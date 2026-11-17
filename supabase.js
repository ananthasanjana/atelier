// ===== Atelier: Supabase connection =====
// 1. Open Supabase -> Project Settings -> API
// 2. Paste your Project URL and "anon public" key below (keep the quotes)

const SUPABASE_URL = 'https://sktkevlfxjppfpjmxguy.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_0jOs1sVk5nRJj1SY9VrgKw_Eoc08C0N';

// ---------------------------------------------------------------
// You don't need to change anything below this line.
// ---------------------------------------------------------------

const ROLE_LABELS = {
  member: 'Member / Student',
  tailor: 'Tailor / Designer',
  seller: 'Seller',
};

const isConfigured = !SUPABASE_URL.startsWith('PASTE') && !SUPABASE_ANON_KEY.startsWith('PASTE');

const db = isConfigured ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

// Build a full link to another page in this folder (works on Live Server and when deployed)
function pageUrl(file) {
  return new URL(file, window.location.href).href;
}

function showMessage(text, type = 'error') {
  const el = document.getElementById('msg');
  if (!el) return;
  el.textContent = text;
  el.className = 'msg ' + type;
}

// "Remember me" unticked -> log out once the browser tab is closed
const REMEMBER_KEY = 'atelier_remember';
const TAB_KEY = 'atelier_tab_alive';

function setRemember(remember) {
  try {
    if (remember) localStorage.removeItem(REMEMBER_KEY);
    else localStorage.setItem(REMEMBER_KEY, 'no');
    sessionStorage.setItem(TAB_KEY, '1');
  } catch (e) { /* storage blocked: ignore */ }
}

const atelierReady = (async () => {
  if (!db) {
    document.addEventListener('DOMContentLoaded', () => {
      const banner = document.createElement('div');
      banner.className = 'setup-banner';
      banner.textContent = 'Setup needed: open supabase.js and paste your Supabase Project URL and anon key.';
      document.body.prepend(banner);
    });
    return;
  }
  try {
    if (localStorage.getItem(REMEMBER_KEY) === 'no' && !sessionStorage.getItem(TAB_KEY)) {
      await db.auth.signOut({ scope: 'local' });
      localStorage.removeItem(REMEMBER_KEY);
    }
    sessionStorage.setItem(TAB_KEY, '1');
  } catch (e) { /* storage blocked: ignore */ }
})();

// Get the logged-in user's profile row (or null if logged out)
async function getCurrentProfile() {
  await atelierReady;
  if (!db) return null;
  const { data: { session } } = await db.auth.getSession();
  if (!session) return null;
  const { data, error } = await db
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single();
  if (error) {
    console.error('Could not load profile:', error.message);
    return null;
  }
  return data;
}

async function logOut() {
  if (db) await db.auth.signOut();
  window.location.href = pageUrl('login.html');
}

// Turn the yellow nav pill into "login" or the signed-in profile link
async function updateNavAuth() {
  await atelierReady;
  const btn = document.getElementById('authBtn');
  if (!btn || !db) return;
  const { data: { session } } = await db.auth.getSession();
  if (session) {
    const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    icon.setAttribute('viewBox', '0 0 24 24');
    icon.setAttribute('width', '17');
    icon.setAttribute('height', '17');
    icon.setAttribute('aria-hidden', 'true');
    icon.style.verticalAlign = 'middle';
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('fill', 'currentColor');
    path.setAttribute('d', 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm0 2c-4.42 0-8 2.24-8 5v1h16v-1c0-2.76-3.58-5-8-5Z');
    icon.append(path);
    btn.replaceChildren(icon, document.createTextNode(' Profile'));
    btn.href = pageUrl('profile.html');
    btn.onclick = null;
  } else {
    btn.textContent = 'login';
    btn.href = pageUrl('login.html');
    btn.onclick = null;
  }
}

async function continueWithGoogle() {
  if (!db) return showMessage('Add your Supabase URL and key in supabase.js first.');
  if (window.location.protocol === 'file:') {
    return showMessage('Open Atelier through Live Server (http://127.0.0.1:5500) before signing in with Google.');
  }
  setRemember(true);
  const { error } = await db.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: pageUrl('index.html') },
  });
  if (error) {
    showMessage(error.message.includes('not enabled')
      ? 'Google login is not turned on yet (Supabase → Authentication → Providers → Google).'
      : error.message);
  }
}

document.addEventListener('DOMContentLoaded', updateNavAuth);
