/**
 * Generates neural Russian voice clips via Microsoft Edge TTS.
 * Run: npm run voice
 */
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { EdgeTTS } = require("node-edge-tts");

const OUT_DIR = path.join(__dirname, "..", "assets", "voice");
const MANIFEST = path.join(OUT_DIR, "manifest.json");

const VOICE = "ru-RU-SvetlanaNeural";
const LANG = "ru-RU";

function keyFor(text) {
  return crypto.createHash("sha1").update(text.trim().toLowerCase()).digest("hex");
}

function pluralize(n, forms) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return forms[0];
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return forms[1];
  return forms[2];
}

const NUM_WORDS = {
  masc: ["", "один", "два", "три", "четыре", "пять", "шесть", "семь", "восемь", "девять", "десять", "одиннадцать", "двенадцать", "тринадцать", "четырнадцать", "пятнадцать"],
  fem: ["", "одну", "две", "три", "четыре", "пять", "шесть", "семь", "восемь", "девять", "десять", "одиннадцать", "двенадцать", "тринадцать", "четырнадцать", "пятнадцать"],
  neuter: ["", "одно", "два", "три", "четыре", "пять", "шесть", "семь", "восемь", "девять", "десять", "одиннадцать", "двенадцать", "тринадцать", "четырнадцать", "пятнадцать"],
};

