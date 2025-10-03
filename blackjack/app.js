"use strict";

// Simple Blackjack core with single deck, player vs dealer

const SUITS = ["♠", "♥", "♦", "♣"];
const RANKS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];

function createShuffledDeck() {
  const deck = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ rank, suit });
    }
  }
  // Fisher-Yates shuffle
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

function getCardValue(rank) {
  if (rank === "A") return 11; // can be 1 later via adjust
  if (["K", "Q", "J"].includes(rank)) return 10;
  return Number(rank);
}

function calculateHandScore(cards) {
  let total = 0;
  let aceCount = 0;
  for (const c of cards) {
    total += getCardValue(c.rank);
    if (c.rank === "A") aceCount++;
  }
  while (total > 21 && aceCount > 0) {
    total -= 10; // convert an Ace from 11 to 1
    aceCount--;
  }
  return total;
}

function isBlackjack(cards) {
  return cards.length === 2 && calculateHandScore(cards) === 21;
}

const els = {
  bankroll: document.getElementById("bankroll"),
  betInput: document.getElementById("bet-amount"),
  betChips: document.querySelectorAll(".btn--chip"),
  sidebar: document.getElementById("sidebar"),
  sidebarToggle: document.getElementById("sidebar-toggle"),
  dealBtn: document.getElementById("deal-btn"),
  hitBtn: document.getElementById("hit-btn"),
  standBtn: document.getElementById("stand-btn"),
  doubleBtn: document.getElementById("double-btn"),
  newRoundBtn: document.getElementById("newround-btn"),
  dealerCards: document.getElementById("dealer-cards"),
  playerCards: document.getElementById("player-cards"),
  dealerScore: document.getElementById("dealer-score"),
  playerScore: document.getElementById("player-score"),
  message: document.getElementById("message-text"),
};

const IS_GAME = Boolean(
  els.dealBtn && els.hitBtn && els.standBtn && els.doubleBtn && els.newRoundBtn &&
  els.dealerCards && els.playerCards && els.bankroll && els.betInput
);

const STORAGE_KEY = "blackjack_bankroll_v1";
const STORAGE_SIDEBAR = "blackjack_sidebar_open_v1";
const STORAGE_USER = "blackjack_user_v1";
const STORAGE_HISTORY = "blackjack_tx_history_v1";
const STORAGE_TICKETS = "blackjack_tickets_v1";

const game = {
  deck: [],
  player: [],
  dealer: [],
  bankroll: 100,
  bet: 10,
  inRound: false,
  playerStood: false,
  dealerHidden: true,
  playerDoubled: false,
};

function loadBankroll() {
  try {
    const val = localStorage.getItem(STORAGE_KEY);
    if (val) game.bankroll = Math.max(0, Number(val) || 0);
  } catch (e) {
    // ignore
  }
  updateHUD();
}

function loadSidebarState() {
  try {
    const val = localStorage.getItem(STORAGE_SIDEBAR);
    const open = val !== "false"; // default open
    setSidebarOpen(open);
  } catch (e) { setSidebarOpen(true); }
}

function saveSidebarState(open) {
  try { localStorage.setItem(STORAGE_SIDEBAR, String(open)); } catch (e) { /* ignore */ }
}

function setSidebarOpen(open) {
  if (!els.sidebar) return;
  if (open) {
    els.sidebar.classList.remove("sidebar--collapsed");
    els.sidebarToggle && els.sidebarToggle.setAttribute("aria-expanded", "true");
  } else {
    els.sidebar.classList.add("sidebar--collapsed");
    els.sidebarToggle && els.sidebarToggle.setAttribute("aria-expanded", "false");
  }
}

// Auth/session helpers
function getUser() {
  try { const raw = localStorage.getItem(STORAGE_USER); return raw ? JSON.parse(raw) : null; } catch { return null; }
}
function setUser(user) {
  try { if (user) localStorage.setItem(STORAGE_USER, JSON.stringify(user)); else localStorage.removeItem(STORAGE_USER); } catch {}
}
function isLoggedIn() { return !!getUser(); }
function setAuthUI() {
  const loginLink = document.getElementById("login-link");
  const registerLink = document.getElementById("register-link");
  const logoutLink = document.getElementById("logout-link");
  const username = document.getElementById("username");
  const avatar = document.getElementById("avatar");
  const ctaPlay = document.getElementById("cta-play");
  const user = getUser();
  const logged = !!user;
  if (loginLink) loginLink.style.display = logged ? "none" : "block";
  if (registerLink) registerLink.style.display = logged ? "none" : "block";
  if (logoutLink) logoutLink.style.display = logged ? "block" : "none";
  if (username) username.textContent = logged ? (user.nick || user.name || user.email) : "Khách";
  if (avatar) {
    const text = (logged ? (user.nick || user.name || user.email || "?") : "ND").trim();
    avatar.textContent = text.slice(0, 2).toUpperCase();
  }
  if (logoutLink) {
    logoutLink.onclick = () => { setUser(null); setAuthUI(); };
  }
  if (ctaPlay) {
    ctaPlay.style.display = logged ? 'block' : 'none';
    ctaPlay.onclick = () => { location.href = './index.html'; };
  }
}

