import { Speech } from "../speech.js";
import { Audio } from "../audio.js";

const PICTURES = [
  { id: "dino2", src: "assets/puzzle/dino2.png", cols: 6, rows: 3, title: "Динозавры" },
  { id: "dragons", src: "assets/puzzle/dragons.png", cols: 5, rows: 2, title: "Драконы" },
  { id: "fishes", src: "assets/puzzle/fishes.png", cols: 5, rows: 2, title: "Рыбки" },
  { id: "forest", src: "assets/puzzle/forest-animals.png", cols: 5, rows: 2, title: "Зверята" },
  { id: "flowers", src: "assets/puzzle/flowers.png", cols: 5, rows: 2, title: "Цветочки" },
  { id: "monsterCars", src: "assets/puzzle/monster-cars.png", cols: 6, rows: 3, title: "Машинки" },
  {
    id: "planets",
    src: "assets/puzzle/planets.png",
    cols: 3,
    rows: 3,
    title: "Планеты",
    // Full-image partition (no gaps): top 5 + bottom 4 = whole picture when assembled.
    // Top cuts 40px left, bottom cuts 40px right (image width 1536).
    layout: "solar",
    rowSizes: [5, 4],
    regions: (() => {
      const topShift = 40 / 1536;
      const botShift = 40 / 1536;
      return [
        { name: "Солнце", x: 0, y: 0, w: 0.2 - topShift, h: 0.5 },
        { name: "Меркурий", x: 0.2 - topShift, y: 0, w: 0.2, h: 0.5 },
        { name: "Венера", x: 0.4 - topShift, y: 0, w: 0.2, h: 0.5 },
        { name: "Земля", x: 0.6 - topShift, y: 0, w: 0.2, h: 0.5 },
        { name: "Марс", x: 0.8 - topShift, y: 0, w: 0.2 + topShift, h: 0.5 },
        { name: "Юпитер", x: 0, y: 0.5, w: 0.25 + botShift, h: 0.5 },
        { name: "Сатурн", x: 0.25 + botShift, y: 0.5, w: 0.25, h: 0.5 },
        { name: "Уран", x: 0.5 + botShift, y: 0.5, w: 0.25, h: 0.5 },
        { name: "Нептун", x: 0.75 + botShift, y: 0.5, w: 0.25 - botShift, h: 0.5 },
      ];
    })(),
  },
];

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function cropPiece(img, sx, sy, pw, ph, id, name, flexW = null) {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, pw);
  canvas.height = Math.max(1, ph);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, sx, sy, pw, ph, 0, 0, canvas.width, canvas.height);
  return {
    id,
    name: name || null,
    dataUrl: canvas.toDataURL("image/png"),
    width: canvas.width,
    height: canvas.height,
    flexW: flexW ?? pw,
  };
}

/** Slice by regions. Prefer partitions that cover the full image (no gaps). */
async function sliceRegions(src, regions) {
  const img = await loadImage(src);
  const pieces = regions.map((region, i) => {
    const sx = Math.round(img.width * region.x);
    const sy = Math.round(img.height * region.y);
    const ex = Math.round(img.width * (region.x + region.w));
    const ey = Math.round(img.height * (region.y + region.h));
    const pw = Math.max(1, ex - sx);
    const ph = Math.max(1, ey - sy);
    return cropPiece(img, sx, sy, pw, ph, i, region.name, region.w);
  });
  return {
    pieces,
    aspect: img.width / img.height,
    voiced: true,
  };
}

/** Slice full image into grid — every pixel included, nothing cropped. */
async function sliceImage(src, cols, rows, names = null) {
  const img = await loadImage(src);
  const pieces = [];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const id = r * cols + c;
      const sx = Math.round((img.width * c) / cols);
      const sy = Math.round((img.height * r) / rows);
      const ex = Math.round((img.width * (c + 1)) / cols);
      const ey = Math.round((img.height * (r + 1)) / rows);
      const pw = ex - sx;
      const ph = ey - sy;
      pieces.push(cropPiece(img, sx, sy, pw, ph, id, names?.[id] || null));
    }
  }

  return {
    pieces,
    aspect: img.width / img.height,
    voiced: Boolean(names?.length),
  };
}

function pieceName(id) {
  return pieces.find((p) => p.id === id)?.name || null;
}

let pieces = [];
let selectedBoardId = null;
let solved = new Set();
let busy = false;
let onComplete = null;
let area = null;
let currentPicture = null;
let mode = "pick"; // pick | play