function buildPhrases() {
  const set = new Set();
  const add = (t) => {
    if (t && String(t).trim()) set.add(String(t).trim());
  };

  // UI / navigation
  [
    "Привет! Давай исследуем остров!",
    "Лес! Давай пойдём исследовать лес!",
    "Выбери игру на карте леса!",
    "Назад",
    "Возвращаемся на остров!",
    "Ура! Ты выполнил задание! Получай звёздочку!",
    "Ты выполнил задание! Получай звёздочку!",
    "Снова получилось! Ты молодец!",
    "Эта игра скоро появится!",
    "Эта игра скоро откроется!",
    "Прогресс сброшен.",
    "Скоро здесь будет ферма!",
    "Скоро здесь будет город!",
    "Скоро здесь будет море!",
    "Скоро здесь будет космос!",
    "Правильно! Молодец!",
    "У тебя получилось!",
    "Попробуй ещё раз.",
    "Хм... Давай посмотрим внимательно.",
  ].forEach(add);

  // Numbers
  const numbers = [
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
  ];
  numbers.filter(Boolean).forEach(add);

  // Objects: [singular, gen-sg for 2-4, gen-pl for 5+, title, gender]
  const objects = [
    { forms: ["яблоко", "яблока", "яблок", "Яблоко"], gender: "neuter" },
    { forms: ["гриб", "гриба", "грибов", "Гриб"], gender: "masc" },
    { forms: ["жёлудь", "жёлудя", "желудей", "Жёлудь"], gender: "masc" },
    { forms: ["цветок", "цветка", "цветков", "Цветок"], gender: "masc" },
    { forms: ["ягодку", "ягодки", "ягодок", "Ягодка"], gender: "fem" },
  ];
  objects.forEach((o) => o.forms.forEach(add));

  // Counting instructions — number as words (correct grammar for TTS)
  for (let n = 1; n <= 15; n++) {
    for (const obj of objects) {
      const num = NUM_WORDS[obj.gender][n];
      add(`Помоги собрать ${num} ${pluralize(n, obj.forms)}!`);
    }
  }

  // Shapes
  const shapes = [
    "круг",
    "квадрат",
    "треугольник",
    "прямоугольник",
    "ромб",
    "звезда",
    "овал",
    "шестиугольник",
  ];
  shapes.forEach((s) => {
    const titled = s[0].toUpperCase() + s.slice(1);
    add(s);
    add(titled);
    add(`Найди ${s}!`);
    add(`Найди ${s}.`);
    add(`Посмотри! Где спрятался ${s}?`);
    add(`${titled}! Правильно!`);
    add(`Попробуй найти ${s}.`);
  });

  // Colors
  const colors = [
    "красный",
    "оранжевый",
    "жёлтый",
    "зелёный",
    "голубой",
    "синий",
    "фиолетовый",
    "розовый",
    "коричневый",
    "белый",
    "чёрный",
    "серый",
    "бирюзовый",
    "салатовый",
    "бежевый",
  ];
  colors.forEach((c) => {
    const titled = c[0].toUpperCase() + c.slice(1);
    add(c);
    add(titled);
    add(`Найди ${c} цвет!`);
    add(`Найди ${c} цвет.`);
    add(`${titled}! Молодец!`);
    add(`Попробуй ещё раз. Найди ${c}.`);
  });

  // Memory
  [
    "Запомни картинки!",
    "Найди одинаковые картинки!",
    "Найди две одинаковые картинки.",
    "Ура! Ты всё нашёл!",
  ].forEach(add);

  // Search objects (accusative forms used in game)
  const searchNames = [
    "гриб",
    "яблоко",
    "белку",
    "цветок",
    "ёжика",
    "птичку",
    "бабочку",
    "жёлудь",
    "пчёлку",
    "зайчика",
  ];
  searchNames.forEach((name) => {
    add(`Найди ${name}!`);
    add(`Найди ${name}.`);
    add(`Вот ${name}! Ты нашёл!`);
  });
  for (let i = 0; i < searchNames.length; i++) {
    for (let j = i + 1; j < searchNames.length; j++) {
      add(`Найди ${searchNames[i]} и ${searchNames[j]}!`);
      add(`Найди ${searchNames[i]} и ${searchNames[j]}.`);
    }
  }

  return [...set];
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const phrases = buildPhrases();
  console.log(`Phrases to generate: ${phrases.length}`);

  const tts = new EdgeTTS({
    voice: VOICE,
    lang: LANG,
    outputFormat: "audio-24khz-96kbitrate-mono-mp3",
    rate: "-5%",
    pitch: "+5%",
    timeout: 30000,
  });

  const manifest = fs.existsSync(MANIFEST) ? JSON.parse(fs.readFileSync(MANIFEST, "utf8")) : {};
  let done = 0;
  let skipped = 0;
  let failed = 0;

  for (const text of phrases) {
    const key = keyFor(text);
    const file = `${key}.mp3`;
    const full = path.join(OUT_DIR, file);

    if (fs.existsSync(full) && fs.statSync(full).size > 500) {
      manifest[text] = `assets/voice/${file}`;
      skipped++;
      continue;
    }

    try {
      await tts.ttsPromise(text, full);
      // remove subtitle json if created
      const sub = full.replace(/\.mp3$/, ".json");
      if (fs.existsSync(sub)) fs.unlinkSync(sub);

      if (!fs.existsSync(full) || fs.statSync(full).size < 200) {
        throw new Error("empty audio");
      }
      manifest[text] = `assets/voice/${file}`;
      done++;
      process.stdout.write(`✓ ${done}/${phrases.length}: ${text.slice(0, 40)}\n`);
    } catch (err) {
      failed++;
      console.error(`✗ "${text.slice(0, 50)}": ${err.message}`);
      // small delay and retry once
      try {
        await new Promise((r) => setTimeout(r, 800));
        await tts.ttsPromise(text, full);
        const sub = full.replace(/\.mp3$/, ".json");
        if (fs.existsSync(sub)) fs.unlinkSync(sub);
        if (fs.existsSync(full) && fs.statSync(full).size > 200) {
          manifest[text] = `assets/voice/${file}`;
          done++;
          failed--;
          process.stdout.write(`✓ retry: ${text.slice(0, 40)}\n`);
        }
      } catch (e2) {
        console.error(`  retry failed: ${e2.message}`);
      }
    }

    // be polite to the service
    await new Promise((r) => setTimeout(r, 120));
  }

  fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2), "utf8");
  console.log(`\nDone. new=${done} skipped=${skipped} failed=${failed}`);
  console.log(`Manifest: ${MANIFEST} (${Object.keys(manifest).length} entries)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
