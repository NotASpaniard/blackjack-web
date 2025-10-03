const STORAGE_USER = 'blackjack_user_v1';

export function getUser() {
  try { const raw = localStorage.getItem(STORAGE_USER); return raw ? JSON.parse(raw) : null; } catch { return null; }
}
export function setUser(user) {
  try { if (user) localStorage.setItem(STORAGE_USER, JSON.stringify(user)); else localStorage.removeItem(STORAGE_USER); } catch {}
}
export function isLoggedIn() { return !!getUser(); }
export function isAdmin() { const u = getUser(); return !!u && (u.name === 'admin' || u.nick === 'Admin'); }

export function setAuthUI() {
  const loginLink = document.getElementById('login-link');
  const registerLink = document.getElementById('register-link');
  const logoutLink = document.getElementById('logout-link');
  const username = document.getElementById('username');
  const avatar = document.getElementById('avatar');
  const adminLink = document.getElementById('admin-link');
  const user = getUser();
  const logged = !!user;
  if (loginLink) loginLink.style.display = logged ? 'none' : 'block';
  if (registerLink) registerLink.style.display = logged ? 'none' : 'block';
  if (logoutLink) logoutLink.style.display = logged ? 'block' : 'none';
  if (adminLink) adminLink.style.display = (logged && isAdmin()) ? 'block' : 'none';
  if (username) username.textContent = logged ? (user.nick || user.name || user.email) : 'Khách';
  if (avatar) {
    const text = (logged ? (user.nick || user.name || user.email || '?') : 'ND').trim();
    avatar.textContent = text.slice(0, 2).toUpperCase();
  }
}

export function logoutAndRedirect() {
  fetch('http://localhost:4000/auth/logout', { method: 'POST', credentials: 'include' })
    .finally(() => { setUser(null); location.href = './auth.html#login'; });
}

export function guardPage(role) {
  if (role === 'admin') {
    if (!isAdmin()) { location.href = './auth.html#login'; return; }
  } else if (role === 'user') {
    if (!isLoggedIn()) { location.href = './auth.html#login'; return; }
  }
  // Optionally verify session with backend
  fetch('http://localhost:4000/auth/me', { credentials: 'include' })
    .then((r) => { if (!r.ok) throw new Error('unauth'); return r.json(); })
    .then(({ user }) => { if (!user) throw new Error('unauth'); })
    .catch(() => { setUser(null); location.href = './auth.html#login'; });
}

export function initAuthSplit() {
  const container = document.getElementById('auth-container');
  if (!container) return;
  const setMode = (mode) => {
    container.classList.toggle('active', mode === 'register');
    document.body.style.background = mode === 'register'
      ? 'radial-gradient(1200px 800px at 50% -200px, #3a0000, #090909)'
      : 'radial-gradient(1200px 800px at 50% -200px, #1f0000, #0b0b0b)';
  };
  const applyHash = () => {
    const hash = (location.hash || '#login').slice(1);
    setMode(hash === 'register' ? 'register' : 'login');
  };
  window.addEventListener('hashchange', applyHash);
  applyHash();
  const regBtn = document.querySelector('.register-btn');
  const logBtn = document.querySelector('.login-btn');
  if (regBtn) regBtn.addEventListener('click', () => { location.hash = '#register'; });
  if (logBtn) logBtn.addEventListener('click', () => { location.hash = '#login'; });
}

export function handleLoginSubmit() {
  const form = document.getElementById('auth-login-form') || document.getElementById('login-form');
  if (!form) return;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const idEl = document.getElementById('auth-login-id') || document.getElementById('login-email');
    const passEl = document.getElementById('auth-login-password') || document.getElementById('login-password');
    const id = (idEl ? idEl.value : '').trim();
    const password = passEl ? passEl.value : '';
    if (!id || !password) return;
    fetch('http://localhost:4000/auth/login', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, password }) })
      .then(async (r) => { if (!r.ok) throw new Error((await r.json()).error || 'Login failed'); return r.json(); })
      .then(({ user }) => { setUser(user); location.href = './index.html'; })
      .catch((err) => alert(err.message));
  });
}

export function handleRegisterSubmit() {
  const form = document.getElementById('auth-register-form') || document.getElementById('register-form');
  if (!form) return;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const nameEl = document.getElementById('auth-register-name') || document.getElementById('register-name');
    const emailEl = document.getElementById('auth-register-email') || document.getElementById('register-email');
    const passEl = document.getElementById('auth-register-password') || document.getElementById('register-password');
    const nickEl = document.getElementById('auth-register-nick') || document.getElementById('register-nick');
    const name = nameEl ? nameEl.value.trim() : '';
    const email = emailEl ? emailEl.value.trim() : '';
    const password = passEl ? passEl.value : '';
    const nick = nickEl ? nickEl.value.trim() : '';
    if (!name || !email || !password) return;
    fetch('http://localhost:4000/auth/register', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, email, password, nick }) })
      .then(async (r) => { if (!r.ok) throw new Error((await r.json()).error || 'Register failed'); return r.json(); })
      .then(() => { alert('Đăng ký thành công. Mời bạn đăng nhập.'); location.hash = '#login'; })
      .catch((err) => alert(err.message));
  });
}

