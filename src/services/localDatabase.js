import AsyncStorage from '@react-native-async-storage/async-storage';

const DB_STORAGE_KEY = '@paal_note_local_db_v2';
const ACTIVE_USER_ID_KEY = '@paal_note_active_user_id';

// Decimal safety helper
export const roundDecimal = (num) => {
  return Math.round((Number(num) + Number.EPSILON) * 100) / 100;
};

// Unique ID generator
export const generateId = (prefix) => {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
};

// Generate past dates string YYYY-MM-DD
const getPastDateStr = (daysAgo) => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split('T')[0];
};

const getInitialSeedData = () => {
  const org = {
    id: 'org_001',
    name: 'Orivil Paal Dairy Farm',
    code: 'ORIVIL01',
    currency: '₹',
    phone: '+91 98765 43210',
    email: 'contact@paalnote.com',
    address: '12 Dairy Farm Road, Green Meadows, Tamil Nadu, 600001',
    settings: {
      currency: '₹',
      defaultCowMilkBuyRate: 42,
      defaultCowMilkSellRate: 52,
      defaultBuffaloMilkBuyRate: 58,
      defaultBuffaloMilkSellRate: 68,
      morningStart: '05:30',
      eveningStart: '17:30',
    },
  };

  const users = [
    {
      id: 'usr_superadmin',
      _id: 'usr_superadmin',
      name: 'Rajesh Sharma',
      email: 'superadmin@paalnote.com',
      password: 'admin123',
      phone: '+91 98765 00001',
      role: 'super_admin',
      status: 'active',
      organizationId: org.id,
      organization: {
        id: org.id,
        name: org.name,
        code: org.code,
        currency: org.currency,
        settings: org.settings,
      },
      permissions: {
        canEditActivities: true,
        canRecordPayments: true,
        canManageParties: true,
        canViewReports: true,
      },
    },
    {
      id: 'usr_admin',
      _id: 'usr_admin',
      name: 'Kavitha Nathan',
      email: 'admin@paalnote.com',
      password: 'admin123',
      phone: '+91 98765 00002',
      role: 'admin',
      status: 'active',
      organizationId: org.id,
      organization: {
        id: org.id,
        name: org.name,
        code: org.code,
        currency: org.currency,
        settings: org.settings,
      },
      permissions: {
        canEditActivities: true,
        canRecordPayments: true,
        canManageParties: true,
        canViewReports: true,
      },
    },
    {
      id: 'usr_employee',
      _id: 'usr_employee',
      name: 'Suresh Kumar',
      email: 'employee@paalnote.com',
      password: 'emp123',
      phone: '+91 98765 00003',
      role: 'employee',
      status: 'active',
      organizationId: org.id,
      organization: {
        id: org.id,
        name: org.name,
        code: org.code,
        currency: org.currency,
        settings: org.settings,
      },
      permissions: {
        canEditActivities: true,
        canRecordPayments: true,
        canManageParties: true,
        canViewReports: true,
      },
    },
  ];

  const masters = [
    { _id: 'm_1', type: 'milk_type', key: 'cow_milk', label: 'Cow Milk', value: { defaultBuyRate: 42, defaultSellRate: 52 }, order: 1, isSystem: true, isActive: true },
    { _id: 'm_2', type: 'milk_type', key: 'buffalo_milk', label: 'Buffalo Milk', value: { defaultBuyRate: 58, defaultSellRate: 68 }, order: 2, isSystem: true, isActive: true },
    { _id: 'm_3', type: 'unit', key: 'litre', label: 'Litre (L)', value: 'L', order: 1, isSystem: true, isActive: true },
    { _id: 'm_4', type: 'unit', key: 'ml', label: 'Millilitre (mL)', value: 'mL', order: 2, isSystem: true, isActive: true },
    { _id: 'm_5', type: 'payment_method', key: 'cash', label: 'Cash', value: 'Cash', order: 1, isSystem: true, isActive: true },
    { _id: 'm_6', type: 'payment_method', key: 'upi', label: 'UPI (GPay / PhonePe / Paytm)', value: 'UPI', order: 2, isSystem: true, isActive: true },
    { _id: 'm_7', type: 'payment_method', key: 'bank_transfer', label: 'Bank Transfer (IMPS/NEFT)', value: 'Bank Transfer', order: 3, isSystem: true, isActive: true },
    { _id: 'm_8', type: 'payment_method', key: 'cheque', label: 'Cheque', value: 'Cheque', order: 4, isSystem: true, isActive: true },
    { _id: 'm_9', type: 'location', key: 'green_meadows', label: 'Green Meadows', value: 'Green Meadows', order: 1, isSystem: false, isActive: true },
    { _id: 'm_10', type: 'location', key: 'north_village', label: 'North Village', value: 'North Village', order: 2, isSystem: false, isActive: true },
    { _id: 'm_11', type: 'location', key: 'sunrise_colony', label: 'Sunrise Colony', value: 'Sunrise Colony', order: 3, isSystem: false, isActive: true },
    { _id: 'm_12', type: 'location', key: 'lake_view', label: 'Lake View', value: 'Lake View', order: 4, isSystem: false, isActive: true },
    { _id: 'm_13', type: 'location', key: 'riverside_farm', label: 'Riverside Farm', value: 'Riverside Farm', order: 5, isSystem: false, isActive: true },
    { _id: 'm_14', type: 'location', key: 'hill_top_route', label: 'Hill Top Route', value: 'Hill Top Route', order: 6, isSystem: false, isActive: true },
  ];

  const vendors = [
    {
      _id: 'ven_1',
      vendorId: 'V-001',
      name: 'Murugan Dairy',
      location: 'Green Meadows',
      phone: '98401 12345',
      address: 'Plot 14, Cow Shelter St',
      status: 'active',
      defaultMilkType: 'Cow Milk',
      defaultRate: 42,
      paymentFrequency: 'daily',
      totalCollectedLitres: 95,
      totalPayable: 3990,
      totalPaid: 2500,
      balance: 1490,
      advanceBalance: 0,
      createdAt: new Date().toISOString(),
    },
    {
      _id: 'ven_2',
      vendorId: 'V-002',
      name: 'Selvam Farm',
      location: 'North Village',
      phone: '98401 23456',
      address: '22 River bank',
      status: 'active',
      defaultMilkType: 'Buffalo Milk',
      defaultRate: 58,
      paymentFrequency: 'weekly',
      payoutCycleDay: 'Sunday',
      totalCollectedLitres: 120,
      totalPayable: 6960,
      totalPaid: 5000,
      balance: 1960,
      advanceBalance: 0,
      createdAt: new Date().toISOString(),
    },
    {
      _id: 'ven_3',
      vendorId: 'V-003',
      name: 'Anbarasan Farms',
      location: 'Riverside Farm',
      phone: '98401 34567',
      address: 'Old Post Office Rd',
      status: 'active',
      defaultMilkType: 'Cow Milk',
      defaultRate: 42,
      paymentFrequency: 'weekly',
      payoutCycleDay: 'Monday',
      totalCollectedLitres: 88,
      totalPayable: 3696,
      totalPaid: 2000,
      balance: 1696,
      advanceBalance: 0,
      createdAt: new Date().toISOString(),
    },
    {
      _id: 'ven_4',
      vendorId: 'V-004',
      name: 'Ramasamy Dairy',
      location: 'Hill Top Route',
      phone: '98401 45678',
      address: 'Bypass cross',
      status: 'active',
      defaultMilkType: 'Cow Milk',
      defaultRate: 43,
      paymentFrequency: 'monthly',
      payoutCycleDate: 1,
      totalCollectedLitres: 110,
      totalPayable: 4730,
      totalPaid: 3500,
      balance: 1230,
      advanceBalance: 0,
      createdAt: new Date().toISOString(),
    },
    {
      _id: 'ven_5',
      vendorId: 'V-005',
      name: 'Jayakumar K',
      location: 'Sunrise Colony',
      phone: '98401 56789',
      address: 'Main Temple St',
      status: 'active',
      defaultMilkType: 'Buffalo Milk',
      defaultRate: 59,
      paymentFrequency: 'monthly',
      payoutCycleDate: 10,
      totalCollectedLitres: 105,
      totalPayable: 6195,
      totalPaid: 4500,
      balance: 1695,
      advanceBalance: 0,
      createdAt: new Date().toISOString(),
    },
  ];

  const customers = [
    {
      _id: 'cust_1',
      customerId: 'C-001',
      name: 'Priya Krishnan',
      location: 'Green Meadows',
      phone: '97890 11111',
      address: 'Flat 3B, Sunshine Apts',
      status: 'active',
      defaultMilkType: 'Cow Milk',
      dailyMorningQuantity: 2,
      dailyEveningQuantity: 1,
      defaultRate: 52,
      customerType: 'daily',
      paymentFrequency: 'monthly',
      payoutCycleDate: 1,
      totalDeliveredLitres: 15,
      totalReceivable: 780,
      totalReceived: 750,
      balance: 30,
      createdAt: new Date().toISOString(),
    },
    {
      _id: 'cust_2',
      customerId: 'C-002',
      name: 'Ramesh Babu',
      location: 'Sunrise Colony',
      phone: '97890 22222',
      address: '18 Rose Garden',
      status: 'active',
      defaultMilkType: 'Buffalo Milk',
      dailyMorningQuantity: 1.5,
      dailyEveningQuantity: 0,
      defaultRate: 68,
      customerType: 'daily',
      paymentFrequency: 'weekly',
      payoutCycleDay: 'Sunday',
      totalDeliveredLitres: 7.5,
      totalReceivable: 510,
      totalReceived: 400,
      balance: 110,
      createdAt: new Date().toISOString(),
    },
    {
      _id: 'cust_3',
      customerId: 'C-003',
      name: 'Shanthi Devi',
      location: 'Lake View',
      phone: '97890 33333',
      address: '74 Lake Avenue',
      status: 'active',
      defaultMilkType: 'Cow Milk',
      dailyMorningQuantity: 1,
      dailyEveningQuantity: 1,
      defaultRate: 52,
      customerType: 'daily',
      paymentFrequency: 'monthly',
      payoutCycleDate: 5,
      totalDeliveredLitres: 10,
      totalReceivable: 520,
      totalReceived: 500,
      balance: 20,
      createdAt: new Date().toISOString(),
    },
    {
      _id: 'cust_4',
      customerId: 'C-004',
      name: 'Karthik Raman',
      location: 'North Village',
      phone: '97890 44444',
      address: '102 Main Bazaar',
      status: 'active',
      defaultMilkType: 'Cow Milk',
      dailyMorningQuantity: 2,
      dailyEveningQuantity: 2,
      defaultRate: 52,
      customerType: 'occasional',
      paymentFrequency: 'daily',
      totalDeliveredLitres: 20,
      totalReceivable: 1040,
      totalReceived: 900,
      balance: 140,
      createdAt: new Date().toISOString(),
    },
    {
      _id: 'cust_5',
      customerId: 'C-005',
      name: 'Meenakshi S',
      location: 'Riverside Farm',
      phone: '97890 55555',
      address: '5 River View Ln',
      status: 'active',
      defaultMilkType: 'Buffalo Milk',
      dailyMorningQuantity: 0.5,
      dailyEveningQuantity: 0.5,
      defaultRate: 68,
      customerType: 'seasonal',
      paymentFrequency: 'weekly',
      payoutCycleDay: 'Friday',
      totalDeliveredLitres: 5,
      totalReceivable: 340,
      totalReceived: 300,
      balance: 40,
      createdAt: new Date().toISOString(),
    },
  ];

  const buyers = [
    {
      _id: 'buy_1',
      buyerId: 'B-001',
      name: 'Sri Krishna Sweets',
      businessName: 'Krishna Sweets & Bakery',
      location: 'Lake View',
      phone: '98840 99901',
      address: 'Commercial St 12',
      status: 'active',
      defaultMilkType: 'Cow Milk',
      defaultRate: 50,
      totalPurchasedLitres: 75,
      totalAmount: 3750,
      totalPaid: 2500,
      balance: 1250,
      createdAt: new Date().toISOString(),
    },
    {
      _id: 'buy_2',
      buyerId: 'B-002',
      name: 'Anandha Bhavan Tea Stall',
      businessName: 'Anandha Bhavan',
      location: 'North Village',
      phone: '98840 99902',
      address: 'Bus Stand Jn',
      status: 'active',
      defaultMilkType: 'Cow Milk',
      defaultRate: 49,
      totalPurchasedLitres: 60,
      totalAmount: 2940,
      totalPaid: 2000,
      balance: 940,
      createdAt: new Date().toISOString(),
    },
    {
      _id: 'buy_3',
      buyerId: 'B-003',
      name: 'Balaji Milk Centre',
      businessName: 'Balaji Dairy Parlour',
      location: 'Green Meadows',
      phone: '98840 99903',
      address: 'Main Circle',
      status: 'active',
      defaultMilkType: 'Buffalo Milk',
      defaultRate: 65,
      totalPurchasedLitres: 45,
      totalAmount: 2925,
      totalPaid: 2000,
      balance: 925,
      createdAt: new Date().toISOString(),
    },
  ];

  // Activities for past 5 days
  const activities = [];
  let actCounter = 1;

  for (let daysAgo = 4; daysAgo >= 0; daysAgo--) {
    const dateStr = getPastDateStr(daysAgo);

    // 1. Morning Collection from Vendors
    vendors.forEach((v, index) => {
      const qty = 16 + index * 2 + (daysAgo % 2 === 0 ? 3 : 0);
      const amount = roundDecimal(qty * v.defaultRate);
      activities.push({
        _id: `act_${actCounter++}`,
        date: dateStr,
        session: 'morning',
        type: 'collection',
        partyType: 'vendor',
        partyId: v._id,
        partyCode: v.vendorId,
        partyName: v.name,
        partyLocation: v.location,
        milkType: v.defaultMilkType,
        quantityLitres: qty,
        ratePerLitre: v.defaultRate,
        totalAmount: amount,
        notes: 'Morning collection batch',
        status: 'active',
        createdBy: 'usr_employee',
        createdByName: 'Suresh Kumar',
        createdAt: `${dateStr}T06:30:00.000Z`,
      });
    });

    // 2. Evening Collection from select vendors
    vendors.slice(0, 3).forEach((v, index) => {
      const qty = 10 + index * 2;
      const amount = roundDecimal(qty * v.defaultRate);
      activities.push({
        _id: `act_${actCounter++}`,
        date: dateStr,
        session: 'evening',
        type: 'collection',
        partyType: 'vendor',
        partyId: v._id,
        partyCode: v.vendorId,
        partyName: v.name,
        partyLocation: v.location,
        milkType: v.defaultMilkType,
        quantityLitres: qty,
        ratePerLitre: v.defaultRate,
        totalAmount: amount,
        notes: 'Evening collection batch',
        status: 'active',
        createdBy: 'usr_employee',
        createdByName: 'Suresh Kumar',
        createdAt: `${dateStr}T18:00:00.000Z`,
      });
    });

    // 3. Morning Distribution to Customers
    customers.forEach((c) => {
      if (c.dailyMorningQuantity > 0) {
        const amount = roundDecimal(c.dailyMorningQuantity * c.defaultRate);
        activities.push({
          _id: `act_${actCounter++}`,
          date: dateStr,
          session: 'morning',
          type: 'distribution',
          partyType: 'customer',
          partyId: c._id,
          partyCode: c.customerId,
          partyName: c.name,
          partyLocation: c.location,
          milkType: c.defaultMilkType,
          quantityLitres: c.dailyMorningQuantity,
          ratePerLitre: c.defaultRate,
          totalAmount: amount,
          notes: 'Morning home delivery',
          status: 'active',
          createdBy: 'usr_employee',
          createdByName: 'Suresh Kumar',
          createdAt: `${dateStr}T07:15:00.000Z`,
        });
      }
    });

    // 4. Evening Distribution to Customers
    customers.forEach((c) => {
      if (c.dailyEveningQuantity > 0) {
        const amount = roundDecimal(c.dailyEveningQuantity * c.defaultRate);
        activities.push({
          _id: `act_${actCounter++}`,
          date: dateStr,
          session: 'evening',
          type: 'distribution',
          partyType: 'customer',
          partyId: c._id,
          partyCode: c.customerId,
          partyName: c.name,
          partyLocation: c.location,
          milkType: c.defaultMilkType,
          quantityLitres: c.dailyEveningQuantity,
          ratePerLitre: c.defaultRate,
          totalAmount: amount,
          notes: 'Evening home delivery',
          status: 'active',
          createdBy: 'usr_employee',
          createdByName: 'Suresh Kumar',
          createdAt: `${dateStr}T18:45:00.000Z`,
        });
      }
    });

    // 5. Bulk Buyer Sales
    if (daysAgo % 2 === 0) {
      const b = buyers[0];
      const qty = 25;
      const amount = roundDecimal(qty * b.defaultRate);
      activities.push({
        _id: `act_${actCounter++}`,
        date: dateStr,
        session: 'morning',
        type: 'buyer_sale',
        partyType: 'buyer',
        partyId: b._id,
        partyCode: b.buyerId,
        partyName: b.name,
        partyLocation: b.location,
        milkType: b.defaultMilkType,
        quantityLitres: qty,
        ratePerLitre: b.defaultRate,
        totalAmount: amount,
        notes: 'Bulk delivery for sweets preparation',
        status: 'active',
        createdBy: 'usr_employee',
        createdByName: 'Suresh Kumar',
        createdAt: `${dateStr}T08:00:00.000Z`,
      });
    }
  }

  const todayStr = getPastDateStr(0);

  const payments = [
    {
      _id: 'pay_1',
      paymentNumber: 'PAY-2026-0001',
      date: todayStr,
      partyType: 'vendor',
      partyId: 'ven_1',
      partyCode: 'V-001',
      partyName: 'Murugan Dairy',
      paymentType: 'pay',
      amount: 2500,
      paymentMode: 'Bank Transfer',
      referenceNumber: 'NEFT98172648',
      notes: 'Weekly vendor milk settlement',
      status: 'completed',
      createdBy: 'usr_admin',
      createdByName: 'Kavitha Nathan',
      createdAt: `${todayStr}T09:30:00.000Z`,
    },
    {
      _id: 'pay_2',
      paymentNumber: 'PAY-2026-0002',
      date: todayStr,
      partyType: 'customer',
      partyId: 'cust_1',
      partyCode: 'C-001',
      partyName: 'Priya Krishnan',
      paymentType: 'receive',
      amount: 750,
      paymentMode: 'UPI',
      referenceNumber: 'UPI/2026/8837192',
      notes: 'Customer monthly payment settlement',
      status: 'completed',
      createdBy: 'usr_employee',
      createdByName: 'Suresh Kumar',
      createdAt: `${todayStr}T10:15:00.000Z`,
    },
    {
      _id: 'pay_3',
      paymentNumber: 'PAY-2026-0003',
      date: todayStr,
      partyType: 'buyer',
      partyId: 'buy_1',
      partyCode: 'B-001',
      partyName: 'Sri Krishna Sweets',
      paymentType: 'receive',
      amount: 2500,
      paymentMode: 'Cash',
      referenceNumber: 'CASH-REC-104',
      notes: 'Bulk sweets purchase advance',
      status: 'completed',
      createdBy: 'usr_admin',
      createdByName: 'Kavitha Nathan',
      createdAt: `${todayStr}T11:00:00.000Z`,
    },
  ];

  const logs = [
    {
      _id: 'log_1',
      userId: 'usr_superadmin',
      userName: 'Rajesh Sharma',
      role: 'super_admin',
      action: 'CREATE',
      module: 'System',
      details: 'Initialized Paal-Note Dairy Management System in Client-Side Offline Storage',
      timestamp: new Date().toISOString(),
    },
    {
      _id: 'log_2',
      userId: 'usr_admin',
      userName: 'Kavitha Nathan',
      role: 'admin',
      action: 'PAYMENT',
      module: 'Payments',
      details: 'Recorded settlement PAY-2026-0001 for vendor Murugan Dairy (₹2,500)',
      timestamp: `${todayStr}T09:30:00.000Z`,
    },
  ];

  return {
    organization: org,
    users,
    vendors,
    customers,
    buyers,
    activities,
    payments,
    masters,
    logs,
  };
};

