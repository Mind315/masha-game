import { Speech } from "../speech.js";
import { Audio } from "../audio.js";

// Simple ABAB patterns — well-supported emojis
const ICON_PAIRS = [
  ["🔴", "🔵"],
  ["🍎", "🍌"],
  ["⭐", "🌙"],
  ["🐶", "🐱"],
  ["🌸", "🌻"],
  ["🚗", "🚌"],
  ["⚽", "🏀"],
  ["🐸", "🐥"],
  ["🍇", "🍊"],
  ["💚", "💛"],
];

const ROUNDS_NEEDED = 5;

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
let answer = null;
let busy = false;
let onComplete = null;
let area = null;
let usedPairs = new Set();

function pickPair() {
  const available = ICON_PAIRS.map((_, i) => i).filter((i) => !usedPairs.has(i));
  const chosenIdx = available.length
    ? available[Math.floor(Math.random() * available.length)]
    : Math.floor(Math.random() * ICON_PAIRS.length);
  usedPairs.add(chosenIdx);
  return ICON_PAIRS[chosenIdx];
}

function startRound() {
  busy = false;
  const [a, b] = pickPair();

  // Pattern ABAB → next is A
  const seq = [a, b, a, b];
  answer = a;

  const decoys = ICON_PAIRS.flat().filter((x) => x !== a && x !== b);
  const options = shuffle([a, b, pick(decoys)]);

  document.getElementById("game-character").textContent = "🦊";
  document.getElementById("game-instruction").textContent = "Какой картинки не хватает в конце?";

  area.innerHTML = "";
  area.style.position = "relative";

  const wrap = document.createElement("div");
  wrap.className = "sequence-layout";

  const meta = document.createElement("p");
  meta.className = "sequence-meta";
  meta.textContent = `Раунд ${round + 1} из ${ROUNDS_NEEDED}`;
  wrap.appendChild(meta);

  const rowBlock = document.createElement("div");
  rowBlock.className = "sequence-row-block";
  const rowLabel = document.createElement("p");
  rowLabel.className = "sequence-label";
  rowLabel.textContent = "Ряд";
  rowBlock.appendChild(rowLabel);

  const row = document.createElement("div");
  row.className = "sequence-row";
  seq.forEach((icon) => {
    const cell = document.createElement("span");
    cell.className = "sequence-cell";
    cell.textContent = icon;
    row.appendChild(cell);
  });
  const q = document.createElement("span");
  q.className = "sequence-cell sequence-cell--question";
  q.textContent = "❓";
  row.appendChild(q);
  rowBlock.appendChild(row);
  wrap.appendChild(rowBlock);

  const choicesBlock = document.createElement("div");
  choicesBlock.className = "sequence-choices-block";
  const choicesLabel = document.createElement("p");
  choicesLabel.className = "sequence-label";
  choicesLabel.textContent = "Выбери картинку";
  choicesBlock.appendChild(choicesLabel);

  const choices = document.createElement("div");
  choices.className = "sequence-choices";
  options.forEach((icon) => {
    const btn = document.createElement("button");
    btn.className = "sequence-choice";
    btn.textContent = icon;
    btn.setAttribute("aria-label", icon);
    btn.addEventListener("click", () => onPick(btn, icon));
    choices.appendChild(btn);
  });
  choicesBlock.appendChild(choices);
  wrap.appendChild(choicesBlock);

  area.appendChild(wrap);
  Speech.say("Какой картинки не хватает в конце?");
}

function onPick(btn, icon) {
  if (busy) return;
  busy = true;
  Audio.click();

  if (icon === answer) {
    btn.classList.add("bounce", "sequence-choice--ok");
    const q = area.querySelector(".sequence-cell--question");
    if (q) {
      q.textContent = icon;
      q.classList.remove("sequence-cell--question");
      q.classList.add("bounce");
    }
    Audio.correct();
    Speech.say("Правильно! Молодец!");
    round++;
    if (round >= ROUNDS_NEEDED) {
      setTimeout(() => onComplete?.(), 700);
    } else {
      setTimeout(() => startRound(), 900);
    }
  } else {
    btn.classList.add("shake", "sequence-choice--bad");
    Audio.wrong();
    Speech.say("Попробуй ещё раз.");
    setTimeout(() => {
      btn.classList.remove("shake", "sequence-choice--bad");
      busy = false;
    }, 500);
  }
}

export const SequenceGame = {
  start(gameArea, completeCb) {
    area = gameArea;
    onComplete = completeCb;
    round = 0;
    usedPairs.clear();
    startRound();
  },

  help() {
    Speech.say("Какой картинки не хватает в конце?");
  },

  destroy() {
    busy = true;
    if (area) area.innerHTML = "";
  },
};
