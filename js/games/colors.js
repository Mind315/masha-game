import { Speech } from "../speech.js";
import { Audio } from "../audio.js";

const COLORS = [
  { id: "red", name: "красный", acc: "красного", hex: "#e74c3c" },
  { id: "orange", name: "оранжевый", acc: "оранжевого", hex: "#e67e22" },
  { id: "yellow", name: "жёлтый", acc: "жёлтого", hex: "#f1c40f" },
  { id: "green", name: "зелёный", acc: "зелёного", hex: "#27ae60" },
  { id: "cyan", name: "голубой", acc: "голубого", hex: "#3498db" },
  { id: "blue", name: "синий", acc: "синего", hex: "#1f5fbf" },
  { id: "purple", name: "фиолетовый", acc: "фиолетового", hex: "#8e44ad" },
  { id: "pink", name: "розовый", acc: "розового", hex: "#ff6b9d" },
  { id: "brown", name: "коричневый", acc: "коричневого", hex: "#8B4513" },
  { id: "white", name: "белый", acc: "белого", hex: "#f7f7f7", light: true },
  { id: "black", name: "чёрный", acc: "чёрного", hex: "#2c2c2c" },
  { id: "gray", name: "серый", acc: "серого", hex: "#95a5a6" },
  { id: "teal", name: "бирюзовый", acc: "бирюзового", hex: "#1abc9c" },
  { id: "lime", name: "салатовый", acc: "салатового", hex: "#a8e063" },
  { id: "beige", name: "бежевый", acc: "бежевого", hex: "#e8d5b7", light: true },
];

const DRAGON_SRC = "assets/dragon_coloring_game_edited.svg";
const ROUNDS_NEEDED = 4;

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

function capitalize(name) {
  return name[0].toUpperCase() + name.slice(1);
}

let round = 0;
let target = null;
let onComplete = null;
let area = null;
let busy = false;
let dragonMarkup = null;

async function ensureDragon() {
  if (dragonMarkup) return dragonMarkup;
  const res = await fetch(DRAGON_SRC);
  if (!res.ok) throw new Error("dragon svg missing");
  dragonMarkup = await res.text();
  return dragonMarkup;
}

function startRound() {
  const poolSize = Math.min(COLORS.length, 6 + round * 2);
  const pool = COLORS.slice(0, poolSize);
  target = pick(pool);
  const others = shuffle(pool.filter((c) => c.id !== target.id)).slice(0, 3);
  const options = shuffle([target, ...others]);

  const instruction = `Найди ${target.acc} дракона!`;
  document.getElementById("game-character").textContent = "🐉";
  document.getElementById("game-instruction").textContent = instruction;

  area.innerHTML = "";
  area.style.position = "relative";

  const layout = document.createElement("div");
  layout.className = "color-dragons";

  options.forEach((color) => {
    const btn = document.createElement("button");
    btn.className = "color-dragon-btn";
    if (color.light) btn.classList.add("color-dragon-btn--light");
    btn.style.setProperty("--dragon-color", color.hex);
    btn.setAttribute("aria-label", color.name);
    btn.innerHTML = `
      <span class="color-dragon-btn__art">${dragonMarkup}</span>
    `;
    btn.addEventListener("click", () => onPick(btn, color));
    layout.appendChild(btn);
  });

  area.appendChild(layout);
  Speech.say(`Найди ${target.acc} дракона.`);
}

async function onPick(btn, color) {
  if (busy) return;
  busy = true;
  Audio.click();

  if (color.id === target.id) {
    btn.classList.add("bounce", "color-dragon-btn--correct");
    Audio.correct();
    await Speech.say(`${capitalize(color.name)}! Молодец!`);
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
    await Speech.say(`Попробуй ещё раз. Найди ${target.acc} дракона.`);
    setTimeout(() => btn.classList.remove("shake"), 500);
    busy = false;
  }
}

export const ColorsGame = {
  async start(gameArea, completeCb) {
    area = gameArea;
    onComplete = completeCb;
    round = 0;
    busy = true;
    document.getElementById("game-character").textContent = "🐉";
    document.getElementById("game-instruction").textContent = "Готовим драконов…";
    area.innerHTML = `<p class="color-dragons-loading">Готовим драконов…</p>`;

    try {
      await ensureDragon();
      busy = false;
      startRound();
    } catch {
      area.innerHTML = `<p class="color-dragons-loading">Не удалось загрузить дракона</p>`;
      Speech.say("Ой, дракон не загрузился.");
    }
  },

  help() {
    if (target) Speech.say(`Найди ${target.acc} дракона.`);
  },

  destroy() {
    busy = true;
    target = null;
    if (area) area.innerHTML = "";
  },
};