class LocalDatabaseManager {
  constructor() {
    this.state = null;
    this.isLoaded = false;
    this.activeUserId = 'usr_superadmin';
  }

  async getDb() {
    if (this.state && this.isLoaded) {
      return this.state;
    }

    try {
      const stored = await AsyncStorage.getItem(DB_STORAGE_KEY);
      if (stored) {
        this.state = JSON.parse(stored);
      } else {
        this.state = getInitialSeedData();
        await AsyncStorage.setItem(DB_STORAGE_KEY, JSON.stringify(this.state));
      }
    } catch (err) {
      console.warn('Failed to load from AsyncStorage, using fresh seed data:', err);
      this.state = getInitialSeedData();
    }

    try {
      const savedUser = await AsyncStorage.getItem(ACTIVE_USER_ID_KEY);
      if (savedUser) {
        this.activeUserId = savedUser;
      }
    } catch {
      // ignore
    }

    this.isLoaded = true;
    return this.state;
  }

  async saveDb() {
    if (!this.state) return;
    try {
      await AsyncStorage.setItem(DB_STORAGE_KEY, JSON.stringify(this.state));
    } catch (err) {
      console.error('Failed to save to AsyncStorage:', err);
    }
  }

  async resetToSeedData() {
    this.state = getInitialSeedData();
    await AsyncStorage.setItem(DB_STORAGE_KEY, JSON.stringify(this.state));
    this.activeUserId = 'usr_superadmin';
    await AsyncStorage.setItem(ACTIVE_USER_ID_KEY, this.activeUserId);
    this.isLoaded = true;
    return this.state;
  }

