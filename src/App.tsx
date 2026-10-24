/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Building2,
  Sun,
  Moon,
  Database,
  CheckCircle2,
  AlertCircle,
  X,
  Lock
} from 'lucide-react';
import { 
  Member, 
  Product, 
  MilkSubscription, 
  NewspaperSubscription, 
  Bill, 
  PaymentTransaction, 
  NotificationLog, 
  UserSession 
} from './types';

// Supabase Imports
import { 
  getSupabase, 
  safeSupabaseInsert,
  safeSupabaseUpdate,
  safeSupabaseDelete,
  safeSupabaseUpsert,
  isSupabaseConfigured,
  onSupabaseSyncEvent,
  SupabaseSyncEvent,
  mapMemberFromSupabase,
  mapMemberToSupabase,
  mapProductFromSupabase,
  mapProductToSupabase,
  mapMilkFromSupabase,
  mapMilkToSupabase,
  mapNewspaperFromSupabase,
  mapNewspaperToSupabase,
  mapBillFromSupabase,
  mapBillToSupabase,
  mapPaymentFromSupabase,
  mapPaymentToSupabase,
  mapNotificationFromSupabase,
  mapNotificationToSupabase
} from './supabase';

// Modular layouts
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import MemberManagement from './components/MemberManagement';
import GroceryManagement from './components/GroceryManagement';
import Subscriptions from './components/Subscriptions';
import POSBilling from './components/POSBilling';
import BillingSystem from './components/BillingSystem';
import PaymentsModule from './components/PaymentsModule';
import ReportsAndNotificator from './components/ReportsAndNotificator';
import SupabaseSyncModal from './components/SupabaseSyncModal';
import LoginPage from './components/LoginPage';

