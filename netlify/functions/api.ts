import serverless from 'serverless-http';
import express from 'express';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import 'dotenv/config';

// Load coopmart_db.json fallback
const DB_FILE = path.join(process.cwd(), 'coopmart_db.json');

// Robust data loading for serverless environments
function loadDatabase() {
  try {
    // Try absolute path from project root first
    const rootPath = path.join(process.cwd(), 'coopmart_db.json');
    if (fs.existsSync(rootPath)) {
      return JSON.parse(fs.readFileSync(rootPath, 'utf8'));
    }
    
    // Fallback: check function local directory
    const localPath = path.join(__dirname, 'coopmart_db.json');
    if (fs.existsSync(localPath)) {
      return JSON.parse(fs.readFileSync(localPath, 'utf8'));
    }
  } catch (e) {
    console.error('Error loading DB:', e);
  }
  
  // Return empty structure if all fails
  return { 
    members: [], 
    products: [], 
    milkSubscriptions: [], 
    newspaperSubscriptions: [], 
    bills: [], 
    payments: [], 
    notifications: [], 
    credentials: [], 
    activeSessions: [] 
  };
}

function saveDatabase(db: any) {
  // NOTE: On Netlify Functions, filesystem is read-only. 
  // This will only work for the duration of the current function invocation.
  // For permanent persistence, Supabase must be used.
  try {
    const dbPath = path.join(process.cwd(), 'coopmart_db.json');
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf8');
  } catch (e) {
    console.warn('Database save skipped (filesystem is read-only on serverless)');
  }
}

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const apiRouter = express.Router();

// Helper normalization
const normalizeName = (s: string) => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
const normalizeFlat = (s: string) => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');

// PIN Hash helper
const hashPin = (pin: string, salt: string) => {
  return crypto.pbkdf2Sync(pin, salt, 1000, 64, 'sha512').toString('hex');
};

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

    let member = db.members.find((m: any) => 
      normalizeName(m.name) === cleanNormName && normalizeFlat(m.flatNo) === cleanNormFlat
    );

    if (!member) {
      const existingIds = new Set(db.members.map((m: any) => m.id));
      let newId = 'M' + Math.floor(100000 + Math.random() * 900000);
      while (existingIds.has(newId)) {
        newId = 'M' + Math.floor(100000 + Math.random() * 900000);
      }

      const newMember = {
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

    const authIdentifier = `${cleanNormName}#${cleanNormFlat}`;
    const existingCred = db.credentials.find((c: any) => c.memberId === member.id || c.authIdentifier === authIdentifier);
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

    const now = Date.now();
    db.activeSessions = db.activeSessions.filter((s: any) => s.expiresAt > now);

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = now + 24 * 60 * 60 * 1000;

    const newSession = {
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

// Registration API (Alias for login / auto-create in demo mode)
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
    if (!db.credentials) db.credentials = [];

    let member = db.members.find((m: any) => 
      normalizeName(m.name) === cleanNormName && normalizeFlat(m.flatNo) === cleanNormFlat
    );

    if (!member) {
      const existingIds = new Set(db.members.map((m: any) => m.id));
      let newId = 'M' + Math.floor(100000 + Math.random() * 900000);
      while (existingIds.has(newId)) {
        newId = 'M' + Math.floor(100000 + Math.random() * 900000);
      }

      member = {
        id: newId,
        flatNo: flat,
        name: name,
        phone: req.body.phone || '',
        email: req.body.email || '',
        address: req.body.address || `Flat ${flat}, CoopMart Residency`,
        familyMembers: Number(req.body.familyMembers || 1),
        joiningDate: new Date().toISOString().split('T')[0],
        status: 'Active'
      };
      db.members.push(member);
    }

    const authIdentifier = `${cleanNormName}#${cleanNormFlat}`;
    const salt = crypto.randomBytes(16).toString('hex');
    const passwordHash = hashPin(pin, salt);

    const existingCredIdx = db.credentials.findIndex((c: any) => c.memberId === member.id || c.authIdentifier === authIdentifier);
    const newCred = {
      memberId: member.id,
      authIdentifier,
      passwordHash,
      salt,
      isInitialPassword: false,
      updatedAt: new Date().toISOString()
    };

    if (existingCredIdx >= 0) {
      db.credentials[existingCredIdx] = newCred;
    } else {
      db.credentials.push(newCred);
    }

    saveDatabase(db);

    return res.json({
      success: true,
      message: 'Registration successful! You may now log in.'
    });

  } catch (err) {
    console.error('Registration error:', err);
    return res.status(500).json({ 
      success: false, 
      message: 'Registration service temporarily unavailable. Please try again.' 
    });
  }
});

// Members API
apiRouter.get('/members', (req, res) => {
  const db = loadDatabase();
  res.json(db.members || []);
});

apiRouter.post('/members', (req, res) => {
  const db = loadDatabase();
  if (!db.members) db.members = [];
  const newMember = req.body;
  db.members.unshift(newMember);
  saveDatabase(db);
  res.json({ success: true, member: newMember });
});

// Products API
apiRouter.get('/products', (req, res) => {
  const db = loadDatabase();
  res.json(db.products || []);
});

// Milk Subscriptions API
apiRouter.get('/milk', (req, res) => {
  const db = loadDatabase();
  res.json(db.milkSubscriptions || db.milk || []);
});

// Newspaper Subscriptions API
apiRouter.get('/newspaper', (req, res) => {
  const db = loadDatabase();
  res.json(db.newspaperSubscriptions || db.newspaper || []);
});

// Bills API
apiRouter.get('/bills', (req, res) => {
  const db = loadDatabase();
  res.json(db.bills || []);
});

// Payments API
apiRouter.get('/payments', (req, res) => {
  const db = loadDatabase();
  res.json(db.payments || []);
});

// Notifications API
apiRouter.get('/notifications', (req, res) => {
  const db = loadDatabase();
  res.json(db.notifications || []);
});

// Session Verify
apiRouter.get('/auth/verify-session', (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : (req.query.token as string);
  if (!token) {
    return res.status(401).json({ success: false, message: 'No session token provided.' });
  }
  const db = loadDatabase();
  const session = (db.activeSessions || []).find((s: any) => s.token === token && s.expiresAt > Date.now());
  if (!session) {
    return res.status(401).json({ success: false, message: 'Session expired or invalid.' });
  }
  res.json({ success: true, user: session });
});

// Logout
apiRouter.post('/auth/logout', (req, res) => {
  const { token } = req.body;
  const authHeader = req.headers.authorization;
  const sessionToken = token || (authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null);
  if (sessionToken) {
    const db = loadDatabase();
    if (db.activeSessions) {
      db.activeSessions = db.activeSessions.filter((s: any) => s.token !== sessionToken);
      saveDatabase(db);
    }
  }
  res.json({ success: true, message: 'Logged out successfully.' });
});

app.use('/api', apiRouter);

export const handler = serverless(app);