function setPuzzleMode(on) {
  const layout = document.querySelector(".game-layout");
  layout?.classList.toggle("game-layout--puzzle", on);
}

function showPicker() {
  mode = "pick";
  currentPicture = null;
  selectedBoardId = null;
  solved = new Set();
  busy = false;
  pieces = [];

  document.getElementById("game-character").textContent = "🧩";
  document.getElementById("game-instruction").textContent =
    "Выбери картинку, которую хочешь собрать!";

  area.innerHTML = "";
  area.style.position = "relative";

  const wrap = document.createElement("div");
  wrap.className = "puzzle-picker";

  const grid = document.createElement("div");
  grid.className = "puzzle-picker__grid";

  PICTURES.forEach((pic) => {
    const btn = document.createElement("button");
    btn.className = "puzzle-picker__card";
    btn.type = "button";
    btn.innerHTML = `
      <span class="puzzle-picker__thumb">
        <img src="${pic.src}" alt="${pic.title}" draggable="false" />
      </span>
      <span class="puzzle-picker__title">${pic.title}</span>
      <span class="puzzle-picker__meta">${(pic.regions?.length || pic.cols * pic.rows)} частей</span>
    `;
    btn.addEventListener("click", () => {
      Audio.click();
      Speech.say(pic.title);
      startPuzzle(pic);
    });
    grid.appendChild(btn);
  });

  wrap.appendChild(grid);
  area.appendChild(wrap);

  Speech.say("Выбери картинку, которую хочешь собрать!");
}

async function startPuzzle(pic) {
  mode = "play";
  currentPicture = pic;
  selectedBoardId = null;
  solved = new Set();
  busy = true;

  document.getElementById("game-character").textContent = "🧩";
  const voiced = Boolean(pic.regions?.length || pic.pieceNames?.length);
  document.getElementById("game-instruction").textContent = voiced
    ? `${pic.title}. Сначала нажми кусочек слева, потом такой же справа — услышишь название.`
    : `${pic.title}. Собери картинку! Сначала нажми кусочек слева, потом такой же справа.`;

  area.innerHTML = "";
  area.style.position = "relative";

  const wrap = document.createElement("div");
  wrap.className = "puzzle-layout";
  wrap.innerHTML = `<p class="puzzle-loading">Готовим пазл…</p>`;
  area.appendChild(wrap);

  let aspect = 16 / 10;
  try {
    const sliced = pic.regions?.length
      ? await sliceRegions(pic.src, pic.regions)
      : await sliceImage(pic.src, pic.cols, pic.rows, pic.pieceNames);
    pieces = sliced.pieces;
    aspect = sliced.aspect;
  } catch {
    wrap.innerHTML = `<p class="puzzle-loading">Не удалось загрузить картинку</p>`;
    Speech.say("Ой, картинка не загрузилась.");
    setTimeout(() => showPicker(), 1200);
    return;
  }

  wrap.innerHTML = "";

  const top = document.createElement("div");
  top.className = "puzzle-top";

  const backBtn = document.createElement("button");
  backBtn.className = "puzzle-back";
  backBtn.type = "button";
  backBtn.textContent = "← Другая картинка";
  backBtn.addEventListener("click", () => {
    Audio.click();
    showPicker();
  });
  top.appendChild(backBtn);

  const meta = document.createElement("p");
  meta.className = "puzzle-meta";
  meta.textContent = pic.title;
  top.appendChild(meta);

  wrap.appendChild(top);

  const main = document.createElement("div");
  main.className = "puzzle-main";

  const board = document.createElement("div");
  board.style.aspectRatio = String(aspect);

  const makeCell = (piece, proportional = false) => {
    const cell = document.createElement("button");
    cell.className = "puzzle-cell puzzle-cell--dim";
    cell.dataset.id = String(piece.id);
    const label = piece.name || `часть ${piece.id + 1}`;
    cell.innerHTML = `<img src="${piece.dataUrl}" alt="${label}" draggable="false" />`;
    cell.addEventListener("click", () => onBoardClick(piece.id, cell));
    if (proportional) {
      cell.style.flex = `${piece.flexW} 1 0`;
    }
    return cell;
  };

  if (pic.layout === "solar" && pic.rowSizes) {
    board.className = "puzzle-board puzzle-board--solar";
    let offset = 0;
    pic.rowSizes.forEach((count) => {
      const row = document.createElement("div");
      row.className = "puzzle-board__row";
      pieces.slice(offset, offset + count).forEach((piece) => {
        row.appendChild(makeCell(piece, true));
      });
      board.appendChild(row);
      offset += count;
    });
  } else {
    board.className = "puzzle-board";
    board.style.gridTemplateColumns = `repeat(${pic.cols}, 1fr)`;
    board.style.gridTemplateRows = `repeat(${pic.rows}, 1fr)`;
    pieces.forEach((piece) => board.appendChild(makeCell(piece)));
  }
  main.appendChild(board);

  const side = document.createElement("div");
  side.className = "puzzle-side";

  const trayTitle = document.createElement("p");
  trayTitle.className = "puzzle-tray-title";
  trayTitle.textContent = voiced ? "Найди такую же планету" : "Найди такую же часть";
  side.appendChild(trayTitle);

  const tray = document.createElement("div");
  tray.className = voiced ? "puzzle-tray puzzle-tray--named" : "puzzle-tray";

  shuffle(pieces).forEach((piece) => {
    const btn = document.createElement("button");
    btn.className = "puzzle-tray-item";
    btn.dataset.id = String(piece.id);
    btn.style.aspectRatio = String(piece.width / piece.height);
    const label = piece.name || `часть ${piece.id + 1}`;
    btn.innerHTML = `<img src="${piece.dataUrl}" alt="${label}" draggable="false" />`;
    btn.addEventListener("click", () => onTrayClick(piece.id, btn));
    tray.appendChild(btn);
  });
  side.appendChild(tray);
  main.appendChild(side);
  wrap.appendChild(main);

  busy = false;
  Speech.say("Собери картинку! Сначала нажми кусочек слева, потом такой же справа.");
}

