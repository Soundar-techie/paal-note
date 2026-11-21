export type UserRole = 'super_admin' | 'admin' | 'employee';

export interface UserPermissions {
  canEditActivities: boolean;
  canRecordPayments: boolean;
  canManageParties: boolean;
  canViewReports: boolean;
}

export interface User {
  id: string;
  _id?: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  status: 'active' | 'inactive';
  permissions: UserPermissions;
  organizationId?: string;
  organization?: {
    id: string;
    name: string;
    code: string;
    currency: string;
    settings?: any;
  };
}

export interface OrganizationSettings {
  currency: string;
  defaultCowMilkBuyRate: number;
  defaultCowMilkSellRate: number;
  defaultBuffaloMilkBuyRate: number;
  defaultBuffaloMilkSellRate: number;
  morningStart: string;
  eveningStart: string;
}

export type PaymentFrequency = 'daily' | 'weekly' | 'monthly';
export type PayoutCycleDay = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
export type CustomerType = 'daily' | 'occasional' | 'seasonal';

export interface Vendor {
  _id: string;
  vendorId: string;
  name: string;
  location: string;
  phone?: string;
  address?: string;
  status: 'active' | 'inactive';
  defaultMilkType: 'Cow Milk' | 'Buffalo Milk';
  defaultRate: number;
  paymentFrequency: PaymentFrequency;
  payoutCycleDay?: PayoutCycleDay;
  payoutCycleDate?: number;
  totalCollectedLitres: number;
  totalPayable: number;
  totalPaid: number;
  balance: number; // amount we owe the vendor
  advanceBalance: number;
  createdAt: string;
}

export interface Customer {
  _id: string;
  customerId: string;
  name: string;
  location: string;
  phone?: string;
  address?: string;
  status: 'active' | 'inactive';
  defaultMilkType: 'Cow Milk' | 'Buffalo Milk';
  dailyMorningQuantity: number;
  dailyEveningQuantity: number;
  defaultRate: number;
  customerType: CustomerType;
  paymentFrequency: PaymentFrequency;
  payoutCycleDay?: PayoutCycleDay;
  payoutCycleDate?: number;
  totalDeliveredLitres: number;
  totalReceivable: number;
  totalReceived: number;
  balance: number; // amount customer owes us
  createdAt: string;
}

export interface Buyer {
  _id: string;
  buyerId: string;
  name: string;
  location: string;
  phone?: string;
  address?: string;
  businessName?: string;
  status: 'active' | 'inactive';
  defaultMilkType: 'Cow Milk' | 'Buffalo Milk';
  defaultRate: number;
  totalPurchasedLitres: number;
  totalAmount: number;
  totalPaid: number;
  balance: number; // amount buyer owes us
  createdAt: string;
}

export type SessionType = 'morning' | 'evening';
export type ActivityType = 'collection' | 'distribution' | 'buyer_sale';
export type PartyType = 'vendor' | 'customer' | 'buyer';

export interface DailyActivity {
  _id: string;
  date: string;
  session: SessionType;
  type: ActivityType;
  partyType: PartyType;
  partyId: string;
  partyCode: string;
  partyName: string;
  partyLocation: string;
  milkType: string;
  quantityLitres: number;
  ratePerLitre: number;
  totalAmount: number;
  notes?: string;
  status: 'active' | 'corrected' | 'reversed';
  correctionReason?: string;
  createdBy: string;
  createdByName: string;
  createdAt: string;
}

export type PaymentMode = 'Cash' | 'UPI' | 'Bank Transfer' | 'Cheque';
export type PaymentType = 'pay' | 'receive';
export type PaymentPartyType = 'vendor' | 'customer' | 'buyer';

export interface Payment {
  _id: string;
  paymentNumber: string;
  date: string;
  partyType: PartyType;
  partyId: string;
  partyCode: string;
  partyName: string;
  paymentType: PaymentType;
  amount: number;
  paymentMode: PaymentMode;
  referenceNumber?: string;
  notes?: string;
  status: 'completed' | 'reversed';
  reversalReason?: string;
  createdBy: string;
  createdByName: string;
  createdAt: string;
}

export type MasterType =
  | 'milk_type'
  | 'unit'
  | 'default_rate'
  | 'payment_method'
  | 'activity_type'
  | 'location'
  | 'setting';

export interface Master {
  _id: string;
  type: MasterType;
  key: string;
  label: string;
  value?: any;
  description?: string;
  isActive: boolean;
  isSystem: boolean;
  order: number;
}

export interface ActivityLog {
  _id: string;
  userId?: string;
  userName: string;
  role: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'DEACTIVATE' | 'PAYMENT' | 'LOGIN' | 'REVERSAL' | 'SETTINGS_CHANGE';
  module: 'Vendors' | 'Customers' | 'Buyers' | 'Daily Activity' | 'Payments' | 'Masters' | 'Users' | 'Auth' | 'System';
  recordId?: string;
  details?: string;
  ip?: string;
  timestamp: string;
}

export interface DashboardSummary {
  totalCollected: number;
  totalDistributed: number;
  remainingMilk: number;
  morning: {
    collection: number;
    distribution: number;
    collectionAmount: number;
    distributionAmount: number;
  };
  evening: {
    collection: number;
    distribution: number;
    collectionAmount: number;
    distributionAmount: number;
  };
  buyerSales: {
    quantity: number;
    amount: number;
  };
  counts: {
    vendors: number;
    customers: number;
    buyers: number;
  };
  financials: {
    dailyIncome: number;
    dailyExpense: number;
    vendorPayableOutstanding: number;
    customerReceivableOutstanding: number;
    buyerReceivableOutstanding: number;
    netReceivable: number;
  };
}

export interface ChartDayData {
  date: string;
  day: string;
  collection: number;
  distribution: number;
}
