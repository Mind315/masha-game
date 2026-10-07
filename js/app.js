import { Progress } from "./progress.js";
import { Speech } from "./speech.js";
import { Audio } from "./audio.js";
import { CountingGame } from "./games/counting.js";
import { DragonCountGame } from "./games/dragonCount.js";
import { DragonBasketGame } from "./games/dragonBasket.js";
import { ShapesGame } from "./games/shapes.js";
import { ColorsGame } from "./games/colors.js";
import { MemoryGame } from "./games/memory.js";
import { SearchGame } from "./games/search.js";
import { FeedGame } from "./games/feed.js";
import { PairsGame } from "./games/pairs.js";
import { SequenceGame } from "./games/sequence.js";
import { OddOneOutGame } from "./games/oddOneOut.js";
import { BuildForestGame } from "./games/buildForest.js";
import { SeaBoatsGame } from "./games/seaBoats.js";
import { SeaFishGame } from "./games/seaFish.js";

const GAMES = {
  counting: CountingGame,
  dragonCount: DragonCountGame,
  dragonBasket: DragonBasketGame,
  shapes: ShapesGame,
  colors: ColorsGame,
  memory: MemoryGame,
  search: SearchGame,
  feed: FeedGame,
  pairs: PairsGame,
  sequence: SequenceGame,
  oddOneOut: OddOneOutGame,
  buildForest: BuildForestGame,
  seaBoats: SeaBoatsGame,
  seaFish: SeaFishGame,
};

const WORLD_LABEL = {
  forest: "леса",
  sea: "моря",
};

let currentScreen = "island";
let currentWorld = "forest";
let currentGame = null;
let parentsHoldTimer = null;

function $(id) {
  return document.getElementById(id);
}

function showScreen(id) {
  document.querySelectorAll(".screen").forEach((s) => s.classList.remove("screen--active"));
  const el = $(`screen-${id}`);
  if (el) {
    el.classList.add("screen--active");
    currentScreen = id;
  }
}

function refreshUI() {
  const forestStars = Progress.forestStars();
  const forestTotal = Progress.forestTotal();
  const seaStars = Progress.seaStars();
  const seaTotal = Progress.seaTotal();
  const islandStars = Progress.islandStars();
  const islandTotal = Progress.islandTotal();

  const islandStarsEl = $("island-stars");
  if (islandStarsEl) islandStarsEl.textContent = Progress.starsDisplay(islandStars, islandTotal);

  const islandCount = $("island-count");
  if (islandCount) islandCount.textContent = `${islandStars} / ${islandTotal}`;

  const forestLabel = $("forest-stars-label");
  if (forestLabel) forestLabel.textContent = `⭐ ${forestStars} / ${forestTotal}`;

  const seaLabel = $("sea-stars-label");
  if (seaLabel) seaLabel.textContent = `⭐ ${seaStars} / ${seaTotal}`;

  const worldStars = currentWorld === "sea" ? seaStars : forestStars;
  const worldTotal = currentWorld === "sea" ? seaTotal : forestTotal;
  const gameLabel = $("game-stars-label");
  if (gameLabel) gameLabel.textContent = `⭐ ${worldStars} / ${worldTotal}`;

  const forestLoc = $("forest-loc-stars");
  if (forestLoc) forestLoc.textContent = `⭐ ${forestStars}/${forestTotal}`;

  const seaLoc = $("sea-loc-stars");
  if (seaLoc) seaLoc.textContent = `⭐ ${seaStars}/${seaTotal}`;

  document.querySelectorAll(".game-spot[data-game]").forEach((spot) => {
    const id = spot.dataset.game;
    const world = spot.dataset.world || Progress.worldOf(id);
    const active =
      world === "sea" ? Progress.activeSeaIds().includes(id) : Progress.activeForestIds().includes(id);
    if (!active) return;
    const starEl = spot.querySelector(".game-spot__star");
    if (Progress.isComplete(id)) {
      spot.classList.add("game-spot--done");
      if (starEl) starEl.textContent = "⭐";
    } else {
      spot.classList.remove("game-spot--done");
      if (starEl) starEl.textContent = "";
    }
  });
}

