import { Speech } from "../speech.js";
import { Audio } from "../audio.js";

const SHAPES = [
  {
    id: "circle",
    name: "круг",
    voice: "Круг",
    svg: '<circle cx="50" cy="50" r="38" fill="#ff6b6b"/>',
  },
  {
    id: "square",
    name: "квадрат",
    voice: "Квадрат",
    svg: '<rect x="12" y="12" width="76" height="76" rx="6" fill="#4ecdc4"/>',
  },
  {
    id: "triangle",
    name: "треугольник",
    voice: "Треугольник",
    svg: '<polygon points="50,10 90,88 10,88" fill="#ffe66d"/>',
  },
  {
    id: "rectangle",
    name: "прямоугольник",
    voice: "Прямоугольник",
    svg: '<rect x="8" y="25" width="84" height="50" rx="6" fill="#a29bfe"/>',
  },
  {
    id: "diamond",
    name: "ромб",
    voice: "Ромб",
    svg: '<polygon points="50,8 92,50 50,92 8,50" fill="#fd79a8"/>',
  },
  {
    id: "star",
    name: "звезда",
    voice: "Звезда",
    svg: '<polygon points="50,8 61,38 94,38 67,58 78,90 50,70 22,90 33,58 6,38 39,38" fill="#fdcb6e"/>',
  },
  {
    id: "oval",
    name: "овал",
    voice: "Овал",
    svg: '<ellipse cx="50" cy="50" rx="28" ry="40" fill="#74b9ff"/>',
  },
  {
    id: "hexagon",
    name: "шестиугольник",
    voice: "Шестиугольник",
    svg: '<polygon points="50,8 88,28 88,72 50,92 12,72 12,28" fill="#55efc4"/>',
  },
];

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
  target = pick(SHAPES);
  const others = shuffle(SHAPES.filter((s) => s.id !== target.id)).slice(0, 3);
  const options = shuffle([target, ...others]);

  const instruction = `Найди ${target.name}!`;
  document.getElementById("game-character").textContent = "🦊";
  document.getElementById("game-instruction").textContent = instruction;

  area.innerHTML = "";
  area.style.position = "relative";

  options.forEach((shape) => {
    const btn = document.createElement("button");
    btn.className = "shape-btn";
    btn.setAttribute("aria-label", shape.voice);
    btn.innerHTML = `<svg class="shape-svg" viewBox="0 0 100 100">${shape.svg}</svg>`;
    btn.addEventListener("click", () => onPick(btn, shape));
    area.appendChild(btn);
  });

  Speech.say(`Посмотри! Где спрятался ${target.name}?`);
}

async function onPick(btn, shape) {
  if (busy) return;
  busy = true;
  Audio.click();

  if (shape.id === target.id) {
    btn.classList.add("bounce");
    Audio.correct();
    await Speech.say(`${shape.voice}! Правильно!`);
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
    await Speech.say(`Попробуй найти ${target.name}.`);
    setTimeout(() => btn.classList.remove("shake"), 500);
    busy = false;
  }
}

export const ShapesGame = {
  start(gameArea, completeCb) {
    area = gameArea;
    onComplete = completeCb;
    round = 0;
    busy = false;
    startRound();
  },

  help() {
    if (target) Speech.say(`Найди ${target.name}.`);
  },

  destroy() {
    busy = true;
    if (area) area.innerHTML = "";
  },
};
