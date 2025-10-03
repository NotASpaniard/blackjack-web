const STORAGE_KEY = 'blackjack_bankroll_v1';

const SUITS = ['♠', '♥', '♦', '♣'];
const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

const els = {
  bankroll: () => document.getElementById('bankroll'),
  betInput: () => document.getElementById('bet-amount'),
  betChips: () => document.querySelectorAll('.btn--chip'),
  dealBtn: () => document.getElementById('deal-btn'),
  hitBtn: () => document.getElementById('hit-btn'),
  standBtn: () => document.getElementById('stand-btn'),
  doubleBtn: () => document.getElementById('double-btn'),
  newRoundBtn: () => document.getElementById('newround-btn'),
  dealerCards: () => document.getElementById('dealer-cards'),
  playerCards: () => document.getElementById('player-cards'),
  dealerScore: () => document.getElementById('dealer-score'),
  playerScore: () => document.getElementById('player-score'),
  message: () => document.getElementById('message-text'),
};

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

function createShuffledDeck() {
  const deck = [];
  for (const suit of SUITS) for (const rank of RANKS) deck.push({ rank, suit });
  for (let i = deck.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [deck[i], deck[j]] = [deck[j], deck[i]]; }
  return deck;
}
function getCardValue(rank) { if (rank === 'A') return 11; if (['K','Q','J'].includes(rank)) return 10; return Number(rank); }
function calculateHandScore(cards) {
  let total = 0, ace = 0; for (const c of cards) { total += getCardValue(c.rank); if (c.rank === 'A') ace++; }
  while (total > 21 && ace > 0) { total -= 10; ace--; } return total;
}
function isBlackjack(cards) { return cards.length === 2 && calculateHandScore(cards) === 21; }
function dealCard(to) { if (game.deck.length === 0) game.deck = createShuffledDeck(); to.push(game.deck.pop()); }

function loadBankroll() { try { const v = localStorage.getItem(STORAGE_KEY); if (v) game.bankroll = Math.max(0, Number(v)||0); } catch {} updateHUD(); }
function saveBankroll() { try { localStorage.setItem(STORAGE_KEY, String(game.bankroll)); } catch {} }

function setMessage(text) { const m = els.message(); if (m) m.textContent = text || ''; }
function renderCard(card, hidden) {
  const div = document.createElement('div');
  div.className = 'card' + (hidden ? ' card--hidden' : '') + ((card.suit === '♥' || card.suit === '♦') ? ' card--red' : '');
  if (hidden) return div;
  const top = document.createElement('div'); top.className = 'card__rank'; top.textContent = card.rank;
  const mid = document.createElement('div'); mid.className = 'card__suit'; mid.textContent = card.suit;
  const bot = document.createElement('div'); bot.className = 'card__rank card__rank--bottom'; bot.textContent = card.rank;
  div.appendChild(top); div.appendChild(mid); div.appendChild(bot); return div;
}

function isRoundOver() {
  const playerBust = calculateHandScore(game.player) > 21;
  const dealerBust = calculateHandScore(game.dealer) > 21;
  if (playerBust || dealerBust) return true;
  if (!game.dealerHidden && game.playerStood) return true;
  if (game.player.length === 2 && game.dealer.length === 2 && !game.dealerHidden) {
    if (isBlackjack(game.player) || isBlackjack(game.dealer)) return true;
  }
  return false;
}

function settleRound() {
  const playerScore = calculateHandScore(game.player);
  const dealerScore = calculateHandScore(game.dealer);
  let outcome = 'push';
  const playerBJ = isBlackjack(game.player); const dealerBJ = isBlackjack(game.dealer);
  if (playerBJ && dealerBJ) outcome = 'push';
  else if (playerBJ) outcome = 'player_bj';
  else if (dealerBJ) outcome = 'dealer_bj';
  else if (playerScore > 21) outcome = 'dealer';
  else if (dealerScore > 21) outcome = 'player';
  else if (playerScore > dealerScore) outcome = 'player';
  else if (playerScore < dealerScore) outcome = 'dealer';
  let payout = 0; if (outcome === 'player_bj') payout = Math.floor(game.bet * 1.5); else if (outcome === 'player') payout = game.bet; else if (outcome === 'dealer' || outcome === 'dealer_bj') payout = -game.bet;
  if (game.playerDoubled) payout *= 2; game.bankroll += payout; saveBankroll();
  const map = { push: 'Hòa!', player: 'Bạn thắng!', dealer: 'Nhà cái thắng!', player_bj: 'Blackjack! Bạn thắng 3:2', dealer_bj: 'Nhà cái Blackjack!' };
  setMessage(`${map[outcome]} (±${payout >= 0 ? '+' : ''}${payout})`);
}

