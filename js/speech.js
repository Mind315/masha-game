let voiceEnabled = true;
let currentAudio = null;
let preferredVoice = null;
let manifest = null;
let manifestLoading = null;

function keyNormalize(text) {
  return String(text || "").trim();
}

function pickVoice() {
  const voices = speechSynthesis.getVoices();
  const ru = voices.filter((v) => v.lang.toLowerCase().startsWith("ru"));

  preferredVoice =
    ru.find((v) => /neural|natural|online|google/i.test(v.name)) ||
    ru.find((v) => /svetlana|irina|milena|elena|anna|dariya|female|woman/i.test(v.name)) ||
    ru[0] ||
    voices.find((v) => /neural|natural/i.test(v.name)) ||
    voices[0] ||
    null;
}

if (typeof speechSynthesis !== "undefined") {
  pickVoice();
  speechSynthesis.onvoiceschanged = pickVoice;
}

const OBJECT_VOICES = {
  apple: "Яблоко",
  mushroom: "Гриб",
  acorn: "Жёлудь",
  flower: "Цветок",
  squirrel: "Белка",
  berry: "Ягодка",
  leaf: "Листок",
  bunny: "Зайчик",
  fox: "Лисичка",
  hedgehog: "Ёжик",
  tree: "Дерево",
  bird: "Птичка",
  butterfly: "Бабочка",
  stone: "Камень",
  bee: "Пчёлка",
};

const NUMBER_WORDS = [
  "",
  "Один",
  "Два",
  "Три",
  "Четыре",
  "Пять",
  "Шесть",
  "Семь",
  "Восемь",
  "Девять",
  "Десять",
  "Одиннадцать",
  "Двенадцать",
  "Тринадцать",
  "Четырнадцать",
  "Пятнадцать",
  "Шестнадцать",
  "Семнадцать",
  "Восемнадцать",
  "Девятнадцать",
  "Двадцать",
];

async function loadManifest() {
  if (manifest) return manifest;
  if (manifestLoading) return manifestLoading;

  manifestLoading = fetch("assets/voice/manifest.json")
    .then((r) => (r.ok ? r.json() : {}))
    .then((data) => {
      manifest = data || {};
      return manifest;
    })
    .catch(() => {
      manifest = {};
      return manifest;
    });

  return manifestLoading;
}

function stopAudio() {
  if (currentAudio) {
    currentAudio.onended = null;
    currentAudio.onerror = null;
    currentAudio.pause();
    currentAudio.src = "";
    currentAudio = null;
  }
}

function playFile(url) {
  return new Promise((resolve) => {
    stopAudio();
    const audio = new Audio(url);
    currentAudio = audio;
    audio.onended = () => {
      if (currentAudio === audio) currentAudio = null;
      resolve();
    };
    audio.onerror = () => {
      if (currentAudio === audio) currentAudio = null;
      resolve("fallback");
    };
    const p = audio.play();
    if (p && typeof p.catch === "function") {
      p.catch(() => {
        if (currentAudio === audio) currentAudio = null;
        resolve("fallback");
      });
    }
  });
}

function speakWeb(text) {
  if (typeof speechSynthesis === "undefined") return Promise.resolve();

  return new Promise((resolve) => {
    speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "ru-RU";
    utter.rate = 0.88;
    utter.pitch = 1.05;
    if (preferredVoice) utter.voice = preferredVoice;

    utter.onend = () => resolve();
    utter.onerror = () => resolve();
    speechSynthesis.speak(utter);
  });
}

export const Speech = {
  async init() {
    await loadManifest();
  },

  setEnabled(on) {
    voiceEnabled = on;
    if (!on) this.stop();
  },

  stop() {
    stopAudio();
    if (typeof speechSynthesis !== "undefined") {
      speechSynthesis.cancel();
    }
  },

  async say(text, { interrupt = true } = {}) {
    const phrase = keyNormalize(text);
    if (!voiceEnabled || !phrase) return;

    if (interrupt) this.stop();

    const map = await loadManifest();
    const url = map[phrase];

    if (url) {
      const result = await playFile(url);
      if (result !== "fallback") return;
    }

    // Try case-insensitive match
    const found = Object.keys(map).find((k) => k.toLowerCase() === phrase.toLowerCase());
    if (found) {
      const result = await playFile(map[found]);
      if (result !== "fallback") return;
    }

    return speakWeb(phrase);
  },

  sayObject(id) {
    return this.say(OBJECT_VOICES[id] || id);
  },

  sayNumber(n) {
    return this.say(NUMBER_WORDS[n] || String(n));
  },

  numberWord(n) {
    return NUMBER_WORDS[n] || String(n);
  },

  objectName(id) {
    return OBJECT_VOICES[id] || id;
  },

  get objects() {
    return OBJECT_VOICES;
  },
};

// Warm up manifest early
loadManifest();
