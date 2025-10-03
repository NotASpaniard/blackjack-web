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
  setUser(null);
  location.href = './auth.html#login';
}

export function guardPage(role) {
  if (role === 'admin') {
    if (!isAdmin()) { location.href = './auth.html#login'; }
  } else if (role === 'user') {
    if (!isLoggedIn()) { location.href = './auth.html#login'; }
  }
}

export function initAuthSplit() {
  const split = document.getElementById('authsplit');
  if (!split) return;
  const setMode = (mode) => {
    split.classList.toggle('authsplit--login', mode === 'login');
    split.classList.toggle('authsplit--register', mode === 'register');
  };
  const applyHash = () => {
    const hash = (location.hash || '#login').slice(1);
    setMode(hash === 'register' ? 'register' : 'login');
  };
  window.addEventListener('hashchange', applyHash);
  applyHash();
  const showRegister = document.getElementById('show-register');
  const showLogin = document.getElementById('show-login');
  if (showRegister) showRegister.addEventListener('click', () => { location.hash = '#register'; });
  if (showLogin) showLogin.addEventListener('click', () => { location.hash = '#login'; });
  const paneLogin = split.querySelector('.pane--login');
  const paneRegister = split.querySelector('.pane--register');
  const isInteractive = (el) => el.closest('form') || el.closest('button') || el.closest('input') || el.closest('a');
  if (paneLogin) paneLogin.addEventListener('click', (e) => { if (!isInteractive(e.target)) location.hash = '#login'; });
  if (paneRegister) paneRegister.addEventListener('click', (e) => { if (!isInteractive(e.target)) location.hash = '#register'; });
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
    if (id === 'admin' && password === '123') {
      setUser({ email: 'admin@example.com', name: 'admin', nick: 'Admin' });
      location.href = './index.html';
      return;
    }
    alert('Sai tài khoản hoặc mật khẩu. Dùng admin/123.');
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
    alert('Đăng ký thành công. Mời bạn đăng nhập.');
    location.hash = '#login';
  });
}


