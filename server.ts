/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { createServer as createViteServer } from 'vite';
import type { 
  Member, 
  Product, 
  MilkSubscription, 
  NewspaperSubscription, 
  Bill, 
  PaymentTransaction, 
  NotificationLog 
} from './src/types.ts';

// Optional Supabase server-side client for notification synchronization
let activeSupabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
let activeSupabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

let supabaseServerClient = (activeSupabaseUrl && activeSupabaseKey && activeSupabaseUrl.startsWith('https://') && !activeSupabaseUrl.includes('your-project')) 
  ? createClient(activeSupabaseUrl, activeSupabaseKey) 
  : null;

function reinitServerSupabase(url?: string, key?: string) {
  if (url && key && url.startsWith('https://') && !url.includes('your-project')) {
    activeSupabaseUrl = url.trim();
    activeSupabaseKey = key.trim();
    try {
      supabaseServerClient = createClient(activeSupabaseUrl, activeSupabaseKey);
      console.log(`[Supabase Server] Initialized with URL: ${activeSupabaseUrl}`);
      return true;
    } catch (e) {
      console.error(`[Supabase Server] Init failed:`, e);
      return false;
    }
  }
  return false;
}

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const DB_FILE = path.join(process.cwd(), 'coopmart_db.json');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Dynamic ID Generators
const generateId = (prefix: string) => `${prefix}${Math.floor(100000 + Math.random() * 900000)}`;

// Initial Database Seeds
const initialMembers: Member[] = [
  {
    id: "M101",
    flatNo: "A-102",
    name: "Ramesh Sharma",
    phone: "+91 98765 43210",
    email: "ramesh.sharma@email.com",
    address: "CoopMart Residency, Sector 4, Block A",
    familyMembers: 4,
    joiningDate: "2025-01-15",
    status: "Active"
  },
  {
    id: "M102",
    flatNo: "B-304",
    name: "Anjali Gupta",
    phone: "+91 98234 56789",
    email: "anjali.gupta@email.com",
    address: "CoopMart Residency, Sector 4, Block B",
    familyMembers: 3,
    joiningDate: "2025-03-22",
    status: "Active"
  },
  {
    id: "M103",
    flatNo: "C-501",
    name: "Vikram Malhotra",
    phone: "+91 91122 33445",
    email: "vikram.m@email.com",
    address: "CoopMart Residency, Sector 4, Block C",
    familyMembers: 5,
    joiningDate: "2024-11-01",
    status: "Active"
  },
  {
    id: "M104",
    flatNo: "D-201",
    name: "Priya Nair",
    phone: "+91 95556 78912",
    email: "priya.nair@email.com",
    address: "CoopMart Residency, Sector 4, Block D",
    familyMembers: 2,
    joiningDate: "2025-05-18",
    status: "Active"
  },
  {
    id: "M105",
    flatNo: "A-403",
    name: "Sunil Deshmukh",
    phone: "+91 88889 99911",
    email: "sunil.d@email.com",
    address: "CoopMart Residency, Sector 4, Block A",
    familyMembers: 4,
    joiningDate: "2025-02-10",
    status: "Inactive"
  },
  {
    id: "M106",
    flatNo: "A-504",
    name: "Karan Johar",
    phone: "+91 99345 61234",
    email: "karan.johar@email.com",
    address: "CoopMart Residency, Sector 4, Block A",
    familyMembers: 2,
    joiningDate: "2025-06-01",
    status: "Active"
  },
  {
    id: "M107",
    flatNo: "B-205",
    name: "Rohan Mehra",
    phone: "+91 98451 23678",
    email: "rohan.mehra@email.com",
    address: "CoopMart Residency, Sector 4, Block B",
    familyMembers: 3,
    joiningDate: "2025-06-10",
    status: "Active"
  },
  {
    id: "M108",
    flatNo: "C-101",
    name: "Surbhi Jyoti",
    phone: "+91 99887 76655",
    email: "surbhi.jyoti@email.com",
    address: "CoopMart Residency, Sector 4, Block C",
    familyMembers: 4,
    joiningDate: "2025-06-12",
    status: "Active"
  },
  {
    id: "M109",
    flatNo: "D-402",
    name: "Devendra Fadnavis",
    phone: "+91 98761 12233",
    email: "devendra.f@email.com",
    address: "CoopMart Residency, Sector 4, Block D",
    familyMembers: 4,
    joiningDate: "2025-06-15",
    status: "Active"
  },
  {
    id: "M110",
    flatNo: "A-301",
    name: "Shreya Ghoshal",
    phone: "+91 95551 11222",
    email: "shreya.g@email.com",
    address: "CoopMart Residency, Sector 4, Block A",
    familyMembers: 5,
    joiningDate: "2025-06-11",
    status: "Active"
  },
  {
    id: "M111",
    flatNo: "B-102",
    name: "Amit Trivedi",
    phone: "+91 91112 22333",
    email: "amit.t@email.com",
    address: "CoopMart Residency, Sector 4, Block B",
    familyMembers: 2,
    joiningDate: "2025-06-08",
    status: "Active"
  },
  {
    id: "M112",
    flatNo: "C-602",
    name: "Nisha Jindal",
    phone: "+91 88776 65544",
    email: "nisha.jindal@email.com",
    address: "CoopMart Residency, Sector 4, Block C",
    familyMembers: 3,
    joiningDate: "2025-06-05",
    status: "Active"
  },
  {
    id: "M113",
    flatNo: "D-503",
    name: "Rajesh Koothrappali",
    phone: "+91 90001 00002",
    email: "rajesh.k@email.com",
    address: "CoopMart Residency, Sector 4, Block D",
    familyMembers: 1,
    joiningDate: "2025-06-14",
    status: "Active"
  }
];

