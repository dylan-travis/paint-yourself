const GRID_SIZE = 16;
const TILE_W = 54;
const TILE_H = 28;
const FLOOR_Z = 12;
const ORIGIN_X = 550;
const ORIGIN_Y = 120;

const FLOOR_BASE = "#7a8087";
const FLOOR_PAINTED = "#34b44a";
const FLOOR_ANTAGONIST = "#c9252d";
const FLOOR_BLOCKED = "#60666f";
const OUTLINE_COLOR = "rgba(0, 0, 0, 0.35)";

const furniture = new Set([
  "3,4",
  "3,5",
  "4,5",
  "6,8",
  "7,8",
  "8,8",
  "10,3",
  "10,4",
  "11,4",
  "12,11",
  "13,11",
  "5,12",
  "5,13",
  "6,13",
  "9,6",
  "9,7",
]);

const greenPainted = new Set();
const redPainted = new Set();
let player = { x: 1, y: 1 };
let antagonist = { x: GRID_SIZE - 1, y: 0 };
let won = false;

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const statusEl = document.getElementById("status");

const totalPaintable = GRID_SIZE * GRID_SIZE - furniture.size;

function key(x, y) {
  return `${x},${y}`;
}

function inBounds(x, y) {
  return x >= 0 && y >= 0 && x < GRID_SIZE && y < GRID_SIZE;
}

function isBlocked(x, y) {
  return furniture.has(key(x, y));
}

function isoToScreen(x, y) {
  return {
    x: ORIGIN_X + (x - y) * (TILE_W / 2),
    y: ORIGIN_Y + (x + y) * (TILE_H / 2),
  };
}

function shade(hex, amount) {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.min(255, Math.max(0, ((n >> 16) & 255) + amount));
  const g = Math.min(255, Math.max(0, ((n >> 8) & 255) + amount));
  const b = Math.min(255, Math.max(0, (n & 255) + amount));
  return `rgb(${r}, ${g}, ${b})`;
}

function drawDiamond(cx, cy, fillTop, fillLeft, fillRight, zHeight) {
  const top = { x: cx, y: cy - TILE_H / 2 };
  const right = { x: cx + TILE_W / 2, y: cy };
  const bottom = { x: cx, y: cy + TILE_H / 2 };
  const left = { x: cx - TILE_W / 2, y: cy };

  if (zHeight > 0) {
    ctx.beginPath();
    ctx.moveTo(left.x, left.y);
    ctx.lineTo(bottom.x, bottom.y);
    ctx.lineTo(bottom.x, bottom.y + zHeight);
    ctx.lineTo(left.x, left.y + zHeight);
    ctx.closePath();
    ctx.fillStyle = fillLeft;
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(right.x, right.y);
    ctx.lineTo(bottom.x, bottom.y);
    ctx.lineTo(bottom.x, bottom.y + zHeight);
    ctx.lineTo(right.x, right.y + zHeight);
    ctx.closePath();
    ctx.fillStyle = fillRight;
    ctx.fill();
  }

  ctx.beginPath();
  ctx.moveTo(top.x, top.y);
  ctx.lineTo(right.x, right.y);
  ctx.lineTo(bottom.x, bottom.y);
  ctx.lineTo(left.x, left.y);
  ctx.closePath();
  ctx.fillStyle = fillTop;
  ctx.fill();
  ctx.strokeStyle = OUTLINE_COLOR;
  ctx.stroke();
}

function drawFurniture(x, y) {
  const pos = isoToScreen(x, y);
  const baseX = pos.x;
  const baseY = pos.y;

  drawDiamond(baseX, baseY - FLOOR_Z - 18, "#7f5c3d", "#664730", "#593c29", 32);

  ctx.fillStyle = "#3b2a1d";
  ctx.fillRect(baseX - 5, baseY - FLOOR_Z - 50, 10, 10);
  ctx.fillStyle = "#d6b182";
  ctx.beginPath();
  ctx.arc(baseX, baseY - FLOOR_Z - 53, 3, 0, Math.PI * 2);
  ctx.fill();
}