export default function App() {
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [session, setSession] = useState<UserSession | null>(null);
  const [isVerifyingSession, setIsVerifyingSession] = useState(true);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  
  // Day / Night Theme state (Defaults to Day/Light Mode with high clarity)
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('coopmart_theme');
      return saved === 'dark';
    } catch {
      return false; // Day Mode by default
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('coopmart_theme', darkMode ? 'dark' : 'light');
    } catch {}
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode(prev => !prev);

  // Verify resident session token on initial mount
  useEffect(() => {
    const token = localStorage.getItem('coopmart_session_token');
    if (!token) {
      setIsVerifyingSession(false);
      return;
    }

    fetch('/api/auth/verify-session', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.user) {
          setSession({
            id: data.user.token || `SESS_${data.user.memberId}`,
            name: data.user.name,
            role: data.user.role || 'Society Member',
            memberId: data.user.memberId,
            flatNo: data.user.flatNo,
            email: data.user.email || '',
            phone: data.user.phone || '',
            token: data.user.token || token
          });
        } else {
          localStorage.removeItem('coopmart_session_token');
          setSession(null);
        }
      })
      .catch(() => {
        localStorage.removeItem('coopmart_session_token');
        setSession(null);
      })
      .finally(() => {
        setIsVerifyingSession(false);
      });
  }, []);

  const handleLoginSuccess = (user: UserSession, token: string) => {
    localStorage.setItem('coopmart_session_token', token);
    setSession({
      id: token,
      name: user.name,
      role: user.role || 'Society Member',
      memberId: user.memberId,
      flatNo: user.flatNo,
      email: user.email || '',
      phone: user.phone || '',
      token
    });
    fetchLocalData(true);
  };

  const handleLogout = async () => {
    const token = localStorage.getItem('coopmart_session_token');
    if (token) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ token })
        });
      } catch (_) {}
    }
    localStorage.removeItem('coopmart_session_token');
    setSession(null);
    setCurrentTab('dashboard');
  };

  // DB States
  const [members, setMembers] = useState<Member[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [milkSubs, setMilkSubs] = useState<MilkSubscription[]>([]);
  const [newspaperSubs, setNewspaperSubs] = useState<NewspaperSubscription[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [payments, setPayments] = useState<PaymentTransaction[]>([]);
  const [notifications, setNotifications] = useState<NotificationLog[]>([]);

  // Live Supabase Sync Toast State
  const [syncToast, setSyncToast] = useState<{
    show: boolean;
    success: boolean;
    message: string;
    table: string;
  } | null>(null);

  useEffect(() => {
    const unsubscribe = onSupabaseSyncEvent((event) => {
      setSyncToast({
        show: true,
        success: event.success,
        message: event.message || (event.success ? `Synced with Supabase '${event.table}'` : `Sync error in '${event.table}'`),
        table: event.table
      });

      const timer = setTimeout(() => {
        setSyncToast(prev => prev ? { ...prev, show: false } : null);
      }, 4500);

      return () => clearTimeout(timer);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // System Loading state
  const [isLoading, setIsLoading] = useState(true);

  // Local API fetching
  const fetchLocalData = useCallback(async (silent = false) => {
    if (!silent) {
      setIsLoading(true);
    }
    try {
      const [
        resMembers, 
        resProducts, 
        resMilk, 
        resNewspaper, 
        resBills, 
        resPayments, 
        resNotifications
      ] = await Promise.all([
        fetch('/api/members').then(r => r.json()),
        fetch('/api/products').then(r => r.json()),
        fetch('/api/milk').then(r => r.json()),
        fetch('/api/newspaper').then(r => r.json()),
        fetch('/api/bills').then(r => r.json()),
        fetch('/api/payments').then(r => r.json()),
        fetch('/api/notifications').then(r => r.json())
      ]);

      if (Array.isArray(resMembers)) setMembers(resMembers);
      if (Array.isArray(resProducts)) setProducts(resProducts);
      if (Array.isArray(resMilk)) setMilkSubs(resMilk);
      if (Array.isArray(resNewspaper)) setNewspaperSubs(resNewspaper);
      if (Array.isArray(resBills)) setBills(resBills);
      if (Array.isArray(resPayments)) setPayments(resPayments);
      if (Array.isArray(resNotifications)) setNotifications(resNotifications);
    } catch (err) {
      console.error('CoopMart: Fetch failure from Express API', err);
    } finally {
      if (!silent) {
        setIsLoading(false);
      }
    }
  }, []);

  // Supabase Data Fetching & Sync (Resilient without schema assumptions)
  const fetchSupabaseData = useCallback(async () => {
    const client = getSupabase();
    if (!client) {
      await fetchLocalData();
      return;
    }

    setIsLoading(true);
    try {
      let currentMembers: Member[] = members;

      // 1. Fetch members safely
      try {
        const { data: mData, error: mErr } = await client.from('members').select('*');
        if (!mErr && Array.isArray(mData) && mData.length > 0) {
          currentMembers = mData.map(mapMemberFromSupabase);
          setMembers(currentMembers);
        } else if (!mData || mData.length === 0) {
          seedSupabaseIfEmpty('members');
        }
      } catch (e) {
        console.warn('Error fetching members from Supabase:', e);
      }

      // 2. Fetch products safely
      try {
        const { data: pData, error: pErr } = await client.from('products').select('*');
        if (!pErr && Array.isArray(pData) && pData.length > 0) {
          setProducts(pData.map(mapProductFromSupabase));
        } else if (!pData || pData.length === 0) {
          seedSupabaseIfEmpty('products');
        }
      } catch (e) {
        console.warn('Error fetching products from Supabase:', e);
      }

      // 3. Fetch milk subscriptions safely
      try {
        const { data: msData, error: msErr } = await client.from('milk_subscriptions').select('*');
        if (!msErr && Array.isArray(msData) && msData.length > 0) {
          setMilkSubs(msData.map(mapMilkFromSupabase));
        } else if (!msData || msData.length === 0) {
          seedSupabaseIfEmpty('milk_subscriptions');
        }
      } catch (e) {
        console.warn('Error fetching milk subscriptions from Supabase:', e);
      }

      // 4. Fetch newspaper subscriptions safely
      try {
        const { data: nsData, error: nsErr } = await client.from('newspaper_subscriptions').select('*');
        if (!nsErr && Array.isArray(nsData) && nsData.length > 0) {
          setNewspaperSubs(nsData.map(mapNewspaperFromSupabase));
        } else if (!nsData || nsData.length === 0) {
          seedSupabaseIfEmpty('newspaper_subscriptions');
        }
      } catch (e) {
        console.warn('Error fetching newspaper subscriptions from Supabase:', e);
      }

      // 5. Fetch bills safely
      try {
        const { data: bData, error: bErr } = await client.from('bills').select('*');
        if (!bErr && Array.isArray(bData) && bData.length > 0) {
          setBills(bData.map(mapBillFromSupabase));
        } else if (!bData || bData.length === 0) {
          seedSupabaseIfEmpty('bills');
        }
      } catch (e) {
        console.warn('Error fetching bills from Supabase:', e);
      }

      // 6. Fetch payments safely (with member detail resolution)
      try {
        const { data: payData, error: payErr } = await client.from('payments').select('*');
        if (!payErr && Array.isArray(payData) && payData.length > 0) {
          setPayments(payData.map(row => mapPaymentFromSupabase(row, currentMembers)));
        } else if (!payData || payData.length === 0) {
          seedSupabaseIfEmpty('payments');
        }
      } catch (e) {
        console.warn('Error fetching payments from Supabase:', e);
      }

      // 7. Fetch notifications safely
      try {
        const { data: notifData, error: notifErr } = await client.from('notifications').select('*');
        if (!notifErr && Array.isArray(notifData) && notifData.length > 0) {
          setNotifications(notifData.map(mapNotificationFromSupabase));
        } else if (!notifData || notifData.length === 0) {
          seedSupabaseIfEmpty('notifications');
        }
      } catch (e) {
        console.warn('Error fetching notifications from Supabase:', e);
      }

    } catch (err) {
      console.warn('Supabase fetch error, falling back to local database:', err);
      await fetchLocalData();
    } finally {
      setIsLoading(false);
    }
  }, [fetchLocalData]);

  // Seed Supabase from Local JSON/API if Supabase table is newly created
  const seedSupabaseIfEmpty = async (tableName: string) => {
    const client = getSupabase();
    if (!client) return;
    try {
      let endpoint = '';
      if (tableName === 'members') endpoint = '/api/members';
      else if (tableName === 'products') endpoint = '/api/products';
      else if (tableName === 'milk_subscriptions') endpoint = '/api/milk';
      else if (tableName === 'newspaper_subscriptions') endpoint = '/api/newspaper';
      else if (tableName === 'bills') endpoint = '/api/bills';
      else if (tableName === 'payments') endpoint = '/api/payments';
      else if (tableName === 'notifications') endpoint = '/api/notifications';

      if (!endpoint) return;

      const resData = await fetch(endpoint).then(r => r.json()).catch(() => null);
      if (resData && Array.isArray(resData) && resData.length > 0) {
        let mappedData: any[] = [];
        if (tableName === 'members') {
          mappedData = resData.map(mapMemberToSupabase);
          setMembers(resData);
        } else if (tableName === 'products') {
          mappedData = resData.map(mapProductToSupabase);
          setProducts(resData);
        } else if (tableName === 'milk_subscriptions') {
          mappedData = resData.map(mapMilkToSupabase);
          setMilkSubs(resData);
        } else if (tableName === 'newspaper_subscriptions') {
          mappedData = resData.map(mapNewspaperToSupabase);
          setNewspaperSubs(resData);
        } else if (tableName === 'bills') {
          mappedData = resData.map(mapBillToSupabase);
          setBills(resData);
        } else if (tableName === 'payments') {
          mappedData = resData.map(mapPaymentToSupabase);
          setPayments(resData);
        } else if (tableName === 'notifications') {
          mappedData = resData.map(mapNotificationToSupabase);
          setNotifications(resData);
        }

        if (mappedData.length > 0) {
          try {
            await client.from(tableName).upsert(mappedData);
          } catch (_) {}
        }
      }
    } catch (err) {
      console.warn(`Auto-seeding ${tableName} into Supabase skipped or failed:`, err);
    }
  };

  // Realtime Subscription Setup (Immediate live reactions for society database)
  useEffect(() => {
    const client = getSupabase();

    if (client) {
      // Set up Realtime channel subscriptions with INSTANT reactive payload handling
      const channel = client
        .channel('coopmart_live_sync_all')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'members' }, (payload) => {
          if (payload.eventType === 'INSERT' && payload.new) {
            const newM = mapMemberFromSupabase(payload.new);
            setMembers(prev => prev.some(m => m.id === newM.id) ? prev.map(m => m.id === newM.id ? newM : m) : [newM, ...prev]);
          } else if (payload.eventType === 'UPDATE' && payload.new) {
            const updatedM = mapMemberFromSupabase(payload.new);
            setMembers(prev => prev.map(m => m.id === updatedM.id ? updatedM : m));
          } else if (payload.eventType === 'DELETE' && payload.old?.id) {
            setMembers(prev => prev.filter(m => m.id !== payload.old.id));
          }
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, (payload) => {
          if (payload.eventType === 'INSERT' && payload.new) {
            const newP = mapProductFromSupabase(payload.new);
            setProducts(prev => prev.some(p => p.id === newP.id) ? prev.map(p => p.id === newP.id ? newP : p) : [newP, ...prev]);
          } else if (payload.eventType === 'UPDATE' && payload.new) {
            const updatedP = mapProductFromSupabase(payload.new);
            setProducts(prev => prev.map(p => p.id === updatedP.id ? updatedP : p));
          } else if (payload.eventType === 'DELETE' && payload.old?.id) {
            setProducts(prev => prev.filter(p => p.id !== payload.old.id));
          }
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'milk_subscriptions' }, (payload) => {
          if (payload.eventType === 'INSERT' && payload.new) {
            const newS = mapMilkFromSupabase(payload.new);
            setMilkSubs(prev => prev.some(s => s.id === newS.id) ? prev.map(s => s.id === newS.id ? newS : s) : [newS, ...prev]);
          } else if (payload.eventType === 'UPDATE' && payload.new) {
            const updatedS = mapMilkFromSupabase(payload.new);
            setMilkSubs(prev => prev.map(s => s.id === updatedS.id ? updatedS : s));
          } else if (payload.eventType === 'DELETE' && payload.old?.id) {
            setMilkSubs(prev => prev.filter(s => s.id !== payload.old.id));
          }
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'newspaper_subscriptions' }, (payload) => {
          if (payload.eventType === 'INSERT' && payload.new) {
            const newS = mapNewspaperFromSupabase(payload.new);
            setNewspaperSubs(prev => prev.some(s => s.id === newS.id) ? prev.map(s => s.id === newS.id ? newS : s) : [newS, ...prev]);
          } else if (payload.eventType === 'UPDATE' && payload.new) {
            const updatedS = mapNewspaperFromSupabase(payload.new);
            setNewspaperSubs(prev => prev.map(s => s.id === updatedS.id ? updatedS : s));
          } else if (payload.eventType === 'DELETE' && payload.old?.id) {
            setNewspaperSubs(prev => prev.filter(s => s.id !== payload.old.id));
          }
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'bills' }, (payload) => {
          if (payload.eventType === 'INSERT' && payload.new) {
            const newB = mapBillFromSupabase(payload.new);
            setBills(prev => prev.some(b => b.id === newB.id) ? prev.map(b => b.id === newB.id ? newB : b) : [newB, ...prev]);
          } else if (payload.eventType === 'UPDATE' && payload.new) {
            const updatedB = mapBillFromSupabase(payload.new);
            setBills(prev => prev.map(b => b.id === updatedB.id ? updatedB : b));
          } else if (payload.eventType === 'DELETE' && payload.old?.id) {
            setBills(prev => prev.filter(b => b.id !== payload.old.id));
          }
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'payments' }, (payload) => {
          if (payload.eventType === 'INSERT' && payload.new) {
            const newPay = mapPaymentFromSupabase(payload.new);
            setPayments(prev => prev.some(p => p.id === newPay.id) ? prev.map(p => p.id === newPay.id ? newPay : p) : [newPay, ...prev]);
          } else if (payload.eventType === 'UPDATE' && payload.new) {
            const updatedPay = mapPaymentFromSupabase(payload.new);
            setPayments(prev => prev.map(p => p.id === updatedPay.id ? updatedPay : p));
          } else if (payload.eventType === 'DELETE' && payload.old?.id) {
            setPayments(prev => prev.filter(p => p.id !== payload.old.id));
          }
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, (payload) => {
          if (payload.eventType === 'INSERT' && payload.new) {
            const newN = mapNotificationFromSupabase(payload.new);
            setNotifications(prev => prev.some(n => n.id === newN.id) ? prev.map(n => n.id === newN.id ? newN : n) : [newN, ...prev]);
          } else if (payload.eventType === 'UPDATE' && payload.new) {
            const updatedN = mapNotificationFromSupabase(payload.new);
            setNotifications(prev => prev.map(n => n.id === updatedN.id ? updatedN : n));
          } else if (payload.eventType === 'DELETE' && payload.old?.id) {
            setNotifications(prev => prev.filter(n => n.id !== payload.old.id));
          }
        })
        .subscribe();

      // Initial Fetch from Supabase
      fetchSupabaseData();

      return () => {
        client.removeChannel(channel);
      };
    } else {
      // Local fallback initial fetch
      fetchLocalData();
    }
  }, [fetchSupabaseData, fetchLocalData]);

  // Sync dark mode class
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // 1. Members mutations (Live instant local + Supabase sync)
  const handleAddMember = async (newMemberData: Omit<Member, 'id' | 'joiningDate' | 'status'>) => {
    const id = 'M' + Math.floor(100000 + Math.random() * 900000);
    const newMember: Member = {
      id,
      joiningDate: new Date().toISOString().split('T')[0],
      status: 'Active',
      ...newMemberData
    };

    // 1. Live Instant Local Update (0ms)
    setMembers(prev => [newMember, ...prev]);

    // 2. Supabase Live Adaptive Upsert
    const fullPayload = mapMemberToSupabase(newMember);
    safeSupabaseUpsert('members', fullPayload);

    // 3. Local API sync in background
    fetch('/api/members', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newMember)
    }).catch(err => console.warn('Local API member sync warning:', err));
  };

  const handleEditMember = async (id: string, updatedData: Partial<Member>) => {
    // 1. Live Instant Local Update (0ms)
    let completeUpdatedMember: Member | null = null;
    setMembers(prev => {
      return prev.map(m => {
        if (m.id === id) {
          const merged: Member = { ...m, ...updatedData };
          completeUpdatedMember = merged;
          return merged;
        }
        return m;
      });
    });

    // 2. Supabase Live Adaptive Upsert with Complete Merged Record
    const memberObj: Partial<Member> = completeUpdatedMember || { id, ...updatedData };
    const fullPayload = mapMemberToSupabase(memberObj);
    safeSupabaseUpsert('members', fullPayload);

    // 3. Local API sync in background
    fetch(`/api/members/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(memberObj)
    }).catch(err => console.warn('Local API member edit warning:', err));
  };

  const handleDeleteMember = async (id: string) => {
    // 1. Live Instant Local Update (0ms)
    setMembers(prev => prev.filter(m => m.id !== id));

    // 2. Supabase Live Delete
    safeSupabaseDelete('members', id);

    // 3. Local API sync in background
    fetch(`/api/members/${id}`, { method: 'DELETE' }).catch(err => console.warn('Local API member delete warning:', err));
  };

  // 2. Products inventory mutations (Live instant local + Supabase sync)
  const handleAddProduct = async (prod: Omit<Product, 'id'>) => {
    const id = 'P' + Math.floor(100000 + Math.random() * 900000);
    const newProduct: Product = {
      id,
      ...prod,
      price: Number(prod.price),
      quantity: Number(prod.quantity)
    };

    // 1. Live Instant Local Update (0ms)
    setProducts(prev => [newProduct, ...prev]);

    // 2. Supabase Live Insert with Schema Fallback
    const fullPayload = mapProductToSupabase(newProduct);
    const fallbackPayload = {
      id: newProduct.id,
      product_name: newProduct.productName,
      price: newProduct.price,
      quantity: newProduct.quantity,
      category: newProduct.category
    };
    safeSupabaseInsert('products', fullPayload, fallbackPayload);

    // 3. Local API sync in background
    fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newProduct)
    }).catch(err => console.warn('Local API product add warning:', err));
  };

  const handleEditProduct = async (id: string, prod: Partial<Product>) => {
    const cleanProd: any = { ...prod };
    if (prod.price !== undefined) cleanProd.price = Number(prod.price);
    if (prod.quantity !== undefined) cleanProd.quantity = Number(prod.quantity);

    // 1. Live Instant Local Update (0ms)
    setProducts(prev => prev.map(p => p.id === id ? { ...p, ...cleanProd } : p));

    // 2. Supabase Live Update with Schema Fallback
    const fullPayload = mapProductToSupabase(cleanProd);
    const fallbackPayload: Record<string, any> = {};
    if (cleanProd.productName !== undefined) fallbackPayload.product_name = cleanProd.productName;
    if (cleanProd.price !== undefined) fallbackPayload.price = cleanProd.price;
    if (cleanProd.quantity !== undefined) fallbackPayload.quantity = cleanProd.quantity;

    safeSupabaseUpdate('products', id, fullPayload, fallbackPayload);

    // 3. Local API sync in background
    fetch(`/api/products/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cleanProd)
    }).catch(err => console.warn('Local API product edit warning:', err));
  };

  const handleDeleteProduct = async (id: string) => {
    // 1. Live Instant Local Update (0ms)
    setProducts(prev => prev.filter(p => p.id !== id));

    // 2. Supabase Live Delete
    safeSupabaseDelete('products', id);

    // 3. Local API sync in background
    fetch(`/api/products/${id}`, { method: 'DELETE' }).catch(err => console.warn('Local API product delete warning:', err));
  };

  // 3. Subscriptions mutations (Live instant local + Supabase sync)
  const handleAddMilk = async (sub: Omit<MilkSubscription, 'id' | 'status' | 'startDate' | 'memberName' | 'flatNo'>) => {
    const id = 'MS' + Math.floor(100000 + Math.random() * 900000);
    const member = members.find(m => m.id === sub.memberId);
    const newSub: MilkSubscription = {
      id,
      memberName: member ? member.name : "Unknown Member",
      flatNo: member ? member.flatNo : "N/A",
      status: 'Active',
      startDate: new Date().toISOString().split('T')[0],
      ...sub,
      quantity: Number(sub.quantity),
      pricePerLiter: Number(sub.pricePerLiter)
    };

    // 1. Live Instant Local Update (0ms)
    setMilkSubs(prev => [newSub, ...prev]);

    // 2. Supabase Live Insert
    const fullPayload = mapMilkToSupabase(newSub);
    const fallbackPayload = {
      id: newSub.id,
      member_id: newSub.memberId,
      milk_brand: newSub.milkBrand,
      quantity: newSub.quantity,
      status: newSub.status
    };
    safeSupabaseInsert('milk_subscriptions', fullPayload, fallbackPayload);

    // 3. Local API sync
    fetch('/api/milk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newSub)
    }).catch(err => console.warn('Local API milk add warning:', err));
  };

  const handleEditMilk = async (id: string, partial: Partial<MilkSubscription>) => {
    const cleanPartial: any = { ...partial };
    if (partial.quantity !== undefined) cleanPartial.quantity = Number(partial.quantity);
    if (partial.pricePerLiter !== undefined) cleanPartial.pricePerLiter = Number(partial.pricePerLiter);

    // 1. Live Instant Local Update (0ms)
    setMilkSubs(prev => prev.map(s => s.id === id ? { ...s, ...cleanPartial } : s));

    // 2. Supabase Live Update
    const fullPayload = mapMilkToSupabase(cleanPartial);
    safeSupabaseUpdate('milk_subscriptions', id, fullPayload);

    // 3. Local API sync
    fetch(`/api/milk/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cleanPartial)
    }).catch(err => console.warn('Local API milk edit warning:', err));
  };

  const handleAddNewspaper = async (sub: Omit<NewspaperSubscription, 'id' | 'status' | 'memberName' | 'flatNo'>) => {
    const id = 'NS' + Math.floor(100000 + Math.random() * 900000);
    const member = members.find(m => m.id === sub.memberId);
    const newSub: NewspaperSubscription = {
      id,
      memberName: member ? member.name : "Unknown Member",
      flatNo: member ? member.flatNo : "N/A",
      status: 'Active',
      ...sub,
      monthlyCharge: Number(sub.monthlyCharge)
    };

    // 1. Live Instant Local Update (0ms)
    setNewspaperSubs(prev => [newSub, ...prev]);

    // 2. Supabase Live Insert
    const fullPayload = mapNewspaperToSupabase(newSub);
    const fallbackPayload = {
      id: newSub.id,
      member_id: newSub.memberId,
      newspaper_name: newSub.newspaperName,
      monthly_charge: newSub.monthlyCharge,
      status: newSub.status
    };
    safeSupabaseInsert('newspaper_subscriptions', fullPayload, fallbackPayload);

    // 3. Local API sync
    fetch('/api/newspaper', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newSub)
    }).catch(err => console.warn('Local API newspaper add warning:', err));
  };

  const handleEditNewspaper = async (id: string, partial: Partial<NewspaperSubscription>) => {
    const cleanPartial: any = { ...partial };
    if (partial.monthlyCharge !== undefined) cleanPartial.monthlyCharge = Number(partial.monthlyCharge);

    // 1. Live Instant Local Update (0ms)
    setNewspaperSubs(prev => prev.map(s => s.id === id ? { ...s, ...cleanPartial } : s));

    // 2. Supabase Live Update
    const fullPayload = mapNewspaperToSupabase(cleanPartial);
    safeSupabaseUpdate('newspaper_subscriptions', id, fullPayload);

    // 3. Local API sync
    fetch(`/api/newspaper/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cleanPartial)
    }).catch(err => console.warn('Local API newspaper edit warning:', err));
  };

  // 4. Invoicing automation triggers (Live instant local + Supabase sync)
  const handleGenerateCycle = async (month: string) => {
    const activeMembers = members.filter(m => m.status === 'Active');
    let count = 0;

    const createdBills: Bill[] = [];
    const createdNotifs: NotificationLog[] = [];

    for (const m of activeMembers) {
      const existingBill = bills.find(b => b.memberId === m.id && b.billingMonth === month);
      if (existingBill) continue;

      const milkSub = milkSubs.find(ms => ms.memberId === m.id && ms.status === 'Active');
      let milkAmount = 0;
      if (milkSub) {
        const deliveriesPerDay = milkSub.deliveryTime === 'Both' ? 2 : 1;
        milkAmount = milkSub.quantity * deliveriesPerDay * milkSub.pricePerLiter * 30;
      }

      const newsSub = newspaperSubs.find(ns => ns.memberId === m.id && ns.status === 'Active');
      const newspaperAmount = newsSub ? newsSub.monthlyCharge : 0;

      const maintenanceAmount = 2500;
      const groceryAmount = Math.floor(Math.random() * 1500) + 200;

      const subtotal = groceryAmount + milkAmount + newspaperAmount + maintenanceAmount;
      const gst = Math.round(subtotal * 0.05);
      const discount = groceryAmount > 1000 ? 100 : 0;
      const totalAmount = subtotal + gst - discount;

      const billId = 'B' + Math.floor(100000 + Math.random() * 900000);
      const newBill: Bill = {
        id: billId,
        memberId: m.id,
        memberName: m.name,
        flatNo: m.flatNo,
        billingMonth: month,
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

      const notifId = 'NL' + Math.floor(100000 + Math.random() * 900000);
      const newNotif: NotificationLog = {
        id: notifId,
        memberId: m.id,
        memberName: m.name,
        flatNo: m.flatNo,
        type: 'Email',
        title: `Monthly Bill Generated - ${month}`,
        message: `Dear ${m.name}, your bill of ₹${totalAmount} for ${month} was generated successfully. Please pay under Society Utilities.`,
        sentDate: new Date().toISOString().replace('T', ' ').substring(0, 16),
        status: 'Sent'
      };

      createdBills.push(newBill);
      createdNotifs.push(newNotif);
      count++;
    }

    if (createdBills.length > 0) {
      // 1. Live Instant Local Update (0ms)
      setBills(prev => [...createdBills, ...prev]);
      setNotifications(prev => [...createdNotifs, ...prev]);

      // 2. Supabase Insert
      const client = getSupabase();
      if (client) {
        for (const bill of createdBills) {
          safeSupabaseInsert('bills', mapBillToSupabase(bill));
        }
        for (const notif of createdNotifs) {
          safeSupabaseInsert('notifications', mapNotificationToSupabase(notif));
        }
      }

      // 3. Local API sync
      fetch('/api/bills/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ billingMonth: month })
      }).catch(err => console.warn('Local API generate bills warning:', err));

      return { success: true, message: `Generated ${count} bills in Supabase and website successfully.` };
    }

    return { success: true, message: `Bills for ${month} are already generated for all active members.` };
  };

  const handleUpdateBillStatus = async (id: string, status: 'Paid' | 'Unpaid') => {
    // 1. Live Instant Local Update (0ms)
    setBills(prev => prev.map(b => b.id === id ? { ...b, paymentStatus: status } : b));

    // 2. Supabase Live Update
    safeSupabaseUpdate('bills', id, { payment_status: status });

    // 3. Local API sync
    fetch(`/api/bills/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    }).catch(err => console.warn('Local API bill status update warning:', err));
  };

  // 5. Checkout Payments integrations (Live instant local + Supabase sync)
  const handleRecordPayment = async (data: {
    memberId: string;
    memberName?: string;
    flatNo?: string;
    amount: number;
    paymentMethod: 'Cash' | 'UPI' | 'Credit Card' | 'Debit Card' | 'Wallet';
    items?: Array<{ id: string; selectQty: number }>;
    billId?: string;
  }) => {
    const id = 'TX' + Math.floor(100000 + Math.random() * 900000);
    const member = members.find(m => m.id === data.memberId);
    
    let resolvedMemberName = data.memberName;
    let resolvedFlatNo = data.flatNo;

    if (!resolvedMemberName || resolvedMemberName === 'Unknown Member' || resolvedMemberName.toLowerCase().startsWith('unknown')) {
      if (member) {
        resolvedMemberName = member.name;
        if (!resolvedFlatNo || resolvedFlatNo === 'N/A') resolvedFlatNo = member.flatNo;
      } else if (data.memberId === 'Visitor') {
        resolvedMemberName = 'Walk-in Guest';
        if (!resolvedFlatNo) resolvedFlatNo = 'N/A';
      } else {
        resolvedMemberName = data.memberId ? `Resident (${data.memberId})` : 'Walk-in Guest';
        if (!resolvedFlatNo) resolvedFlatNo = 'N/A';
      }
    }

    if (!resolvedFlatNo) {
      resolvedFlatNo = member ? member.flatNo : 'N/A';
    }

    const newTx: PaymentTransaction = {
      id,
      memberId: data.memberId,
      memberName: resolvedMemberName,
      flatNo: resolvedFlatNo,
      amount: Number(data.amount),
      paymentMethod: data.paymentMethod,
      transactionId: 'REF-' + Math.floor(10000000 + Math.random() * 90000000),
      paymentDate: new Date().toISOString().replace('T', ' ').substring(0, 16),
      status: 'Success',
      ...(data.billId ? { billId: data.billId } : {})
    };

    // 1. Live Instant Local Update (0ms) - That Very Second!
    setPayments(prev => [newTx, ...prev]);

    if (data.billId) {
      setBills(prev => prev.map(b => b.id === data.billId ? { ...b, paymentStatus: 'Paid' } : b));
    }

    if (data.items && Array.isArray(data.items)) {
      setProducts(prev => prev.map(p => {
        const item = data.items?.find(i => i.id === p.id);
        if (item) {
          return { ...p, quantity: Math.max(0, p.quantity - item.selectQty) };
        }
        return p;
      }));
    }

    // 2. Supabase Live Insert with Schema Fallback
    const fullPayload = mapPaymentToSupabase(newTx);
    const fallbackPayload = {
      id: newTx.id,
      member_id: newTx.memberId,
      member_name: newTx.memberName,
      flat_no: newTx.flatNo,
      amount: newTx.amount,
      payment_method: newTx.paymentMethod,
      status: newTx.status
    };
    safeSupabaseInsert('payments', fullPayload, fallbackPayload);

    if (data.billId) {
      safeSupabaseUpdate('bills', data.billId, { payment_status: 'Paid' });
    }

    if (data.items && Array.isArray(data.items)) {
      for (const item of data.items) {
        const prod = products.find(p => p.id === item.id);
        if (prod) {
          const newQty = Math.max(0, prod.quantity - item.selectQty);
          safeSupabaseUpdate('products', item.id, { quantity: newQty });
        }
      }
    }

    // 3. Local API sync in background
    fetch('/api/payments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...data,
        memberName: resolvedMemberName,
        flatNo: resolvedFlatNo
      })
    }).catch(err => console.warn('Local API payment record warning:', err));

    return newTx;
  };

  const handleRefund = async (id: string) => {
    const txDoc = payments.find(p => p.id === id);

    // 1. Live Instant Local Update (0ms)
    setPayments(prev => prev.map(p => p.id === id ? { ...p, status: 'Refunded' } : p));
    if (txDoc?.billId) {
      setBills(prev => prev.map(b => b.id === txDoc.billId ? { ...b, paymentStatus: 'Unpaid' } : b));
    }

    // 2. Supabase Live Update
    safeSupabaseUpdate('payments', id, { status: 'Refunded' });
    if (txDoc?.billId) {
      safeSupabaseUpdate('bills', txDoc.billId, { payment_status: 'Unpaid' });
    }

    // 3. Local API sync
    fetch(`/api/payments/${id}/refund`, { method: 'POST' }).catch(err => console.warn('Local API refund warning:', err));
  };

  // 6. Direct alert notification transmitter (Live instant local + Supabase sync)
  const handleSendAlert = async (data: { memberId: string; type: 'SMS' | 'Email'; title: string; message: string }) => {
    const id = 'NL' + Math.floor(100000 + Math.random() * 900000);
    const member = members.find(m => m.id === data.memberId);
    const newNotif: NotificationLog = {
      id,
      memberId: data.memberId,
      memberName: member ? member.name : "Unknown Member",
      flatNo: member ? member.flatNo : "N/A",
      type: data.type,
      title: data.title,
      message: data.message,
      sentDate: new Date().toISOString().replace('T', ' ').substring(0, 16),
      status: 'Sent'
    };

    // 1. Live Instant Local Update (0ms)
    setNotifications(prev => [newNotif, ...prev]);

    // 2. Supabase Live Insert
    const fullPayload = mapNotificationToSupabase(newNotif);
    safeSupabaseInsert('notifications', fullPayload);

    // 3. Local API sync
    fetch('/api/notifications/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).catch(err => console.warn('Local API send notification warning:', err));
  };

  // Tabs layout selection renderer
  const renderTabContent = () => {
    switch (currentTab) {
      case 'dashboard':
        return (
          <Dashboard 
            members={members} 
            products={products}
            milkSubs={milkSubs}
            newspaperSubs={newspaperSubs}
            bills={bills}
            payments={payments}
            onNavigate={(tab) => setCurrentTab(tab)}
            residentName={session?.name}
          />
        );
      case 'pos':
        return (
          <POSBilling 
            products={products}
            members={members}
            onRecordPayment={handleRecordPayment}
          />
        );
      case 'members':
        return (
          <MemberManagement 
            members={members}
            onAdd={handleAddMember}
            onEdit={handleEditMember}
            onDelete={handleDeleteMember}
          />
        );
      case 'groceries':
        return (
          <GroceryManagement 
            products={products}
            onAdd={handleAddProduct}
            onEdit={handleEditProduct}
            onDelete={handleDeleteProduct}
          />
        );
      case 'milk':
      case 'newspaper':
        return (
          <Subscriptions 
            milkSubs={milkSubs}
            newspaperSubs={newspaperSubs}
            members={members}
            onAddMilk={handleAddMilk}
            onEditMilk={handleEditMilk}
            onAddNewspaper={handleAddNewspaper}
            onEditNewspaper={handleEditNewspaper}
            defaultTab={currentTab === 'newspaper' ? 'newspaper' : 'milk'}
          />
        );
      case 'billing':
        return (
          <BillingSystem 
            bills={bills}
            members={members}
            onGenerateCycle={handleGenerateCycle}
            onUpdateStatus={handleUpdateBillStatus}
            onSendAlert={handleSendAlert}
            onRecordPayment={handleRecordPayment}
          />
        );
      case 'payments':
        return (
          <PaymentsModule 
            payments={payments}
            members={members}
            onRefund={handleRefund}
            onQuickPay={handleRecordPayment}
          />
        );
      case 'reports':
        return (
          <ReportsAndNotificator 
            members={members}
            products={products}
            milkSubs={milkSubs}
            newspaperSubs={newspaperSubs}
            bills={bills}
            notifications={notifications}
            onDispatchAlert={handleSendAlert}
            onNotificationSent={(newNotif) => setNotifications(prev => [newNotif, ...prev])}
          />
        );
      default:
        return <div className="p-8 text-center text-slate-500">Feature tab layout loading...</div>;
    }
  };

  // If verifying session token, render smooth themed loading indicator
  if (isVerifyingSession) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#0d041a] text-purple-200">
        <Building2 className="w-10 h-10 text-purple-400 animate-pulse mb-3" />
        <p className="text-xs font-mono font-medium tracking-wide">Verifying resident session...</p>
      </div>
    );
  }

  // Require a successful login response before showing the dashboard
  if (!session) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen font-sans flex flex-col md:flex-row bg-[#F8FAF8] dark:bg-slate-950 text-[#1F2937] dark:text-slate-100 transition-colors duration-200">
      
      {/* Navigation Sidebar */}
      <Sidebar 
        currentTab={currentTab} 
        setCurrentTab={setCurrentTab} 
        session={session} 
        setSession={(s) => setSession(s)}
        membersList={members.map(m => ({ id: m.id, name: m.name }))}
        darkMode={darkMode}
        onToggleDarkMode={toggleDarkMode}
        onLogout={handleLogout}
      />

      {/* Primary Workstation Frame */}
      <main className="flex-1 overflow-x-hidden flex flex-col min-h-screen bg-[#F8FAF8] dark:bg-slate-950">
        
        {/* Top Header bar */}
        <header className="bg-[#F7FEE7] dark:bg-lime-950/40 border-b border-[#D9F99D] dark:border-lime-900/60 px-6 py-3.5 flex items-center justify-between sticky top-0 z-30 shadow-xs transition-colors duration-200">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#65A30D] flex items-center justify-center text-white shadow-xs">
                <Building2 className="w-4.5 h-4.5 text-[#ECFCCB]" />
              </div>
              <div>
                <span className="text-sm font-bold text-[#365314] dark:text-[#D9F99D] block">CoopMart Society</span>
                <span className="text-[10px] text-[#4D7C0F] dark:text-lime-300 font-medium">Smart Billing & Management System</span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3.5">
            {/* Authenticated Resident Information & Logout Button */}
            <div className="flex items-center space-x-2 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/60 rounded-xl px-2.5 py-1 text-xs">
              <span className="font-semibold text-purple-900 dark:text-purple-200 hidden sm:inline">
                {session.name} {session.flatNo ? `(${session.flatNo})` : ''}
              </span>
              <button
                id="header-logout-btn"
                onClick={handleLogout}
                className="flex items-center space-x-1 px-2 py-0.5 rounded-lg bg-white dark:bg-purple-900 text-purple-700 dark:text-purple-200 font-bold hover:bg-purple-100 dark:hover:bg-purple-800 transition-colors cursor-pointer text-[11px]"
                title="Log Out of Resident Account"
              >
                <Lock className="w-3 h-3" />
                <span>Log Out</span>
              </button>
            </div>

            {/* Supabase Live Status Button */}
            <button
              id="open-supabase-sync-modal-btn"
              onClick={() => setIsSyncModalOpen(true)}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-emerald-300 dark:border-emerald-800/80 bg-emerald-50 hover:bg-emerald-100/80 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 text-xs font-bold text-emerald-800 dark:text-emerald-300 shadow-xs cursor-pointer transition-all"
              title="Open Supabase Cloud Sync Manager"
            >
              <Database className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="hidden sm:inline">Supabase Live</span>
            </button>

            {/* Dark & Light Mode Toggle Button */}
            <button
              id="theme-toggle-btn"
              onClick={toggleDarkMode}
              className="flex items-center space-x-2 px-3 py-1.5 rounded-xl border border-[#D9F99D] dark:border-lime-800 bg-white hover:bg-[#ECFCCB] dark:bg-slate-900 dark:hover:bg-slate-800 text-[#365314] dark:text-lime-200 transition-all text-xs font-bold cursor-pointer shadow-xs focus:outline-none focus:ring-2 focus:ring-[#84CC16]"
              title={darkMode ? "Switch to Day Mode" : "Switch to Dark Mode"}
              aria-label={darkMode ? "Switch to Day Mode" : "Switch to Dark Mode"}
            >
              {darkMode ? (
                <>
                  <Sun className="w-4 h-4 text-[#EAB308] animate-spin-slow" />
                  <span className="hidden sm:inline font-semibold">Day Mode</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-[#4D7C0F]" />
                  <span className="hidden sm:inline font-semibold">Dark Mode</span>
                </>
              )}
            </button>


          </div>
        </header>

        {/* Dynamic Inner Router Render */}
        <div className="flex-1 p-6 max-w-7xl mx-auto w-full">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-40 space-y-3.5">
              <div className="relative">
                <Building2 className="w-10 h-10 text-[#2E7D32] animate-bounce" />
                <div className="absolute inset-0 border-2 border-[#2E7D32]/30 border-t-[#2E7D32] rounded-full animate-spin"></div>
              </div>
              <p className="text-xs font-mono font-bold text-[#4B5563]">Synchronizing CoopMart database...</p>
            </div>
          ) : (
            renderTabContent()
          )}
        </div>

      </main>

      {/* Live Supabase Sync Toast Notification */}
      {syncToast && syncToast.show && (
        <aside
          aria-label="Supabase live sync status"
          className={`fixed bottom-5 right-5 z-50 p-3.5 rounded-2xl shadow-xl border flex items-start space-x-3 max-w-sm transition-all transform animate-in fade-in slide-in-from-bottom-5 ${
            syncToast.success
              ? 'bg-slate-900 text-white border-emerald-500/40 shadow-emerald-950/20'
              : 'bg-rose-950 text-rose-100 border-rose-600/60 shadow-rose-950/30'
          }`}
        >
          <div className="shrink-0 mt-0.5">
            {syncToast.success ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-400" />
            )}
          </div>
          <div className="flex-1 text-xs">
            <div className="font-bold flex items-center space-x-1.5 mb-0.5">
              <span>{syncToast.success ? 'Supabase Synchronized' : 'Supabase Sync Warning'}</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 bg-white/10 rounded font-semibold uppercase">
                {syncToast.table}
              </span>
            </div>
            <p className="text-[11px] opacity-90 leading-relaxed">{syncToast.message}</p>
            {!syncToast.success && (
              <button
                onClick={() => {
                  setSyncToast(null);
                  setIsSyncModalOpen(true);
                }}
                className="mt-2 text-[11px] font-bold text-emerald-300 hover:text-emerald-200 underline cursor-pointer"
              >
                Open Supabase Manager & Fix Tables
              </button>
            )}
          </div>
          <button
            onClick={() => setSyncToast(null)}
            className="text-white/60 hover:text-white p-0.5 rounded cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </aside>
      )}

      {/* Supabase Live Sync & Cloud Manager Modal */}
      <SupabaseSyncModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        members={members}
        products={products}
        milkSubs={milkSubs}
        newspaperSubs={newspaperSubs}
        bills={bills}
        payments={payments}
        notifications={notifications}
        onSyncComplete={() => fetchLocalData(true)}
      />

    </div>
  );
}