// Page initializers
function initLoginPage() {
  const split = document.getElementById("authsplit");
  if (split) {
    // hash control
    const setMode = (mode) => {
      split.classList.toggle("authsplit--login", mode === 'login');
      split.classList.toggle("authsplit--register", mode === 'register');
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
  }
  const form = document.getElementById("login-form") || document.getElementById("auth-login-form");
  if (!form) return;
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const idEl = document.getElementById("auth-login-id") || document.getElementById("login-email");
    const passEl = document.getElementById("auth-login-password") || document.getElementById("login-password");
    const id = (idEl ? idEl.value : "").trim();
    const password = passEl ? passEl.value : "";
    if (!id || !password) return;
    // hardcoded admin/123
    if (id === 'admin' && password === '123') {
      setUser({ email: 'admin@example.com', name: 'admin', nick: 'Admin' });
      location.href = "./index.html";
      return;
    }
    alert('Sai tài khoản hoặc mật khẩu. Dùng admin/123.');
  });
}

function initRegisterPage() {
  const form = document.getElementById("register-form") || document.getElementById("auth-register-form");
  if (!form) return;
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const nameEl = document.getElementById("auth-register-name") || document.getElementById("register-name");
    const emailEl = document.getElementById("auth-register-email") || document.getElementById("register-email");
    const passEl = document.getElementById("auth-register-password") || document.getElementById("register-password");
    const nickEl = document.getElementById("auth-register-nick") || document.getElementById("register-nick");
    const name = nameEl ? nameEl.value.trim() : "";
    const email = emailEl ? emailEl.value.trim() : "";
    const password = passEl ? passEl.value : "";
    const nick = nickEl ? nickEl.value.trim() : "";
    if (!name || !email || !password) return;
    // For now, do not auto-login; redirect to login view
    alert('Đăng ký thành công. Mời bạn đăng nhập.');
    if (location.pathname.endsWith('auth.html')) {
      location.hash = '#login';
    } else {
      location.href = './auth.html#login';
    }
  });
}

function initAccountPage() {
  const form = document.getElementById("account-form");
  if (!form) return;
  const user = getUser() || {};
  const name = document.getElementById("profile-name");
  const email = document.getElementById("profile-email");
  const nick = document.getElementById("profile-nick");
  name.value = user.name || "";
  email.value = user.email || "";
  nick.value = user.nick || "";
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    setUser({ name: name.value.trim(), email: email.value.trim(), nick: nick.value.trim() });
    setAuthUI();
    alert("Đã lưu thông tin tài khoản.");
  });
}

function readHistory() { try { return JSON.parse(localStorage.getItem(STORAGE_HISTORY) || "[]"); } catch { return []; } }
function writeHistory(items) { try { localStorage.setItem(STORAGE_HISTORY, JSON.stringify(items)); } catch {} }
function addHistory(type, amount) { const items = readHistory(); items.unshift({ id: Date.now(), type, amount, ts: new Date().toISOString() }); writeHistory(items); }

function initBalancePage() {
  const amountEl = document.getElementById("balance-amount");
  if (!amountEl) return;
  amountEl.textContent = String(game.bankroll);
  const input = document.getElementById("balance-value");
  const hist = document.getElementById("balance-history");
  function renderHist() {
    const items = readHistory();
    hist.innerHTML = items.map(it => `<li>[${new Date(it.ts).toLocaleString()}] ${it.type === 'deposit' ? '+' : '-'}${it.amount}</li>`).join("");
  }
  const deposit = document.getElementById("deposit-btn");
  const withdraw = document.getElementById("withdraw-btn");
  if (deposit) deposit.addEventListener("click", () => {
    const val = Math.max(1, Math.floor(Number(input.value) || 0));
    game.bankroll += val;
    saveBankroll();
    amountEl.textContent = String(game.bankroll);
    addHistory('deposit', val);
    renderHist();
  });
  if (withdraw) withdraw.addEventListener("click", () => {
    const val = Math.max(1, Math.floor(Number(input.value) || 0));
    game.bankroll = Math.max(0, game.bankroll - val);
    saveBankroll();
    amountEl.textContent = String(game.bankroll);
    addHistory('withdraw', val);
    renderHist();
  });
  renderHist();
}