function applySettings() {
  const s = Progress.getSettings();
  Speech.setEnabled(s.voice);
  Audio.setSound(s.sound);
  Audio.setMusic(s.music);
  $("opt-sound").checked = s.sound;
  $("opt-music").checked = s.music;
  $("opt-voice").checked = s.voice;
}

function openOverlay(id) {
  $(id).hidden = false;
}

function closeOverlay(id) {
  $(id).hidden = true;
}

function showConfetti() {
  const box = $("confetti");
  box.innerHTML = "";
  const emojis = ["⭐", "🎉", "✨", "🌟", "🎊", "💛"];
  for (let i = 0; i < 24; i++) {
    const span = document.createElement("span");
    span.textContent = emojis[i % emojis.length];
    span.style.left = `${Math.random() * 100}%`;
    span.style.animationDelay = `${Math.random() * 0.8}s`;
    span.style.animationDuration = `${1.4 + Math.random()}s`;
    box.appendChild(span);
  }
}

function onGameComplete(gameId) {
  const wasNew = !Progress.isComplete(gameId);
  Progress.complete(gameId);
  Audio.star();
  showConfetti();
  $("success-text").textContent = wasNew
    ? "Ты выполнил задание! Получай звёздочку!"
    : "Снова получилось! Ты молодец!";
  $("btn-success-ok").textContent = `К карте ${WORLD_LABEL[currentWorld] || "леса"}`;
  openOverlay("overlay-success");
  Speech.say("Ура! Ты выполнил задание! Получай звёздочку!");
  refreshUI();
}

function startGame(gameId) {
  const game = GAMES[gameId];
  if (!game) {
    Speech.say("Эта игра скоро появится!");
    return;
  }

  if (currentGame?.destroy) currentGame.destroy();
  Speech.stop();
  Audio.whoosh();

  currentWorld = Progress.worldOf(gameId);
  currentGame = game;
  showScreen("game");
  refreshUI();
  const area = $("game-area");
  area.innerHTML = "";
  game.start(area, () => onGameComplete(gameId));
}

function leaveGame() {
  Speech.stop();
  if (currentGame?.destroy) currentGame.destroy();
  currentGame = null;
  showScreen(currentWorld);
  refreshUI();
}

function enterForest() {
  Audio.whoosh();
  currentWorld = "forest";
  showScreen("forest");
  refreshUI();
  $("forest-guide-text").textContent = "Выбери игру на карте леса!";
  Speech.say("Лес! Давай пойдём исследовать лес!");
}

function enterSea() {
  Audio.whoosh();
  currentWorld = "sea";
  showScreen("sea");
  refreshUI();
  $("sea-guide-text").textContent = "Выбери игру на карте моря!";
  Speech.say("Море! Давай пойдём исследовать море!");
}

function backToIsland() {
  Speech.stop();
  Audio.whoosh();
  showScreen("island");
  refreshUI();
  Speech.say("Возвращаемся на остров!");
}

function fillParentsList() {
  const list = $("parents-list");
  list.innerHTML = "";

  const addSection = (title, games) => {
    const header = document.createElement("li");
    header.className = "parents-section";
    header.innerHTML = `<strong>${title}</strong>`;
    list.appendChild(header);
    games.forEach((g) => {
      const li = document.createElement("li");
      const done = Progress.isComplete(g.id);
      li.innerHTML = `<span>${g.name}</span><span>${done ? "⭐" : "☆"}</span>`;
      list.appendChild(li);
    });
  };

  addSection("Лес", Progress.forestGames());
  addSection("Море", Progress.seaGames());
  $("parents-total").textContent = `${Progress.islandStars()} / ${Progress.islandTotal()} игр`;
}

