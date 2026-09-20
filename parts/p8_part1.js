<script>
// ==========================================
// 1. CONSTANTS & SYSTEM INITIALIZATION
// ==========================================
const SUPABASE_URL = "https://momwcmngzrqsjjkwsvgx.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_swDNnStwEq3nSX-3lU7vjQ_pXiLUBbO";
const DB_HEADERS = {
  'apikey': SUPABASE_ANON_KEY,
  'Authorization': 'Bearer ' + SUPABASE_ANON_KEY,
  'Content-Type': 'application/json',
  'Prefer': 'return=representation'
};

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS_SHORT = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const SLOT_LABELS = { breakfast:'Breakfast', lunch:'Lunch', snacks:'Evening Snacks', dinner:'Dinner', fullday:'Full Day' };
const SLOT_TIMES  = { breakfast:'7:30 AM', lunch:'1:00 PM', snacks:'4:30 PM', dinner:'8:00 PM', fullday:'All Day' };
const SLOT_ICONS  = { breakfast:'â˜€ï¸', lunch:'ðŸ›', snacks:'ðŸ«–', dinner:'ðŸŒ™', fullday:'ðŸ½ï¸' };
const SLOTS_ORDER = ['breakfast','lunch','snacks','dinner'];
const ADMIN_TABS  = ['dashboard','roster','members','ustads','broadcast','settings'];

// Default Seed Data
const DEFAULT_MASJIDS = [
  {
    masjid_id: "MSJ-7821",
    name: "Markaz Jamia Masjid",
    locality: "Central Mahallu, Civil Station",
    city: "Kozhikode",
    admin_email: "admin@wajba.org",
    ustad_count: 3,
    delivery_location: "Madrasa Room #2, Ground Floor",
    delivery_notes: "Covered hotpot containers. Please knock before entering."
  },
  {
    masjid_id: "MSJ-4092",
    name: "Bilal Masjid Mahallu",
    locality: "East Ward, Hill Road",
    city: "Malappuram",
    admin_email: "bilal.admin@wajba.org",
    ustad_count: 2,
    delivery_location: "Ustad Residence Block B",
    delivery_notes: "Leave food at the common dining room."
  }
];

const DEFAULT_MASJID_USERS = [
  { masjid_id: "MSJ-7821", email: "admin@wajba.org", role: "admin", name: "Admin Brother", phone: "9876543210" },
  { masjid_id: "MSJ-7821", email: "ustad@wajba.org", role: "ustad", name: "Hazrat Ustad Abdullah", phone: "9876543211", room: "Room #1", subject: "Hifz & Tajweed", diet: "Less spicy food" },
  { masjid_id: "MSJ-7821", email: "delivery@wajba.org", role: "delivery", name: "Ibrahim Household", phone: "9876543212", house: "House #14 / Nur Villa", head: "Afreez Ibrahim", zone: "Zone A - North" },
  { masjid_id: "MSJ-7821", email: "member@wajba.org", role: "member", name: "Tariq Jamath Member", phone: "9876543213", house: "House #22 / Madina Manzil", head: "Tariq Member", zone: "Zone B - South" }
];

const DEFAULT_HOUSES = [
  { id: 101, masjid_id: "MSJ-7821", house: "House #01 / Markaz House", head: "Admin Brother", phone: "9876543210", email: "admin@wajba.org", zone: "Zone E - Central", active: true, role: "admin" },
  { id: 102, masjid_id: "MSJ-7821", house: "House #14 / Nur Villa", head: "Afreez Ibrahim", phone: "9876543212", email: "delivery@wajba.org", zone: "Zone A - North", active: true, role: "delivery" },
  { id: 103, masjid_id: "MSJ-7821", house: "House #22 / Madina Manzil", head: "Tariq Member", phone: "9876543213", email: "member@wajba.org", zone: "Zone B - South", active: true, role: "member" }
];

const DEFAULT_USTADS = [
  { id: 201, masjid_id: "MSJ-7821", name: "Hazrat Ustad Abdullah", email: "ustad@wajba.org", room: "Room #1", subject: "Hifz & Tajweed", diet: "Less spicy food" },
  { id: 202, masjid_id: "MSJ-7821", name: "Hazrat Ustad Zainul Abideen", email: "zain@wajba.org", room: "Room #3", subject: "Fiqh & Hadith", diet: "Standard diet" }
];

function getRoleBadge(role) {
  if (role === 'admin') return '<span class="badge badge-admin">👑 Jamath Representative</span>';
  if (role === 'ustad') return '<span class="badge badge-ustad">👳 Ustad</span>';
  if (role === 'member') return '<span class="badge badge-member">👤 Jamath Member</span>';
  return '<span class="badge badge-delivery">🛵 Food Delivery</span>';
}

// App In-Memory State
let currentUser = null;
let activeMasjid = null;
let currentRole = null; // 'admin' | 'ustad' | 'delivery' | 'member'

let masjids = [...DEFAULT_MASJIDS];
let masjidUsers = [...DEFAULT_MASJID_USERS];
let houses = [...DEFAULT_HOUSES];
let ustads = [...DEFAULT_USTADS];
let roster = {};

let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();
let tmrwUstadCount = 3;
let currentEditingDutyHouseId = null;
let editingMemberId = null;
let toastTimer = null;