function readTickets() { try { return JSON.parse(localStorage.getItem(STORAGE_TICKETS) || "[]"); } catch { return []; } }
function writeTickets(items) { try { localStorage.setItem(STORAGE_TICKETS, JSON.stringify(items)); } catch {} }

function initContactPage() {
  const form = document.getElementById("ticket-form");
  if (!form) return;
  const subject = document.getElementById("ticket-subject");
  const content = document.getElementById("ticket-content");
  const list = document.getElementById("ticket-history");
  function renderTickets() {
    const items = readTickets();
    list.innerHTML = items.map(it => `<li>[${new Date(it.ts).toLocaleString()}] ${it.subject}</li>`).join("");
  }
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const s = subject.value.trim(); const c = content.value.trim();
    if (!s || !c) return;
    const items = readTickets();
    items.unshift({ id: Date.now(), subject: s, content: c, ts: new Date().toISOString() });
    writeTickets(items);
    subject.value = ""; content.value = "";
    renderTickets();
  });
  renderTickets();
}

function saveBankroll() {
  try { localStorage.setItem(STORAGE_KEY, String(game.bankroll)); } catch (e) { /* ignore */ }
}

function updateHUD() {
  if (!IS_GAME) return;
  els.bankroll.textContent = `${game.bankroll}`;
  els.betInput.value = String(game.bet);
  const canAct = game.inRound && !isRoundOver();
  els.hitBtn.disabled = !canAct;
  els.standBtn.disabled = !canAct;
  els.doubleBtn.disabled = !(game.inRound && game.player.length === 2 && game.bankroll >= game.bet && !game.playerDoubled);
  els.newRoundBtn.disabled = !(game.inRound && isRoundOver());
}

function setMessage(text) {
  els.message.textContent = text || "";
}

function renderHands() {
  if (!IS_GAME) return;
  // Dealer
  els.dealerCards.innerHTML = "";
  game.dealer.forEach((c, idx) => {
    const hidden = game.dealerHidden && idx === 0;
    els.dealerCards.appendChild(renderCard(c, hidden));
  });
  // Player
  els.playerCards.innerHTML = "";
  game.player.forEach((c) => {
    els.playerCards.appendChild(renderCard(c, false));
  });

  // Scores
  els.playerScore.textContent = `(${calculateHandScore(game.player)})`;
  const dealerScore = game.dealerHidden ? "" : `(${calculateHandScore(game.dealer)})`;
  els.dealerScore.textContent = dealerScore;
}

function renderCard(card, hidden) {
  const div = document.createElement("div");
  div.className = "card" + (hidden ? " card--hidden" : "") + (card.suit === "♥" || card.suit === "♦" ? " card--red" : "");
  if (hidden) {
    // back only
    div.innerHTML = "";
    return div;
  }
  const top = document.createElement("div");
  top.className = "card__rank";
  top.textContent = card.rank;

  const mid = document.createElement("div");
  mid.className = "card__suit";
  mid.textContent = card.suit;

  const bot = document.createElement("div");
  bot.className = "card__rank card__rank--bottom";
  bot.textContent = card.rank;

  div.appendChild(top);
  div.appendChild(mid);
  div.appendChild(bot);
  return div;
}

function dealCard(to) {
  if (game.deck.length === 0) game.deck = createShuffledDeck();
  const card = game.deck.pop();
  to.push(card);
}

function isRoundOver() {
  const playerBust = calculateHandScore(game.player) > 21;
  const dealerBust = calculateHandScore(game.dealer) > 21;
  if (playerBust || dealerBust) return true;
  if (!game.dealerHidden && game.playerStood) {
    return true;
  }
  // Blackjack auto-resolve
  if (game.player.length === 2 && game.dealer.length === 2 && !game.dealerHidden) {
    if (isBlackjack(game.player) || isBlackjack(game.dealer)) return true;
  }
  return false;
}

