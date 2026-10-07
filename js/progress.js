import { Storage } from "./storage.js";

const FOREST_GAMES = [
  { id: "counting", name: "Счёт" },
  { id: "dragonCount", name: "Драконы" },
  { id: "dragonBasket", name: "Корзина" },
  { id: "shapes", name: "Фигуры" },
  { id: "colors", name: "Цвета" },
  { id: "memory", name: "Память" },
  { id: "search", name: "Поиск" },
  { id: "feed", name: "Накорми" },
  { id: "pairs", name: "Пары" },
  { id: "sequence", name: "Ряд" },
  { id: "oddOneOut", name: "Лишний" },
  { id: "buildForest", name: "Собери" },
];

const SEA_GAMES = [
  { id: "seaBoats", name: "Кораблики" },
  { id: "seaFish", name: "Рыбки" },
];

const ACTIVE_FOREST = FOREST_GAMES.map((g) => g.id);
const ACTIVE_SEA = SEA_GAMES.map((g) => g.id);

const WORLD_OF = Object.fromEntries([
  ...ACTIVE_FOREST.map((id) => [id, "forest"]),
  ...ACTIVE_SEA.map((id) => [id, "sea"]),
]);

let state = Storage.load();

function bucket(world) {
  return world === "sea" ? state.sea : state.forest;
}

export const Progress = {
  getState() {
    return state;
  },

  getSettings() {
    return state.settings;
  },

  updateSettings(partial) {
    state.settings = { ...state.settings, ...partial };
    Storage.save(state);
  },

  worldOf(gameId) {
    return WORLD_OF[gameId] || "forest";
  },

  isComplete(gameId) {
    const world = WORLD_OF[gameId] || "forest";
    return Boolean(bucket(world)[gameId]);
  },

  complete(gameId) {
    const world = WORLD_OF[gameId] || "forest";
    bucket(world)[gameId] = true;
    Storage.save(state);
  },

  forestStars() {
    return ACTIVE_FOREST.filter((id) => state.forest[id]).length;
  },

  forestTotal() {
    return ACTIVE_FOREST.length;
  },

  forestGames() {
    return FOREST_GAMES;
  },

  activeForestIds() {
    return ACTIVE_FOREST;
  },

  seaStars() {
    return ACTIVE_SEA.filter((id) => state.sea[id]).length;
  },

  seaTotal() {
    return ACTIVE_SEA.length;
  },

  seaGames() {
    return SEA_GAMES;
  },

  activeSeaIds() {
    return ACTIVE_SEA;
  },

  islandStars() {
    return this.forestStars() + this.seaStars();
  },

  islandTotal() {
    return this.forestTotal() + this.seaTotal();
  },

  starsDisplay(filled, total) {
    return Array.from({ length: total }, (_, i) => (i < filled ? "⭐" : "☆")).join("");
  },

  reset() {
    state = Storage.reset();
  },
};
