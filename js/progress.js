import { Storage } from "./storage.js";

const FOREST_GAMES = [
  { id: "counting", name: "Счёт" },
  { id: "dragonCount", name: "Драконы" },
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

const ACTIVE_FOREST = FOREST_GAMES.map((g) => g.id);

let state = Storage.load();

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

  isComplete(gameId) {
    return Boolean(state.forest[gameId]);
  },

  complete(gameId) {
    state.forest[gameId] = true;
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

  starsDisplay(filled, total) {
    return Array.from({ length: total }, (_, i) => (i < filled ? "⭐" : "☆")).join("");
  },

  reset() {
    state = Storage.reset();
  },
};