function clearHighlights() {
  area.querySelectorAll(".puzzle-cell--selected, .puzzle-tray-item--bad, .puzzle-tray-item--selected").forEach((el) => {
    el.classList.remove("puzzle-cell--selected", "puzzle-tray-item--bad", "puzzle-tray-item--selected");
  });
}

function onBoardClick(id, cell) {
  if (busy || solved.has(id)) return;
  Audio.click();
  clearHighlights();
  selectedBoardId = id;
  cell.classList.add("puzzle-cell--selected");
}

function onTrayClick(id, btn) {
  if (busy || btn.classList.contains("puzzle-tray-item--gone")) return;

  if (selectedBoardId === null) {
    Audio.wrong();
    Speech.say("Сначала нажми кусочек на картинке слева.");
    return;
  }

  Audio.click();

  if (id !== selectedBoardId) {
    btn.classList.add("puzzle-tray-item--bad", "shake");
    Audio.wrong();
    setTimeout(() => {
      btn.classList.remove("puzzle-tray-item--bad", "shake");
    }, 500);
    return;
  }

  busy = true;
  solved.add(id);

  const boardCell = area.querySelector(`.puzzle-cell[data-id="${id}"]`);
  boardCell?.classList.remove("puzzle-cell--dim", "puzzle-cell--selected");
  boardCell?.classList.add("puzzle-cell--solved", "bounce");

  btn.classList.add("puzzle-tray-item--gone");
  selectedBoardId = null;
  Audio.correct();

  const name = pieceName(id);
  const finish = () => {
    if (solved.size >= pieces.length) {
      const title = currentPicture?.title || "картинка";
      document.getElementById("game-instruction").textContent = `Ура! ${title} собраны!`;
      Speech.say("Ура! Картинка собрана!").then(() => {
        setTimeout(() => onComplete?.(), 700);
      });
    } else {
      busy = false;
    }
  };

  if (name) {
    Speech.say(name).then(finish);
  } else {
    finish();
  }
}

export const BuildForestGame = {
  start(gameArea, completeCb) {
    area = gameArea;
    onComplete = completeCb;
    setPuzzleMode(true);
    showPicker();
  },

  help() {
    if (mode === "pick") {
      Speech.say("Выбери картинку, которую хочешь собрать!");
    } else if (selectedBoardId !== null) {
      Speech.say("Теперь найди такой же кусочек справа.");
    } else {
      Speech.say("Сначала нажми тусклый кусочек на картинке слева.");
    }
  },

  destroy() {
    busy = true;
    selectedBoardId = null;
    currentPicture = null;
    mode = "pick";
    setPuzzleMode(false);
    if (area) area.innerHTML = "";
  },
};
