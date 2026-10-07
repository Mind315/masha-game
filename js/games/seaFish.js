import { Speech } from "../speech.js";
import { Audio } from "../audio.js";

const ROUNDS_NEEDED = 8;

/** 20 colors — feminine accusative for «рыбку» */
const COLORS = [
  { id: "red", name: "красный", fem: "красную", hex: "#e74c3c" },
  { id: "orange", name: "оранжевый", fem: "оранжевую", hex: "#e67e22" },
  { id: "yellow", name: "жёлтый", fem: "жёлтую", hex: "#f1c40f" },
  { id: "green", name: "зелёный", fem: "зелёную", hex: "#27ae60" },
  { id: "cyan", name: "голубой", fem: "голубую", hex: "#3498db" },
  { id: "blue", name: "синий", fem: "синюю", hex: "#1f5fbf" },
  { id: "purple", name: "фиолетовый", fem: "фиолетовую", hex: "#8e44ad" },
  { id: "pink", name: "розовый", fem: "розовую", hex: "#ff6b9d" },
  { id: "brown", name: "коричневый", fem: "коричневую", hex: "#8B4513" },
  { id: "white", name: "белый", fem: "белую", hex: "#f7f7f7", light: true },
  { id: "black", name: "чёрный", fem: "чёрную", hex: "#2c2c2c" },
  { id: "gray", name: "серый", fem: "серую", hex: "#95a5a6" },
  { id: "teal", name: "бирюзовый", fem: "бирюзовую", hex: "#1abc9c" },
  { id: "lime", name: "салатовый", fem: "салатовую", hex: "#a8e063" },
  { id: "beige", name: "бежевый", fem: "бежевую", hex: "#e8d5b7", light: true },
  { id: "burgundy", name: "бордовый", fem: "бордовую", hex: "#800020" },
  { id: "gold", name: "золотой", fem: "золотую", hex: "#d4a017" },
  { id: "coral", name: "коралловый", fem: "коралловую", hex: "#ff7f50" },
  { id: "lilac", name: "сиреневый", fem: "сиреневую", hex: "#c8a2c8" },
  { id: "peach", name: "персиковый", fem: "персиковую", hex: "#ffcba4", light: true },
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

function capitalize(name) {
  return name[0].toUpperCase() + name.slice(1);
}

function fishSvg(hex) {
  return `
    <svg class="sea-fish__svg" viewBox="0 0 160 100" aria-hidden="true">
      <ellipse cx="72" cy="52" rx="48" ry="30" fill="${hex}" stroke="#1a1a1a" stroke-width="3"/>
      <path d="M118 52 L148 28 L148 76 Z" fill="${hex}" stroke="#1a1a1a" stroke-width="3" stroke-linejoin="round"/>
      <path d="M55 28 L68 12 L82 28" fill="${hex}" stroke="#1a1a1a" stroke-width="3" stroke-linejoin="round"/>
      <circle cx="48" cy="46" r="7" fill="#fff" stroke="#1a1a1a" stroke-width="2"/>
      <circle cx="50" cy="46" r="3.5" fill="#1a1a1a"/>
      <path d="M28 52 Q38 58 48 52" fill="none" stroke="#1a1a1a" stroke-width="2.5" stroke-linecap="round"/>
      <path d="M70 42 Q82 52 70 62" fill="none" stroke="rgba(0,0,0,0.25)" stroke-width="2" stroke-linecap="round"/>
    </svg>
  `;
}

function instruction(color) {
  return `Найди ${color.fem} рыбку!`;
}

function helpPhrase(color) {
  return `Найди ${color.fem} рыбку.`;
}

function retryPhrase(color) {
  return `Попробуй ещё раз. Найди ${color.fem} рыбку.`;
}

let round = 0;
let target = null;
let onComplete = null;
let area = null;
let busy = false;

function startRound() {
  busy = false;
  target = pick(COLORS);
  const others = shuffle(COLORS.filter((c) => c.id !== target.id)).slice(0, 3);
  const options = shuffle([target, ...others]);

  const text = instruction(target);
  document.getElementById("game-character").textContent = "🐠";
  document.getElementById("game-instruction").textContent = text;

  area.innerHTML = "";
  const wrap = document.createElement("div");
  wrap.className = "sea-fish";

  const meta = document.createElement("p");
  meta.className = "sea-fish__meta";
  meta.textContent = `Раунд ${round + 1} из ${ROUNDS_NEEDED}`;
  wrap.appendChild(meta);

  const water = document.createElement("div");
  water.className = "sea-fish__water";

  options.forEach((color) => {
    const btn = document.createElement("button");
    btn.className = "sea-fish-btn";
    if (color.light) btn.classList.add("sea-fish-btn--light");
    btn.type = "button";
    btn.setAttribute("aria-label", color.name);
    btn.innerHTML = fishSvg(color.hex);
    btn.addEventListener("click", () => onPick(btn, color));
    water.appendChild(btn);
  });

  wrap.appendChild(water);
  area.appendChild(wrap);
  Speech.say(text);
}

async function onPick(btn, color) {
  if (busy) return;
  busy = true;
  Audio.click();

  if (color.id === target.id) {
    btn.classList.add("bounce", "sea-fish-btn--correct");
    Audio.correct();
    await Speech.say(`${capitalize(color.name)}! Молодец!`);
    round++;
    if (round >= ROUNDS_NEEDED) {
      setTimeout(() => onComplete?.(), 300);
    } else {
      setTimeout(() => startRound(), 500);
    }
  } else {
    btn.classList.add("shake");
    Audio.wrong();
    await Speech.say(retryPhrase(target));
    setTimeout(() => btn.classList.remove("shake"), 450);
    busy = false;
  }
}

export const SeaFishGame = {
  start(gameArea, completeCb) {
    area = gameArea;
    onComplete = completeCb;
    round = 0;
    busy = false;
    startRound();
  },

  help() {
    if (target) Speech.say(helpPhrase(target));
  },

  destroy() {
    busy = true;
    target = null;
    if (area) area.innerHTML = "";
  },
};
