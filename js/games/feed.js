import { Speech } from "../speech.js";
import { Audio } from "../audio.js";

const ANIMALS = [
  { id: "giraffe", name: "жираф", feed: "жирафа", hungry: "голодный", img: "assets/animals/giraffe.svg" },
  { id: "elephant", name: "слон", feed: "слона", hungry: "голодный", img: "assets/animals/elephant.svg" },
  { id: "fox", name: "лисичка", feed: "лисичку", hungry: "голодная", img: "assets/animals/fox.svg" },
  { id: "panda", name: "панда", feed: "панду", hungry: "голодная", img: "assets/animals/panda.svg" },
  { id: "rabbit", name: "зайчик", feed: "зайчика", hungry: "голодный", img: "assets/animals/rabbit.svg" },
  { id: "lion", name: "лев", feed: "льва", hungry: "голодный", img: "assets/animals/lion.svg" },
  { id: "hippo", name: "бегемот", feed: "бегемота", hungry: "голодный", img: "assets/animals/hippo.svg" },
  { id: "zebra", name: "зебра", feed: "зебру", hungry: "голодная", img: "assets/animals/zebra.svg" },
  { id: "cat", name: "котик", feed: "котика", hungry: "голодный", img: "assets/animals/cat.svg" },
  { id: "dog", name: "собачка", feed: "собачку", hungry: "голодная", img: "assets/animals/dog.svg" },
  { id: "bear", name: "мишка", feed: "мишку", hungry: "голодный", img: "assets/animals/bear.svg" },
  { id: "owl", name: "сова", feed: "сову", hungry: "голодная", img: "assets/animals/owl.svg" },
  { id: "monkey", name: "обезьянка", feed: "обезьянку", hungry: "голодная", img: "assets/animals/monkey.svg" },
];

const NUMBER_WORDS = [
  "ноль",
  "один",
  "два",
  "три",
  "четыре",
  "пять",
  "шесть",
  "семь",
  "восемь",
  "девять",
  "десять",
  "одиннадцать",
  "двенадцать",
  "тринадцать",
  "четырнадцать",
  "пятнадцать",
];

const ROUNDS_NEEDED = 10;

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickUniqueNumbers(count) {
  const pool = shuffle(Array.from({ length: 16 }, (_, i) => i));
  return pool.slice(0, count);
}

let round = 0;
let target = 0;
let animal = null;
let numbers = [];
let animals = [];
let onComplete = null;
let area = null;
let busy = false;
let inputEl = null;
let lastInstruction = "";

function hungryText(a) {
  const title = a.name[0].toUpperCase() + a.name.slice(1);
  return `Ой! ${title} очень ${a.hungry} и хочет кушать!`;
}

function fedText(a) {
  const title = a.name[0].toUpperCase() + a.name.slice(1);
  const done = a.hungry === "голодная" ? "накормлена" : "накормлен";
  return `${title} ${done}! Молодец!`;
}

function taskText(a, n) {
  return `Чтобы накормить ${a.feed}, напиши ${n}`;
}

function taskVoice(a, n) {
  return `Чтобы накормить ${a.feed}, напиши ${NUMBER_WORDS[n]}`;
}

function startRound() {
  busy = false;
  animal = animals[round];
  target = numbers[round];

  const hungry = hungryText(animal);
  const task = taskText(animal, target);
  lastInstruction = taskVoice(animal, target);

  document.getElementById("game-character").textContent = "🥕";
  document.getElementById("game-instruction").textContent = hungry;

  area.innerHTML = "";
  area.style.position = "relative";

  const wrap = document.createElement("div");
  wrap.className = "feed-layout";
  wrap.innerHTML = `
    <div class="feed-animal-card">
      <img class="feed-animal-img" src="${animal.img}" alt="${animal.name}" />
      <p class="feed-hungry">${hungry}</p>
    </div>
    <div class="feed-task">
      <p class="feed-task-text">${task}</p>
      <input
        class="feed-input"
        type="text"
        inputmode="numeric"
        pattern="[0-9]*"
        maxlength="2"
        autocomplete="off"
        aria-label="Введи число"
        placeholder="?"
      />
      <p class="feed-hint">Нажми цифры на клавиатуре</p>
      <p class="feed-round">Угощение ${round + 1} из ${ROUNDS_NEEDED}</p>
    </div>
  `;
  area.appendChild(wrap);

  inputEl = wrap.querySelector(".feed-input");
  inputEl.addEventListener("input", onInput);
  inputEl.addEventListener("keydown", (e) => {
    if (e.key === "Enter") checkAnswer();
  });

  // Focus after paint so keyboard works immediately
  requestAnimationFrame(() => inputEl?.focus());

  Speech.say(hungry).then(() => Speech.say(lastInstruction));
}

function onInput() {
  if (busy || !inputEl) return;
  // Keep only digits
  const cleaned = inputEl.value.replace(/\D/g, "").slice(0, 2);
  if (cleaned !== inputEl.value) inputEl.value = cleaned;

  if (cleaned === "") return;

  // Auto-check when length matches target (e.g. "8" or "15")
  const targetStr = String(target);
  if (cleaned.length >= targetStr.length) {
    checkAnswer();
  }
}

function checkAnswer() {
  if (busy || !inputEl) return;
  const value = inputEl.value.replace(/\D/g, "");
  if (value === "") return;

  if (Number(value) === target) {
    busy = true;
    Audio.correct();
    const card = area.querySelector(".feed-animal-card");
    card?.classList.add("feed-animal-card--happy", "bounce");
    inputEl.classList.add("feed-input--ok");
    inputEl.blur();

    Speech.say(fedText(animal)).then(() => {
      round++;
      if (round >= ROUNDS_NEEDED) {
        setTimeout(() => onComplete?.(), 400);
      } else {
        setTimeout(() => startRound(), 600);
      }
    });
  } else {
    Audio.wrong();
    inputEl.classList.add("shake", "feed-input--bad");
    Speech.say(`Попробуй ещё раз. Напиши ${NUMBER_WORDS[target]}.`);
    setTimeout(() => {
      inputEl.classList.remove("shake", "feed-input--bad");
      inputEl.value = "";
      inputEl.focus();
    }, 450);
  }
}

export const FeedGame = {
  start(gameArea, completeCb) {
    area = gameArea;
    onComplete = completeCb;
    round = 0;
    busy = false;
    numbers = pickUniqueNumbers(ROUNDS_NEEDED);
    animals = shuffle(ANIMALS).slice(0, ROUNDS_NEEDED);
    startRound();
  },

  help() {
    if (lastInstruction) {
      Speech.say(lastInstruction);
      inputEl?.focus();
    }
  },

  destroy() {
    busy = true;
    inputEl = null;
    if (area) area.innerHTML = "";
  },
};