const initialProducts: Product[] = [
  {
    id: "P101",
    productName: "Amul Fresh Gold Milk (1L)",
    category: "Fresh Dairy",
    barcode: "8901262010015",
    price: 68,
    quantity: 133,
    expiryDate: "2026-06-25",
    supplierName: "Amul Dairy Corp",
    imageUrl: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=150&auto=format&fit=crop&q=80"
  },
  {
    id: "P102",
    productName: "Aashirvaad Chakki Atta (5kg)",
    category: "Grains & Flours",
    barcode: "8901725181223",
    price: 265,
    quantity: 54,
    expiryDate: "2026-11-15",
    supplierName: "ITC Limited",
    imageUrl: "https://images.unsplash.com/photo-1574316071802-0d684efa7bf5?w=150&auto=format&fit=crop&q=80"
  },
  {
    id: "P103",
    productName: "Fortune Soya Health Oil (1L)",
    category: "Oils & Spices",
    barcode: "8911262010023",
    price: 135,
    quantity: 75,
    expiryDate: "2027-02-10",
    supplierName: "Adani Wilmar",
    imageUrl: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=150&auto=format&fit=crop&q=80"
  },
  {
    id: "P104",
    productName: "Tata Salt Lite (1kg)",
    category: "Oils & Spices",
    barcode: "8901058002315",
    price: 28,
    quantity: 30,
    expiryDate: "2028-01-01",
    supplierName: "Tata Consumer Products",
    imageUrl: "/images/tata_salt.jpg"
  },
  {
    id: "P105",
    productName: "Maggi Masala Noodles (280g)",
    category: "Snacks & Packed Food",
    barcode: "8901058895627",
    price: 48,
    quantity: 180,
    expiryDate: "2026-12-30",
    supplierName: "Nestle India",
    imageUrl: "https://images.unsplash.com/photo-1612927601601-6638404737ce?w=150&auto=format&fit=crop&q=80"
  },
  {
    id: "P106",
    productName: "Surf Excel Easy Wash (1kg)",
    category: "Household Care",
    barcode: "8901030753226",
    price: 140,
    quantity: 34,
    expiryDate: "2028-05-18",
    supplierName: "Hindustan Unilever",
    imageUrl: "/images/surf_excel.jpg"
  },
  {
    id: "P107",
    productName: "Parle-G Gold Biscuits (100g)",
    category: "Snacks & Packed Food",
    barcode: "8901163100204",
    price: 10,
    quantity: 24,
    expiryDate: "2026-10-01",
    supplierName: "Parle Products",
    imageUrl: "/images/parle_g.jpg"
  },
  {
    id: "P108",
    productName: "Britannia Cheese Slices (200g)",
    category: "Fresh Dairy",
    barcode: "8901063142075",
    price: 155,
    quantity: 50,
    expiryDate: "2026-07-20",
    supplierName: "Britannia Industries",
    imageUrl: "https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=150&auto=format&fit=crop&q=80"
  },
  {
    id: "P109",
    productName: "Daawat Rozana Basmati Rice (5kg)",
    category: "Grains & Flours",
    barcode: "8901532100215",
    price: 375,
    quantity: 40,
    expiryDate: "2027-04-18",
    supplierName: "Daawat Foods",
    imageUrl: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=150&auto=format&fit=crop&q=80"
  },
  {
    id: "P110",
    productName: "Taj Mahal Tea (500g)",
    category: "Snacks & Packed Food",
    barcode: "8901030756784",
    price: 215,
    quantity: 60,
    expiryDate: "2027-11-20",
    supplierName: "Hindustan Unilever",
    imageUrl: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=150&auto=format&fit=crop&q=80"
  },
  {
    id: "P111",
    productName: "Himalaya Neem Face Wash (150ml)",
    category: "Household Care",
    barcode: "8901138511257",
    price: 170,
    quantity: 45,
    expiryDate: "2028-03-10",
    supplierName: "Himalaya Wellness",
    imageUrl: "https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=150&auto=format&fit=crop&q=80"
  },
  {
    id: "P112",
    productName: "Catch Turmeric Powder (200g)",
    category: "Oils & Spices",
    barcode: "8901356002341",
    price: 54,
    quantity: 80,
    expiryDate: "2027-09-15",
    supplierName: "DS Group",
    imageUrl: "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=150&auto=format&fit=crop&q=80"
  },
  {
    id: "P113",
    productName: "Cadbury Dairy Milk Silk (150g)",
    category: "Snacks & Packed Food",
    barcode: "8901058002316",
    price: 90,
    quantity: 120,
    expiryDate: "2027-01-25",
    supplierName: "Mondelez India",
    imageUrl: "/images/cadbury_dairy_milk.jpg"
  },
  {
    id: "P114",
    productName: "Dettol Liquid Handwash Refill (1.5L)",
    category: "Household Care",
    barcode: "8911262010044",
    price: 230,
    quantity: 35,
    expiryDate: "2028-09-30",
    supplierName: "Reckitt Benckiser",
    imageUrl: "https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?w=150&auto=format&fit=crop&q=80"
  },
  {
    id: "P115",
    productName: "Kissan Tomato Ketchup (950g)",
    category: "Snacks & Packed Food",
    barcode: "8901030751234",
    price: 145,
    quantity: 50,
    expiryDate: "2027-06-12",
    supplierName: "Hindustan Unilever",
    imageUrl: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=150&auto=format&fit=crop&q=80"
  },
  {
    id: "P116",
    productName: "Amul Pasteurised Butter (500g)",
    category: "Fresh Dairy",
    barcode: "8901262010123",
    price: 275,
    quantity: 90,
    expiryDate: "2026-10-18",
    supplierName: "Amul Dairy Corp",
    imageUrl: "https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=150&auto=format&fit=crop&q=80"
  }
];

const initialMilkSubscriptions: MilkSubscription[] = [
  {
    id: "MS101",
    memberId: "M101",
    memberName: "Ramesh Sharma",
    flatNo: "A-102",
    milkBrand: "Amul Gold",
    quantity: 2,
    deliveryTime: "Morning",
    pricePerLiter: 68,
    startDate: "2025-01-16",
    status: "Active"
  },
  {
    id: "MS102",
    memberId: "M102",
    memberName: "Anjali Gupta",
    flatNo: "B-304",
    milkBrand: "Mother Dairy",
    quantity: 1,
    deliveryTime: "Both", // Morning & Evening
    pricePerLiter: 64,
    startDate: "2025-04-01",
    status: "Active"
  },
  {
    id: "MS103",
    memberId: "M103",
    memberName: "Vikram Malhotra",
    flatNo: "C-501",
    milkBrand: "Gokul Milk",
    quantity: 3,
    deliveryTime: "Morning",
    pricePerLiter: 70,
    startDate: "2024-11-05",
    status: "Paused"
  },
  {
    id: "MS104",
    memberId: "M104",
    memberName: "Priya Nair",
    flatNo: "D-201",
    milkBrand: "Nandini Milk",
    quantity: 1,
    deliveryTime: "Evening",
    pricePerLiter: 60,
    startDate: "2025-05-20",
    status: "Active"
  }
];

const initialNewspaperSubscriptions: NewspaperSubscription[] = [
  {
    id: "NS101",
    memberId: "M101",
    memberName: "Ramesh Sharma",
    flatNo: "A-102",
    newspaperName: "The Times of India",
    language: "English",
    monthlyCharge: 180,
    status: "Active"
  },
  {
    id: "NS102",
    memberId: "M102",
    memberName: "Anjali Gupta",
    flatNo: "B-304",
    newspaperName: "Hindustan Times",
    language: "English",
    monthlyCharge: 160,
    status: "Active"
  },
  {
    id: "NS103",
    memberId: "M103",
    memberName: "Vikram Malhotra",
    flatNo: "C-501",
    newspaperName: "Maharashtra Times",
    language: "Marathi",
    monthlyCharge: 140,
    status: "Active"
  },
  {
    id: "NS104",
    memberId: "M104",
    memberName: "Priya Nair",
    flatNo: "D-201",
    newspaperName: "The Hindu",
    language: "English",
    monthlyCharge: 220,
    status: "Paused"
  }
];

const initialBills: Bill[] = [
  {
    id: "B101",
    memberId: "M101",
    memberName: "Ramesh Sharma",
    flatNo: "A-102",
    billingMonth: "May 2026",
    groceryAmount: 1450,
    milkAmount: 4080, // 2 * 68 * 30 days
    newspaperAmount: 180,
    maintenanceAmount: 2500,
    gst: 450,
    discount: 100,
    totalAmount: 8560,
    paymentStatus: "Paid",
    dateGenerated: "2026-05-31"
  },
  {
    id: "B102",
    memberId: "M102",
    memberName: "Anjali Gupta",
    flatNo: "B-304",
    billingMonth: "May 2026",
    groceryAmount: 950,
    milkAmount: 3840, // 1L * 2 deliveries * 64 * 30
    newspaperAmount: 160,
    maintenanceAmount: 2500,
    gst: 390,
    discount: 50,
    totalAmount: 7790,
    paymentStatus: "Unpaid",
    dateGenerated: "2026-05-31"
  },
  {
    id: "B103",
    memberId: "M103",
    memberName: "Vikram Malhotra",
    flatNo: "C-501",
    billingMonth: "May 2026",
    groceryAmount: 2200,
    milkAmount: 0, // Paused
    newspaperAmount: 140,
    maintenanceAmount: 2500,
    gst: 280,
    discount: 150,
    totalAmount: 4970,
    paymentStatus: "Paid",
    dateGenerated: "2026-05-31"
  },
  {
    id: "B104",
    memberId: "M104",
    memberName: "Priya Nair",
    flatNo: "D-201",
    billingMonth: "May 2026",
    groceryAmount: 512,
    milkAmount: 1800, // 1L * 60 * 30 days
    newspaperAmount: 0, // Paused
    maintenanceAmount: 2500,
    gst: 240,
    discount: 0,
    totalAmount: 5052,
    paymentStatus: "Unpaid",
    dateGenerated: "2026-05-31"
  }
];

const initialPayments: PaymentTransaction[] = [
  {
    id: "PAY101",
    memberId: "M101",
    memberName: "Ramesh Sharma",
    flatNo: "A-102",
    billId: "B101",
    amount: 8560,
    paymentMethod: "UPI",
    transactionId: "TXN891238912",
    paymentDate: "2026-06-01 10:45 AM",
    status: "Success"
  },
  {
    id: "PAY102",
    memberId: "M103",
    memberName: "Vikram Malhotra",
    flatNo: "C-501",
    billId: "B103",
    amount: 4970,
    paymentMethod: "Credit Card",
    transactionId: "TXN771662991",
    paymentDate: "2026-06-02 04:30 PM",
    status: "Success"
  },
  {
    id: "PAY103",
    memberId: "M102",
    memberName: "Anjali Gupta",
    flatNo: "B-304",
    amount: 155, // individual POS billing transaction
    paymentMethod: "Cash",
    transactionId: "TXN108923192",
    paymentDate: "2026-06-18 11:15 AM",
    status: "Success"
  }
];

