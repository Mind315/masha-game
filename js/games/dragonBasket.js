import { Speech } from "../speech.js";
import { Audio } from "../audio.js";

const DRAGON_SRC = "assets/drago-transparent.png";
const ROUNDS_NEEDED = 5;

const COLORS = [
  "#e74c3c",
  "#e67e22",
  "#f1c40f",
  "#27ae60",
  "#2980b9",
  "#8e44ad",
  "#ff6b9d",
  "#1abc9c",
];

/** Progressive targets toward 20 */
const STAGE_RANGE = [
  { min: 2, max: 5 },
  { min: 4, max: 8 },
  { min: 6, max: 12 },
  { min: 8, max: 16 },
  { min: 10, max: 20 },
];

const ACC_NUM = [
  "",
  "одного",
  "два",
  "три",
  "четыре",
  "пять",
  "шесть",
  "семь",
  "восемь",
  "девять",
  "десять",
  "одиннадцать",
  "двенадцать",
  "тринадцать",
  "четырнадцать",
  "пятнадцать",
  "шестнадцать",
  "семнадцать",
  "восемнадцать",
  "девятнадцать",
  "двадцать",
];

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function dragonAcc(n) {
  if (n === 1) return "дракона";
  if (n >= 2 && n <= 4) return "дракона";
  return "драконов";
}

function instruction(n) {
  return `Положи в корзину ${ACC_NUM[n]} ${dragonAcc(n)}!`;
}

let round = 0;
let target = 0;
let collected = 0;
let color = null;
let onComplete = null;
let area = null;
let busy = false;
let fieldEl = null;
let basketCountEl = null;

function updateBasket() {
  if (basketCountEl) basketCountEl.textContent = `${collected} / ${target}`;
}

function placeDragons(total) {
  fieldEl.innerHTML = "";
  const positions = [];

  for (let i = 0; i < total; i++) {
    let x;
    let y;
    let ok = false;
    let tries = 0;
    do {
      x = rand(4, 88);
      y = rand(4, 78);
      ok = positions.every((p) => Math.hypot(p.x - x, p.y - y) > 11);
      tries++;
    } while (!ok && tries < 40);
    positions.push({ x, y });

    const btn = document.createElement("button");
    btn.className = "dragon-basket__dragon";
    btn.type = "button";
    btn.style.left = `${x}%`;
    btn.style.top = `${y}%`;
    btn.style.setProperty("--dragon-color", color);
    btn.style.setProperty("--rot", `${rand(-12, 12)}deg`);
    btn.style.setProperty("--delay", `${i * 0.03}s`);
    btn.innerHTML = `<img src="${DRAGON_SRC}" alt="" draggable="false" />`;
    btn.addEventListener("click", () => onDragonClick(btn));
    fieldEl.appendChild(btn);
  }
}

function startRound() {
  busy = false;
  collected = 0;
  const range = STAGE_RANGE[round] || STAGE_RANGE[STAGE_RANGE.length - 1];
  target = rand(range.min, range.max);
  color = pick(COLORS);
  const extras = rand(2, 5);
  const totalOnScreen = Math.min(22, target + extras);
  const text = instruction(target);

  document.getElementById("game-character").textContent = "🧺";
  document.getElementById("game-instruction").textContent = text;

  area.innerHTML = "";
  area.style.position = "relative";

  const wrap = document.createElement("div");
  wrap.className = "dragon-basket";

  const basket = document.createElement("div");
  basket.className = "dragon-basket__basket";
  basket.innerHTML = `
    <span class="dragon-basket__basket-icon">🧺</span>
    <span class="dragon-basket__basket-count" id="dragon-basket-count">0 / ${target}</span>
  `;

  fieldEl = document.createElement("div");
  fieldEl.className = "dragon-basket__field";

  wrap.appendChild(basket);
  wrap.appendChild(fieldEl);
  area.appendChild(wrap);

  basketCountEl = basket.querySelector(".dragon-basket__basket-count");
  placeDragons(totalOnScreen);
  updateBasket();

  Speech.say(text);
}

function onDragonClick(btn) {
  if (busy || btn.classList.contains("dragon-basket__dragon--gone")) return;

  if (collected >= target) {
    btn.classList.add("shake");
    Audio.wrong();
    setTimeout(() => btn.classList.remove("shake"), 400);
    return;
  }

  Audio.click();
  collected++;
  updateBasket();
  btn.classList.add("dragon-basket__dragon--gone");

  if (collected >= target) {
    busy = true;
    Audio.correct();
    Speech.sayNumber(collected)
      .then(() => Speech.say("Правильно! Молодец!"))
      .then(() => {
        round++;
        if (round >= ROUNDS_NEEDED) {
          setTimeout(() => onComplete?.(), 400);
        } else {
          setTimeout(() => startRound(), 700);
        }
      });
  } else {
    // Don't await — kids can tap quickly; voice interrupts previous number
    Speech.sayNumber(collected);
  }
}

export const DragonBasketGame = {
  start(gameArea, completeCb) {
    area = gameArea;
    onComplete = completeCb;
    round = 0;
    busy = false;
    startRound();
  },

  help() {
    if (target) Speech.say(instruction(target));
  },

  destroy() {
    busy = true;
    fieldEl = null;
    basketCountEl = null;
    if (area) area.innerHTML = "";
  },
};