  getActiveUser(db) {
    const found = db.users.find((u) => u.id === this.activeUserId || u._id === this.activeUserId);
    return found || db.users[0];
  }

  async setActiveUser(userId) {
    this.activeUserId = userId;
    try {
      await AsyncStorage.setItem(ACTIVE_USER_ID_KEY, userId);
    } catch {
      // ignore
    }
  }

  addLog(db, action, module, details, recordId) {
    const user = this.getActiveUser(db);
    db.logs.unshift({
      _id: generateId('log'),
      userId: user.id || user._id,
      userName: user.name,
      role: user.role,
      action,
      module,
      details,
      recordId,
      timestamp: new Date().toISOString(),
    });
  }

  // Recalculate party financial balances
  recalculateVendorFinancials(db, vendorId) {
    const vendor = db.vendors.find((v) => v._id === vendorId);
    if (!vendor) return;

    const activeActivities = db.activities.filter(
      (a) => a.partyId === vendorId && a.type === 'collection' && a.status === 'active'
    );
    const activePayments = db.payments.filter(
      (p) => p.partyId === vendorId && p.paymentType === 'pay' && p.status === 'completed'
    );

    const totalLitres = activeActivities.reduce((sum, a) => sum + a.quantityLitres, 0);
    const totalPayable = activeActivities.reduce((sum, a) => sum + a.totalAmount, 0);
    const totalPaid = activePayments.reduce((sum, p) => sum + p.amount, 0);

    vendor.totalCollectedLitres = roundDecimal(totalLitres);
    vendor.totalPayable = roundDecimal(totalPayable);
    vendor.totalPaid = roundDecimal(totalPaid);
    vendor.balance = roundDecimal(totalPayable - totalPaid);
  }

