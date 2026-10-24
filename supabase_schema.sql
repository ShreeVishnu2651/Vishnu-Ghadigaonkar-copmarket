-- =========================================================================
-- CoopMart Society Billing System - Supabase PostgreSQL Schema & Seeds
-- =========================================================================
-- You can run this entire script in your Supabase Project -> SQL Editor.
-- It creates all required tables, indexes, RLS policies, and seeds initial data.

-- 1. Members Table
CREATE TABLE IF NOT EXISTS public.members (
    id TEXT PRIMARY KEY,
    flat_no TEXT NOT NULL,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    address TEXT,
    family_members INTEGER DEFAULT 1,
    joining_date DATE DEFAULT CURRENT_DATE,
    status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Products / Grocery Inventory Table
CREATE TABLE IF NOT EXISTS public.products (
    id TEXT PRIMARY KEY,
    product_name TEXT NOT NULL,
    category TEXT NOT NULL,
    barcode TEXT,
    price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    quantity INTEGER NOT NULL DEFAULT 0,
    expiry_date DATE,
    supplier_name TEXT,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Milk Subscriptions Table
CREATE TABLE IF NOT EXISTS public.milk_subscriptions (
    id TEXT PRIMARY KEY,
    member_id TEXT REFERENCES public.members(id) ON DELETE CASCADE,
    member_name TEXT NOT NULL,
    flat_no TEXT NOT NULL,
    milk_brand TEXT NOT NULL DEFAULT 'Amul Taaza (500ml)',
    quantity NUMERIC(5, 2) NOT NULL DEFAULT 1.0,
    delivery_time TEXT NOT NULL CHECK (delivery_time IN ('Morning', 'Evening', 'Both')),
    price_per_liter NUMERIC(10, 2) NOT NULL DEFAULT 60.00,
    start_date DATE DEFAULT CURRENT_DATE,
    status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Paused', 'Cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Newspaper Subscriptions Table
CREATE TABLE IF NOT EXISTS public.newspaper_subscriptions (
    id TEXT PRIMARY KEY,
    member_id TEXT REFERENCES public.members(id) ON DELETE CASCADE,
    member_name TEXT NOT NULL,
    flat_no TEXT NOT NULL,
    newspaper_name TEXT NOT NULL DEFAULT 'The Times of India',
    language TEXT NOT NULL,
    monthly_charge NUMERIC(10, 2) NOT NULL DEFAULT 150.00,
    status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Paused', 'Cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Monthly Utility Bills Table
CREATE TABLE IF NOT EXISTS public.bills (
    id TEXT PRIMARY KEY,
    member_id TEXT REFERENCES public.members(id) ON DELETE CASCADE,
    member_name TEXT NOT NULL,
    flat_no TEXT NOT NULL,
    billing_month TEXT NOT NULL,
    grocery_amount NUMERIC(10, 2) DEFAULT 0.00,
    milk_amount NUMERIC(10, 2) DEFAULT 0.00,
    newspaper_amount NUMERIC(10, 2) DEFAULT 0.00,
    maintenance_amount NUMERIC(10, 2) DEFAULT 2500.00,
    gst NUMERIC(10, 2) DEFAULT 0.00,
    discount NUMERIC(10, 2) DEFAULT 0.00,
    total_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    payment_status TEXT DEFAULT 'Unpaid' CHECK (payment_status IN ('Paid', 'Unpaid')),
    date_generated DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Payment Transactions Table
CREATE TABLE IF NOT EXISTS public.payments (
    id TEXT PRIMARY KEY,
    member_id TEXT NOT NULL,
    member_name TEXT NOT NULL,
    flat_no TEXT,
    amount NUMERIC(10, 2) NOT NULL,
    payment_method TEXT NOT NULL,
    transaction_id TEXT NOT NULL,
    payment_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    status TEXT DEFAULT 'Success' CHECK (status IN ('Success', 'Failed', 'Refunded')),
    bill_id TEXT REFERENCES public.bills(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. Notifications Log Table
CREATE TABLE IF NOT EXISTS public.notifications (
    id TEXT PRIMARY KEY,
    member_id TEXT,
    member_name TEXT,
    flat_no TEXT,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    sent_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    status TEXT DEFAULT 'Sent',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. Member Credentials / Authentication Registry Table
CREATE TABLE IF NOT EXISTS public.member_credentials (
    member_id TEXT PRIMARY KEY REFERENCES public.members(id) ON DELETE CASCADE,
    auth_identifier TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    salt TEXT NOT NULL,
    is_initial_password BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.milk_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newspaper_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_credentials ENABLE ROW LEVEL SECURITY;

-- Allow public / authenticated access for CoopMart application
CREATE POLICY "Allow public read-write for members" ON public.members FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read-write for products" ON public.products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read-write for milk_subscriptions" ON public.milk_subscriptions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read-write for newspaper_subscriptions" ON public.newspaper_subscriptions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read-write for bills" ON public.bills FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read-write for payments" ON public.payments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read-write for notifications" ON public.notifications FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read-write for member_credentials" ON public.member_credentials FOR ALL USING (true) WITH CHECK (true);

-- Enable Realtime Replication for Tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.members;
ALTER PUBLICATION supabase_realtime ADD TABLE public.products;
ALTER PUBLICATION supabase_realtime ADD TABLE public.milk_subscriptions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.newspaper_subscriptions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.bills;
ALTER PUBLICATION supabase_realtime ADD TABLE public.payments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;


