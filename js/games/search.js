import { Speech } from "../speech.js";
import { Audio } from "../audio.js";

const OBJECTS = [
  { id: "mushroom", emoji: "🍄", name: "гриб" },
  { id: "apple", emoji: "🍎", name: "яблоко" },
  { id: "squirrel", emoji: "🐿️", name: "белку" },
  { id: "flower", emoji: "🌸", name: "цветок" },
  { id: "hedgehog", emoji: "🦔", name: "ёжика" },
  { id: "bird", emoji: "🐦", name: "птичку" },
  { id: "butterfly", emoji: "🦋", name: "бабочку" },
  { id: "acorn", emoji: "🌰", name: "жёлудь" },
  { id: "bee", emoji: "🐝", name: "пчёлку" },
  { id: "bunny", emoji: "🐰", name: "зайчика" },
];

const DECOR = ["🌳", "🌲", "🍂", "🍃", "🌿", "🌻"];

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

// Round configs: decoy count, target count
const ROUNDS = [
  { decoys: 4, targets: 1 },
  { decoys: 8, targets: 1 },
  { decoys: 10, targets: 1 },
  { decoys: 8, targets: 2 },
];

let round = 0;
let targets = [];
let foundIds = new Set();
let onComplete = null;
let area = null;
let busy = false;

function startRound() {
  const cfg = ROUNDS[Math.min(round, ROUNDS.length - 1)];
  foundIds = new Set();
  busy = false;

  const shuffled = shuffle(OBJECTS);
  targets = shuffled.slice(0, cfg.targets);
  const targetIds = new Set(targets.map((t) => t.id));

  const decoyObjects = shuffled.filter((o) => !targetIds.has(o.id)).slice(0, Math.min(4, cfg.decoys));
  const decoyDecor = Array.from({ length: cfg.decoys - decoyObjects.length }, () => ({
    id: "decor",
    emoji: pick(DECOR),
    name: "",
  }));

  const allItems = [
    ...targets.map((t) => ({ ...t, isTarget: true })),
    ...decoyObjects.map((t) => ({ ...t, isTarget: false })),
    ...decoyDecor.map((t) => ({ ...t, isTarget: false })),
  ];

  const names = targets.map((t) => t.name);
  const instruction =
    targets.length === 1
      ? `Найди ${names[0]}!`
      : `Найди ${names[0]} и ${names[1]}!`;

  document.getElementById("game-character").textContent = "🦊";
  document.getElementById("game-instruction").textContent = instruction;

  area.innerHTML = "";
  area.style.position = "relative";

  const scene = document.createElement("div");
  scene.className = "search-scene";

  const chips = document.createElement("div");
  chips.className = "search-targets";
  targets.forEach((t) => {
    const chip = document.createElement("span");
    chip.className = "search-target-chip";
    chip.dataset.id = t.id;
    chip.textContent = t.emoji;
    chips.appendChild(chip);
  });
  scene.appendChild(chips);

  const positions = [];
  allItems.forEach((obj) => {
    let x, y, ok;
    let tries = 0;
    do {
      x = 8 + Math.random() * 80;
      y = 18 + Math.random() * 65;
      ok = positions.every((p) => Math.hypot(p.x - x, p.y - y) > 12);
      tries++;
    } while (!ok && tries < 50);
    positions.push({ x, y });

    const btn = document.createElement("button");
    btn.className = `search-item${obj.isTarget ? "" : " search-item--decoy"}`;
    btn.textContent = obj.emoji;
    btn.style.left = `${x}%`;
    btn.style.top = `${y}%`;
    btn.style.fontSize = `${2.2 + Math.random() * 1.2}rem`;
    btn.dataset.id = obj.id;
    btn.dataset.target = obj.isTarget ? "1" : "0";
    btn.setAttribute("aria-label", obj.name || "предмет");
    btn.addEventListener("click", () => onItemClick(btn, obj));
    scene.appendChild(btn);
  });

  area.appendChild(scene);
  Speech.say(instruction);
}

function onItemClick(btn, obj) {
  if (busy) return;
  Audio.click();

  if (obj.isTarget && !foundIds.has(obj.id)) {
    busy = true;
    foundIds.add(obj.id);
    btn.classList.add("search-item--found", "bounce");
    Audio.correct();

    const chip = area.querySelector(`.search-target-chip[data-id="${obj.id}"]`);
    if (chip) chip.classList.add("search-target-chip--done");

    if (foundIds.size >= targets.length) {
      round++;
      if (round >= ROUNDS.length) {
        setTimeout(() => onComplete?.(), 400);
      } else {
        setTimeout(() => startRound(), 500);
      }
    } else {
      busy = false;
    }
  } else if (obj.isTarget && foundIds.has(obj.id)) {
    // already found
  } else {
    btn.classList.add("shake");
    Audio.wrong();
    Speech.say("Хм... Давай посмотрим внимательно.");
    setTimeout(() => btn.classList.remove("shake"), 500);
  }
}

export const SearchGame = {
  start(gameArea, completeCb) {
    area = gameArea;
    onComplete = completeCb;
    round = 0;
    startRound();
  },

  help() {
    if (!targets.length) return;
    const names = targets.filter((t) => !foundIds.has(t.id)).map((t) => t.name);
    if (names.length === 1) Speech.say(`Найди ${names[0]}.`);
    else if (names.length > 1) Speech.say(`Найди ${names[0]} и ${names[1]}.`);
  },

  destroy() {
    busy = true;
    if (area) area.innerHTML = "";
  },
};