  recalculateCustomerFinancials(db, customerId) {
    const customer = db.customers.find((c) => c._id === customerId);
    if (!customer) return;

    const activeActivities = db.activities.filter(
      (a) => a.partyId === customerId && a.type === 'distribution' && a.status === 'active'
    );
    const activePayments = db.payments.filter(
      (p) => p.partyId === customerId && p.paymentType === 'receive' && p.status === 'completed'
    );

    const totalLitres = activeActivities.reduce((sum, a) => sum + a.quantityLitres, 0);
    const totalBilled = activeActivities.reduce((sum, a) => sum + a.totalAmount, 0);
    const totalReceived = activePayments.reduce((sum, p) => sum + p.amount, 0);

    customer.totalDeliveredLitres = roundDecimal(totalLitres);
    customer.totalReceivable = roundDecimal(totalBilled);
    customer.totalReceived = roundDecimal(totalReceived);
    customer.balance = roundDecimal(totalBilled - totalReceived);
  }

  recalculateBuyerFinancials(db, buyerId) {
    const buyer = db.buyers.find((b) => b._id === buyerId);
    if (!buyer) return;

    const activeActivities = db.activities.filter(
      (a) => a.partyId === buyerId && a.type === 'buyer_sale' && a.status === 'active'
    );
    const activePayments = db.payments.filter(
      (p) => p.partyId === buyerId && p.paymentType === 'receive' && p.status === 'completed'
    );

    const totalLitres = activeActivities.reduce((sum, a) => sum + a.quantityLitres, 0);
    const totalAmount = activeActivities.reduce((sum, a) => sum + a.totalAmount, 0);
    const totalPaid = activePayments.reduce((sum, p) => sum + p.amount, 0);

    buyer.totalPurchasedLitres = roundDecimal(totalLitres);
    buyer.totalAmount = roundDecimal(totalAmount);
    buyer.totalPaid = roundDecimal(totalPaid);
    buyer.balance = roundDecimal(totalAmount - totalPaid);
  }
}

export const localDb = new LocalDatabaseManager();
