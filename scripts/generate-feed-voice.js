/**
 * Generates ONLY feed-game voice clips.
 * Run: node scripts/generate-feed-voice.js
 */
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { EdgeTTS } = require("node-edge-tts");

const OUT_DIR = path.join(__dirname, "..", "assets", "voice");
const MANIFEST = path.join(OUT_DIR, "manifest.json");

const ANIMALS = [
  { name: "жираф", feed: "жирафа", hungry: "голодный", done: "накормлен" },
  { name: "слон", feed: "слона", hungry: "голодный", done: "накормлен" },
  { name: "лисичка", feed: "лисичку", hungry: "голодная", done: "накормлена" },
  { name: "панда", feed: "панду", hungry: "голодная", done: "накормлена" },
  { name: "зайчик", feed: "зайчика", hungry: "голодный", done: "накормлен" },
  { name: "лев", feed: "льва", hungry: "голодный", done: "накормлен" },
  { name: "бегемот", feed: "бегемота", hungry: "голодный", done: "накормлен" },
  { name: "зебра", feed: "зебру", hungry: "голодная", done: "накормлена" },
  { name: "котик", feed: "котика", hungry: "голодный", done: "накормлен" },
  { name: "собачка", feed: "собачку", hungry: "голодная", done: "накормлена" },
  { name: "мишка", feed: "мишку", hungry: "голодный", done: "накормлен" },
  { name: "сова", feed: "сову", hungry: "голодная", done: "накормлена" },
  { name: "обезьянка", feed: "обезьянку", hungry: "голодная", done: "накормлена" },
];

const NUMBERS = [
  "ноль", "один", "два", "три", "четыре", "пять", "шесть", "семь",
  "восемь", "девять", "десять", "одиннадцать", "двенадцать",
  "тринадцать", "четырнадцать", "пятнадцать",
];

function keyFor(text) {
  return crypto.createHash("sha1").update(text.trim().toLowerCase()).digest("hex");
}

function buildPhrases() {
  const set = new Set();
  for (const a of ANIMALS) {
    const title = a.name[0].toUpperCase() + a.name.slice(1);
    set.add(`Ой! ${title} очень ${a.hungry} и хочет кушать!`);
    set.add(`${title} ${a.done}! Молодец!`);
    for (let n = 0; n <= 15; n++) {
      set.add(`Чтобы накормить ${a.feed}, напиши ${NUMBERS[n]}`);
      set.add(`Попробуй ещё раз. Напиши ${NUMBERS[n]}.`);
    }
  }
  set.add("Нажми цифры на клавиатуре");
  return [...set];
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const phrases = buildPhrases();
  console.log(`Feed phrases: ${phrases.length}`);

  const tts = new EdgeTTS({
    voice: "ru-RU-SvetlanaNeural",
    lang: "ru-RU",
    outputFormat: "audio-24khz-96kbitrate-mono-mp3",
    rate: "-5%",
    pitch: "+5%",
    timeout: 30000,
  });

  const manifest = fs.existsSync(MANIFEST)
    ? JSON.parse(fs.readFileSync(MANIFEST, "utf8"))
    : {};

  let done = 0;
  let skipped = 0;

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
      const sub = full.replace(/\.mp3$/, ".json");
      if (fs.existsSync(sub)) fs.unlinkSync(sub);
      manifest[text] = `assets/voice/${file}`;
      done++;
      console.log(`✓ ${done}: ${text.slice(0, 50)}`);
    } catch (e) {
      console.error(`✗ ${text.slice(0, 40)}: ${e.message}`);
    }
    await new Promise((r) => setTimeout(r, 100));
  }

  fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2));
  console.log(`Done. new=${done} skipped=${skipped}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
