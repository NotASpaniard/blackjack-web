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

const STORAGE_KEY = "blackjack_bankroll_v1";

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

function saveBankroll() {
  try { localStorage.setItem(STORAGE_KEY, String(game.bankroll)); } catch (e) { /* ignore */ }
}

function updateHUD() {
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
  els.dealBtn.addEventListener("click", startRound);
  els.hitBtn.addEventListener("click", playerHit);
  els.standBtn.addEventListener("click", playerStand);
  els.doubleBtn.addEventListener("click", playerDouble);
  els.newRoundBtn.addEventListener("click", newRound);
  els.betChips.forEach((btn) => {
    btn.addEventListener("click", () => {
      const delta = Number(btn.dataset.change);
      const next = Math.max(1, Math.floor(Number(els.betInput.value || 0) + delta));
      els.betInput.value = String(next);
    });
  });
  els.betInput.addEventListener("change", () => {
    const val = Math.max(1, Math.floor(Number(els.betInput.value) || 1));
    els.betInput.value = String(val);
    game.bet = val;
  });
}

// Initialization
setupEvents();
loadBankroll();
renderHands();
updateHUD();