function bindEvents() {
  $("loc-forest").addEventListener("mouseenter", () => {
    Audio.click();
  });
  $("loc-forest").addEventListener("click", enterForest);

  $("loc-sea").addEventListener("mouseenter", () => {
    Audio.click();
  });
  $("loc-sea").addEventListener("click", enterSea);

  document.querySelectorAll(".location--locked").forEach((btn) => {
    btn.addEventListener("click", () => {
      const name = btn.querySelector(".location__name")?.textContent || "локация";
      Speech.say(`Скоро здесь будет ${name.toLowerCase()}!`);
    });
  });

  $("btn-back-island").addEventListener("mouseenter", () => Speech.say("Назад", { interrupt: false }));
  $("btn-back-island").addEventListener("click", backToIsland);

  $("btn-back-island-sea").addEventListener("mouseenter", () => Speech.say("Назад", { interrupt: false }));
  $("btn-back-island-sea").addEventListener("click", backToIsland);

  $("btn-back-world").addEventListener("click", leaveGame);

  document.querySelectorAll(".game-spot").forEach((spot) => {
    spot.addEventListener("click", () => {
      if (spot.disabled || spot.classList.contains("game-spot--locked")) {
        Speech.say("Эта игра скоро откроется!");
        return;
      }
      const id = spot.dataset.game;
      if (spot.dataset.world) currentWorld = spot.dataset.world;
      startGame(id);
    });
  });

  $("btn-help").addEventListener("click", () => {
    Audio.click();
    currentGame?.help?.();
  });

  $("btn-success-ok").addEventListener("click", () => {
    closeOverlay("overlay-success");
    leaveGame();
  });

  $("btn-settings").addEventListener("click", () => {
    applySettings();
    openOverlay("overlay-settings");
  });
  $("btn-settings-close").addEventListener("click", () => {
    Progress.updateSettings({
      sound: $("opt-sound").checked,
      music: $("opt-music").checked,
      voice: $("opt-voice").checked,
    });
    applySettings();
    closeOverlay("overlay-settings");
  });
  $("opt-sound").addEventListener("change", (e) => {
    Progress.updateSettings({ sound: e.target.checked });
    Audio.setSound(e.target.checked);
  });
  $("opt-music").addEventListener("change", (e) => {
    Progress.updateSettings({ music: e.target.checked });
    Audio.setMusic(e.target.checked);
  });
  $("opt-voice").addEventListener("change", (e) => {
    Progress.updateSettings({ voice: e.target.checked });
    Speech.setEnabled(e.target.checked);
  });

  const parentsBtn = $("btn-parents");
  let parentsHoldStarted = 0;
  const HOLD_MS = 3000;

  const startHold = (e) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    e.preventDefault();
    clearTimeout(parentsHoldTimer);
    parentsHoldStarted = Date.now();
    parentsBtn.classList.add("btn-parents--holding");
    parentsBtn.setPointerCapture?.(e.pointerId);
    parentsHoldTimer = setTimeout(() => {
      parentsBtn.classList.remove("btn-parents--holding");
      parentsHoldStarted = 0;
      fillParentsList();
      openOverlay("overlay-parents");
      Audio.click();
    }, HOLD_MS);
  };

  const cancelHold = (e) => {
    const held = parentsHoldStarted ? Date.now() - parentsHoldStarted : 0;
    clearTimeout(parentsHoldTimer);
    parentsHoldTimer = null;
    parentsBtn.classList.remove("btn-parents--holding");
    if (held > 0 && held < HOLD_MS) {
      parentsBtn.classList.add("btn-parents--hint");
      parentsBtn.title = "Удерживайте 3 секунды";
      setTimeout(() => parentsBtn.classList.remove("btn-parents--hint"), 1200);
    }
    parentsHoldStarted = 0;
    if (e?.pointerId != null) {
      try {
        parentsBtn.releasePointerCapture?.(e.pointerId);
      } catch (_) {
        /* already released */
      }
    }
  };

  parentsBtn.addEventListener("pointerdown", startHold);
  parentsBtn.addEventListener("pointerup", cancelHold);
  parentsBtn.addEventListener("pointercancel", cancelHold);
  parentsBtn.addEventListener("lostpointercapture", cancelHold);

  $("btn-parents-close").addEventListener("click", () => closeOverlay("overlay-parents"));
  $("btn-reset-progress").addEventListener("click", () => {
    Progress.reset();
    refreshUI();
    fillParentsList();
    Speech.say("Прогресс сброшен.");
  });

  const unlock = () => {
    Audio.startMusic();
    Speech.say("Привет! Давай исследуем остров!");
    window.removeEventListener("pointerdown", unlock);
  };
  window.addEventListener("pointerdown", unlock, { once: true });
}

export async function init() {
  applySettings();
  refreshUI();
  bindEvents();
  showScreen("island");
  await Speech.init();
}

init();
