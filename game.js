const GRID_SIZE = 16;
const TILE_W = 54;
const TILE_H = 28;
const FLOOR_Z = 12;
const ORIGIN_X = 550;
const ORIGIN_Y = 120;

const FLOOR_BASE = "#7a8087";
const FLOOR_PAINTED = "#34b44a";
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

const painted = new Set();
let player = { x: 1, y: 1 };
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

function drawBoard() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (let y = 0; y < GRID_SIZE; y += 1) {
    for (let x = 0; x < GRID_SIZE; x += 1) {
      const pos = isoToScreen(x, y);
      const tileKey = key(x, y);
      let topColor = FLOOR_BASE;

      if (isBlocked(x, y)) {
        topColor = FLOOR_BLOCKED;
      } else if (painted.has(tileKey)) {
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
      if (player.x === x && player.y === y) {
        drawPlayer();
      }
    }
  }
}

function updateStatus(message = "") {
  const paintedCount = painted.size;
  const left = totalPaintable - paintedCount;
  statusEl.textContent =
    message || `Painted: ${paintedCount}/${totalPaintable}. Unpainted tiles left: ${left}.`;
}

function checkWin() {
  const playerKey = key(player.x, player.y);
  if (!painted.has(playerKey) && painted.size === totalPaintable - 1) {
    won = true;
    updateStatus("You painted yourself into a corner. Victory.");
  }
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
  checkWin();
  if (!won) updateStatus();
}

function paintHere() {
  if (won) return;
  const tileKey = key(player.x, player.y);

  if (painted.has(tileKey)) {
    updateStatus("That tile is already painted.");
    return;
  }

  painted.add(tileKey);
  checkWin();
  if (!won) updateStatus();
}

function resetGame() {
  painted.clear();
  player = { x: 1, y: 1 };
  won = false;
  updateStatus("Fresh coat of nothing. Start painting.");
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
