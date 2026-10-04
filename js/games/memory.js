import { Speech } from "../speech.js";
import { Audio } from "../audio.js";

const SYMBOLS = ["🐰", "🍎", "🦊", "🌸", "🍄", "🐿️", "🦔", "🦋", "🌳", "⭐", "🐻", "🐝"];

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const PAIR_COUNTS = [2, 3, 4]; // 4, 6, 8 cards

let level = 0;
let onComplete = null;
let area = null;
let busy = false;
let flipped = [];
let matched = 0;
let totalPairs = 0;
let revealing = false;

function colsFor(pairs) {
  if (pairs <= 2) return 2;
  if (pairs <= 3) return 3;
  return 4;
}

function startLevel() {
  const pairs = PAIR_COUNTS[Math.min(level, PAIR_COUNTS.length - 1)];
  totalPairs = pairs;
  matched = 0;
  flipped = [];
  busy = false;

  const chosen = shuffle(SYMBOLS).slice(0, pairs);
  const cards = shuffle([...chosen, ...chosen]);

  document.getElementById("game-character").textContent = "🦉";
  document.getElementById("game-instruction").textContent = "Найди одинаковые картинки!";

  area.innerHTML = "";
  area.style.position = "relative";

  const grid = document.createElement("div");
  grid.className = `memory-grid memory-grid--${colsFor(pairs)}`;

  cards.forEach((symbol, idx) => {
    const card = document.createElement("button");
    card.className = "memory-card";
    card.dataset.symbol = symbol;
    card.dataset.idx = String(idx);
    card.innerHTML = `
      <span class="memory-card__back">❓</span>
      <span class="memory-card__face">${symbol}</span>
    `;
    card.addEventListener("click", () => onCardClick(card));
    grid.appendChild(card);
  });

  area.appendChild(grid);

  // Preview phase
  revealing = true;
  grid.querySelectorAll(".memory-card").forEach((c) => c.classList.add("memory-card--flipped"));
  Speech.say("Запомни картинки!");

  setTimeout(() => {
    grid.querySelectorAll(".memory-card").forEach((c) => {
      if (!c.classList.contains("memory-card--matched")) {
        c.classList.remove("memory-card--flipped");
      }
    });
    revealing = false;
    Speech.say("Найди одинаковые картинки!");
  }, 2500);
}

async function onCardClick(card) {
  if (busy || revealing) return;
  if (card.classList.contains("memory-card--flipped") || card.classList.contains("memory-card--matched")) return;
  if (flipped.length >= 2) return;

  Audio.click();
  card.classList.add("memory-card--flipped");
  flipped.push(card);

  if (flipped.length < 2) return;

  busy = true;
  const [a, b] = flipped;

  if (a.dataset.symbol === b.dataset.symbol) {
    a.classList.add("memory-card--matched", "bounce");
    b.classList.add("memory-card--matched", "bounce");
    Audio.correct();
    matched++;
    flipped = [];
    busy = false;

    if (matched >= totalPairs) {
      await Speech.say("Ура! Ты всё нашёл!");
      level++;
      if (level >= PAIR_COUNTS.length) {
        setTimeout(() => onComplete?.(), 400);
      } else {
        setTimeout(() => startLevel(), 700);
      }
    }
  } else {
    Audio.wrong();
    await Speech.say("Попробуй ещё раз.");
    setTimeout(() => {
      a.classList.remove("memory-card--flipped");
      b.classList.remove("memory-card--flipped");
      flipped = [];
      busy = false;
    }, 600);
  }
}

export const MemoryGame = {
  start(gameArea, completeCb) {
    area = gameArea;
    onComplete = completeCb;
    level = 0;
    startLevel();
  },

  help() {
    Speech.say("Найди две одинаковые картинки.");
  },

  destroy() {
    busy = true;
    if (area) area.innerHTML = "";
  },
};
