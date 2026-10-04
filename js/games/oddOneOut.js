import { Speech } from "../speech.js";
import { Audio } from "../audio.js";

const SHAPES = [
  {
    id: "circle",
    svg: (c) => `<circle cx="50" cy="50" r="38" fill="${c}"/>`,
  },
  {
    id: "square",
    svg: (c) => `<rect x="12" y="12" width="76" height="76" rx="8" fill="${c}"/>`,
  },
  {
    id: "triangle",
    svg: (c) => `<polygon points="50,10 90,88 10,88" fill="${c}"/>`,
  },
  {
    id: "diamond",
    svg: (c) => `<polygon points="50,8 92,50 50,92 8,50" fill="${c}"/>`,
  },
  {
    id: "star",
    svg: (c) =>
      `<polygon points="50,8 61,38 94,38 67,58 78,90 50,70 22,90 33,58 6,38 39,38" fill="${c}"/>`,
  },
  {
    id: "hexagon",
    svg: (c) => `<polygon points="50,8 88,28 88,72 50,92 12,72 12,28" fill="${c}"/>`,
  },
  {
    id: "oval",
    svg: (c) => `<ellipse cx="50" cy="50" rx="28" ry="40" fill="${c}"/>`,
  },
];

const COLORS = [
  { id: "red", name: "красный", hex: "#e74c3c" },
  { id: "blue", name: "синий", hex: "#3498db" },
  { id: "green", name: "зелёный", hex: "#27ae60" },
  { id: "yellow", name: "жёлтый", hex: "#f1c40f" },
  { id: "orange", name: "оранжевый", hex: "#e67e22" },
  { id: "purple", name: "фиолетовый", hex: "#8e44ad" },
  { id: "pink", name: "розовый", hex: "#ff6b9d" },
  { id: "teal", name: "бирюзовый", hex: "#1abc9c" },
];

const ROUNDS_NEEDED = 5;
const ITEMS_COUNT = 5;

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

let round = 0;
let busy = false;
let onComplete = null;
let area = null;

function buildRound() {
  const mainColor = pick(COLORS);
  const oddColor = pick(COLORS.filter((c) => c.id !== mainColor.id));
  const shapes = shuffle(SHAPES).slice(0, ITEMS_COUNT);
  const oddIndex = Math.floor(Math.random() * ITEMS_COUNT);

  const items = shapes.map((shape, i) => ({
    shape,
    color: i === oddIndex ? oddColor : mainColor,
    isOdd: i === oddIndex,
  }));

  return { items, mainColor, oddColor };
}

function startRound() {
  busy = false;
  const { items } = buildRound();

  document.getElementById("game-character").textContent = "🦊";
  document.getElementById("game-instruction").textContent = "Что здесь лишнее?";

  area.innerHTML = "";
  area.style.position = "relative";

  const wrap = document.createElement("div");
  wrap.className = "odd-layout";

  const meta = document.createElement("p");
  meta.className = "odd-meta";
  meta.textContent = `Раунд ${round + 1} из ${ROUNDS_NEEDED}`;
  wrap.appendChild(meta);

  const grid = document.createElement("div");
  grid.className = "odd-grid";

  items.forEach((item) => {
    const btn = document.createElement("button");
    btn.className = "odd-item";
    btn.innerHTML = `<svg class="odd-svg" viewBox="0 0 100 100">${item.shape.svg(item.color.hex)}</svg>`;
    btn.setAttribute("aria-label", item.isOdd ? "лишний" : "фигура");
    btn.addEventListener("click", () => onPick(btn, item));
    grid.appendChild(btn);
  });

  wrap.appendChild(grid);
  area.appendChild(wrap);
  Speech.say("Что здесь лишнее?");
}

function onPick(btn, item) {
  if (busy) return;
  busy = true;
  Audio.click();

  if (item.isOdd) {
    btn.classList.add("bounce", "odd-item--ok");
    Audio.correct();
    Speech.say("Правильно! Молодец!");
    round++;
    if (round >= ROUNDS_NEEDED) {
      setTimeout(() => onComplete?.(), 700);
    } else {
      setTimeout(() => startRound(), 900);
    }
  } else {
    btn.classList.add("shake", "odd-item--bad");
    Audio.wrong();
    Speech.say("Попробуй ещё раз. Какая фигура другого цвета?");
    setTimeout(() => {
      btn.classList.remove("shake", "odd-item--bad");
      busy = false;
    }, 500);
  }
}

export const OddOneOutGame = {
  start(gameArea, completeCb) {
    area = gameArea;
    onComplete = completeCb;
    round = 0;
    startRound();
  },

  help() {
    Speech.say("Найди фигуру другого цвета. Она лишняя.");
  },

  destroy() {
    busy = true;
    if (area) area.innerHTML = "";
  },
};
