import { getUser, setUser, setAuthUI } from './auth.js';

export function initAccount() {
  const form = document.getElementById('account-form');
  if (!form) return;
  const user = getUser() || {};
  const name = document.getElementById('profile-name');
  const email = document.getElementById('profile-email');
  const nick = document.getElementById('profile-nick');
  if (name) name.value = user.name || '';
  if (email) email.value = user.email || '';
  if (nick) nick.value = user.nick || '';
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    setUser({ name: name.value.trim(), email: email.value.trim(), nick: nick.value.trim() });
    setAuthUI();
    alert('Đã lưu thông tin tài khoản.');
  });
}

