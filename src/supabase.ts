/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { 
  Member, 
  Product, 
  MilkSubscription, 
  NewspaperSubscription, 
  Bill, 
  PaymentTransaction, 
  NotificationLog 
} from './types';

// Environment credentials for Supabase
export function getActiveSupabaseCredentials(): { url: string; key: string } {
  let url = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) || '';
  let key = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) || '';

  if (typeof window !== 'undefined') {
    const storedUrl = localStorage.getItem('supabase_url') || localStorage.getItem('VITE_SUPABASE_URL');
    const storedKey = localStorage.getItem('supabase_anon_key') || localStorage.getItem('VITE_SUPABASE_ANON_KEY');
    if (storedUrl && storedUrl.startsWith('https://')) {
      url = storedUrl;
    }
    if (storedKey && storedKey.length > 10) {
      key = storedKey;
    }
  }

  url = (url || '').replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '').trim();
  key = (key || '').trim();

  return { url, key };
}

// Validate if active Supabase project credentials are provided
export const isSupabaseConfigured = Boolean(
  getActiveSupabaseCredentials().url && 
  getActiveSupabaseCredentials().key && 
  !getActiveSupabaseCredentials().url.includes('your-project') &&
  !getActiveSupabaseCredentials().url.includes('placeholder')
);

// Lazy singleton Supabase client
let supabaseInstance: SupabaseClient | null = null;
let lastUsedUrl = '';
let lastUsedKey = '';

export function getSupabase(): SupabaseClient | null {
  const { url, key } = getActiveSupabaseCredentials();
  if (!url || !key || !url.startsWith('https://') || url.includes('your-project') || url.includes('placeholder')) {
    return null;
  }

  if (!supabaseInstance || lastUsedUrl !== url || lastUsedKey !== key) {
    try {
      supabaseInstance = createClient(url, key, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
        realtime: {
          params: {
            eventsPerSecond: 20
          }
        }
      });
      lastUsedUrl = url;
      lastUsedKey = key;
    } catch (err) {
      console.warn('Failed to initialize Supabase client:', err);
      return null;
    }
  }
  return supabaseInstance;
}

export const supabase = getSupabase();

// Notification and Sync Event Bus for UI feedback
export type SupabaseSyncEvent = {
  table: string;
  action: 'insert' | 'update' | 'delete' | 'upsert' | 'select' | 'test';
  success: boolean;
  message?: string;
  error?: any;
  timestamp: number;
};

type SyncListener = (event: SupabaseSyncEvent) => void;
const syncListeners: Set<SyncListener> = new Set();

export function onSupabaseSyncEvent(listener: SyncListener): () => void {
  syncListeners.add(listener);
  return () => {
    syncListeners.delete(listener);
  };
}

export function emitSupabaseSyncEvent(event: Omit<SupabaseSyncEvent, 'timestamp'>) {
  const fullEvent: SupabaseSyncEvent = { ...event, timestamp: Date.now() };
  syncListeners.forEach(l => {
    try {
      l(fullEvent);
    } catch (err) {
      console.warn('Sync listener error:', err);
    }
  });
}

/**
 * Persists Supabase Credentials to BOTH browser local storage and server backend!
 */
export async function saveSupabaseCredentials(url: string, key: string): Promise<{ success: boolean; message: string }> {
  const cleanUrl = url.trim().replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
  const cleanKey = key.trim();

  if (typeof window !== 'undefined') {
    localStorage.setItem('supabase_url', cleanUrl);
    localStorage.setItem('supabase_anon_key', cleanKey);
  }

  // Force re-init of client
  if (supabaseInstance) {
    supabaseInstance = null;
    lastUsedUrl = '';
    lastUsedKey = '';
  }

  try {
    const res = await fetch('/api/supabase/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: cleanUrl, key: cleanKey })
    });
    const data = await res.json();
    return {
      success: data.success ?? true,
      message: data.message || 'Credentials updated successfully on client & server.'
    };
  } catch (err: any) {
    return {
      success: true,
      message: 'Credentials saved locally in browser.'
    };
  }
}
export async function loginMember(username: string, flatNoOrPassword: string) {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password: flatNoOrPassword }),
  });
  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.message || 'Invalid member name or flat number.');
  }
  return data;
}

