import { Speech } from "../speech.js";
import { Audio } from "../audio.js";

const COLORS = [
  { id: "red", name: "красный", hex: "#e74c3c" },
  { id: "orange", name: "оранжевый", hex: "#e67e22" },
  { id: "yellow", name: "жёлтый", hex: "#f1c40f" },
  { id: "green", name: "зелёный", hex: "#27ae60" },
  { id: "cyan", name: "голубой", hex: "#3498db" },
  { id: "blue", name: "синий", hex: "#2980b9" },
  { id: "purple", name: "фиолетовый", hex: "#8e44ad" },
  { id: "pink", name: "розовый", hex: "#ff6b9d" },
  { id: "brown", name: "коричневый", hex: "#8B4513" },
  { id: "white", name: "белый", hex: "#f5f5f5", border: true },
  { id: "black", name: "чёрный", hex: "#2c2c2c" },
  { id: "gray", name: "серый", hex: "#95a5a6" },
  { id: "teal", name: "бирюзовый", hex: "#1abc9c" },
  { id: "lime", name: "салатовый", hex: "#a8e063" },
  { id: "beige", name: "бежевый", hex: "#e8d5b7", border: true },
];

const SHAPES_CSS = ["circle", "rect"];

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

let round = 0;
let target = null;
let onComplete = null;
let area = null;
let busy = false;
const ROUNDS_NEEDED = 4;

function startRound() {
  // Gradually introduce more colors
  const poolSize = Math.min(COLORS.length, 6 + round * 2);
  const pool = COLORS.slice(0, poolSize);
  target = pick(pool);
  const others = shuffle(pool.filter((c) => c.id !== target.id)).slice(0, 3);
  const options = shuffle([target, ...others]);
  const shapeKind = pick(SHAPES_CSS);

  const instruction = `Найди ${target.name} цвет!`;
  document.getElementById("game-character").textContent = "🐰";
  document.getElementById("game-instruction").textContent = instruction;

  area.innerHTML = "";
  area.style.position = "relative";

  options.forEach((color) => {
    const btn = document.createElement("button");
    btn.className = `color-btn${shapeKind === "rect" ? " color-btn--rect" : ""}`;
    btn.style.background = color.hex;
    if (color.border) btn.style.border = "4px solid #ccc";
    btn.setAttribute("aria-label", color.name);
    btn.addEventListener("click", () => onPick(btn, color));
    area.appendChild(btn);
  });

  Speech.say(`Найди ${target.name} цвет.`);
}

async function onPick(btn, color) {
  if (busy) return;
  busy = true;
  Audio.click();

  if (color.id === target.id) {
    btn.classList.add("bounce");
    Audio.correct();
    await Speech.say(`${color.name[0].toUpperCase() + color.name.slice(1)}! Молодец!`);
    round++;
    if (round >= ROUNDS_NEEDED) {
      setTimeout(() => onComplete?.(), 300);
    } else {
      setTimeout(() => {
        busy = false;
        startRound();
      }, 500);
    }
  } else {
    btn.classList.add("shake");
    Audio.wrong();
    await Speech.say(`Попробуй ещё раз. Найди ${target.name}.`);
    setTimeout(() => btn.classList.remove("shake"), 500);
    busy = false;
  }
}

export const ColorsGame = {
  start(gameArea, completeCb) {
    area = gameArea;
    onComplete = completeCb;
    round = 0;
    busy = false;
    startRound();
  },

  help() {
    if (target) Speech.say(`Найди ${target.name} цвет.`);
  },

  destroy() {
    busy = true;
    if (area) area.innerHTML = "";
  },
};