function settleRound() {
  const playerScore = calculateHandScore(game.player);
  const dealerScore = calculateHandScore(game.dealer);

  let outcome = "push"; // tie
  // natural blackjack handling
  const playerBJ = isBlackjack(game.player);
  const dealerBJ = isBlackjack(game.dealer);
  if (playerBJ && dealerBJ) outcome = "push";
  else if (playerBJ) outcome = "player_bj";
  else if (dealerBJ) outcome = "dealer_bj";
  else if (playerScore > 21) outcome = "dealer";
  else if (dealerScore > 21) outcome = "player";
  else if (playerScore > dealerScore) outcome = "player";
  else if (playerScore < dealerScore) outcome = "dealer";

  let payout = 0;
  if (outcome === "player_bj") payout = Math.floor(game.bet * 1.5);
  else if (outcome === "player") payout = game.bet;
  else if (outcome === "dealer" || outcome === "dealer_bj") payout = -game.bet;
  else payout = 0;
  if (game.playerDoubled) payout *= 2;

  game.bankroll += payout;
  saveBankroll();

  // message
  const map = {
    push: "Hòa!",
    player: "Bạn thắng!",
    dealer: "Nhà cái thắng!",
    player_bj: "Blackjack! Bạn thắng 3:2",
    dealer_bj: "Nhà cái Blackjack!",
  };
  setMessage(`${map[outcome]} (±${payout >= 0 ? "+" : ""}${payout})`);
}

function startRound() {
  if (game.inRound) return;
  const bet = Math.max(1, Math.floor(Number(els.betInput.value) || game.bet));
  if (bet > game.bankroll) {
    setMessage("Không đủ ngân quỹ để cược.");
    return;
  }
  game.bet = bet;
  game.inRound = true;
  game.playerStood = false;
  game.dealerHidden = true;
  game.playerDoubled = false;
  game.player = [];
  game.dealer = [];
  setMessage("");

  if (game.deck.length < 15) game.deck = createShuffledDeck();
  // initial deal: player, dealer(hidden), player, dealer
  dealCard(game.player);
  dealCard(game.dealer);
  dealCard(game.player);
  dealCard(game.dealer);

  // Auto check for naturals
  const playerBJ = isBlackjack(game.player);
  const dealerBJ = isBlackjack(game.dealer);
  if (playerBJ || dealerBJ) {
    game.dealerHidden = false;
    renderHands();
    settleRound();
  }

  renderHands();
  updateHUD();
}

function playerHit() {
  if (!game.inRound || isRoundOver()) return;
  dealCard(game.player);
  renderHands();
  if (calculateHandScore(game.player) > 21) {
    game.dealerHidden = false;
    renderHands();
  }
  updateHUD();
  if (isRoundOver()) {
    settleRound();
    updateHUD();
  }
}

function playerStand() {
  if (!game.inRound || isRoundOver()) return;
  game.playerStood = true;
  game.dealerHidden = false;
  // Dealer draws to 17 soft
  while (calculateHandScore(game.dealer) < 17) {
    dealCard(game.dealer);
  }
  renderHands();
  settleRound();
  updateHUD();
}

function playerDouble() {
  if (!game.inRound || game.player.length !== 2 || game.playerDoubled) return;
  const added = game.bet; // double bet
  if (game.bet + added > game.bankroll) return;
  game.playerDoubled = true;
  // Take one card and stand automatically
  dealCard(game.player);
  game.dealerHidden = false;
  while (calculateHandScore(game.dealer) < 17) {
    dealCard(game.dealer);
  }
  renderHands();
  settleRound();
  updateHUD();
}

function newRound() {
  if (!game.inRound) return;
  game.inRound = false;
  game.player = [];
  game.dealer = [];
  game.playerStood = false;
  game.dealerHidden = true;
  game.playerDoubled = false;
  setMessage("");
  renderHands();
  updateHUD();
}

function setupEvents() {
  if (els.dealBtn) els.dealBtn.addEventListener("click", startRound);
  if (els.hitBtn) els.hitBtn.addEventListener("click", playerHit);
  if (els.standBtn) els.standBtn.addEventListener("click", playerStand);
  if (els.doubleBtn) els.doubleBtn.addEventListener("click", playerDouble);
  if (els.newRoundBtn) els.newRoundBtn.addEventListener("click", newRound);
  if (els.sidebarToggle) {
    els.sidebarToggle.addEventListener("click", () => {
      const isCollapsed = els.sidebar.classList.toggle("sidebar--collapsed");
      saveSidebarState(!isCollapsed);
    });
  }
  els.betChips.forEach((btn) => {
    btn.addEventListener("click", () => {
      if (!IS_GAME) return;
      const delta = Number(btn.dataset.change);
      const next = Math.max(1, Math.floor(Number(els.betInput.value || 0) + delta));
      els.betInput.value = String(next);
    });
  });
  if (els.betInput) {
    els.betInput.addEventListener("change", () => {
      if (!IS_GAME) return;
      const val = Math.max(1, Math.floor(Number(els.betInput.value) || 1));
      els.betInput.value = String(val);
      game.bet = val;
    });
  }
}

// Initialization
setupEvents();
loadSidebarState();
setAuthUI();
if (IS_GAME) {
  loadBankroll();
  renderHands();
  updateHUD();
}
initLoginPage();
initRegisterPage();