const initialNotifications: NotificationLog[] = [
  {
    id: "NL101",
    memberId: "M101",
    memberName: "Ramesh Sharma",
    flatNo: "A-102",
    type: "Email",
    title: "Monthly Bill Generated - May 2026",
    message: "Dear Ramesh Sharma, your bill for May 2026 amounting to ₹8560 has been generated. Please clear before 10th of next month.",
    sentDate: "2026-05-31 06:00 PM",
    status: "Sent"
  },
  {
    id: "NL102",
    memberId: "M102",
    memberName: "Anjali Gupta",
    flatNo: "B-304",
    type: "SMS",
    title: "Payment Reminder due of ₹7790",
    message: "CoopMart Reminder: Your society outstanding of ₹7790 for May 2026 is pending. Please scan UPI at billing booth to clear.",
    sentDate: "2026-06-10 11:30 AM",
    status: "Sent"
  }
];

interface MemberCredential {
  memberId: string;
  authIdentifier: string;
  passwordHash: string;
  salt: string;
  isInitialPassword: boolean;
  updatedAt: string;
}

interface ActiveSession {
  token: string;
  memberId: string;
  name: string;
  flatNo: string;
  email: string;
  phone?: string;
  role: 'Admin' | 'Cashier' | 'Society Member';
  status: string;
  isInitialPassword: boolean;
  expiresAt: number;
}

interface AppDatabase {
  members: Member[];
  products: Product[];
  milkSubscriptions: MilkSubscription[];
  newspaperSubscriptions: NewspaperSubscription[];
  bills: Bill[];
  payments: PaymentTransaction[];
  notifications: NotificationLog[];
  credentials?: MemberCredential[];
  activeSessions?: ActiveSession[];
  supabaseConfig?: { url: string; key: string };
}

// Secure PBKDF2 Password Hashing
function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
}

// Ensure local JSON database creation and recovery
function loadDatabase(): AppDatabase {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf8');
      const parsed = JSON.parse(data) as AppDatabase;
      if (!parsed.credentials) parsed.credentials = [];
      if (!parsed.activeSessions) parsed.activeSessions = [];
      if (parsed.supabaseConfig && !supabaseServerClient) {
        reinitServerSupabase(parsed.supabaseConfig.url, parsed.supabaseConfig.key);
      }
      return parsed;
    }
  } catch (err) {
    console.error('Error reading DB, restoring defaults', err);
  }

  // Backup initial structure
  const initialDb: AppDatabase = {
    members: initialMembers,
    products: initialProducts,
    milkSubscriptions: initialMilkSubscriptions,
    newspaperSubscriptions: initialNewspaperSubscriptions,
    bills: initialBills,
    payments: initialPayments,
    notifications: initialNotifications,
    credentials: [],
    activeSessions: []
  };

  saveDatabase(initialDb);
  return initialDb;
}

function saveDatabase(db: AppDatabase) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf8');
  } catch (err) {
    console.error('Error saving CoopMart database to disk', err);
  }
}

// API Routes to serve full-stack client request
const apiRouter = express.Router();

// ============================================================================
// Resident College-Demo Authentication (Register & Login)
// College Demo Gate Notice:
// In this college demo, any resident matching an active member record may claim
// their account once by registering a 4-digit PIN. Passwords are saved as slow
// salted PBKDF2 hashes server-side. Note that existing public RLS policies on
// Supabase / shared APIs represent a demo gate, not production access control.
// ============================================================================