function drawPlayer() {
  const pos = isoToScreen(player.x, player.y);
  const px = pos.x;
  const py = pos.y - FLOOR_Z - 20;

  ctx.fillStyle = "#1f2937";
  ctx.beginPath();
  ctx.ellipse(px, py + 24, 13, 8, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#d8a07a";
  ctx.fillRect(px - 11, py + 5, 22, 18);

  // Arms
  ctx.fillRect(px - 15, py + 8, 4, 14);
  ctx.fillRect(px + 11, py + 8, 4, 14);

  // Rounded shoulder muscles
  ctx.beginPath();
  ctx.arc(px - 11, py + 10, 4.2, 0, Math.PI * 2);
  ctx.arc(px + 11, py + 10, 4.2, 0, Math.PI * 2);
  ctx.fill();

  // Chest definition
  ctx.strokeStyle = "rgba(86, 53, 36, 0.5)";
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(px, py + 8);
  ctx.lineTo(px, py + 22);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(px - 9, py + 13);
  ctx.quadraticCurveTo(px, py + 16, px + 9, py + 13);
  ctx.stroke();

  ctx.fillStyle = "#f4b183";
  ctx.beginPath();
  ctx.arc(px, py, 10, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "#2f2117";
  ctx.lineWidth = 2.8;
  ctx.beginPath();
  ctx.moveTo(px - 5, py - 3);
  ctx.lineTo(px + 5, py - 3);
  ctx.stroke();

  ctx.fillStyle = "#1f1f1f";
  ctx.beginPath();
  ctx.arc(px - 3, py - 1, 1.2, 0, Math.PI * 2);
  ctx.arc(px + 3, py - 1, 1.2, 0, Math.PI * 2);
  ctx.fill();

  // Friendly smile
  ctx.strokeStyle = "#6b3f2a";
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.arc(px, py + 2.2, 3.2, 0.2, Math.PI - 0.2);
  ctx.stroke();
}

function drawAntagonist() {
  const pos = isoToScreen(antagonist.x, antagonist.y);
  const px = pos.x;
  const py = pos.y - FLOOR_Z - 26;

  // Bright marker so the rival pops visually.
  ctx.strokeStyle = "#ffd6d6";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(px, py + 29, 17, 10, 0, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = "#2b1315";
  ctx.beginPath();
  ctx.ellipse(px, py + 27, 14, 8, 0, 0, Math.PI * 2);
  ctx.fill();

  // Red flannel body and sleeves.
  ctx.fillStyle = "#8f1d21";
  ctx.fillRect(px - 12, py + 3, 24, 20);
  ctx.fillRect(px - 17, py + 7, 5, 14);
  ctx.fillRect(px + 12, py + 7, 5, 14);

  ctx.strokeStyle = "#d8a4a4";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(px - 9, py + 9);
  ctx.lineTo(px + 9, py + 9);
  ctx.moveTo(px - 9, py + 16);
  ctx.lineTo(px + 9, py + 16);
  ctx.moveTo(px - 4, py + 3);
  ctx.lineTo(px - 4, py + 23);
  ctx.moveTo(px + 4, py + 3);
  ctx.lineTo(px + 4, py + 23);
  ctx.stroke();

  ctx.fillStyle = "#efb592";
  ctx.beginPath();
  ctx.arc(px, py - 1, 10, 0, Math.PI * 2);
  ctx.fill();

  // Red hair and beard.
  ctx.fillStyle = "#b71d16";
  ctx.beginPath();
  ctx.arc(px, py - 10, 8, Math.PI, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(px - 7, py - 10, 3, 5);
  ctx.fillRect(px + 4, py - 10, 3, 5);
  ctx.beginPath();
  ctx.arc(px, py + 3, 6, 0, Math.PI, false);
  ctx.fill();

  ctx.fillStyle = "#24181a";
  ctx.beginPath();
  ctx.arc(px - 3, py - 2, 1.2, 0, Math.PI * 2);
  ctx.arc(px + 3, py - 2, 1.2, 0, Math.PI * 2);
  ctx.fill();
}

function drawBoard() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (let y = 0; y < GRID_SIZE; y += 1) {
    for (let x = 0; x < GRID_SIZE; x += 1) {
      const pos = isoToScreen(x, y);
      const tileKey = key(x, y);
      let topColor = FLOOR_BASE;

      if (isBlocked(x, y)) {
        topColor = FLOOR_BLOCKED;
      } else if (redPainted.has(tileKey)) {
        topColor = FLOOR_ANTAGONIST;
      } else if (greenPainted.has(tileKey)) {
        topColor = FLOOR_PAINTED;
      }

      const leftColor = shade(topColor, -20);
      const rightColor = shade(topColor, -30);
      drawDiamond(pos.x, pos.y - FLOOR_Z, topColor, leftColor, rightColor, FLOOR_Z);
    }
  }

  for (let y = 0; y < GRID_SIZE; y += 1) {
    for (let x = 0; x < GRID_SIZE; x += 1) {
      if (isBlocked(x, y)) {
        drawFurniture(x, y);
      }
      if (antagonist.x === x && antagonist.y === y) {
        drawAntagonist();
      }
      if (player.x === x && player.y === y) {
        drawPlayer();
      }
    }
  }
}

function updateStatus(message = "") {
  const paintedCount = greenPainted.size;
  const redCount = redPainted.size;
  const left = totalPaintable - paintedCount;
  statusEl.textContent =
    message ||
    `Green tiles: ${paintedCount}/${totalPaintable}. Red sabotage: ${redCount}. Unpainted left: ${left}.`;
}

function checkWin() {
  const playerKey = key(player.x, player.y);
  if (!greenPainted.has(playerKey) && greenPainted.size === totalPaintable - 1) {
    won = true;
    updateStatus("You painted yourself into a corner. Victory.");
  }
}

function pickRandomTile(tiles) {
  if (tiles.length === 0) return null;
  return tiles[Math.floor(Math.random() * tiles.length)];
}

function antagonistTurn() {
  if (won) return;

  const sabotageCandidates = [...greenPainted].filter(
    (tileKey) => tileKey !== key(antagonist.x, antagonist.y)
  );
  let targetKey = pickRandomTile(sabotageCandidates);

  if (!targetKey) {
    const fallback = [];
    for (let y = 0; y < GRID_SIZE; y += 1) {
      for (let x = 0; x < GRID_SIZE; x += 1) {
        const tileKey = key(x, y);
        if (isBlocked(x, y)) continue;
        if (tileKey === key(player.x, player.y)) continue;
        if (tileKey === key(antagonist.x, antagonist.y)) continue;
        if (redPainted.has(tileKey)) continue;
        fallback.push(tileKey);
      }
    }
    targetKey = pickRandomTile(fallback);
  }

  if (!targetKey) {
    updateStatus("The Nova Scotian fella glares, but finds nothing left to ruin.");
    return;
  }

  greenPainted.delete(targetKey);
  redPainted.add(targetKey);
  updateStatus("The Nova Scotian antagonist repaints a tile red.");
}

function tryMove(dx, dy) {
  if (won) return;
  const nx = player.x + dx;
  const ny = player.y + dy;

  if (!inBounds(nx, ny)) {
    updateStatus("You bump into a wall.");
    return;
  }
  if (isBlocked(nx, ny)) {
    updateStatus("Furniture blocks the way.");
    return;
  }

  player = { x: nx, y: ny };
  redPainted.delete(key(player.x, player.y));
  checkWin();
  if (!won) antagonistTurn();
  if (!won) updateStatus();
}

function paintHere() {
  if (won) return;
  const tileKey = key(player.x, player.y);

  if (greenPainted.has(tileKey)) {
    updateStatus("That tile is already painted.");
    return;
  }

  redPainted.delete(tileKey);
  greenPainted.add(tileKey);
  checkWin();
  if (!won) antagonistTurn();
  if (!won) updateStatus();
}

function resetGame() {
  greenPainted.clear();
  redPainted.clear();
  player = { x: 1, y: 1 };
  antagonist = { x: GRID_SIZE - 1, y: 0 };
  won = false;
  updateStatus("Fresh coat of nothing. Start painting before the red menace ruins it.");
}

window.addEventListener("keydown", (event) => {
  const keyName = event.key.toLowerCase();
  if (["arrowup", "arrowdown", "arrowleft", "arrowright", "p", "r"].includes(keyName)) {
    event.preventDefault();
  }

  if (keyName === "arrowup") tryMove(0, -1);
  else if (keyName === "arrowdown") tryMove(0, 1);
  else if (keyName === "arrowleft") tryMove(-1, 0);
  else if (keyName === "arrowright") tryMove(1, 0);
  else if (keyName === "p") paintHere();
  else if (keyName === "r") resetGame();

  drawBoard();
});

resetGame();
drawBoard();
