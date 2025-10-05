import { initAuthSplit, handleLoginSubmit, handleRegisterSubmit, setAuthUI, isLoggedIn, isAdmin, logoutAndRedirect, guardPage } from './modules/auth.js';
import { initGame } from './modules/game.js';
import { initAccount } from './modules/account.js';
import { initBalance, initTopup } from './modules/balance.js';
import { initContact } from './modules/contact.js';

// Global boot
document.addEventListener('DOMContentLoaded', () => {
  setAuthUI();

  // Route guards
  const path = location.pathname;
  if (path.endsWith('index.html') || path.endsWith('/') || path.endsWith('/blackjack') || path.endsWith('/blackjack/')) {
    guardPage('user');
    initGame();
  } else if (path.endsWith('account.html') || path.endsWith('balance.html') || path.endsWith('contact.html') || path.endsWith('help.html')) {
    guardPage('user');
  } else if (path.endsWith('topup.html')) {
    guardPage('user');
  } else if (path.endsWith('admin.html')) {
    guardPage('admin');
  } else if (path.endsWith('auth.html')) {
    // no guard
  }

  // Page initializers
  initAuthSplit();
  handleLoginSubmit();
  handleRegisterSubmit();
  initAccount();
  initBalance();
  initTopup();
  initContact();

  const logoutLink = document.getElementById('logout-link');
  if (logoutLink) logoutLink.addEventListener('click', logoutAndRedirect);

  const ctaPlay = document.getElementById('cta-play');
  if (ctaPlay) ctaPlay.addEventListener('click', () => { location.href = './index.html'; });
});