// Helper string normalization
function normalizeName(name?: string): string {
  return (name || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

function normalizeFlat(flat?: string): string {
  return (flat || '').trim().toLowerCase().replace(/[\s-]/g, '');
}

// In-memory brute force throttling for demo security
interface RateLimitRecord {
  failures: number;
  firstFailureAt: number;
  blockedUntil: number;
}
const rateLimitMap = new Map<string, RateLimitRecord>();

function checkRateLimit(key: string): { allowed: boolean; remainingSec: number } {
  const now = Date.now();
  const record = rateLimitMap.get(key);
  if (!record) return { allowed: true, remainingSec: 0 };

  if (record.blockedUntil > now) {
    return { allowed: false, remainingSec: Math.ceil((record.blockedUntil - now) / 1000) };
  }

  // Reset window after 15 minutes of inactivity
  if (now - record.firstFailureAt > 15 * 60 * 1000) {
    rateLimitMap.delete(key);
    return { allowed: true, remainingSec: 0 };
  }

  return { allowed: true, remainingSec: 0 };
}

function recordRateLimitFailure(key: string) {
  const now = Date.now();
  const record = rateLimitMap.get(key) || { failures: 0, firstFailureAt: now, blockedUntil: 0 };
  record.failures += 1;
  if (record.failures >= 5) {
    record.blockedUntil = now + 5 * 60 * 1000; // 5 minute lock
  }
  rateLimitMap.set(key, record);
}

function clearRateLimit(key: string) {
  rateLimitMap.delete(key);
}

// Salted Slow PBKDF2 PIN Hashing (Never log or expose PIN)
function hashPin(pin: string, salt: string): string {
  return crypto.pbkdf2Sync(pin, salt, 100000, 64, 'sha512').toString('hex');
}

function verifyPin(pin: string, salt: string, expectedHash: string): boolean {
  try {
    const calculated = hashPin(pin, salt);
    const bufA = Buffer.from(calculated, 'hex');
    const bufB = Buffer.from(expectedHash, 'hex');
    if (bufA.length !== bufB.length) return false;
    return crypto.timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}

// Fetch all known members (Supabase if available + Local DB fallback)
async function fetchAllKnownMembers(): Promise<Member[]> {
  const db = loadDatabase();
  const memberMap = new Map<string, Member>();

  for (const m of db.members) {
    if (m && m.id) memberMap.set(m.id, m);
  }

  if (supabaseServerClient) {
    try {
      const { data, error } = await supabaseServerClient.from('members').select('*');
      if (!error && Array.isArray(data)) {
        for (const raw of data) {
          memberMap.set(raw.id, {
            id: raw.id,
            name: (raw.name || '').trim(),
            flatNo: (raw.flat_no || raw.flatNo || '').trim(),
            phone: raw.phone || '',
            email: raw.email || '',
            address: raw.address || '',
            familyMembers: Number(raw.family_members || 1),
            joiningDate: raw.joining_date || '',
            status: raw.status || 'Active'
          });
        }
      }
    } catch (err) {
      console.warn('[Auth] Supabase fetch fallback warning:', err);
    }
  }

  return Array.from(memberMap.values());
}

// Find member matching BOTH normalized name and flat number
function findMatchingActiveMember(members: Member[], rawName: string, rawFlat: string): {
  member: Member | null;
  reason?: 'not_found' | 'ambiguous' | 'inactive';
} {
  const cleanName = normalizeName(rawName);
  const cleanFlat = normalizeFlat(rawFlat);

  if (!cleanName || !cleanFlat) {
    return { member: null, reason: 'not_found' };
  }

  const matches = members.filter(m => 
    normalizeName(m.name) === cleanName && normalizeFlat(m.flatNo) === cleanFlat
  );

  if (matches.length === 0) {
    return { member: null, reason: 'not_found' };
  }
  if (matches.length > 1) {
    return { member: null, reason: 'ambiguous' };
  }

  const found = matches[0];
  if (found.status !== 'Active') {
    return { member: null, reason: 'inactive' };
  }

  return { member: found };
}

// 0. Register Resident with 4-digit PIN (Open College Demo Registration)
apiRouter.post('/auth/register', async (req, res) => {
  try {
    const rawName = typeof req.body.name === 'string' ? req.body.name : (req.body.username || '');
    const rawFlat = typeof req.body.flat === 'string' ? req.body.flat : (req.body.flatNo || '');
    const rawPin = typeof req.body.pin === 'string' ? req.body.pin : (req.body.password || '');

    const name = rawName.trim();
    const flat = rawFlat.trim();
    const pin = rawPin.trim();

    if (!name || !flat) {
      return res.status(400).json({
        success: false,
        message: 'Both resident name and flat number are required.'
      });
    }

    // Validate PIN is strictly 4 numeric digits
    if (!/^\d{4}$/.test(pin)) {
      return res.status(400).json({
        success: false,
        message: 'PIN must be exactly 4 numeric digits.'
      });
    }

    const cleanNormName = normalizeName(name);
    const cleanNormFlat = normalizeFlat(flat);
    const authIdentifier = `${cleanNormName}#${cleanNormFlat}`;

    const allMembers = await fetchAllKnownMembers();
    const freshDb = loadDatabase();
    if (!freshDb.credentials) freshDb.credentials = [];
    if (!freshDb.members) freshDb.members = [];

    // Find any existing member matching BOTH normalized name and flat number
    const matchingMembers = allMembers.filter(m => 
      normalizeName(m.name) === cleanNormName && normalizeFlat(m.flatNo) === cleanNormFlat
    );

    if (matchingMembers.length > 1) {
      return res.status(400).json({
        success: false,
        message: 'Ambiguous resident records found. Please contact the society administration.'
      });
    }

    let targetMember: Member | null = matchingMembers.length === 1 ? matchingMembers[0] : null;

    // Check if this name+flat pair is already registered with a PIN (in local DB or Supabase)
    const isAlreadyRegisteredLocally = freshDb.credentials.some(c => 
      c.authIdentifier === authIdentifier || (targetMember && c.memberId === targetMember.id)
    );

    if (isAlreadyRegisteredLocally) {
      return res.status(409).json({
        success: false,
        message: 'This name and flat number are already registered. Please proceed to Login.'
      });
    }

    if (supabaseServerClient) {
      try {
        if (targetMember) {
          const { data: supaCred } = await supabaseServerClient
            .from('member_credentials')
            .select('member_id')
            .eq('member_id', targetMember.id)
            .maybeSingle();

          if (supaCred && supaCred.member_id) {
            return res.status(409).json({
              success: false,
              message: 'This name and flat number are already registered. Please proceed to Login.'
            });
          }
        }

        const { data: supaAuthCred } = await supabaseServerClient
          .from('member_credentials')
          .select('member_id')
          .eq('auth_identifier', authIdentifier)
          .maybeSingle();

        if (supaAuthCred && supaAuthCred.member_id) {
          return res.status(409).json({
            success: false,
            message: 'This name and flat number are already registered. Please proceed to Login.'
          });
        }
      } catch (e) {
        console.warn('[Register] Supabase credential check warning:', e);
      }
    }

    // If an existing member matched, check status
    if (targetMember) {
      if (targetMember.status !== 'Active') {
        return res.status(400).json({
          success: false,
          message: 'This resident record is marked inactive. Please contact the society administration.'
        });
      }
    } else {
      // No pre-existing record found: Provision a new minimal Active member record in the database
      const existingIds = new Set([
        ...allMembers.map(m => m.id),
        ...freshDb.members.map(m => m.id)
      ]);

      let newId = generateId('M');
      while (existingIds.has(newId)) {
        newId = generateId('M');
      }

      const newMember: Member = {
        id: newId,
        flatNo: flat,
        name: name,
        phone: '',
        email: '',
        address: `Flat ${flat}, CoopMart Residency`,
        familyMembers: 1,
        joiningDate: new Date().toISOString().split('T')[0],
        status: 'Active'
      };

      // Double-check no duplicate member record in freshDb
      const existingInFresh = freshDb.members.find(m => 
        normalizeName(m.name) === cleanNormName && normalizeFlat(m.flatNo) === cleanNormFlat
      );

      if (existingInFresh) {
        targetMember = existingInFresh;
      } else {
        freshDb.members.push(newMember);
        targetMember = newMember;

        // Sync new member to Supabase only if configured
        if (supabaseServerClient) {
          try {
            await supabaseServerClient.from('members').insert({
              id: newMember.id,
              flat_no: newMember.flatNo,
              name: newMember.name,
              phone: '',
              email: '',
              address: newMember.address || '',
              family_members: 1,
              joining_date: newMember.joiningDate,
              status: 'Active'
            });
          } catch (err) {
            console.warn('[Register] Supabase new member insert warning:', err);
          }
        }
      }
    }

    // Final race-condition check before enrolling credential
    if (freshDb.credentials.some(c => c.memberId === targetMember!.id || c.authIdentifier === authIdentifier)) {
      return res.status(409).json({
        success: false,
        message: 'This name and flat number are already registered. Please proceed to Login.'
      });
    }

    // Generate slow salted PBKDF2 hash (PIN is never stored in plain text and never logged)
    const salt = crypto.randomBytes(16).toString('hex');
    const passwordHash = hashPin(pin, salt);
    const nowIso = new Date().toISOString();

    const newCredential: MemberCredential = {
      memberId: targetMember.id,
      authIdentifier,
      passwordHash,
      salt,
      isInitialPassword: false,
      updatedAt: nowIso
    };

    freshDb.credentials.push(newCredential);
    saveDatabase(freshDb);

    // Sync credential to Supabase server-side if configured
    if (supabaseServerClient) {
      try {
        await supabaseServerClient.from('member_credentials').upsert({
          member_id: targetMember.id,
          auth_identifier: newCredential.authIdentifier,
          password_hash: passwordHash,
          salt,
          is_initial_password: false,
          updated_at: nowIso
        });
      } catch (err) {
        console.warn('[Register] Supabase credential sync skipped/failed:', err);
      }
    }

    return res.json({
      success: true,
      message: 'Registration successful! You may now log in with your name, flat number, and 4-digit PIN.'
    });

  } catch (err) {
    console.error('Registration exception:', err);
    return res.status(500).json({
      success: false,
      message: 'Registration service temporarily unavailable. Please try again.'
    });
  }
});

// 1. Resident Login API (Demo: Any nonempty name, flat, and 4-digit PIN logs straight in)
apiRouter.post('/auth/login', async (req, res) => {
  try {
    const rawName = typeof req.body.name === 'string' ? req.body.name : (req.body.username || '');
    const rawFlat = typeof req.body.flat === 'string' ? req.body.flat : (req.body.flatNo || '');
    const rawPin = typeof req.body.pin === 'string' ? req.body.pin : (req.body.password || '');

    const name = rawName.trim();
    const flat = rawFlat.trim();
    const pin = rawPin.trim();

    if (!name || !flat) {
      return res.status(400).json({ 
        success: false, 
        message: 'Resident name and flat number are required.' 
      });
    }

    if (!/^\d{4}$/.test(pin)) {
      return res.status(400).json({
        success: false,
        message: 'PIN must be exactly 4 numeric digits.'
      });
    }

    const cleanNormName = normalizeName(name);
    const cleanNormFlat = normalizeFlat(flat);

    const db = loadDatabase();
    if (!db.members) db.members = [];
    if (!db.activeSessions) db.activeSessions = [];
    if (!db.credentials) db.credentials = [];

    // Check if resident is already present in local demo database
    let member = db.members.find(m => 
      normalizeName(m.name) === cleanNormName && normalizeFlat(m.flatNo) === cleanNormFlat
    );

    // If new, automatically create the local demo resident using existing registration defaults
    if (!member) {
      const existingIds = new Set(db.members.map(m => m.id));
      let newId = generateId('M');
      while (existingIds.has(newId)) {
        newId = generateId('M');
      }

      const newMember: Member = {
        id: newId,
        flatNo: flat,
        name: name,
        phone: '',
        email: '',
        address: `Flat ${flat}, CoopMart Residency`,
        familyMembers: 1,
        joiningDate: new Date().toISOString().split('T')[0],
        status: 'Active'
      };

      db.members.push(newMember);
      member = newMember;
    }

    // Ensure member has an associated credential record if none exists yet
    const authIdentifier = `${cleanNormName}#${cleanNormFlat}`;
    const existingCred = db.credentials.find(c => c.memberId === member!.id || c.authIdentifier === authIdentifier);
    if (!existingCred) {
      const salt = crypto.randomBytes(16).toString('hex');
      const passwordHash = hashPin(pin, salt);
      db.credentials.push({
        memberId: member.id,
        authIdentifier,
        passwordHash,
        salt,
        isInitialPassword: false,
        updatedAt: new Date().toISOString()
      });
    }

    // Clean up expired sessions
    const now = Date.now();
    db.activeSessions = db.activeSessions.filter(s => s.expiresAt > now);

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = now + 24 * 60 * 60 * 1000; // 24-hour session

    const newSession: ActiveSession = {
      token,
      memberId: member.id,
      name: member.name,
      flatNo: member.flatNo,
      email: member.email || '',
      phone: member.phone || '',
      role: 'Society Member',
      status: member.status || 'Active',
      isInitialPassword: false,
      expiresAt
    };

    db.activeSessions.push(newSession);
    saveDatabase(db);

    return res.json({
      success: true,
      token,
      expiresAt,
      user: newSession
    });

  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ 
      success: false, 
      message: 'Authentication service temporarily unavailable. Please try again.' 
    });
  }
});

function freshDbSession(db: AppDatabase): AppDatabase {
  return db;
}

// 2. Session verification API
apiRouter.get('/auth/verify-session', async (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : (req.query.token as string);

  if (!token) {
    return res.status(401).json({ success: false, message: 'No session token provided.' });
  }

  const db = loadDatabase();
  const session = (db.activeSessions || []).find(s => s.token === token && s.expiresAt > Date.now());
  if (!session) {
    return res.status(401).json({ success: false, message: 'Session expired or invalid.' });
  }

  // Verify that the member is still active
  const allMembers = await fetchAllKnownMembers();
  const liveMember = allMembers.find(m => m.id === session.memberId);

  if (!liveMember || liveMember.status !== 'Active') {
    db.activeSessions = (db.activeSessions || []).filter(s => s.token !== token);
    saveDatabase(db);
    return res.status(401).json({ success: false, message: 'Member account is inactive or removed.' });
  }

  res.json({ success: true, user: session });
});

// 3. Logout API
apiRouter.post('/auth/logout', (req, res) => {
  const { token } = req.body;
  const authHeader = req.headers.authorization;
  const sessionToken = token || (authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null);

  if (sessionToken) {
    const db = loadDatabase();
    if (db.activeSessions) {
      db.activeSessions = db.activeSessions.filter(s => s.token !== sessionToken);
      saveDatabase(db);
    }
  }

  res.json({ success: true, message: 'Logged out successfully.' });
});

// Server-side safe Supabase push helper
async function serverSyncSupabase(table: string, action: 'insert' | 'update' | 'delete' | 'upsert', payload: any, id?: string) {
  if (!supabaseServerClient) return;
  try {
    if (action === 'insert' || action === 'upsert') {
      await supabaseServerClient.from(table).upsert(payload);
    } else if (action === 'update' && id) {
      await supabaseServerClient.from(table).update(payload).eq('id', id);
    } else if (action === 'delete' && id) {
      await supabaseServerClient.from(table).delete().eq('id', id);
    }
  } catch (err) {
    console.warn(`[Supabase Server Sync] ${table} ${action} warning:`, err);
  }
}

// 1. Members APIs
apiRouter.get('/members', (req, res) => {
  const db = loadDatabase();
  res.json(db.members);
});

apiRouter.post('/members', (req, res) => {
  const db = loadDatabase();
  const newMember: Member = {
    id: req.body.id || generateId('M'),
    joiningDate: req.body.joiningDate || new Date().toISOString().split('T')[0],
    status: req.body.status || 'Active',
    ...req.body
  };
  // Avoid duplicate by ID
  const existingIdx = db.members.findIndex(m => m.id === newMember.id);
  if (existingIdx !== -1) {
    db.members[existingIdx] = newMember;
  } else {
    db.members.push(newMember);
  }
  saveDatabase(db);

  // Sync to Supabase server-side
  serverSyncSupabase('members', 'upsert', {
    id: newMember.id,
    flat_no: newMember.flatNo,
    name: newMember.name,
    phone: newMember.phone,
    email: newMember.email,
    address: newMember.address,
    family_members: newMember.familyMembers,
    joining_date: newMember.joiningDate,
    status: newMember.status
  });

  res.status(201).json(newMember);
});

apiRouter.put('/members/:id', (req, res) => {
  const db = loadDatabase();
  const index = db.members.findIndex(m => m.id === req.params.id);
  if (index !== -1) {
    db.members[index] = { ...db.members[index], ...req.body };
    saveDatabase(db);

    const m = db.members[index];
    serverSyncSupabase('members', 'update', {
      flat_no: m.flatNo,
      name: m.name,
      phone: m.phone,
      email: m.email,
      address: m.address,
      family_members: m.familyMembers,
      status: m.status
    }, req.params.id);

    res.json(db.members[index]);
  } else {
    res.status(404).json({ error: 'Member not found' });
  }
});

apiRouter.delete('/members/:id', (req, res) => {
  const db = loadDatabase();
  const initialCount = db.members.length;
  // Soft filter out
  db.members = db.members.filter(m => m.id !== req.params.id);
  if (db.members.length !== initialCount) {
    saveDatabase(db);
    serverSyncSupabase('members', 'delete', null, req.params.id);
    res.json({ success: true, message: 'Member deleted successfully' });
  } else {
    res.status(404).json({ error: 'Member not found' });
  }
});

// 2. Products APIs
apiRouter.get('/products', (req, res) => {
  const db = loadDatabase();
  res.json(db.products);
});

apiRouter.post('/products', (req, res) => {
  const db = loadDatabase();
  const newProduct: Product = {
    id: req.body.id || generateId('P'),
    ...req.body,
    price: Number(req.body.price),
    quantity: Number(req.body.quantity)
  };
  const existingIdx = db.products.findIndex(p => p.id === newProduct.id);
  if (existingIdx !== -1) {
    db.products[existingIdx] = newProduct;
  } else {
    db.products.push(newProduct);
  }
  saveDatabase(db);

  serverSyncSupabase('products', 'upsert', {
    id: newProduct.id,
    product_name: newProduct.productName,
    price: newProduct.price,
    quantity: newProduct.quantity,
    category: newProduct.category,
    expiry_date: newProduct.expiryDate,
    supplier_name: newProduct.supplierName,
    image_url: newProduct.imageUrl
  });

  res.status(201).json(newProduct);
});

apiRouter.put('/products/:id', (req, res) => {
  const db = loadDatabase();
  const index = db.products.findIndex(p => p.id === req.params.id);
  if (index !== -1) {
    db.products[index] = { 
      ...db.products[index], 
      ...req.body,
      price: req.body.price !== undefined ? Number(req.body.price) : db.products[index].price,
      quantity: req.body.quantity !== undefined ? Number(req.body.quantity) : db.products[index].quantity,
    };
    saveDatabase(db);

    const p = db.products[index];
    serverSyncSupabase('products', 'update', {
      product_name: p.productName,
      price: p.price,
      quantity: p.quantity,
      category: p.category,
      expiry_date: p.expiryDate,
      supplier_name: p.supplierName,
      image_url: p.imageUrl
    }, req.params.id);

    res.json(db.products[index]);
  } else {
    res.status(404).json({ error: 'Product not found' });
  }
});

apiRouter.delete('/products/:id', (req, res) => {
  const db = loadDatabase();
  db.products = db.products.filter(p => p.id !== req.params.id);
  saveDatabase(db);
  serverSyncSupabase('products', 'delete', null, req.params.id);
  res.json({ success: true });
});

// 3. Milk Subscriptions APIs
apiRouter.get('/milk', (req, res) => {
  const db = loadDatabase();
  res.json(db.milkSubscriptions);
});

apiRouter.post('/milk', (req, res) => {
  const db = loadDatabase();
  
  // Find member to populate details
  const member = db.members.find(m => m.id === req.body.memberId);
  const newSub: MilkSubscription = {
    id: req.body.id || generateId('MS'),
    memberName: member ? member.name : "Unknown Member",
    flatNo: member ? member.flatNo : "N/A",
    status: req.body.status || 'Active',
    startDate: req.body.startDate || new Date().toISOString().split('T')[0],
    ...req.body,
    quantity: Number(req.body.quantity),
    pricePerLiter: Number(req.body.pricePerLiter)
  };
  
  const existingIdx = db.milkSubscriptions.findIndex(s => s.id === newSub.id);
  if (existingIdx !== -1) {
    db.milkSubscriptions[existingIdx] = newSub;
  } else {
    db.milkSubscriptions.push(newSub);
  }
  saveDatabase(db);

  serverSyncSupabase('milk_subscriptions', 'upsert', {
    id: newSub.id,
    member_id: newSub.memberId,
    milk_brand: newSub.milkBrand,
    quantity: newSub.quantity,
    delivery_time: newSub.deliveryTime,
    price_per_liter: newSub.pricePerLiter,
    status: newSub.status
  });

  res.status(201).json(newSub);
});

apiRouter.put('/milk/:id', (req, res) => {
  const db = loadDatabase();
  const index = db.milkSubscriptions.findIndex(m => m.id === req.params.id);
  if (index !== -1) {
    db.milkSubscriptions[index] = { 
      ...db.milkSubscriptions[index], 
      ...req.body,
      quantity: req.body.quantity !== undefined ? Number(req.body.quantity) : db.milkSubscriptions[index].quantity,
      pricePerLiter: req.body.pricePerLiter !== undefined ? Number(req.body.pricePerLiter) : db.milkSubscriptions[index].pricePerLiter
    };
    saveDatabase(db);

    const s = db.milkSubscriptions[index];
    serverSyncSupabase('milk_subscriptions', 'update', {
      quantity: s.quantity,
      delivery_time: s.deliveryTime,
      price_per_liter: s.pricePerLiter,
      status: s.status
    }, req.params.id);

    res.json(db.milkSubscriptions[index]);
  } else {
    res.status(404).json({ error: 'Subscription not found' });
  }
});

// 4. Newspaper Subscriptions APIs
apiRouter.get('/newspaper', (req, res) => {
  const db = loadDatabase();
  res.json(db.newspaperSubscriptions);
});

apiRouter.post('/newspaper', (req, res) => {
  const db = loadDatabase();
  const member = db.members.find(m => m.id === req.body.memberId);
  const newSub: NewspaperSubscription = {
    id: req.body.id || generateId('NS'),
    memberName: member ? member.name : "Unknown Member",
    flatNo: member ? member.flatNo : "N/A",
    status: req.body.status || 'Active',
    ...req.body,
    monthlyCharge: Number(req.body.monthlyCharge)
  };
  const existingIdx = db.newspaperSubscriptions.findIndex(s => s.id === newSub.id);
  if (existingIdx !== -1) {
    db.newspaperSubscriptions[existingIdx] = newSub;
  } else {
    db.newspaperSubscriptions.push(newSub);
  }
  saveDatabase(db);

  serverSyncSupabase('newspaper_subscriptions', 'upsert', {
    id: newSub.id,
    member_id: newSub.memberId,
    newspaper_name: newSub.newspaperName,
    monthly_charge: newSub.monthlyCharge,
    status: newSub.status
  });

  res.status(201).json(newSub);
});

apiRouter.put('/newspaper/:id', (req, res) => {
  const db = loadDatabase();
  const index = db.newspaperSubscriptions.findIndex(n => n.id === req.params.id);
  if (index !== -1) {
    db.newspaperSubscriptions[index] = { 
      ...db.newspaperSubscriptions[index], 
      ...req.body,
      monthlyCharge: req.body.monthlyCharge !== undefined ? Number(req.body.monthlyCharge) : db.newspaperSubscriptions[index].monthlyCharge
    };
    saveDatabase(db);

    const s = db.newspaperSubscriptions[index];
    serverSyncSupabase('newspaper_subscriptions', 'update', {
      newspaper_name: s.newspaperName,
      monthly_charge: s.monthlyCharge,
      status: s.status
    }, req.params.id);

    res.json(db.newspaperSubscriptions[index]);
  } else {
    res.status(404).json({ error: 'Subscription not found' });
  }
});

// 5. Bills APIs
apiRouter.get('/bills', (req, res) => {
  const db = loadDatabase();
  res.json(db.bills);
});

// Auto Generate Bills Function
apiRouter.post('/bills/generate', (req, res) => {
  const db = loadDatabase();
  const { billingMonth } = req.body; // e.g. "June 2026"
  
  if (!billingMonth) {
    return res.status(400).json({ error: 'Billing month is required' });
  }

  const generatedBills: Bill[] = [];
  const activeMembers = db.members.filter(m => m.status === 'Active');

  for (const m of activeMembers) {
    // Check if bill already exists for this member and month
    const existing = db.bills.find(b => b.memberId === m.id && b.billingMonth === billingMonth);
    if (existing) continue;

    // Calculate Milk delivery amount: Delivery quantity * Price per liter * 30 days
    const milkSub = db.milkSubscriptions.find(ms => ms.memberId === m.id && ms.status === 'Active');
    let milkAmount = 0;
    if (milkSub) {
      const deliveriesPerDay = milkSub.deliveryTime === 'Both' ? 2 : 1;
      milkAmount = milkSub.quantity * deliveriesPerDay * milkSub.pricePerLiter * 30;
    }

    // Calculate Newspaper delivery charge
    const newsSub = db.newspaperSubscriptions.find(ns => ns.memberId === m.id && ns.status === 'Active');
    const newspaperAmount = newsSub ? newsSub.monthlyCharge : 0;

    // Fixed Maintenance charges
    const maintenanceAmount = 2500;

    // Add some randomized groceries purchase for May/June
    const groceryAmount = Math.floor(Math.random() * 1500) + 200;

    // Calculate GST & Net discounts
    const subtotal = groceryAmount + milkAmount + newspaperAmount + maintenanceAmount;
    const gst = Math.round(subtotal * 0.05); // 5% GST
    const discount = groceryAmount > 1000 ? 100 : 0;
    const totalAmount = subtotal + gst - discount;

    const newBill: Bill = {
      id: generateId('B'),
      memberId: m.id,
      memberName: m.name,
      flatNo: m.flatNo,
      billingMonth,
      groceryAmount,
      milkAmount,
      newspaperAmount,
      maintenanceAmount,
      gst,
      discount,
      totalAmount,
      paymentStatus: 'Unpaid',
      dateGenerated: new Date().toISOString().split('T')[0]
    };

    generatedBills.push(newBill);
    db.bills.push(newBill);

    serverSyncSupabase('bills', 'upsert', {
      id: newBill.id,
      member_id: newBill.memberId,
      billing_month: newBill.billingMonth,
      grocery_amount: newBill.groceryAmount,
      milk_amount: newBill.milkAmount,
      newspaper_amount: newBill.newspaperAmount,
      maintenance_amount: newBill.maintenanceAmount,
      gst: newBill.gst,
      discount: newBill.discount,
      total_amount: newBill.totalAmount,
      payment_status: newBill.paymentStatus,
      date_generated: newBill.dateGenerated
    });

    // Auto add notification log for warning users of new bill
    const notif: NotificationLog = {
      id: generateId('NL'),
      memberId: m.id,
      memberName: m.name,
      flatNo: m.flatNo,
      type: 'Email',
      title: `Monthly Bill Generated - ${billingMonth}`,
      message: `Dear ${m.name}, your bill of ₹${totalAmount} for ${billingMonth} was generated successfully. Please pay under Society Utilities.`,
      sentDate: new Date().toISOString().replace('T', ' ').substring(0, 16),
      status: 'Sent'
    };
    db.notifications.push(notif);
    serverSyncSupabase('notifications', 'upsert', {
      id: notif.id,
      member_id: notif.memberId,
      type: notif.type,
      title: notif.title,
      message: notif.message,
      sent_date: notif.sentDate,
      status: notif.status
    });
  }

  saveDatabase(db);
  res.json({
    success: true,
    message: `Generated ${generatedBills.length} society utility bills for ${billingMonth}.`,
    bills: generatedBills
  });
});

apiRouter.put('/bills/:id/status', (req, res) => {
  const db = loadDatabase();
  const index = db.bills.findIndex(b => b.id === req.params.id);
  if (index !== -1) {
    db.bills[index].paymentStatus = req.body.status; // 'Paid' or 'Unpaid'
    saveDatabase(db);
    serverSyncSupabase('bills', 'update', { payment_status: req.body.status }, req.params.id);
    res.json(db.bills[index]);
  } else {
    res.status(404).json({ error: 'Bill not found' });
  }
});

// 6. Payments transactions endpoints
apiRouter.get('/payments', (req, res) => {
  const db = loadDatabase();
  // Auto-resolve any legacy payments with missing/unknown member names
  if (db.payments && Array.isArray(db.payments)) {
    db.payments.forEach(p => {
      if ((!p.memberName || p.memberName === 'Unknown Member' || p.memberName.toLowerCase().startsWith('unknown')) && p.memberId) {
        const found = db.members.find(m => m.id === p.memberId);
        if (found) {
          p.memberName = found.name;
          if (!p.flatNo || p.flatNo === 'N/A') p.flatNo = found.flatNo;
        }
      }
    });
  }
  res.json(db.payments);
});

apiRouter.post('/payments', (req, res) => {
  const db = loadDatabase();
  const { memberId, amount, paymentMethod, billId, memberName, flatNo } = req.body;

  const member = db.members.find(m => m.id === memberId);
  const transactionId = "TXN" + Math.floor(100000000 + Math.random() * 900000000);
  
  let resolvedMemberName = memberName;
  let resolvedFlatNo = flatNo;

  if (!resolvedMemberName || resolvedMemberName === 'Unknown Member' || resolvedMemberName.toLowerCase().startsWith('unknown')) {
    if (member) {
      resolvedMemberName = member.name;
      if (!resolvedFlatNo || resolvedFlatNo === 'N/A') resolvedFlatNo = member.flatNo;
    } else if (memberId === 'Visitor') {
      resolvedMemberName = 'Walk-in Guest';
      if (!resolvedFlatNo) resolvedFlatNo = 'N/A';
    } else {
      resolvedMemberName = memberId ? `Resident (${memberId})` : 'Walk-in Guest';
      if (!resolvedFlatNo) resolvedFlatNo = 'N/A';
    }
  }

  if (!resolvedFlatNo) {
    resolvedFlatNo = member ? member.flatNo : 'N/A';
  }

  const newPayment: PaymentTransaction = {
    id: req.body.id || generateId('PAY'),
    memberId: memberId || (member ? member.id : 'Visitor'),
    memberName: resolvedMemberName,
    flatNo: resolvedFlatNo,
    billId,
    amount: Number(amount),
    paymentMethod,
    transactionId,
    paymentDate: new Date().toISOString().replace('T', ' ').substring(0, 16),
    status: 'Success'
  };

  db.payments.unshift(newPayment);

  // If this payment is linked to a bill, clear that bill status!
  if (billId) {
    const billIdx = db.bills.findIndex(b => b.id === billId);
    if (billIdx !== -1) {
      db.bills[billIdx].paymentStatus = 'Paid';
      serverSyncSupabase('bills', 'update', { payment_status: 'Paid' }, billId);
    }
  }

  // Update product inventory levels if custom purchase (simulate stock deduction)
  if (req.body.items && Array.isArray(req.body.items)) {
    req.body.items.forEach((item: { id: string; selectQty: number }) => {
      const prodIdx = db.products.findIndex(p => p.id === item.id);
      if (prodIdx !== -1) {
        db.products[prodIdx].quantity = Math.max(0, db.products[prodIdx].quantity - item.selectQty);
        serverSyncSupabase('products', 'update', { quantity: db.products[prodIdx].quantity }, item.id);
      }
    });
  }

  saveDatabase(db);

  serverSyncSupabase('payments', 'upsert', {
    id: newPayment.id,
    member_id: newPayment.memberId,
    member_name: newPayment.memberName,
    flat_no: newPayment.flatNo,
    amount: newPayment.amount,
    payment_method: newPayment.paymentMethod,
    transaction_id: newPayment.transactionId,
    payment_date: newPayment.paymentDate,
    status: newPayment.status,
    bill_id: newPayment.billId
  });

  res.status(201).json(newPayment);
});

apiRouter.post('/payments/:id/refund', (req, res) => {
  const db = loadDatabase();
  const index = db.payments.findIndex(p => p.id === req.params.id);
  if (index !== -1) {
    db.payments[index].status = 'Refunded';
    serverSyncSupabase('payments', 'update', { status: 'Refunded' }, req.params.id);
    
    // If it was linked to a bill, set it unpaid again
    if (db.payments[index].billId) {
      const billIdx = db.bills.findIndex(b => b.id === db.payments[index].billId);
      if (billIdx !== -1) {
        db.bills[billIdx].paymentStatus = 'Unpaid';
        serverSyncSupabase('bills', 'update', { payment_status: 'Unpaid' }, db.payments[index].billId);
      }
    }
    
    saveDatabase(db);
    res.json(db.payments[index]);
  } else {
    res.status(404).json({ error: 'Transaction not found' });
  }
});

// 7. Notification Sender Alert APIs
apiRouter.get('/notifications', (req, res) => {
  const db = loadDatabase();
  res.json(db.notifications);
});

apiRouter.post('/notifications/send', (req, res) => {
  const db = loadDatabase();
  const { memberId, type, title, message } = req.body;

  const member = db.members.find(m => m.id === memberId);
  if (!member) {
    return res.status(404).json({ error: 'Member not found' });
  }

  const log: NotificationLog = {
    id: generateId('NL'),
    memberId,
    memberName: member.name,
    flatNo: member.flatNo,
    type,
    title,
    message,
    sentDate: new Date().toISOString().replace('T', ' ').substring(0, 16),
    status: 'Sent'
  };

  db.notifications.unshift(log);
  saveDatabase(db);
  res.json({ success: true, log });
});

// ===========================================================================
// 8. Supabase Live Integration, Diagnostics & Auto-Sync Endpoints
// ===========================================================================

const SUPABASE_SETUP_SQL = `-- =========================================================================
-- CoopMart Society Management System - Complete Supabase Setup
-- Copy and paste this script into your Supabase Dashboard -> SQL Editor -> Run
-- =========================================================================

-- 1. Create members table
CREATE TABLE IF NOT EXISTS public.members (
    id TEXT PRIMARY KEY,
    flat_no TEXT NOT NULL,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    address TEXT,
    family_members INTEGER DEFAULT 1,
    joining_date TEXT,
    status TEXT DEFAULT 'Active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. Create products table (Grocery Inventory)
CREATE TABLE IF NOT EXISTS public.products (
    id TEXT PRIMARY KEY,
    product_name TEXT NOT NULL,
    category TEXT,
    barcode TEXT,
    price NUMERIC DEFAULT 0,
    quantity INTEGER DEFAULT 0,
    expiry_date TEXT,
    supplier_name TEXT,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. Create milk_subscriptions table
CREATE TABLE IF NOT EXISTS public.milk_subscriptions (
    id TEXT PRIMARY KEY,
    member_id TEXT,
    member_name TEXT,
    flat_no TEXT,
    milk_brand TEXT,
    quantity NUMERIC DEFAULT 1,
    delivery_time TEXT DEFAULT 'Morning',
    price_per_liter NUMERIC DEFAULT 60,
    start_date TEXT,
    status TEXT DEFAULT 'Active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 4. Create newspaper_subscriptions table
CREATE TABLE IF NOT EXISTS public.newspaper_subscriptions (
    id TEXT PRIMARY KEY,
    member_id TEXT,
    member_name TEXT,
    flat_no TEXT,
    newspaper_name TEXT,
    language TEXT DEFAULT 'English',
    monthly_charge NUMERIC DEFAULT 150,
    status TEXT DEFAULT 'Active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 5. Create bills table (Utility Bills)
CREATE TABLE IF NOT EXISTS public.bills (
    id TEXT PRIMARY KEY,
    member_id TEXT,
    member_name TEXT,
    flat_no TEXT,
    billing_month TEXT,
    grocery_amount NUMERIC DEFAULT 0,
    milk_amount NUMERIC DEFAULT 0,
    newspaper_amount NUMERIC DEFAULT 0,
    maintenance_amount NUMERIC DEFAULT 2500,
    gst NUMERIC DEFAULT 0,
    discount NUMERIC DEFAULT 0,
    total_amount NUMERIC DEFAULT 0,
    payment_status TEXT DEFAULT 'Unpaid',
    date_generated TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 6. Create payments table (Payment Transactions)
CREATE TABLE IF NOT EXISTS public.payments (
    id TEXT PRIMARY KEY,
    member_id TEXT,
    member_name TEXT,
    flat_no TEXT,
    bill_id TEXT,
    amount NUMERIC DEFAULT 0,
    payment_method TEXT DEFAULT 'Cash',
    transaction_id TEXT,
    payment_date TEXT,
    status TEXT DEFAULT 'Success',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 7. Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
    id TEXT PRIMARY KEY,
    member_id TEXT,
    member_name TEXT,
    type TEXT DEFAULT 'General',
    title TEXT,
    message TEXT,
    sent_date TEXT,
    status TEXT DEFAULT 'Sent',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.milk_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newspaper_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create Open Public Access Policies
DROP POLICY IF EXISTS "Allow public access" ON public.members;
CREATE POLICY "Allow public access" ON public.members FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public access" ON public.products;
CREATE POLICY "Allow public access" ON public.products FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public access" ON public.milk_subscriptions;
CREATE POLICY "Allow public access" ON public.milk_subscriptions FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public access" ON public.newspaper_subscriptions;
CREATE POLICY "Allow public access" ON public.newspaper_subscriptions FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public access" ON public.bills;
CREATE POLICY "Allow public access" ON public.bills FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public access" ON public.payments;
CREATE POLICY "Allow public access" ON public.payments FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public access" ON public.notifications;
CREATE POLICY "Allow public access" ON public.notifications FOR ALL USING (true) WITH CHECK (true);

-- Enable Realtime Replication
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'members') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.members;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'products') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.products;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'milk_subscriptions') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.milk_subscriptions;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'newspaper_subscriptions') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.newspaper_subscriptions;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'bills') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.bills;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'payments') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.payments;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'notifications') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  END IF;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;
`;

// Return SQL Setup Script
apiRouter.get('/supabase/sql-schema', (req, res) => {
  res.json({
    success: true,
    sql: SUPABASE_SETUP_SQL
  });
});

// Configure Supabase credentials dynamically
apiRouter.post('/supabase/config', (req, res) => {
  const { url, key } = req.body;
  if (!url || !key || !url.startsWith('https://')) {
    return res.status(400).json({ success: false, message: 'Valid Supabase HTTPS URL and Key required.' });
  }

  const db = loadDatabase();
  db.supabaseConfig = { url: url.trim(), key: key.trim() };
  saveDatabase(db);

  const initOk = reinitServerSupabase(url, key);
  res.json({
    success: initOk,
    message: initOk ? 'Supabase server client connected and saved.' : 'Failed to initialize Supabase client with given credentials.',
    url: activeSupabaseUrl
  });
});

// Diagnostic check of Supabase connectivity and each table's schema/RLS
apiRouter.get('/supabase/diagnose', async (req, res) => {
  const db = loadDatabase();
  const url = activeSupabaseUrl || db.supabaseConfig?.url || '';
  const isConfigured = Boolean(url && url.startsWith('https://') && !url.includes('your-project'));

  if (!isConfigured || !supabaseServerClient) {
    return res.json({
      configured: false,
      connected: false,
      message: 'Supabase credentials not configured or placeholder detected.',
      url,
      tables: {}
    });
  }

  const tableNames = ['members', 'products', 'milk_subscriptions', 'newspaper_subscriptions', 'bills', 'payments', 'notifications'];
  const tableDiagnostics: Record<string, { exists: boolean; writable: boolean; rowCount: number; error?: string }> = {};

  for (const t of tableNames) {
    try {
      const { data, count, error } = await supabaseServerClient.from(t).select('*', { count: 'exact', head: false }).limit(1);
      if (error) {
        tableDiagnostics[t] = {
          exists: !error.message.includes('does not exist') && !error.message.includes('schema cache'),
          writable: false,
          rowCount: 0,
          error: error.message
        };
      } else {
        tableDiagnostics[t] = {
          exists: true,
          writable: true,
          rowCount: count ?? (data?.length || 0)
        };
      }
    } catch (err: any) {
      tableDiagnostics[t] = {
        exists: false,
        writable: false,
        rowCount: 0,
        error: err.message
      };
    }
  }

  const allTablesOk = Object.values(tableDiagnostics).every(t => t.exists && t.writable);

  res.json({
    configured: true,
    connected: true,
    url: activeSupabaseUrl,
    allTablesOk,
    tables: tableDiagnostics
  });
});

// Full Push of all local data into Supabase
apiRouter.post('/supabase/sync-all', async (req, res) => {
  if (!supabaseServerClient) {
    return res.status(400).json({ success: false, message: 'Supabase server client is not connected.' });
  }

  const db = loadDatabase();
  const logs: string[] = [];

  try {
    // 1. Members
    const membersPayload = db.members.map(m => ({
      id: m.id,
      flat_no: m.flatNo,
      name: m.name,
      phone: m.phone,
      email: m.email,
      address: m.address,
      family_members: m.familyMembers,
      joining_date: m.joiningDate,
      status: m.status
    }));
    const resM = await supabaseServerClient.from('members').upsert(membersPayload, { onConflict: 'id' });
    if (resM.error) logs.push(`⚠️ Members error: ${resM.error.message}`);
    else logs.push(`✅ ${db.members.length} members pushed to Supabase.`);

    // 2. Products
    const productsPayload = db.products.map(p => ({
      id: p.id,
      product_name: p.productName,
      category: p.category,
      barcode: p.barcode,
      price: p.price,
      quantity: p.quantity,
      expiry_date: p.expiryDate,
      supplier_name: p.supplierName,
      image_url: p.imageUrl
    }));
    const resP = await supabaseServerClient.from('products').upsert(productsPayload, { onConflict: 'id' });
    if (resP.error) logs.push(`⚠️ Products error: ${resP.error.message}`);
    else logs.push(`✅ ${db.products.length} products pushed to Supabase.`);

    // 3. Milk Subscriptions
    const milkPayload = db.milkSubscriptions.map(s => ({
      id: s.id,
      member_id: s.memberId,
      member_name: s.memberName,
      flat_no: s.flatNo,
      milk_brand: s.milkBrand,
      quantity: s.quantity,
      delivery_time: s.deliveryTime,
      price_per_liter: s.pricePerLiter,
      start_date: s.startDate,
      status: s.status
    }));
    const resMilk = await supabaseServerClient.from('milk_subscriptions').upsert(milkPayload, { onConflict: 'id' });
    if (resMilk.error) logs.push(`⚠️ Milk Subs error: ${resMilk.error.message}`);
    else logs.push(`✅ ${db.milkSubscriptions.length} milk subscriptions pushed to Supabase.`);

    // 4. Newspaper Subscriptions
    const newsPayload = db.newspaperSubscriptions.map(s => ({
      id: s.id,
      member_id: s.memberId,
      member_name: s.memberName,
      flat_no: s.flatNo,
      newspaper_name: s.newspaperName,
      language: s.language,
      monthly_charge: s.monthlyCharge,
      status: s.status
    }));
    const resNews = await supabaseServerClient.from('newspaper_subscriptions').upsert(newsPayload, { onConflict: 'id' });
    if (resNews.error) logs.push(`⚠️ Newspaper Subs error: ${resNews.error.message}`);
    else logs.push(`✅ ${db.newspaperSubscriptions.length} newspaper subscriptions pushed to Supabase.`);

    // 5. Bills
    const billsPayload = db.bills.map(b => ({
      id: b.id,
      member_id: b.memberId,
      member_name: b.memberName,
      flat_no: b.flatNo,
      billing_month: b.billingMonth,
      grocery_amount: b.groceryAmount,
      milk_amount: b.milkAmount,
      newspaper_amount: b.newspaperAmount,
      maintenance_amount: b.maintenanceAmount,
      gst: b.gst,
      discount: b.discount,
      total_amount: b.totalAmount,
      payment_status: b.paymentStatus,
      date_generated: b.dateGenerated
    }));
    const resBills = await supabaseServerClient.from('bills').upsert(billsPayload, { onConflict: 'id' });
    if (resBills.error) logs.push(`⚠️ Bills error: ${resBills.error.message}`);
    else logs.push(`✅ ${db.bills.length} bills pushed to Supabase.`);

    // 6. Payments
    const payPayload = db.payments.map(p => ({
      id: p.id,
      member_id: p.memberId,
      member_name: p.memberName,
      flat_no: p.flatNo,
      bill_id: p.billId,
      amount: p.amount,
      payment_method: p.paymentMethod,
      transaction_id: p.transactionId,
      payment_date: p.paymentDate,
      status: p.status
    }));
    const resPay = await supabaseServerClient.from('payments').upsert(payPayload, { onConflict: 'id' });
    if (resPay.error) logs.push(`⚠️ Payments error: ${resPay.error.message}`);
    else logs.push(`✅ ${db.payments.length} payments pushed to Supabase.`);

    res.json({
      success: true,
      logs
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: err.message,
      logs
    });
  }
});

// Mount consolidated endpoints to Express server
app.use('/api', apiRouter);

if (process.env.VERCEL) {
  // Export express app for Vercel serverless function
  module.exports = app;
} else {
  // Start our primary full-stack hosting routine
  async function startServer() {
    if (process.env.NODE_ENV !== 'production') {
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa'
      });
      app.use(vite.middlewares);
      console.log('Vite middleware mounted in Development mode.');
    } else {
      const distPath = path.join(process.cwd(), 'dist');
      app.use(express.static(distPath));
      app.get('*', (req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
      console.log('Serving prepared production builds from dist.');
    }

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`CoopMart server listening on http://localhost:${PORT}`);
    });
  }

  startServer();
}
