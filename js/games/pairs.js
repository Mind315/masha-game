import { Speech } from "../speech.js";
import { Audio } from "../audio.js";

const ANIMALS = [
  { id: "cat", name: "котик", pair: "котиков", img: "assets/pairs/cat.jpg" },
  { id: "dog", name: "собачка", pair: "собачек", img: "assets/pairs/dog.jpg" },
  { id: "fox", name: "лисичка", pair: "лисичек", img: "assets/pairs/fox.jpg" },
  { id: "lion", name: "лев", pair: "львов", img: "assets/pairs/lion.jpg" },
  { id: "tiger", name: "тигр", pair: "тигров", img: "assets/pairs/tiger.jpg" },
  { id: "bear", name: "мишка", pair: "мишек", img: "assets/pairs/bear.jpg" },
  { id: "elephant", name: "слон", pair: "слонов", img: "assets/pairs/elephant.jpg" },
  { id: "giraffe", name: "жираф", pair: "жирафов", img: "assets/pairs/giraffe.jpg" },
  { id: "monkey", name: "обезьянка", pair: "обезьянок", img: "assets/pairs/monkey.jpg" },
  { id: "horse", name: "лошадка", pair: "лошадок", img: "assets/pairs/horse.jpg" },
  { id: "sheep", name: "овечка", pair: "овечек", img: "assets/pairs/sheep.jpg" },
  { id: "pig", name: "поросёнок", pair: "поросят", img: "assets/pairs/pig.jpg" },
  { id: "penguin", name: "пингвин", pair: "пингвинов", img: "assets/pairs/penguin.jpg" },
];

const ROUNDS_NEEDED = 3;
const PAIRS_PER_ROUND = 5;

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

let round = 0;
let pairsLeft = 0;
let selected = [];
let busy = false;
let onComplete = null;
let area = null;
let usedAnimalIds = new Set();
let currentAnimals = [];

function pickAnimalsForRound() {
  let pool = ANIMALS.filter((a) => !usedAnimalIds.has(a.id));
  if (pool.length < PAIRS_PER_ROUND) {
    usedAnimalIds.clear();
    pool = [...ANIMALS];
  }
  const chosen = shuffle(pool).slice(0, PAIRS_PER_ROUND);
  chosen.forEach((a) => usedAnimalIds.add(a.id));
  return chosen;
}

function startRound() {
  busy = false;
  selected = [];
  pairsLeft = PAIRS_PER_ROUND;
  currentAnimals = pickAnimalsForRound();

  const cards = shuffle([...currentAnimals, ...currentAnimals]);

  document.getElementById("game-character").textContent = "🐰";
  document.getElementById("game-instruction").textContent =
    "Найди одинаковые пары животных!";

  area.innerHTML = "";
  area.style.position = "relative";

  const wrap = document.createElement("div");
  wrap.className = "pairs-layout";

  const meta = document.createElement("p");
  meta.className = "pairs-meta";
  meta.innerHTML = `Раунд ${round + 1} из ${ROUNDS_NEEDED} · пар осталось: <span class="pairs-left">${pairsLeft}</span>`;
  wrap.appendChild(meta);

  const grid = document.createElement("div");
  grid.className = "pairs-grid";

  cards.forEach((animal, idx) => {
    const btn = document.createElement("button");
    btn.className = "pairs-card";
    btn.dataset.id = animal.id;
    btn.dataset.idx = String(idx);
    btn.setAttribute("aria-label", animal.name);
    btn.innerHTML = `<img src="${animal.img}" alt="${animal.name}" class="pairs-card__img" draggable="false" />`;
    btn.addEventListener("click", () => onCardClick(btn, animal));
    grid.appendChild(btn);
  });

  wrap.appendChild(grid);
  area.appendChild(wrap);

  Speech.say("Найди одинаковые пары животных!");
}

function updateMeta() {
  const el = area.querySelector(".pairs-left");
  if (el) el.textContent = String(pairsLeft);
}

function clearSelection() {
  selected.forEach((btn) => btn.classList.remove("pairs-card--selected"));
  selected = [];
}

function onCardClick(btn, animal) {
  if (busy) return;
  if (btn.classList.contains("pairs-card--matched")) return;
  if (btn.classList.contains("pairs-card--selected")) return;
  if (selected.length >= 2) return;

  Audio.click();
  btn.classList.add("pairs-card--selected");
  selected.push(btn);

  if (selected.length < 2) return;

  busy = true;
  const [a, b] = selected;

  if (a.dataset.id === b.dataset.id) {
    a.classList.add("pairs-card--matched", "bounce");
    b.classList.add("pairs-card--matched", "bounce");
    a.classList.remove("pairs-card--selected");
    b.classList.remove("pairs-card--selected");
    Audio.correct();
    pairsLeft--;
    updateMeta();
    selected = [];

    const found = currentAnimals.find((x) => x.id === a.dataset.id);
    // Short feedback without long wait
    if (found) Speech.say(`Пара ${found.pair}!`);

    if (pairsLeft <= 0) {
      round++;
      if (round >= ROUNDS_NEEDED) {
        setTimeout(() => onComplete?.(), 600);
      } else {
        setTimeout(() => startRound(), 800);
      }
    } else {
      busy = false;
    }
  } else {
    a.classList.add("shake");
    b.classList.add("shake");
    Audio.wrong();
    Speech.say("Попробуй ещё раз.");
    setTimeout(() => {
      a.classList.remove("shake");
      b.classList.remove("shake");
      clearSelection();
      busy = false;
    }, 500);
  }
}

export const PairsGame = {
  start(gameArea, completeCb) {
    area = gameArea;
    onComplete = completeCb;
    round = 0;
    usedAnimalIds = new Set();
    startRound();
  },

  help() {
    Speech.say("Найди двух одинаковых животных.");
  },

  destroy() {
    busy = true;
    selected = [];
    if (area) area.innerHTML = "";
  },
};