export async function changeMemberPassword(token: string, newPassword: string) {
  const response = await fetch('/api/auth/change-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, newPassword }),
  });
  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.message || 'Failed to update password.');
  }
  return data;
}

export async function verifyMemberSession(token: string) {
  const response = await fetch('/api/auth/verify-session', {
    method: 'GET',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}` 
    },
  });
  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.message || 'Session expired.');
  }
  return data.user;
}

export async function logoutMember(token?: string) {
  try {
    if (token) {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
    }
  } catch (err) {
    console.warn('Logout notification error:', err);
  }
}

// ---------------------------------------------------------------------------
// Supabase Database Model Converters (handling snake_case <-> camelCase)
// ---------------------------------------------------------------------------

export function mapMemberFromSupabase(row: any): Member {
  return {
    id: row.id,
    flatNo: row.flat_no || row.flatNo || '',
    name: row.name || '',
    phone: row.phone || '',
    email: row.email || '',
    address: row.address || '',
    familyMembers: Number(row.family_members || row.familyMembers || 1),
    joiningDate: row.joining_date || row.joiningDate || new Date().toISOString().split('T')[0],
    status: row.status || 'Active'
  };
}

export function mapMemberToSupabase(member: Partial<Member>): Record<string, any> {
  const result: Record<string, any> = {};
  if (member.id !== undefined) result.id = member.id;
  if (member.flatNo !== undefined) result.flat_no = member.flatNo;
  if (member.name !== undefined) result.name = member.name;
  if (member.phone !== undefined) result.phone = member.phone;
  if (member.email !== undefined) result.email = member.email;
  if (member.address !== undefined) result.address = member.address;
  if (member.familyMembers !== undefined) result.family_members = Number(member.familyMembers);
  if (member.joiningDate !== undefined) result.joining_date = member.joiningDate;
  if (member.status !== undefined) result.status = member.status;
  return result;
}

export function mapProductFromSupabase(row: any): Product {
  return {
    id: row.id,
    productName: row.product_name || row.productName || '',
    category: row.category || '',
    barcode: row.barcode || '',
    price: Number(row.price || 0),
    quantity: Number(row.quantity || 0),
    expiryDate: row.expiry_date || row.expiryDate || '',
    supplierName: row.supplier_name || row.supplierName || '',
    imageUrl: row.image_url || row.imageUrl || ''
  };
}

export function mapProductToSupabase(product: Partial<Product>): Record<string, any> {
  const result: Record<string, any> = {};
  if (product.id !== undefined) result.id = product.id;
  if (product.productName !== undefined) result.product_name = product.productName;
  if (product.category !== undefined) result.category = product.category;
  if (product.barcode !== undefined) result.barcode = product.barcode;
  if (product.price !== undefined) result.price = Number(product.price);
  if (product.quantity !== undefined) result.quantity = Number(product.quantity);
  if (product.expiryDate !== undefined) result.expiry_date = product.expiryDate;
  if (product.supplierName !== undefined) result.supplier_name = product.supplierName;
  if (product.imageUrl !== undefined) result.image_url = product.imageUrl;
  return result;
}

export function mapMilkFromSupabase(row: any): MilkSubscription {
  return {
    id: row.id,
    memberId: row.member_id || row.memberId || '',
    memberName: row.member_name || row.memberName || '',
    flatNo: row.flat_no || row.flatNo || '',
    milkBrand: row.milk_brand || row.milkBrand || row.milk_type || 'Amul Taaza (500ml)',
    quantity: Number(row.quantity || 1),
    deliveryTime: row.delivery_time || row.deliveryTime || 'Morning',
    pricePerLiter: Number(row.price_per_liter || row.pricePerLiter || 60),
    startDate: row.start_date || row.startDate || new Date().toISOString().split('T')[0],
    status: row.status || 'Active'
  };
}

export function mapMilkToSupabase(sub: Partial<MilkSubscription>): Record<string, any> {
  const result: Record<string, any> = {};
  if (sub.id !== undefined) result.id = sub.id;
  if (sub.memberId !== undefined) result.member_id = sub.memberId;
  if (sub.memberName !== undefined) result.member_name = sub.memberName;
  if (sub.flatNo !== undefined) result.flat_no = sub.flatNo;
  if (sub.milkBrand !== undefined) result.milk_brand = sub.milkBrand;
  if (sub.quantity !== undefined) result.quantity = Number(sub.quantity);
  if (sub.deliveryTime !== undefined) result.delivery_time = sub.deliveryTime;
  if (sub.pricePerLiter !== undefined) result.price_per_liter = Number(sub.pricePerLiter);
  if (sub.startDate !== undefined) result.start_date = sub.startDate;
  if (sub.status !== undefined) result.status = sub.status;
  return result;
}

export function mapNewspaperFromSupabase(row: any): NewspaperSubscription {
  return {
    id: row.id,
    memberId: row.member_id || row.memberId || '',
    memberName: row.member_name || row.memberName || '',
    flatNo: row.flat_no || row.flatNo || '',
    newspaperName: row.newspaper_name || row.newspaperName || row.paper_name || 'The Times of India',
    language: row.language || 'English',
    monthlyCharge: Number(row.monthly_charge || row.monthlyCharge || 150),
    status: row.status || 'Active'
  };
}

export function mapNewspaperToSupabase(sub: Partial<NewspaperSubscription>): Record<string, any> {
  const result: Record<string, any> = {};
  if (sub.id !== undefined) result.id = sub.id;
  if (sub.memberId !== undefined) result.member_id = sub.memberId;
  if (sub.memberName !== undefined) result.member_name = sub.memberName;
  if (sub.flatNo !== undefined) result.flat_no = sub.flatNo;
  if (sub.newspaperName !== undefined) result.newspaper_name = sub.newspaperName;
  if (sub.language !== undefined) result.language = sub.language;
  if (sub.monthlyCharge !== undefined) result.monthly_charge = Number(sub.monthlyCharge);
  if (sub.status !== undefined) result.status = sub.status;
  return result;
}

export function mapBillFromSupabase(row: any): Bill {
  return {
    id: row.id,
    memberId: row.member_id || row.memberId || '',
    memberName: row.member_name || row.memberName || '',
    flatNo: row.flat_no || row.flatNo || '',
    billingMonth: row.billing_month || row.billingMonth || '',
    groceryAmount: Number(row.grocery_amount || row.groceryAmount || 0),
    milkAmount: Number(row.milk_amount || row.milkAmount || 0),
    newspaperAmount: Number(row.newspaper_amount || row.newspaperAmount || 0),
    maintenanceAmount: Number(row.maintenance_amount || row.maintenanceAmount || 2500),
    gst: Number(row.gst || 0),
    discount: Number(row.discount || 0),
    totalAmount: Number(row.total_amount || row.totalAmount || 0),
    paymentStatus: row.payment_status || row.paymentStatus || 'Unpaid',
    dateGenerated: row.date_generated || row.dateGenerated || new Date().toISOString().split('T')[0]
  };
}

export function mapBillToSupabase(bill: Partial<Bill>): Record<string, any> {
  const result: Record<string, any> = {};
  if (bill.id !== undefined) result.id = bill.id;
  if (bill.memberId !== undefined) result.member_id = bill.memberId;
  if (bill.memberName !== undefined) result.member_name = bill.memberName;
  if (bill.flatNo !== undefined) result.flat_no = bill.flatNo;
  if (bill.billingMonth !== undefined) result.billing_month = bill.billingMonth;
  if (bill.groceryAmount !== undefined) result.grocery_amount = Number(bill.groceryAmount);
  if (bill.milkAmount !== undefined) result.milk_amount = Number(bill.milkAmount);
  if (bill.newspaperAmount !== undefined) result.newspaper_amount = Number(bill.newspaperAmount);
  if (bill.maintenanceAmount !== undefined) result.maintenance_amount = Number(bill.maintenanceAmount);
  if (bill.gst !== undefined) result.gst = Number(bill.gst);
  if (bill.discount !== undefined) result.discount = Number(bill.discount);
  if (bill.totalAmount !== undefined) result.total_amount = Number(bill.totalAmount);
  if (bill.paymentStatus !== undefined) result.payment_status = bill.paymentStatus;
  if (bill.dateGenerated !== undefined) result.date_generated = bill.dateGenerated;
  return result;
}

export function mapPaymentFromSupabase(row: any, membersList?: Member[]): PaymentTransaction {
  let memberName = row.member_name || row.memberName || '';
  let flatNo = row.flat_no || row.flatNo || '';
  const memberId = row.member_id || row.memberId || '';

  // Auto-resolve member details if missing or default placeholder
  if ((!memberName || memberName === 'Unknown Member' || memberName.toLowerCase().startsWith('unknown')) && membersList && memberId) {
    const matched = membersList.find(m => m.id === memberId);
    if (matched) {
      memberName = matched.name;
      if (!flatNo || flatNo === 'N/A') flatNo = matched.flatNo;
    }
  }

  if (!memberName) {
    memberName = memberId === 'Visitor' ? 'Walk-in Guest' : (memberId ? `Resident (${memberId})` : 'Walk-in Guest');
  }

  return {
    id: row.id,
    memberId,
    memberName,
    flatNo: flatNo || 'N/A',
    amount: Number(row.amount || 0),
    paymentMethod: row.payment_method || row.paymentMethod || 'Cash',
    transactionId: row.transaction_id || row.transactionId || '',
    paymentDate: row.payment_date || row.paymentDate || new Date().toISOString().replace('T', ' ').substring(0, 16),
    status: row.status || 'Success',
    billId: row.bill_id || row.billId
  };
}

export function mapPaymentToSupabase(payment: Partial<PaymentTransaction>): Record<string, any> {
  const result: Record<string, any> = {};
  if (payment.id !== undefined) result.id = payment.id;
  if (payment.memberId !== undefined) result.member_id = payment.memberId;
  if (payment.memberName !== undefined) result.member_name = payment.memberName;
  if (payment.flatNo !== undefined) result.flat_no = payment.flatNo;
  if (payment.amount !== undefined) result.amount = Number(payment.amount);
  if (payment.paymentMethod !== undefined) result.payment_method = payment.paymentMethod;
  if (payment.transactionId !== undefined) result.transaction_id = payment.transactionId;
  if (payment.paymentDate !== undefined) result.payment_date = payment.paymentDate;
  if (payment.status !== undefined) result.status = payment.status;
  if (payment.billId !== undefined) result.bill_id = payment.billId;
  return result;
}

export function mapNotificationFromSupabase(row: any): NotificationLog {
  return {
    id: row.id,
    memberId: row.member_id || row.memberId || '',
    memberName: row.member_name || row.memberName || '',
    flatNo: row.flat_no || row.flatNo || '',
    type: row.type || 'Email',
    title: row.title || '',
    message: row.message || '',
    sentDate: row.sent_date || row.sentDate || new Date().toISOString().replace('T', ' ').substring(0, 16),
    status: row.status || 'Sent'
  };
}

export function mapNotificationToSupabase(notif: Partial<NotificationLog>): Record<string, any> {
  const result: Record<string, any> = {};
  if (notif.id !== undefined) result.id = notif.id;
  if (notif.memberId !== undefined) result.member_id = notif.memberId;
  if (notif.memberName !== undefined) result.member_name = notif.memberName;
  if (notif.flatNo !== undefined) result.flat_no = notif.flatNo;
  if (notif.type !== undefined) result.type = notif.type;
  if (notif.title !== undefined) result.title = notif.title;
  if (notif.message !== undefined) result.message = notif.message;
  if (notif.sentDate !== undefined) result.sent_date = notif.sentDate;
  if (notif.status !== undefined) result.status = notif.status;
  return result;
}

// ---------------------------------------------------------------------------
// Resilient & Fault-Tolerant Supabase CRUD Operations with Adaptive Schema Handling
// ---------------------------------------------------------------------------

/**
 * Helper to extract unrecognised column name from PostgREST/Supabase error messages
 */
function extractUnknownColumnName(errorObj: any): string | null {
  if (!errorObj) return null;
  const msg = String(errorObj.message || errorObj.details || errorObj.hint || '');
  
  // Pattern 1: "Could not find the 'address' column of 'members' in the schema cache"
  const m1 = msg.match(/Could not find the ['"]([^'"]+)['"] column/i);
  if (m1 && m1[1]) return m1[1];

  // Pattern 2: column "address" of relation "members" does not exist
  const m2 = msg.match(/column ['"]?([a-zA-Z0-9_]+)['"]? of relation/i);
  if (m2 && m2[1]) return m2[1];

  // Pattern 3: column "address" does not exist
  const m3 = msg.match(/column ['"]?([a-zA-Z0-9_]+)['"]? does not exist/i);
  if (m3 && m3[1]) return m3[1];

  return null;
}

/**
 * Strips a specific property key from all rows or a single row object
 */
function stripColumnFromRows(rows: Record<string, any>[], colName: string): Record<string, any>[] {
  return rows.map(r => {
    const copy = { ...r };
    delete copy[colName];
    return copy;
  });
}

/**
 * Upsert records into Supabase with automatic retrying & stripping of missing columns
 */
export async function safeSupabaseUpsert(
  table: string,
  data: Record<string, any> | Record<string, any>[]
): Promise<{ success: boolean; data?: any; error?: any }> {
  const client = getSupabase();
  if (!client) {
    console.warn(`[Supabase Upsert] Supabase client not initialized. Make sure credentials are set.`);
    emitSupabaseSyncEvent({
      table,
      action: 'upsert',
      success: false,
      message: 'Supabase credentials missing or invalid. Check Supabase Live setup.',
      error: 'Not configured'
    });
    return { success: false, error: 'Supabase client not initialized' };
  }

  let rowList: Record<string, any>[] = Array.isArray(data) ? [...data] : [{ ...data }];
  if (rowList.length === 0) return { success: true, data: [] };

  const maxRetries = 10;
  let lastError: any = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const res = await client.from(table).upsert(rowList, { onConflict: 'id' }).select();
      if (!res.error) {
        console.log(`[Supabase Upsert SUCCESS] Table '${table}' updated/inserted successfully.`);
        emitSupabaseSyncEvent({
          table,
          action: 'upsert',
          success: true,
          message: `Synced ${rowList.length} record(s) to table '${table}' in Supabase.`
        });
        return { success: true, data: res.data };
      }

      lastError = res.error;
      const unknownCol = extractUnknownColumnName(res.error);
      if (unknownCol) {
        console.warn(`[Supabase Schema Adaptive] Column '${unknownCol}' not present in Supabase table '${table}'. Auto-adapting schema and retrying...`);
        rowList = stripColumnFromRows(rowList, unknownCol);
        continue;
      }

      console.warn(`[Supabase Upsert Error] Table '${table}' returned:`, res.error);
      break;
    } catch (err: any) {
      lastError = err;
      console.warn(`[Supabase Upsert Exception] Table '${table}':`, err);
      break;
    }
  }

  emitSupabaseSyncEvent({
    table,
    action: 'upsert',
    success: false,
    message: `Failed syncing to '${table}': ${lastError?.message || 'Check table existence & RLS policies'}`,
    error: lastError
  });

  return { success: false, error: lastError };
}

export async function safeSupabaseInsert(
  table: string, 
  payload: Record<string, any> | Record<string, any>[], 
  _fallbackPayload?: Record<string, any>
): Promise<{ success: boolean; data?: any; error?: any }> {
  return await safeSupabaseUpsert(table, payload);
}

export async function safeSupabaseUpdate(
  table: string, 
  id: string, 
  payload: Record<string, any>, 
  _fallbackPayload?: Record<string, any>
): Promise<{ success: boolean; data?: any; error?: any }> {
  const client = getSupabase();
  if (!client) {
    emitSupabaseSyncEvent({
      table,
      action: 'update',
      success: false,
      message: 'Supabase not configured.',
      error: 'Not configured'
    });
    return { success: false, error: 'Supabase client not initialized' };
  }

  const completePayload = { ...payload, id };
  let currentPayload = { ...payload };
  const maxRetries = 10;
  let lastError: any = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const res = await client.from(table).update(currentPayload).eq('id', id).select();
      if (!res.error) {
        // If 0 rows matched (record not in Supabase yet), run upsert to guarantee creation!
        if (Array.isArray(res.data) && res.data.length === 0) {
          console.log(`[Supabase Update] ID '${id}' not in '${table}'. Running upsert to sync new record...`);
          return await safeSupabaseUpsert(table, completePayload);
        }
        console.log(`[Supabase Update SUCCESS] Table '${table}' ID '${id}' updated.`);
        emitSupabaseSyncEvent({
          table,
          action: 'update',
          success: true,
          message: `Updated row '${id}' in '${table}' in Supabase.`
        });
        return { success: true, data: res.data };
      }

      lastError = res.error;
      const unknownCol = extractUnknownColumnName(res.error);
      if (unknownCol) {
        console.warn(`[Supabase Schema Adaptive] Column '${unknownCol}' not in table '${table}'. Auto-adapting and retrying update...`);
        delete currentPayload[unknownCol];
        continue;
      }
      break;
    } catch (err: any) {
      lastError = err;
      break;
    }
  }

  // Fallback to upsert
  return await safeSupabaseUpsert(table, completePayload);
}

export async function safeSupabaseDelete(table: string, id: string): Promise<{ success: boolean; error?: any }> {
  const client = getSupabase();
  if (!client) return { success: false, error: 'Supabase client not initialized' };

  try {
    const res = await client.from(table).delete().eq('id', id);
    if (!res.error) {
      console.log(`[Supabase Delete SUCCESS] Table '${table}' row '${id}' deleted.`);
      emitSupabaseSyncEvent({
        table,
        action: 'delete',
        success: true,
        message: `Deleted row '${id}' from '${table}' in Supabase.`
      });
      return { success: true };
    }
    emitSupabaseSyncEvent({
      table,
      action: 'delete',
      success: false,
      message: `Failed deleting from '${table}': ${res.error.message}`,
      error: res.error
    });
    return { success: false, error: res.error };
  } catch (err: any) {
    console.warn(`Exception during Supabase delete on ${table}:`, err);
    emitSupabaseSyncEvent({
      table,
      action: 'delete',
      success: false,
      message: `Exception deleting from '${table}': ${err.message}`,
      error: err
    });
    return { success: false, error: err };
  }
}

export async function safeSupabaseSelect(table: string): Promise<any[] | null> {
  const client = getSupabase();
  if (!client) return null;

  try {
    const { data, error } = await client.from(table).select('*');
    if (error) {
      console.warn(`Supabase select from ${table} returned error:`, error.message);
      return null;
    }
    return Array.isArray(data) ? data : null;
  } catch (err) {
    console.warn(`Supabase select from ${table} failed:`, err);
    return null;
  }
}

