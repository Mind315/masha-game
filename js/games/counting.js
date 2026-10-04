import { Speech } from "../speech.js";
import { Audio } from "../audio.js";

const ITEMS = [
  { id: "apple", emoji: "🍎", gender: "neuter" },
  { id: "mushroom", emoji: "🍄", gender: "masc" },
  { id: "acorn", emoji: "🌰", gender: "masc" },
  { id: "flower", emoji: "🌸", gender: "masc" },
  { id: "berry", icon: "assets/objects/berry.svg", gender: "fem" },
];

const CHARACTERS = ["🐿️", "🐰", "🦊", "🦔"];

const ROUNDS_NEEDED = 5;

const NUM_WORDS = {
  masc: ["", "один", "два", "три", "четыре", "пять", "шесть", "семь", "восемь", "девять", "десять", "одиннадцать", "двенадцать", "тринадцать", "четырнадцать", "пятнадцать"],
  fem: ["", "одну", "две", "три", "четыре", "пять", "шесть", "семь", "восемь", "девять", "десять", "одиннадцать", "двенадцать", "тринадцать", "четырнадцать", "пятнадцать"],
  neuter: ["", "одно", "два", "три", "четыре", "пять", "шесть", "семь", "восемь", "девять", "десять", "одиннадцать", "двенадцать", "тринадцать", "четырнадцать", "пятнадцать"],
};

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

let round = 0;
let target = 0;
let collected = 0;
let item = null;
let onComplete = null;
let area = null;
let busy = false;

function buildRound() {
  target = rand(1, 15);
  collected = 0;
  item = pick(ITEMS);
  const character = pick(CHARACTERS);
  const totalOnScreen = Math.min(18, target + rand(2, 5));

  const instruction = countingInstruction(target, item);
  return { character, instruction, totalOnScreen };
}

function pluralize(n, id) {
  const forms = {
    apple: ["яблоко", "яблока", "яблок"],
    mushroom: ["гриб", "гриба", "грибов"],
    acorn: ["жёлудь", "жёлудя", "желудей"],
    flower: ["цветок", "цветка", "цветков"],
    berry: ["ягодку", "ягодки", "ягодок"],
  };
  const f = forms[id] || ["предмет", "предмета", "предметов"];
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return f[0];
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return f[1];
  return f[2];
}

function countingInstruction(n, gameItem) {
  const num = NUM_WORDS[gameItem.gender][n] || String(n);
  return `Помоги собрать ${num} ${pluralize(n, gameItem.id)}!`;
}

function updateBasket() {
  const el = area.querySelector(".counting-basket__count");
  if (el) el.textContent = `${collected} / ${target}`;
}

function placeItems(total) {
  const positions = [];
  for (let i = 0; i < total; i++) {
    let x, y, ok;
    let tries = 0;
    do {
      x = 6 + Math.random() * 70;
      y = 8 + Math.random() * 75;
      ok = positions.every((p) => Math.hypot(p.x - x, p.y - y) > 10);
      tries++;
    } while (!ok && tries < 40);
    positions.push({ x, y });
  }

  positions.forEach((pos, idx) => {
    const btn = document.createElement("button");
    btn.className = "counting-item";
    if (item.icon) {
      const img = document.createElement("img");
      img.src = item.icon;
      img.alt = Speech.objectName(item.id);
      img.className = "counting-item__img";
      btn.appendChild(img);
    } else {
      btn.textContent = item.emoji;
    }
    btn.style.left = `${pos.x}%`;
    btn.style.top = `${pos.y}%`;
    btn.style.animationDelay = `${idx * 0.04}s`;
    btn.setAttribute("aria-label", Speech.objectName(item.id));
    btn.addEventListener("click", () => onItemClick(btn));
    area.appendChild(btn);
  });
}

function onItemClick(btn) {
  if (busy || btn.classList.contains("counting-item--collected")) return;
  if (collected >= target) return;

  Audio.click();
  btn.classList.add("counting-item--collected");
  collected++;
  updateBasket();
  // Don't wait for speech — allow fast tapping
  Speech.sayNumber(collected);

  if (collected >= target) {
    busy = true;
    Audio.correct();
    round++;
    if (round >= ROUNDS_NEEDED) {
      setTimeout(() => onComplete?.(), 500);
    } else {
      setTimeout(() => {
        busy = false;
        startRound();
      }, 700);
    }
  }
}

function startRound() {
  const { character, instruction, totalOnScreen } = buildRound();

  const promptFace = document.getElementById("game-character");
  const promptText = document.getElementById("game-instruction");
  if (promptFace) promptFace.textContent = character;
  if (promptText) promptText.textContent = instruction;

  area.innerHTML = "";
  area.style.position = "relative";

  const basket = document.createElement("div");
  basket.className = "counting-basket";
  basket.innerHTML = `
    <span class="counting-basket__icon">🧺</span>
    <span class="counting-basket__count">0 / ${target}</span>
  `;
  area.appendChild(basket);

  placeItems(totalOnScreen);
  Speech.say(instruction);
}

export const CountingGame = {
  lastInstruction: "",

  start(gameArea, completeCb) {
    area = gameArea;
    onComplete = completeCb;
    round = 0;
    busy = false;
    startRound();
    this.lastInstruction = document.getElementById("game-instruction")?.textContent || "";
  },

  help() {
    const text = document.getElementById("game-instruction")?.textContent;
    if (text) Speech.say(text);
  },

  destroy() {
    busy = true;
    if (area) area.innerHTML = "";
  },
};
