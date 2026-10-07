import { Speech } from "../speech.js";
import { Audio } from "../audio.js";

const ROUNDS_NEEDED = 5;

const COLORS = [
  { id: "red", name: "красный", hex: "#e74c3c", plural: "красные" },
  { id: "yellow", name: "жёлтый", hex: "#f1c40f", plural: "жёлтые" },
  { id: "green", name: "зелёный", hex: "#27ae60", plural: "зелёные" },
  { id: "blue", name: "синий", hex: "#2980b9", plural: "синие" },
  { id: "orange", name: "оранжевый", hex: "#e67e22", plural: "оранжевые" },
  { id: "purple", name: "фиолетовый", hex: "#8e44ad", plural: "фиолетовые" },
  { id: "pink", name: "розовый", hex: "#ff6b9d", plural: "розовые" },
];

/** "с N якорями/якорем" */
const WITH_ANCHORS = {
  1: "с одним якорем",
  2: "с двумя якорями",
  3: "с тремя якорями",
  4: "с четырьмя якорями",
  5: "с пятью якорями",
};

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

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function boatSvg(hex, anchors) {
  const cargo = Array.from({ length: anchors }, () => "⚓").join("");
  return `
    <svg class="sea-boat__svg" viewBox="0 0 160 120" aria-hidden="true">
      <ellipse cx="80" cy="108" rx="54" ry="8" fill="rgba(255,255,255,0.35)"/>
      <path d="M28 78 L132 78 L118 98 L42 98 Z" fill="${hex}" stroke="#1a1a1a" stroke-width="3" stroke-linejoin="round"/>
      <rect x="76" y="28" width="6" height="50" fill="#6d4c41" stroke="#1a1a1a" stroke-width="2"/>
      <path d="M82 30 L82 70 L118 70 Z" fill="#fff8e7" stroke="#1a1a1a" stroke-width="3" stroke-linejoin="round"/>
      <circle cx="40" cy="70" r="5" fill="${hex}" stroke="#1a1a1a" stroke-width="2"/>
      <circle cx="120" cy="70" r="5" fill="${hex}" stroke="#1a1a1a" stroke-width="2"/>
    </svg>
    <span class="sea-boat__cargo">${cargo}</span>
  `;
}

let round = 0;
let busy = false;
let onComplete = null;
let area = null;
let task = null;
let lastVoice = "";

function startRound() {
  busy = false;
  const mode = round < 2 ? "color" : round < 4 ? "colorCount" : "collectColor";

  let boats = [];
  let instruction = "";

  if (mode === "color") {
    const targetColor = pick(COLORS);
    const others = shuffle(COLORS.filter((c) => c.id !== targetColor.id)).slice(0, 3);
    boats = shuffle([
      { id: "t0", color: targetColor, anchors: rand(1, 3) },
      ...others.map((c, i) => ({ id: `o${i}`, color: c, anchors: rand(1, 4) })),
    ]);
    task = { type: "color", color: targetColor, remaining: 1 };
    instruction = `Найди ${targetColor.name} кораблик!`;
  } else if (mode === "colorCount") {
    const targetColor = pick(COLORS);
    const anchors = rand(2, 4);
    const otherColor = pick(COLORS.filter((c) => c.id !== targetColor.id));
    boats = shuffle([
      { id: "t0", color: targetColor, anchors },
      { id: "d1", color: targetColor, anchors: anchors === 2 ? 4 : 2 },
      { id: "d2", color: otherColor, anchors },
      { id: "d3", color: pick(COLORS.filter((c) => c.id !== targetColor.id)), anchors: rand(1, 5) },
      { id: "d4", color: pick(COLORS.filter((c) => c.id !== targetColor.id)), anchors: rand(1, 5) },
    ]);
    task = { type: "colorCount", color: targetColor, anchors, remaining: 1 };
    instruction = `Найди ${targetColor.name} кораблик ${WITH_ANCHORS[anchors]}!`;
  } else {
    const targetColor = pick(COLORS);
    const howMany = rand(2, 3);
    for (let i = 0; i < howMany; i++) {
      boats.push({ id: `t${i}`, color: targetColor, anchors: rand(1, 3) });
    }
    const others = shuffle(COLORS.filter((c) => c.id !== targetColor.id)).slice(0, 3);
    others.forEach((c, i) => {
      boats.push({ id: `o${i}`, color: c, anchors: rand(1, 4) });
    });
    boats = shuffle(boats);
    task = { type: "collectColor", color: targetColor, remaining: howMany };
    instruction = `Собери все ${targetColor.plural} кораблики!`;
  }

  lastVoice = instruction;
  document.getElementById("game-character").textContent = "⛵";
  document.getElementById("game-instruction").textContent = instruction;

  area.innerHTML = "";
  const wrap = document.createElement("div");
  wrap.className = "sea-boats";

  const meta = document.createElement("p");
  meta.className = "sea-boats__meta";
  meta.textContent = `Раунд ${round + 1} из ${ROUNDS_NEEDED}`;
  wrap.appendChild(meta);

  const water = document.createElement("div");
  water.className = "sea-boats__water";

  boats.forEach((boat) => {
    const btn = document.createElement("button");
    btn.className = "sea-boat";
    btn.type = "button";
    btn.setAttribute("aria-label", `${boat.color.name}, якорей ${boat.anchors}`);
    btn.innerHTML = boatSvg(boat.color.hex, boat.anchors);
    btn.addEventListener("click", () => onPick(btn, boat));
    water.appendChild(btn);
  });

  wrap.appendChild(water);
  area.appendChild(wrap);
  Speech.say(instruction);
}

function isMatch(boat) {
  if (task.type === "color") return boat.color.id === task.color.id;
  if (task.type === "colorCount") {
    return boat.color.id === task.color.id && boat.anchors === task.anchors;
  }
  return boat.color.id === task.color.id;
}

async function onPick(btn, boat) {
  if (busy || btn.classList.contains("sea-boat--gone")) return;
  Audio.click();

  if (!isMatch(boat)) {
    btn.classList.add("shake");
    Audio.wrong();
    Speech.say("Попробуй ещё раз.");
    setTimeout(() => btn.classList.remove("shake"), 450);
    return;
  }

  busy = true;
  btn.classList.add("sea-boat--gone", "bounce");
  Audio.correct();
  task.remaining -= 1;

  if (task.remaining <= 0) {
    await Speech.say("Правильно! Молодец!");
    round++;
    if (round >= ROUNDS_NEEDED) {
      setTimeout(() => onComplete?.(), 350);
    } else {
      setTimeout(() => startRound(), 550);
    }
  } else {
    await Speech.say("Правильно! Молодец!");
    busy = false;
  }
}

export const SeaBoatsGame = {
  start(gameArea, completeCb) {
    area = gameArea;
    onComplete = completeCb;
    round = 0;
    busy = false;
    startRound();
  },

  help() {
    if (lastVoice) Speech.say(lastVoice);
  },

  destroy() {
    busy = true;
    task = null;
    lastVoice = "";
    if (area) area.innerHTML = "";
  },
};
