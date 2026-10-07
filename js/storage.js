const STORAGE_KEY = "discovery_island_v1";

const DEFAULT_STATE = {
  forest: {
    counting: false,
    dragonCount: false,
    shapes: false,
    colors: false,
    memory: false,
    search: false,
    feed: false,
    size: false,
    oddOneOut: false,
    sequence: false,
    pairs: false,
    buildForest: false,
  },
  settings: {
    sound: true,
    music: true,
    voice: true,
  },
};

export const Storage = {
  load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return structuredClone(DEFAULT_STATE);
      const parsed = JSON.parse(raw);
      return {
        forest: { ...DEFAULT_STATE.forest, ...parsed.forest },
        settings: { ...DEFAULT_STATE.settings, ...parsed.settings },
      };
    } catch {
      return structuredClone(DEFAULT_STATE);
    }
  },

  save(state) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  },

  reset() {
    localStorage.removeItem(STORAGE_KEY);
    return structuredClone(DEFAULT_STATE);
  },
};
