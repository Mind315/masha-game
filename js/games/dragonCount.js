import { Speech } from "../speech.js";
import { Audio } from "../audio.js";

const DRAGON_SRC = "assets/drago.png";
const ROUNDS_NEEDED = 3;

const COLORS = [
  { id: "red", hex: "#e74c3c" },
  { id: "orange", hex: "#e67e22" },
  { id: "yellow", hex: "#f1c40f" },
  { id: "green", hex: "#27ae60" },
  { id: "blue", hex: "#2980b9" },
  { id: "purple", hex: "#8e44ad" },
  { id: "pink", hex: "#ff6b9d" },
  { id: "teal", hex: "#1abc9c" },
];

const STAGE_RANGE = [
  { min: 1, max: 5 },
  { min: 3, max: 8 },
  { min: 5, max: 12 },
];

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

let round = 0;
let target = 0;
let color = null;
let onComplete = null;
let area = null;
let busy = false;
let inputEl = null;

function startRound() {
  busy = false;
  const range = STAGE_RANGE[round] || STAGE_RANGE[STAGE_RANGE.length - 1];
  target = rand(range.min, range.max);
  color = pick(COLORS);

  document.getElementById("game-character").textContent = "🐉";
  document.getElementById("game-instruction").textContent =
    "Сколько драконов? Напиши число!";

  area.innerHTML = "";
  area.style.position = "relative";

  const wrap = document.createElement("div");
  wrap.className = "dragon-count";

  const field = document.createElement("div");
  field.className = "dragon-count__field";

  for (let i = 0; i < target; i++) {
    const item = document.createElement("div");
    item.className = "dragon-count__item";
    item.style.setProperty("--dragon-color", color.hex);
    item.style.setProperty("--rot", `${rand(-8, 8)}deg`);
    item.style.setProperty("--delay", `${i * 0.04}s`);
    item.innerHTML = `<img src="${DRAGON_SRC}" alt="" draggable="false" />`;
    field.appendChild(item);
  }

  const panel = document.createElement("div");
  panel.className = "dragon-count__panel";
  panel.innerHTML = `
    <p class="dragon-count__ask">Сколько драконов?</p>
    <input
      class="dragon-count__input"
      type="text"
      inputmode="numeric"
      pattern="[0-9]*"
      maxlength="2"
      autocomplete="off"
      aria-label="Введи число"
      placeholder="?"
    />
    <p class="dragon-count__hint">Нажми цифры на клавиатуре</p>
    <p class="dragon-count__stage">Этап ${round + 1} из ${ROUNDS_NEEDED}</p>
  `;

  wrap.appendChild(field);
  wrap.appendChild(panel);
  area.appendChild(wrap);

  inputEl = panel.querySelector(".dragon-count__input");
  inputEl.addEventListener("input", onInput);
  inputEl.addEventListener("keydown", (e) => {
    if (e.key === "Enter") checkAnswer();
  });
  requestAnimationFrame(() => inputEl?.focus());

  Speech.say("Сколько драконов?");
}

function onInput() {
  if (busy || !inputEl) return;
  const cleaned = inputEl.value.replace(/\D/g, "").slice(0, 2);
  if (cleaned !== inputEl.value) inputEl.value = cleaned;
  // Wait until enough digits (so "10" is not checked after typing just "1")
  const needLen = String(target).length;
  if (cleaned.length >= needLen) checkAnswer();
}

async function checkAnswer() {
  if (busy || !inputEl) return;
  const value = inputEl.value.replace(/\D/g, "");
  if (!value) return;

  const needLen = String(target).length;
  if (value.length < needLen) return;

  const num = Number(value);
  busy = true;
  Audio.click();

  if (num === target) {
    inputEl.classList.add("dragon-count__input--ok");
    inputEl.blur();
    Audio.correct();
    round++;
    if (round >= ROUNDS_NEEDED) {
      setTimeout(() => onComplete?.(), 400);
    } else {
      setTimeout(() => startRound(), 600);
    }
  } else {
    inputEl.classList.add("shake", "dragon-count__input--bad");
    Audio.wrong();
    setTimeout(() => {
      inputEl.classList.remove("shake", "dragon-count__input--bad");
      inputEl.value = "";
      inputEl.focus();
      busy = false;
    }, 450);
  }
}

export const DragonCountGame = {
  start(gameArea, completeCb) {
    area = gameArea;
    onComplete = completeCb;
    round = 0;
    busy = false;
    startRound();
  },

  help() {
    Speech.say("Сколько драконов?");
  },

  destroy() {
    busy = true;
    inputEl = null;
    if (area) area.innerHTML = "";
  },
};