// ==========================================
// 2. STORAGE & PERSISTENCE
// ==========================================
function saveLocalState() {
  try {
    const bundle = {
      currentUser,
      activeMasjid,
      currentRole,
      masjids,
      masjidUsers,
      houses,
      ustads,
      roster
    };
    localStorage.setItem('wajba_multi_tenant_v2', JSON.stringify(bundle));
  } catch (e) {
    console.warn('Storage save failed:', e);
  }
}

function loadLocalState() {
  try {
    const raw = localStorage.getItem('wajba_multi_tenant_v2');
    if (raw) {
      const data = JSON.parse(raw);
      currentUser = data.currentUser || null;
      activeMasjid = data.activeMasjid || null;
      currentRole = data.currentRole || null;
      masjids = Array.isArray(data.masjids) && data.masjids.length ? data.masjids : DEFAULT_MASJIDS;
      masjidUsers = Array.isArray(data.masjidUsers) && data.masjidUsers.length ? data.masjidUsers : DEFAULT_MASJID_USERS;
      houses = Array.isArray(data.houses) && data.houses.length ? data.houses : [...DEFAULT_HOUSES];
      ustads = Array.isArray(data.ustads) && data.ustads.length ? data.ustads : [...DEFAULT_USTADS];
      roster = data.roster || {};
      return true;
    }
  } catch (e) {
    console.warn('Storage load error:', e);
  }
  masjids = [...DEFAULT_MASJIDS];
  masjidUsers = [...DEFAULT_MASJID_USERS];
  houses = [...DEFAULT_HOUSES];
  ustads = [...DEFAULT_USTADS];
  return false;
}

// ==========================================
// 3. TOAST & NOTIFICATIONS
// ==========================================
function showToast(msg) {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = msg;
  el.classList.add('show');
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 3200);
}

function openModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add('open');
}

function closeModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove('open');
}

document.addEventListener('click', (e) => {
  if (e.target && e.target.classList && e.target.classList.contains('modal')) {
    e.target.classList.remove('open');
  }
});

// ==========================================
// 4. NAVIGATION & AUTHENTICATION
// ==========================================
function showPage(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const target = document.getElementById(id);
  if (target) target.classList.add('active');
  window.scrollTo(0, 0);
}

function setAuthMode(mode) {
  const isSignUp = (mode === 'signup');
  document.getElementById('auth-signup-fields').style.display = isSignUp ? 'block' : 'none';
  document.getElementById('auth-submit-btn').textContent = isSignUp ? 'Create Account & Continue' : 'Sign In';
  
  const tabIn = document.getElementById('auth-tab-signin');
  const tabUp = document.getElementById('auth-tab-signup');
  if (isSignUp) {
    tabUp.className = 'flex-1 py-3 text-sm font-bold border-b-2 border-emerald-600 text-emerald-800 bg-white';
    tabIn.className = 'flex-1 py-3 text-sm font-semibold text-slate-500 border-b-2 border-transparent';
  } else {
    tabIn.className = 'flex-1 py-3 text-sm font-bold border-b-2 border-emerald-600 text-emerald-800 bg-white';
    tabUp.className = 'flex-1 py-3 text-sm font-semibold text-slate-500 border-b-2 border-transparent';
  }
}

function togglePasswordVisibility(id) {
  const el = document.getElementById(id);
  if (el) el.type = el.type === 'password' ? 'text' : 'password';
}

function handleAuthSubmit() {
  const email = (document.getElementById('auth-email')?.value || '').trim().toLowerCase();
  const password = document.getElementById('auth-password')?.value || '';
  const isSignUp = document.getElementById('auth-signup-fields').style.display !== 'none';

  if (!email || !email.includes('@')) {
    showToast('Please enter a valid email address');
    return;
  }
  if (!password || password.length < 4) {
    showToast('Password must be at least 4 characters');
    return;
  }

  let name = email.split('@')[0];
  let phone = '';
  if (isSignUp) {
    name = (document.getElementById('auth-name')?.value || '').trim() || name;
    phone = (document.getElementById('auth-phone')?.value || '').trim();
  } else {
    const known = masjidUsers.find(u => u.email.toLowerCase() === email);
    if (known && known.name) name = known.name;
    if (known && known.phone) phone = known.phone;
  }

  currentUser = { email, name, phone };
  saveLocalState();
  showToast(`Welcome, ${name}! ðŸ‘‹`);
  openMasjidSelection();
}

function quickTestLogin(role) {
  if (role === 'admin') {
    currentUser = { email: 'admin@wajba.org', name: 'Admin Brother', phone: '9876543210' };
  } else if (role === 'ustad') {
    currentUser = { email: 'ustad@wajba.org', name: 'Hazrat Ustad Abdullah', phone: '9876543211' };
  } else if (role === 'member') {
    currentUser = { email: 'member@wajba.org', name: 'Tariq Jamath Member', phone: '9876543213' };
  } else {
    currentUser = { email: 'delivery@wajba.org', name: 'Afreez Ibrahim', phone: '9876543212' };
  }
  saveLocalState();
  showToast(`Logged in as ${role.toUpperCase()} ⚡`);
  openMasjidSelection();
}

function logout() {
  currentUser = null;
  activeMasjid = null;
  currentRole = null;
  saveLocalState();
  showPage('page-landing');
  showToast('Signed out successfully.');
}