function updateHUD() {
  const bank = els.bankroll(); const bet = els.betInput(); const hit = els.hitBtn(); const stand = els.standBtn(); const dbl = els.doubleBtn(); const nr = els.newRoundBtn();
  if (!bank || !bet) return;
  bank.textContent = `${game.bankroll}`; bet.value = String(game.bet);
  const canAct = game.inRound && !isRoundOver(); if (hit) hit.disabled = !canAct; if (stand) stand.disabled = !canAct; if (dbl) dbl.disabled = !(game.inRound && game.player.length === 2 && game.bankroll >= game.bet && !game.playerDoubled); if (nr) nr.disabled = !(game.inRound && isRoundOver());
}

function renderHands() {
  const dC = els.dealerCards(); const pC = els.playerCards(); const dS = els.dealerScore(); const pS = els.playerScore();
  if (!dC || !pC) return;
  dC.innerHTML = ''; game.dealer.forEach((c, idx) => dC.appendChild(renderCard(c, game.dealerHidden && idx === 0)));
  pC.innerHTML = ''; game.player.forEach((c) => pC.appendChild(renderCard(c, false)));
  if (pS) pS.textContent = `(${calculateHandScore(game.player)})`;
  if (dS) dS.textContent = game.dealerHidden ? '' : `(${calculateHandScore(game.dealer)})`;
}

function startRound() {
  if (game.inRound) return;
  const bet = Math.max(1, Math.floor(Number(els.betInput().value) || game.bet));
  if (bet > game.bankroll) { setMessage('Không đủ ngân quỹ để cược.'); return; }
  game.bet = bet; game.inRound = true; game.playerStood = false; game.dealerHidden = true; game.playerDoubled = false; game.player = []; game.dealer = []; setMessage('');
  if (game.deck.length < 15) game.deck = createShuffledDeck();
  dealCard(game.player); dealCard(game.dealer); dealCard(game.player); dealCard(game.dealer);
  const playerBJ = isBlackjack(game.player); const dealerBJ = isBlackjack(game.dealer);
  if (playerBJ || dealerBJ) { game.dealerHidden = false; renderHands(); settleRound(); }
  renderHands(); updateHUD();
}
function playerHit() { if (!game.inRound || isRoundOver()) return; dealCard(game.player); renderHands(); if (calculateHandScore(game.player) > 21) { game.dealerHidden = false; renderHands(); } updateHUD(); if (isRoundOver()) { settleRound(); updateHUD(); } }
function playerStand() { if (!game.inRound || isRoundOver()) return; game.playerStood = true; game.dealerHidden = false; while (calculateHandScore(game.dealer) < 17) dealCard(game.dealer); renderHands(); settleRound(); updateHUD(); }
function playerDouble() { if (!game.inRound || game.player.length !== 2 || game.playerDoubled) return; if (game.bet > game.bankroll) return; game.playerDoubled = true; dealCard(game.player); game.dealerHidden = false; while (calculateHandScore(game.dealer) < 17) dealCard(game.dealer); renderHands(); settleRound(); updateHUD(); }
function newRound() { if (!game.inRound) return; game.inRound = false; game.player = []; game.dealer = []; game.playerStood = false; game.dealerHidden = true; game.playerDoubled = false; setMessage(''); renderHands(); updateHUD(); }

function setupEvents() {
  const d = els.dealBtn(); const h = els.hitBtn(); const s = els.standBtn(); const dbl = els.doubleBtn(); const nr = els.newRoundBtn();
  if (d) d.addEventListener('click', startRound);
  if (h) h.addEventListener('click', playerHit);
  if (s) s.addEventListener('click', playerStand);
  if (dbl) dbl.addEventListener('click', playerDouble);
  if (nr) nr.addEventListener('click', newRound);
  els.betChips().forEach((btn) => btn.addEventListener('click', () => {
    const delta = Number(btn.dataset.change); const next = Math.max(1, Math.floor(Number(els.betInput().value || 0) + delta)); els.betInput().value = String(next);
  }));
  const bi = els.betInput(); if (bi) bi.addEventListener('change', () => { const val = Math.max(1, Math.floor(Number(els.betInput().value) || 1)); els.betInput().value = String(val); game.bet = val; });
}

export function initGame() {
  if (!document.getElementById('deal-btn')) return;
  setupEvents();
  loadBankroll();
  renderHands();
  updateHUD();
}


