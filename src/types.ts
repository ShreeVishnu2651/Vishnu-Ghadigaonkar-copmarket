/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Member {
  id: string;
  flatNo: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  familyMembers: number;
  joiningDate: string;
  status: 'Active' | 'Inactive';
}

export interface Product {
  id: string;
  productName: string;
  category: string;
  barcode?: string;
  price: number;
  quantity: number; // Stock quantity
  expiryDate: string;
  supplierName: string;
  imageUrl?: string;
}

export interface MilkSubscription {
  id: string;
  memberId: string;
  memberName: string;
  flatNo: string;
  milkBrand: string;
  quantity: number; // in Liters per delivery
  deliveryTime: 'Morning' | 'Evening' | 'Both';
  pricePerLiter: number;
  startDate: string;
  status: 'Active' | 'Paused';
}

export interface NewspaperSubscription {
  id: string;
  memberId: string;
  memberName: string;
  flatNo: string;
  newspaperName: string;
  language: string;
  monthlyCharge: number;
  status: 'Active' | 'Paused';
}

export interface Bill {
  id: string;
  memberId: string;
  memberName: string;
  flatNo: string;
  billingMonth: string; // e.g. "June 2026"
  groceryAmount: number;
  milkAmount: number;
  newspaperAmount: number;
  maintenanceAmount: number;
  gst: number;
  discount: number;
  totalAmount: number;
  paymentStatus: 'Paid' | 'Unpaid';
  dateGenerated: string;
}

export interface PaymentTransaction {
  id: string;
  memberId: string;
  memberName: string;
  flatNo: string;
  billId?: string;
  amount: number;
  paymentMethod: 'Cash' | 'UPI' | 'Credit Card' | 'Debit Card' | 'Wallet';
  transactionId: string;
  paymentDate: string;
  status: 'Success' | 'Refunded';
}

export interface NotificationLog {
  id: string;
  memberId: string;
  memberName: string;
  flatNo: string;
  type: 'SMS' | 'Email';
  title: string;
  message: string;
  sentDate: string;
  status: 'Sent' | 'Failed';
}

export interface UserSession {
  id: string;
  name: string;
  role: 'Admin' | 'Cashier' | 'Society Member';
  memberId?: string; // If role is Society Member
  flatNo?: string;
  phone?: string;
  email: string;
  token?: string;
  expiresAt?: number;
  isInitialPassword?: boolean;
}
