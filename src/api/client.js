import AsyncStorage from '@react-native-async-storage/async-storage';
import { Config } from '../constants/config';
import {
  localDb,
  roundDecimal,
  generateId,
} from '../services/localDatabase';

const TOKEN_KEY = '@paal_note_auth_token';
const API_URL_KEY = '@paal_note_api_base_url';

export const getStoredToken = async () => {
  try {
    return await AsyncStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};

export const setStoredToken = async (token) => {
  try {
    await AsyncStorage.setItem(TOKEN_KEY, token);
  } catch (err) {
    console.error('Error saving auth token:', err);
  }
};

export const removeStoredToken = async () => {
  try {
    await AsyncStorage.removeItem(TOKEN_KEY);
  } catch (err) {
    console.error('Error removing auth token:', err);
  }
};

export const getBaseUrl = async () => {
  try {
    const custom = await AsyncStorage.getItem(API_URL_KEY);
    if (custom && !custom.includes('10.0.2.2')) {
      return custom;
    }
    return Config.API_BASE_URL;
  } catch {
    return Config.API_BASE_URL;
  }
};

export const setBaseUrl = async (url) => {
  try {
    await AsyncStorage.setItem(API_URL_KEY, url);
  } catch (err) {
    console.error('Error saving base url:', err);
  }
};

export const resetLocalDatabase = async () => {
  return await localDb.resetToSeedData();
};

// Generic fetch wrapper with timeout
export async function apiRequest(endpoint, options = {}) {
  const baseUrl = await getBaseUrl();
  const token = await getStoredToken();

  const headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(options.headers || {}),
  };

  if (token && !headers.Authorization) {
    headers.Authorization = `Bearer ${token}`;
  }

  const url = `${baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3500);

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || `Request failed with status ${response.status}`);
    }
    return data;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

// 1. Auth API
export const authApi = {
  login: async (email, pass) => {
    const db = await localDb.getDb();
    const cleanEmail = email.trim().toLowerCase();
    const user = db.users.find((u) => u.email.toLowerCase() === cleanEmail);

    if (!user || user.password !== pass.trim()) {
      return { success: false, message: 'Invalid email or password' };
    }

    if (user.status !== 'active') {
      return { success: false, message: 'This user account has been deactivated.' };
    }

    await localDb.setActiveUser(user.id || user._id);
    const token = `local_token_${user.id}_${Date.now()}`;
    await setStoredToken(token);
    localDb.addLog(db, 'LOGIN', 'Auth', `User signed in: ${user.name} (${user.role})`);
    await localDb.saveDb();

    return {
      success: true,
      token,
      user,
      message: 'Login successful',
    };
  },

  getMe: async () => {
    const db = await localDb.getDb();
    const user = localDb.getActiveUser(db);
    return {
      success: true,
      user,
    };
  },

  updateProfile: async (data) => {
    const db = await localDb.getDb();
    const user = localDb.getActiveUser(db);
    if (data.name) user.name = data.name.trim();
    if (data.phone) user.phone = data.phone.trim();
    if (data.password) user.password = data.password.trim();

    localDb.addLog(db, 'UPDATE', 'Users', `Updated user profile: ${user.name}`);
    await localDb.saveDb();

    return {
      success: true,
      user,
      message: 'Profile updated successfully',
    };
  },
};

// 2. Dashboard API
export const dashboardApi = {
  getSummary: async (date) => {
    const db = await localDb.getDb();
    const todayStr = new Date().toISOString().split('T')[0];
    const selectedDate = date || todayStr;

    // Filter active activities for selected date
    const activitiesOnDate = db.activities.filter(
      (a) => a.date === selectedDate && a.status === 'active'
    );

    let morningColl = 0;
    let morningCollAmt = 0;
    let eveningColl = 0;
    let eveningCollAmt = 0;
    let morningDist = 0;
    let morningDistAmt = 0;
    let eveningDist = 0;
    let eveningDistAmt = 0;
    let buyerSales = 0;
    let buyerSalesAmt = 0;

    for (const act of activitiesOnDate) {
      if (act.type === 'collection') {
        if (act.session === 'morning') {
          morningColl += act.quantityLitres;
          morningCollAmt += act.totalAmount;
        } else {
          eveningColl += act.quantityLitres;
          eveningCollAmt += act.totalAmount;
        }
      } else if (act.type === 'distribution') {
        if (act.session === 'morning') {
          morningDist += act.quantityLitres;
          morningDistAmt += act.totalAmount;
        } else {
          eveningDist += act.quantityLitres;
          eveningDistAmt += act.totalAmount;
        }
      } else if (act.type === 'buyer_sale') {
        buyerSales += act.quantityLitres;
        buyerSalesAmt += act.totalAmount;
      }
    }

    const totalCollected = roundDecimal(morningColl + eveningColl);
    const totalDistributed = roundDecimal(morningDist + eveningDist + buyerSales);
    const remainingMilk = roundDecimal(totalCollected - totalDistributed);

    // Payments on selected date
    const paymentsOnDate = db.payments.filter(
      (p) => p.date === selectedDate && p.status === 'completed'
    );
    let dailyIncome = 0;
    let dailyExpense = 0;
    for (const p of paymentsOnDate) {
      if (p.paymentType === 'receive') {
        dailyIncome += p.amount;
      } else if (p.paymentType === 'pay') {
        dailyExpense += p.amount;
      }
    }

    // Outstanding balances across the system
    const vendorPayableOutstanding = roundDecimal(
      db.vendors.filter((v) => v.status === 'active' && v.balance > 0).reduce((acc, v) => acc + v.balance, 0)
    );
    const customerReceivableOutstanding = roundDecimal(
      db.customers.filter((c) => c.status === 'active' && c.balance > 0).reduce((acc, c) => acc + c.balance, 0)
    );
    const buyerReceivableOutstanding = roundDecimal(
      db.buyers.filter((b) => b.status === 'active' && b.balance > 0).reduce((acc, b) => acc + b.balance, 0)
    );

    // Past 7 Days Trend (Milk Collection vs Distribution)
    const chartData = [];
    const baseDate = new Date(selectedDate);
    for (let i = 6; i >= 0; i--) {
      const d = new Date(baseDate);
      d.setDate(d.getDate() - i);
      const dStr = d.toISOString().split('T')[0];

      const dayActs = db.activities.filter((a) => a.date === dStr && a.status === 'active');
      const coll = dayActs
        .filter((a) => a.type === 'collection')
        .reduce((sum, a) => sum + a.quantityLitres, 0);
      const dist = dayActs
        .filter((a) => a.type === 'distribution' || a.type === 'buyer_sale')
        .reduce((sum, a) => sum + a.quantityLitres, 0);

      chartData.push({
        date: dStr,
        day: d.toLocaleDateString('en-US', { weekday: 'short' }),
        collection: roundDecimal(coll),
        distribution: roundDecimal(dist),
      });
    }

    // Recent activities & payments
    const recentActivities = [...db.activities]
      .sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1))
      .slice(0, 8);
    const recentPayments = [...db.payments]
      .sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1))
      .slice(0, 8);

    return {
      success: true,
      selectedDate,
      summary: {
        totalCollected,
        totalDistributed,
        remainingMilk,
        morning: {
          collection: roundDecimal(morningColl),
          distribution: roundDecimal(morningDist),
          collectionAmount: roundDecimal(morningCollAmt),
          distributionAmount: roundDecimal(morningDistAmt),
        },
        evening: {
          collection: roundDecimal(eveningColl),
          distribution: roundDecimal(eveningDist),
          collectionAmount: roundDecimal(eveningCollAmt),
          distributionAmount: roundDecimal(eveningDistAmt),
        },
        buyerSales: {
          quantity: roundDecimal(buyerSales),
          amount: roundDecimal(buyerSalesAmt),
        },
        counts: {
          vendors: db.vendors.filter((v) => v.status === 'active').length,
          customers: db.customers.filter((c) => c.status === 'active').length,
          buyers: db.buyers.filter((b) => b.status === 'active').length,
        },
        financials: {
          dailyIncome: roundDecimal(dailyIncome),
          dailyExpense: roundDecimal(dailyExpense),
          vendorPayableOutstanding,
          customerReceivableOutstanding,
          buyerReceivableOutstanding,
          netReceivable: roundDecimal(
            customerReceivableOutstanding + buyerReceivableOutstanding - vendorPayableOutstanding
          ),
        },
      },
      chartData,
      recentActivities,
      recentPayments,
    };
  },
};

// 3. Vendor API
export const vendorApi = {
  getAll: async (params) => {
    const db = await localDb.getDb();
    let list = [...db.vendors];

    if (params?.status && params.status !== 'all') {
      list = list.filter((v) => v.status === params.status);
    }

    if (params?.location) {
      list = list.filter((v) => v.location === params.location);
    }

    if (params?.search) {
      const q = params.search.toLowerCase();
      list = list.filter(
        (v) =>
          v.name.toLowerCase().includes(q) ||
          v.location.toLowerCase().includes(q) ||
          v.vendorId.toLowerCase().includes(q) ||
          (v.phone && v.phone.includes(q))
      );
    }

    return {
      success: true,
      data: list,
      total: list.length,
    };
  },

  getById: async (id) => {
    const db = await localDb.getDb();
    const vendor = db.vendors.find((v) => v._id === id || v.vendorId === id);
    if (!vendor) {
      throw new Error('Vendor not found');
    }

    const activities = db.activities
      .filter((a) => a.partyId === vendor._id)
      .sort((a, b) => (b.date > a.date ? 1 : -1))
      .slice(0, 25);

    const payments = db.payments
      .filter((p) => p.partyId === vendor._id)
      .sort((a, b) => (b.date > a.date ? 1 : -1))
      .slice(0, 25);

    return {
      success: true,
      data: {
        vendor,
        activities,
        payments,
        stats: {
          totalLitres: vendor.totalCollectedLitres,
          totalPayable: vendor.totalPayable,
          totalPaid: vendor.totalPaid,
          balance: vendor.balance,
        },
      },
    };
  },

  create: async (data) => {
    const db = await localDb.getDb();
    const nextNum = db.vendors.length + 1;
    const vendorId = `V-${String(nextNum).padStart(3, '0')}`;

    const newVendor = {
      _id: generateId('ven'),
      vendorId,
      name: data.name.trim(),
      location: data.location.trim(),
      phone: data.phone?.trim() || '',
      address: data.address?.trim() || '',
      status: 'active',
      defaultMilkType: data.defaultMilkType || 'Cow Milk',
      defaultRate: Number(data.defaultRate) || 42,
      paymentFrequency: data.paymentFrequency || 'daily',
      payoutCycleDay: data.payoutCycleDay,
      payoutCycleDate: data.payoutCycleDate ? Number(data.payoutCycleDate) : undefined,
      totalCollectedLitres: 0,
      totalPayable: 0,
      totalPaid: 0,
      balance: 0,
      advanceBalance: 0,
      createdAt: new Date().toISOString(),
    };

    db.vendors.push(newVendor);
    localDb.addLog(db, 'CREATE', 'Vendors', `Created vendor ${newVendor.name} (${newVendor.vendorId})`, newVendor._id);
    await localDb.saveDb();

    return {
      success: true,
      data: newVendor,
      message: 'Vendor created successfully',
    };
  },

  update: async (id, data) => {
    const db = await localDb.getDb();
    const vendor = db.vendors.find((v) => v._id === id || v.vendorId === id);
    if (!vendor) throw new Error('Vendor not found');

    if (data.name !== undefined) vendor.name = data.name.trim();
    if (data.location !== undefined) vendor.location = data.location.trim();
    if (data.phone !== undefined) vendor.phone = data.phone.trim();
    if (data.address !== undefined) vendor.address = data.address.trim();
    if (data.defaultMilkType !== undefined) vendor.defaultMilkType = data.defaultMilkType;
    if (data.defaultRate !== undefined) vendor.defaultRate = Number(data.defaultRate);
    if (data.paymentFrequency !== undefined) vendor.paymentFrequency = data.paymentFrequency;
    if (data.payoutCycleDay !== undefined) vendor.payoutCycleDay = data.payoutCycleDay;
    if (data.payoutCycleDate !== undefined) vendor.payoutCycleDate = data.payoutCycleDate ? Number(data.payoutCycleDate) : undefined;

    localDb.addLog(db, 'UPDATE', 'Vendors', `Updated vendor ${vendor.name} (${vendor.vendorId})`, vendor._id);
    await localDb.saveDb();

    return {
      success: true,
      data: vendor,
      message: 'Vendor updated successfully',
    };
  },

  toggleStatus: async (id) => {
    const db = await localDb.getDb();
    const vendor = db.vendors.find((v) => v._id === id || v.vendorId === id);
    if (!vendor) throw new Error('Vendor not found');

    vendor.status = vendor.status === 'active' ? 'inactive' : 'active';
    localDb.addLog(db, 'DEACTIVATE', 'Vendors', `Toggled vendor status: ${vendor.name} (${vendor.status})`, vendor._id);
    await localDb.saveDb();

    return {
      success: true,
      data: vendor,
      message: `Vendor status changed to ${vendor.status}`,
    };
  },
};

// 4. Customer API
export const customerApi = {
  getAll: async (params) => {
    const db = await localDb.getDb();
    let list = [...db.customers];

    if (params?.status && params.status !== 'all') {
      list = list.filter((c) => c.status === params.status);
    }

    if (params?.location) {
      list = list.filter((c) => c.location === params.location);
    }

    if (params?.search) {
      const q = params.search.toLowerCase();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.location.toLowerCase().includes(q) ||
          c.customerId.toLowerCase().includes(q) ||
          (c.phone && c.phone.includes(q))
      );
    }

    return {
      success: true,
      data: list,
      total: list.length,
    };
  },

  getById: async (id) => {
    const db = await localDb.getDb();
    const customer = db.customers.find((c) => c._id === id || c.customerId === id);
    if (!customer) throw new Error('Customer not found');

    const activities = db.activities
      .filter((a) => a.partyId === customer._id)
      .sort((a, b) => (b.date > a.date ? 1 : -1))
      .slice(0, 25);

    const payments = db.payments
      .filter((p) => p.partyId === customer._id)
      .sort((a, b) => (b.date > a.date ? 1 : -1))
      .slice(0, 25);

    return {
      success: true,
      data: {
        customer,
        activities,
        payments,
        stats: {
          totalLitres: customer.totalDeliveredLitres,
          totalReceivable: customer.totalReceivable,
          totalReceived: customer.totalReceived,
          balance: customer.balance,
        },
      },
    };
  },

  create: async (data) => {
    const db = await localDb.getDb();
    const nextNum = db.customers.length + 1;
    const customerId = `C-${String(nextNum).padStart(3, '0')}`;

    const newCust = {
      _id: generateId('cust'),
      customerId,
      name: data.name.trim(),
      location: data.location.trim(),
      phone: data.phone?.trim() || '',
      address: data.address?.trim() || '',
      status: 'active',
      defaultMilkType: data.defaultMilkType || 'Cow Milk',
      dailyMorningQuantity: Number(data.dailyMorningQuantity) || 0,
      dailyEveningQuantity: Number(data.dailyEveningQuantity) || 0,
      defaultRate: Number(data.defaultRate) || 52,
      customerType: data.customerType || 'daily',
      paymentFrequency: data.paymentFrequency || 'monthly',
      payoutCycleDay: data.payoutCycleDay,
      payoutCycleDate: data.payoutCycleDate ? Number(data.payoutCycleDate) : undefined,
      totalDeliveredLitres: 0,
      totalReceivable: 0,
      totalReceived: 0,
      balance: 0,
      createdAt: new Date().toISOString(),
    };

    db.customers.push(newCust);
    localDb.addLog(db, 'CREATE', 'Customers', `Created customer ${newCust.name} (${newCust.customerId})`, newCust._id);
    await localDb.saveDb();

    return {
      success: true,
      data: newCust,
      message: 'Customer created successfully',
    };
  },

  update: async (id, data) => {
    const db = await localDb.getDb();
    const customer = db.customers.find((c) => c._id === id || c.customerId === id);
    if (!customer) throw new Error('Customer not found');

    if (data.name !== undefined) customer.name = data.name.trim();
    if (data.location !== undefined) customer.location = data.location.trim();
    if (data.phone !== undefined) customer.phone = data.phone.trim();
    if (data.address !== undefined) customer.address = data.address.trim();
    if (data.defaultMilkType !== undefined) customer.defaultMilkType = data.defaultMilkType;
    if (data.dailyMorningQuantity !== undefined) customer.dailyMorningQuantity = Number(data.dailyMorningQuantity);
    if (data.dailyEveningQuantity !== undefined) customer.dailyEveningQuantity = Number(data.dailyEveningQuantity);
    if (data.defaultRate !== undefined) customer.defaultRate = Number(data.defaultRate);
    if (data.customerType !== undefined) customer.customerType = data.customerType;
    if (data.paymentFrequency !== undefined) customer.paymentFrequency = data.paymentFrequency;
    if (data.payoutCycleDay !== undefined) customer.payoutCycleDay = data.payoutCycleDay;
    if (data.payoutCycleDate !== undefined) customer.payoutCycleDate = data.payoutCycleDate ? Number(data.payoutCycleDate) : undefined;

    localDb.addLog(db, 'UPDATE', 'Customers', `Updated customer ${customer.name} (${customer.customerId})`, customer._id);
    await localDb.saveDb();

    return {
      success: true,
      data: customer,
      message: 'Customer updated successfully',
    };
  },

  toggleStatus: async (id) => {
    const db = await localDb.getDb();
    const customer = db.customers.find((c) => c._id === id || c.customerId === id);
    if (!customer) throw new Error('Customer not found');

    customer.status = customer.status === 'active' ? 'inactive' : 'active';
    localDb.addLog(db, 'DEACTIVATE', 'Customers', `Toggled customer status: ${customer.name} (${customer.status})`, customer._id);
    await localDb.saveDb();

    return {
      success: true,
      data: customer,
      message: `Customer status changed to ${customer.status}`,
    };
  },
};

// 5. Buyer API
export const buyerApi = {
  getAll: async (params) => {
    const db = await localDb.getDb();
    let list = [...db.buyers];

    if (params?.status && params.status !== 'all') {
      list = list.filter((b) => b.status === params.status);
    }

    if (params?.location) {
      list = list.filter((b) => b.location === params.location);
    }

    if (params?.search) {
      const q = params.search.toLowerCase();
      list = list.filter(
        (b) =>
          b.name.toLowerCase().includes(q) ||
          b.location.toLowerCase().includes(q) ||
          b.buyerId.toLowerCase().includes(q) ||
          (b.businessName && b.businessName.toLowerCase().includes(q))
      );
    }

    return {
      success: true,
      data: list,
      total: list.length,
    };
  },

  getById: async (id) => {
    const db = await localDb.getDb();
    const buyer = db.buyers.find((b) => b._id === id || b.buyerId === id);
    if (!buyer) throw new Error('Commercial Buyer not found');

    const activities = db.activities
      .filter((a) => a.partyId === buyer._id)
      .sort((a, b) => (b.date > a.date ? 1 : -1))
      .slice(0, 25);

    const payments = db.payments
      .filter((p) => p.partyId === buyer._id)
      .sort((a, b) => (b.date > a.date ? 1 : -1))
      .slice(0, 25);

    return {
      success: true,
      data: {
        buyer,
        activities,
        payments,
      },
    };
  },

  create: async (data) => {
    const db = await localDb.getDb();
    const nextNum = db.buyers.length + 1;
    const buyerId = `B-${String(nextNum).padStart(3, '0')}`;

    const newBuyer = {
      _id: generateId('buy'),
      buyerId,
      name: data.name.trim(),
      businessName: data.businessName?.trim() || data.name.trim(),
      location: data.location.trim(),
      phone: data.phone?.trim() || '',
      address: data.address?.trim() || '',
      status: 'active',
      defaultMilkType: data.defaultMilkType || 'Cow Milk',
      defaultRate: Number(data.defaultRate) || 50,
      totalPurchasedLitres: 0,
      totalAmount: 0,
      totalPaid: 0,
      balance: 0,
      createdAt: new Date().toISOString(),
    };

    db.buyers.push(newBuyer);
    localDb.addLog(db, 'CREATE', 'Buyers', `Created buyer ${newBuyer.name} (${newBuyer.buyerId})`, newBuyer._id);
    await localDb.saveDb();

    return {
      success: true,
      data: newBuyer,
      message: 'Buyer created successfully',
    };
  },

  update: async (id, data) => {
    const db = await localDb.getDb();
    const buyer = db.buyers.find((b) => b._id === id || b.buyerId === id);
    if (!buyer) throw new Error('Buyer not found');

    if (data.name !== undefined) buyer.name = data.name.trim();
    if (data.businessName !== undefined) buyer.businessName = data.businessName.trim();
    if (data.location !== undefined) buyer.location = data.location.trim();
    if (data.phone !== undefined) buyer.phone = data.phone.trim();
    if (data.address !== undefined) buyer.address = data.address.trim();
    if (data.defaultMilkType !== undefined) buyer.defaultMilkType = data.defaultMilkType;
    if (data.defaultRate !== undefined) buyer.defaultRate = Number(data.defaultRate);

    localDb.addLog(db, 'UPDATE', 'Buyers', `Updated buyer ${buyer.name} (${buyer.buyerId})`, buyer._id);
    await localDb.saveDb();

    return {
      success: true,
      data: buyer,
      message: 'Buyer updated successfully',
    };
  },

  toggleStatus: async (id) => {
    const db = await localDb.getDb();
    const buyer = db.buyers.find((b) => b._id === id || b.buyerId === id);
    if (!buyer) throw new Error('Buyer not found');

    buyer.status = buyer.status === 'active' ? 'inactive' : 'active';
    localDb.addLog(db, 'DEACTIVATE', 'Buyers', `Toggled buyer status: ${buyer.name} (${buyer.status})`, buyer._id);
    await localDb.saveDb();

    return {
      success: true,
      data: buyer,
      message: `Buyer status changed to ${buyer.status}`,
    };
  },
};

// 6. Daily Activities API
export const activityApi = {
  getAll: async (params) => {
    const db = await localDb.getDb();
    let list = [...db.activities];

    if (params?.date) {
      list = list.filter((a) => a.date === params.date);
    }
    if (params?.session && params.session !== 'all') {
      list = list.filter((a) => a.session === params.session);
    }
    if (params?.type && params.type !== 'all') {
      list = list.filter((a) => a.type === params.type);
    }
    if (params?.partyType) {
      list = list.filter((a) => a.partyType === params.partyType);
    }
    if (params?.partyId) {
      list = list.filter((a) => a.partyId === params.partyId);
    }

    list.sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1));

    const totalLitres = roundDecimal(list.reduce((sum, a) => sum + (a.status === 'active' ? a.quantityLitres : 0), 0));
    const totalAmount = roundDecimal(list.reduce((sum, a) => sum + (a.status === 'active' ? a.totalAmount : 0), 0));

    return {
      success: true,
      data: list,
      count: list.length,
      summary: {
        totalLitres,
        totalAmount,
      },
    };
  },

  create: async (data) => {
    const db = await localDb.getDb();
    const user = localDb.getActiveUser(db);

    const qty = Number(data.quantityLitres);
    const rate = Number(data.ratePerLitre);
    if (qty <= 0) throw new Error('Quantity must be greater than zero');
    if (rate <= 0) throw new Error('Rate must be greater than zero');

    const totalAmount = roundDecimal(qty * rate);

    const newActivity = {
      _id: generateId('act'),
      date: data.date,
      session: data.session,
      type: data.type,
      partyType: data.partyType,
      partyId: data.partyId,
      partyCode: data.partyCode,
      partyName: data.partyName,
      partyLocation: data.partyLocation || '',
      milkType: data.milkType || 'Cow Milk',
      quantityLitres: roundDecimal(qty),
      ratePerLitre: roundDecimal(rate),
      totalAmount,
      notes: data.notes?.trim() || '',
      status: 'active',
      createdBy: user.id || user._id,
      createdByName: user.name,
      createdAt: new Date().toISOString(),
    };

    db.activities.unshift(newActivity);

    // Recalculate party balance
    if (data.partyType === 'vendor') {
      localDb.recalculateVendorFinancials(db, data.partyId);
    } else if (data.partyType === 'customer') {
      localDb.recalculateCustomerFinancials(db, data.partyId);
    } else if (data.partyType === 'buyer') {
      localDb.recalculateBuyerFinancials(db, data.partyId);
    }

    localDb.addLog(
      db,
      'CREATE',
      'Daily Activity',
      `Logged ${data.type} of ${qty}L milk for ${data.partyName} (₹${totalAmount})`,
      newActivity._id
    );

    await localDb.saveDb();

    return {
      success: true,
      data: newActivity,
      message: 'Milk activity recorded successfully',
    };
  },

  update: async (id, data) => {
    const db = await localDb.getDb();
    const activity = db.activities.find((a) => a._id === id);
    if (!activity) throw new Error('Activity entry not found');

    if (data.quantityLitres !== undefined) activity.quantityLitres = roundDecimal(Number(data.quantityLitres));
    if (data.ratePerLitre !== undefined) activity.ratePerLitre = roundDecimal(Number(data.ratePerLitre));
    activity.totalAmount = roundDecimal(activity.quantityLitres * activity.ratePerLitre);
    if (data.notes !== undefined) activity.notes = data.notes.trim();
    if (data.milkType !== undefined) activity.milkType = data.milkType;
    if (data.session !== undefined) activity.session = data.session;

    if (activity.partyType === 'vendor') {
      localDb.recalculateVendorFinancials(db, activity.partyId);
    } else if (activity.partyType === 'customer') {
      localDb.recalculateCustomerFinancials(db, activity.partyId);
    } else if (activity.partyType === 'buyer') {
      localDb.recalculateBuyerFinancials(db, activity.partyId);
    }

    localDb.addLog(db, 'UPDATE', 'Daily Activity', `Edited activity ${activity._id} for ${activity.partyName}`, activity._id);
    await localDb.saveDb();

    return {
      success: true,
      data: activity,
      message: 'Activity updated successfully',
    };
  },

  reverse: async (id, reason) => {
    const db = await localDb.getDb();
    const activity = db.activities.find((a) => a._id === id);
    if (!activity) throw new Error('Activity entry not found');

    activity.status = 'reversed';
    activity.correctionReason = reason?.trim() || 'Entry reversed by user';

    if (activity.partyType === 'vendor') {
      localDb.recalculateVendorFinancials(db, activity.partyId);
    } else if (activity.partyType === 'customer') {
      localDb.recalculateCustomerFinancials(db, activity.partyId);
    } else if (activity.partyType === 'buyer') {
      localDb.recalculateBuyerFinancials(db, activity.partyId);
    }

    localDb.addLog(
      db,
      'REVERSAL',
      'Daily Activity',
      `Reversed activity ${activity._id} for ${activity.partyName}. Reason: ${activity.correctionReason}`,
      activity._id
    );

    await localDb.saveDb();

    return {
      success: true,
      data: activity,
      message: 'Activity entry reversed and balances recalculated',
    };
  },
};

// 7. Payments API
export const paymentApi = {
  getAll: async (params) => {
    const db = await localDb.getDb();
    let list = [...db.payments];

    if (params?.date) list = list.filter((p) => p.date === params.date);
    if (params?.partyType) list = list.filter((p) => p.partyType === params.partyType);
    if (params?.partyId) list = list.filter((p) => p.partyId === params.partyId);
    if (params?.paymentType) list = list.filter((p) => p.paymentType === params.paymentType);
    if (params?.paymentMode) list = list.filter((p) => p.paymentMode === params.paymentMode);

    list.sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1));

    const totalReceivedAll = roundDecimal(
      list
        .filter((p) => p.paymentType === 'receive' && p.status === 'completed')
        .reduce((sum, p) => sum + p.amount, 0)
    );
    const totalPaidToVendors = roundDecimal(
      list
        .filter((p) => p.paymentType === 'pay' && p.status === 'completed')
        .reduce((sum, p) => sum + p.amount, 0)
    );
    const netCashFlow = roundDecimal(totalReceivedAll - totalPaidToVendors);

    return {
      success: true,
      data: list,
      count: list.length,
      summary: {
        totalReceivedAll,
        totalPaidToVendors,
        netCashFlow,
      },
    };
  },

  record: async (data) => {
    const db = await localDb.getDb();
    const user = localDb.getActiveUser(db);

    const amt = Number(data.amount);
    if (amt <= 0) throw new Error('Payment amount must be greater than zero');

    const nextNum = db.payments.length + 1;
    const paymentNumber = `PAY-2026-${String(nextNum).padStart(4, '0')}`;

    const newPayment = {
      _id: generateId('pay'),
      paymentNumber,
      date: data.date,
      partyType: data.partyType,
      partyId: data.partyId,
      partyCode: data.partyCode,
      partyName: data.partyName,
      paymentType: data.paymentType,
      amount: roundDecimal(amt),
      paymentMode: data.paymentMode,
      referenceNumber: data.referenceNumber?.trim() || undefined,
      notes: data.notes?.trim() || undefined,
      status: 'completed',
      createdBy: user.id || user._id,
      createdByName: user.name,
      createdAt: new Date().toISOString(),
    };

    db.payments.unshift(newPayment);

    // Recalculate party financials
    if (data.partyType === 'vendor') {
      localDb.recalculateVendorFinancials(db, data.partyId);
    } else if (data.partyType === 'customer') {
      localDb.recalculateCustomerFinancials(db, data.partyId);
    } else if (data.partyType === 'buyer') {
      localDb.recalculateBuyerFinancials(db, data.partyId);
    }

    localDb.addLog(
      db,
      'PAYMENT',
      'Payments',
      `Recorded ${data.paymentType === 'pay' ? 'Payout to' : 'Receipt from'} ${data.partyName} of ₹${amt} (${data.paymentMode})`,
      newPayment._id
    );

    await localDb.saveDb();

    return {
      success: true,
      data: newPayment,
      message: 'Payment recorded successfully',
    };
  },

  getReceipt: async (id) => {
    const db = await localDb.getDb();
    const payment = db.payments.find((p) => p._id === id || p.paymentNumber === id);
    if (!payment) throw new Error('Payment voucher not found');

    let party = null;
    if (payment.partyType === 'vendor') {
      const v = db.vendors.find((item) => item._id === payment.partyId);
      if (v) party = { location: v.location, phone: v.phone, currentBalance: v.balance };
    } else if (payment.partyType === 'customer') {
      const c = db.customers.find((item) => item._id === payment.partyId);
      if (c) party = { location: c.location, phone: c.phone, currentBalance: c.balance };
    } else if (payment.partyType === 'buyer') {
      const b = db.buyers.find((item) => item._id === payment.partyId);
      if (b) party = { location: b.location, phone: b.phone, currentBalance: b.balance };
    }

    return {
      success: true,
      data: {
        payment,
        party,
      },
    };
  },

  reverse: async (id, reason) => {
    const db = await localDb.getDb();
    const payment = db.payments.find((p) => p._id === id || p.paymentNumber === id);
    if (!payment) throw new Error('Payment voucher not found');

    payment.status = 'reversed';
    payment.reversalReason = reason?.trim() || 'Payment reversed by operator';

    if (payment.partyType === 'vendor') {
      localDb.recalculateVendorFinancials(db, payment.partyId);
    } else if (payment.partyType === 'customer') {
      localDb.recalculateCustomerFinancials(db, payment.partyId);
    } else if (payment.partyType === 'buyer') {
      localDb.recalculateBuyerFinancials(db, payment.partyId);
    }

    localDb.addLog(
      db,
      'REVERSAL',
      'Payments',
      `Reversed payment ${payment.paymentNumber} for ${payment.partyName}. Reason: ${payment.reversalReason}`,
      payment._id
    );

    await localDb.saveDb();

    return {
      success: true,
      data: payment,
      message: 'Payment reversed and balance recalculated',
    };
  },
};

// 8. Reports API
export const reportApi = {
  getMilkReport: async (params) => {
    const db = await localDb.getDb();
    const todayStr = new Date().toISOString().split('T')[0];
    const sDate = params?.startDate || todayStr;
    const eDate = params?.endDate || todayStr;

    let activities = db.activities.filter(
      (a) => a.date >= sDate && a.date <= eDate && a.status === 'active'
    );

    if (params?.session && params.session !== 'all') {
      activities = activities.filter((a) => a.session === params.session);
    }
    if (params?.type && params.type !== 'all') {
      activities = activities.filter((a) => a.type === params.type);
    }

    activities.sort((a, b) => (a.date > b.date ? 1 : -1));

    let totalCollectionQty = 0;
    let totalDistributionQty = 0;
    let totalBuyerSaleQty = 0;
    let totalCollectionAmount = 0;
    let totalDistributionAmount = 0;
    let totalBuyerSaleAmount = 0;

    for (const a of activities) {
      if (a.type === 'collection') {
        totalCollectionQty += a.quantityLitres;
        totalCollectionAmount += a.totalAmount;
      } else if (a.type === 'distribution') {
        totalDistributionQty += a.quantityLitres;
        totalDistributionAmount += a.totalAmount;
      } else if (a.type === 'buyer_sale') {
        totalBuyerSaleQty += a.quantityLitres;
        totalBuyerSaleAmount += a.totalAmount;
      }
    }

    return {
      success: true,
      period: { startDate: sDate, endDate: eDate },
      summary: {
        totalCollectionQty: roundDecimal(totalCollectionQty),
        totalDistributionQty: roundDecimal(totalDistributionQty),
        totalBuyerSaleQty: roundDecimal(totalBuyerSaleQty),
        totalDistributedQtyAll: roundDecimal(totalDistributionQty + totalBuyerSaleQty),
        remainingLitres: roundDecimal(totalCollectionQty - (totalDistributionQty + totalBuyerSaleQty)),
        totalCollectionAmount: roundDecimal(totalCollectionAmount),
        totalDistributionAmount: roundDecimal(totalDistributionAmount),
        totalBuyerSaleAmount: roundDecimal(totalBuyerSaleAmount),
      },
      data: activities,
    };
  },

  getPartyReport: async (params) => {
    const db = await localDb.getDb();
    const todayStr = new Date().toISOString().split('T')[0];
    const sDate = params?.startDate || todayStr;
    const eDate = params?.endDate || todayStr;

    if (params?.partyType === 'vendor') {
      let vendors = [...db.vendors];
      if (params.partyId) vendors = vendors.filter((v) => v._id === params.partyId);

      const rows = vendors.map((v) => {
        const acts = db.activities.filter(
          (a) => a.partyId === v._id && a.type === 'collection' && a.date >= sDate && a.date <= eDate && a.status === 'active'
        );
        const pays = db.payments.filter(
          (p) => p.partyId === v._id && p.paymentType === 'pay' && p.date >= sDate && p.date <= eDate && p.status === 'completed'
        );

        const periodQty = acts.reduce((sum, a) => sum + a.quantityLitres, 0);
        const periodPayable = acts.reduce((sum, a) => sum + a.totalAmount, 0);
        const periodPaid = pays.reduce((sum, p) => sum + p.amount, 0);

        return {
          id: v._id,
          code: v.vendorId,
          name: v.name,
          location: v.location,
          phone: v.phone,
          periodQtyLitres: roundDecimal(periodQty),
          periodPayable: roundDecimal(periodPayable),
          periodPaid: roundDecimal(periodPaid),
          currentBalance: v.balance,
          overallPayable: v.totalPayable,
          overallPaid: v.totalPaid,
        };
      });

      return {
        success: true,
        partyType: 'vendor',
        period: { startDate: sDate, endDate: eDate },
        data: rows,
      };
    } else if (params?.partyType === 'customer') {
      let customers = [...db.customers];
      if (params.partyId) customers = customers.filter((c) => c._id === params.partyId);

      const rows = customers.map((c) => {
        const acts = db.activities.filter(
          (a) => a.partyId === c._id && a.type === 'distribution' && a.date >= sDate && a.date <= eDate && a.status === 'active'
        );
        const pays = db.payments.filter(
          (p) => p.partyId === c._id && p.paymentType === 'receive' && p.date >= sDate && p.date <= eDate && p.status === 'completed'
        );

        const periodQty = acts.reduce((sum, a) => sum + a.quantityLitres, 0);
        const periodReceivable = acts.reduce((sum, a) => sum + a.totalAmount, 0);
        const periodReceived = pays.reduce((sum, p) => sum + p.amount, 0);

        return {
          id: c._id,
          code: c.customerId,
          name: c.name,
          location: c.location,
          phone: c.phone,
          periodQtyLitres: roundDecimal(periodQty),
          periodReceivable: roundDecimal(periodReceivable),
          periodReceived: roundDecimal(periodReceived),
          currentBalance: c.balance,
          overallReceivable: c.totalReceivable,
          overallReceived: c.totalReceived,
        };
      });

      return {
        success: true,
        partyType: 'customer',
        period: { startDate: sDate, endDate: eDate },
        data: rows,
      };
    } else {
      // Buyer
      let buyers = [...db.buyers];
      if (params?.partyId) buyers = buyers.filter((b) => b._id === params.partyId);

      const rows = buyers.map((b) => {
        const acts = db.activities.filter(
          (a) => a.partyId === b._id && a.type === 'buyer_sale' && a.date >= sDate && a.date <= eDate && a.status === 'active'
        );
        const pays = db.payments.filter(
          (p) => p.partyId === b._id && p.paymentType === 'receive' && p.date >= sDate && p.date <= eDate && p.status === 'completed'
        );

        const periodQty = acts.reduce((sum, a) => sum + a.quantityLitres, 0);
        const periodAmount = acts.reduce((sum, a) => sum + a.totalAmount, 0);
        const periodReceived = pays.reduce((sum, p) => sum + p.amount, 0);

        return {
          id: b._id,
          code: b.buyerId,
          name: b.name,
          businessName: b.businessName,
          location: b.location,
          periodQtyLitres: roundDecimal(periodQty),
          periodAmount: roundDecimal(periodAmount),
          periodReceived: roundDecimal(periodReceived),
          currentBalance: b.balance,
          overallAmount: b.totalAmount,
          overallReceived: b.totalPaid,
        };
      });

      return {
        success: true,
        partyType: 'buyer',
        period: { startDate: sDate, endDate: eDate },
        data: rows,
      };
    }
  },

  getIncomeExpenseReport: async (params) => {
    const db = await localDb.getDb();
    const todayStr = new Date().toISOString().split('T')[0];
    const sDate = params?.startDate || todayStr;
    const eDate = params?.endDate || todayStr;

    const payments = db.payments
      .filter((p) => p.date >= sDate && p.date <= eDate && p.status === 'completed')
      .sort((a, b) => (a.date > b.date ? 1 : -1));

    let incomeFromCustomers = 0;
    let incomeFromBuyers = 0;
    let expensePaidToVendors = 0;

    const rows = payments.map((p) => {
      if (p.paymentType === 'receive') {
        if (p.partyType === 'customer') incomeFromCustomers += p.amount;
        else if (p.partyType === 'buyer') incomeFromBuyers += p.amount;
      } else if (p.paymentType === 'pay') {
        expensePaidToVendors += p.amount;
      }

      return {
        id: p._id,
        paymentNumber: p.paymentNumber,
        date: p.date,
        partyType: p.partyType,
        partyName: p.partyName,
        paymentType: p.paymentType,
        amount: p.amount,
        paymentMode: p.paymentMode,
        referenceNumber: p.referenceNumber,
      };
    });

    const totalIncome = roundDecimal(incomeFromCustomers + incomeFromBuyers);
    const totalExpense = roundDecimal(expensePaidToVendors);
    const netProfit = roundDecimal(totalIncome - totalExpense);

    return {
      success: true,
      period: { startDate: sDate, endDate: eDate },
      summary: {
        incomeFromCustomers: roundDecimal(incomeFromCustomers),
        incomeFromBuyers: roundDecimal(incomeFromBuyers),
        totalIncome,
        expensePaidToVendors: totalExpense,
        netProfit,
      },
      data: rows,
    };
  },

  getOutstandingReport: async () => {
    const db = await localDb.getDb();
    const vendors = db.vendors.filter((v) => v.status === 'active' && v.balance > 0);
    const customers = db.customers.filter((c) => c.status === 'active' && c.balance > 0);
    const buyers = db.buyers.filter((b) => b.status === 'active' && b.balance > 0);

    const totalPayableToVendors = roundDecimal(vendors.reduce((s, v) => s + v.balance, 0));
    const totalReceivableFromCustomers = roundDecimal(customers.reduce((s, c) => s + c.balance, 0));
    const totalReceivableFromBuyers = roundDecimal(buyers.reduce((s, b) => s + b.balance, 0));

    return {
      success: true,
      summary: {
        totalPayableToVendors,
        totalReceivableFromCustomers,
        totalReceivableFromBuyers,
        totalReceivableAll: roundDecimal(totalReceivableFromCustomers + totalReceivableFromBuyers),
        netOutstanding: roundDecimal(totalReceivableFromCustomers + totalReceivableFromBuyers - totalPayableToVendors),
      },
      vendors,
      customers,
      buyers,
    };
  },
};

// 9. Masters API
export const masterApi = {
  getAll: async (type) => {
    const db = await localDb.getDb();
    let list = db.masters.filter((m) => m.isActive !== false);
    if (type) list = list.filter((m) => m.type === type);
    list.sort((a, b) => a.order - b.order);
    return {
      success: true,
      data: list,
    };
  },

  create: async (data) => {
    const db = await localDb.getDb();
    const newMaster = {
      _id: generateId('mst'),
      type: data.type,
      key: data.key?.trim() || data.label.toLowerCase().replace(/\s+/g, '_'),
      label: data.label.trim(),
      value: data.value,
      description: data.description,
      isActive: true,
      isSystem: false,
      order: db.masters.length + 1,
    };

    db.masters.push(newMaster);
    localDb.addLog(db, 'CREATE', 'Masters', `Added master config: ${newMaster.label} (${newMaster.type})`, newMaster._id);
    await localDb.saveDb();

    return {
      success: true,
      data: newMaster,
    };
  },

  update: async (id, data) => {
    const db = await localDb.getDb();
    const master = db.masters.find((m) => m._id === id);
    if (!master) throw new Error('Master item not found');

    if (data.label !== undefined) master.label = data.label.trim();
    if (data.value !== undefined) master.value = data.value;
    if (data.order !== undefined) master.order = Number(data.order);
    if (data.isActive !== undefined) master.isActive = !!data.isActive;

    localDb.addLog(db, 'UPDATE', 'Masters', `Updated master: ${master.label}`, master._id);
    await localDb.saveDb();

    return {
      success: true,
      data: master,
    };
  },

  delete: async (id) => {
    const db = await localDb.getDb();
    const index = db.masters.findIndex((m) => m._id === id);
    if (index === -1) throw new Error('Master not found');

    const item = db.masters[index];
    if (item.isSystem) throw new Error('System master items cannot be deleted');

    db.masters.splice(index, 1);
    localDb.addLog(db, 'DELETE', 'Masters', `Deleted master: ${item.label}`, item._id);
    await localDb.saveDb();

    return {
      success: true,
      message: 'Master item deleted',
    };
  },
};

// 10. Users API
export const userApi = {
  getAll: async () => {
    const db = await localDb.getDb();
    return {
      success: true,
      data: db.users,
    };
  },

  create: async (data) => {
    const db = await localDb.getDb();
    const newUser = {
      id: generateId('usr'),
      _id: generateId('usr'),
      name: data.name.trim(),
      email: data.email.trim().toLowerCase(),
      password: data.password || 'admin123',
      phone: data.phone?.trim(),
      role: data.role || 'employee',
      status: 'active',
      organizationId: db.organization.id,
      organization: {
        id: db.organization.id,
        name: db.organization.name,
        code: db.organization.code,
        currency: db.organization.currency,
        settings: db.organization.settings,
      },
      permissions: data.permissions || {
        canEditActivities: true,
        canRecordPayments: true,
        canManageParties: true,
        canViewReports: data.role !== 'employee',
      },
    };

    db.users.push(newUser);
    localDb.addLog(db, 'CREATE', 'Users', `Created user account: ${newUser.name} (${newUser.role})`, newUser.id);
    await localDb.saveDb();

    return {
      success: true,
      data: newUser,
    };
  },

  update: async (id, data) => {
    const db = await localDb.getDb();
    const user = db.users.find((u) => u.id === id || u._id === id);
    if (!user) throw new Error('User not found');

    if (data.name !== undefined) user.name = data.name.trim();
    if (data.phone !== undefined) user.phone = data.phone.trim();
    if (data.role !== undefined) user.role = data.role;
    if (data.status !== undefined) user.status = data.status;
    if (data.permissions !== undefined) user.permissions = { ...user.permissions, ...data.permissions };

    localDb.addLog(db, 'UPDATE', 'Users', `Updated user account: ${user.name}`, user.id);
    await localDb.saveDb();

    return {
      success: true,
      data: user,
    };
  },
};

// 11. Activity Logs API
export const logApi = {
  getAll: async (params) => {
    const db = await localDb.getDb();
    let list = [...db.logs];

    if (params?.module && params.module !== 'all') {
      list = list.filter((l) => l.module === params.module);
    }
    if (params?.action && params.action !== 'all') {
      list = list.filter((l) => l.action === params.action);
    }
    if (params?.startDate) {
      list = list.filter((l) => l.timestamp >= params.startDate);
    }
    if (params?.endDate) {
      list = list.filter((l) => l.timestamp <= params.endDate);
    }

    list.sort((a, b) => (b.timestamp > a.timestamp ? 1 : -1));

    return {
      success: true,
      data: list,
      count: list.length,
    };
  },
};
