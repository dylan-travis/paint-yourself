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
  ctx.moveTo(px - 9, py + 6);
  ctx.lineTo(px + 9, py + 6);
  ctx.moveTo(px - 9, py + 9);
  ctx.lineTo(px + 9, py + 9);
  ctx.moveTo(px - 9, py + 12.5);
  ctx.lineTo(px + 9, py + 12.5);
  ctx.moveTo(px - 9, py + 16);
  ctx.lineTo(px + 9, py + 16);
  ctx.moveTo(px - 9, py + 19.5);
  ctx.lineTo(px + 9, py + 19.5);
  ctx.moveTo(px - 8, py + 3);
  ctx.lineTo(px - 8, py + 23);
  ctx.moveTo(px - 4, py + 3);
  ctx.lineTo(px - 4, py + 23);
  ctx.moveTo(px, py + 3);
  ctx.lineTo(px, py + 23);
  ctx.moveTo(px + 4, py + 3);
  ctx.lineTo(px + 4, py + 23);
  ctx.moveTo(px + 8, py + 3);
  ctx.lineTo(px + 8, py + 23);
  ctx.stroke();

  ctx.fillStyle = "#efb592";
  ctx.beginPath();
  ctx.arc(px, py - 1, 10, 0, Math.PI * 2);
  ctx.fill();

  // Red hair and beard.
  ctx.fillStyle = "#b71d16";
  // Hair mass wraps around the whole head.
  ctx.beginPath();
  ctx.arc(px, py - 1, 12.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(px - 11, py - 5, 3.5, 11);
  ctx.fillRect(px + 7.5, py - 5, 3.5, 11);

  // Redraw face over center so hair reads as a wrap-around ring.
  ctx.fillStyle = "#efb592";
  ctx.beginPath();
  ctx.arc(px, py - 1, 10, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#b71d16";
  ctx.beginPath();
  ctx.ellipse(px, py + 4, 8, 6, 0, 0, Math.PI, false);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(px, py + 6.2, 6.4, 3.4, 0, 0, Math.PI, false);
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

function getAntagonistMoves() {
  const deltas = [
    { dx: 1, dy: 0 },
    { dx: -1, dy: 0 },
    { dx: 0, dy: 1 },
    { dx: 0, dy: -1 },
  ];

  return deltas
    .map(({ dx, dy }) => ({ x: antagonist.x + dx, y: antagonist.y + dy }))
    .filter((pos) => inBounds(pos.x, pos.y))
    .filter((pos) => !isBlocked(pos.x, pos.y))
    .filter((pos) => !(pos.x === player.x && pos.y === player.y));
}

function scoreAntagonistMove(pos) {
  const tileKey = key(pos.x, pos.y);
  const distanceToPlayer = Math.abs(pos.x - player.x) + Math.abs(pos.y - player.y);

  // Prefer stepping onto green tiles to undo progress, then unpainted tiles.
  let score = 0;
  if (greenPainted.has(tileKey)) score += 100;
  else if (!redPainted.has(tileKey)) score += 20;

  // Lightly bias movement toward the player to keep pressure up.
  score += Math.max(0, 12 - distanceToPlayer);
  return score;
}

function antagonistTurn() {
  if (won) return;

  const moves = getAntagonistMoves();
  if (moves.length === 0) {
    updateStatus("The Nova Scotian fella is boxed in and can't move this turn.");
    return;
  }

  let bestScore = -Infinity;
  const bestMoves = [];
  for (const move of moves) {
    const moveScore = scoreAntagonistMove(move);
    if (moveScore > bestScore) {
      bestScore = moveScore;
      bestMoves.length = 0;
      bestMoves.push(move);
    } else if (moveScore === bestScore) {
      bestMoves.push(move);
    }
  }

  const nextMove = bestMoves[Math.floor(Math.random() * bestMoves.length)];
  antagonist = { x: nextMove.x, y: nextMove.y };

  const targetKey = key(antagonist.x, antagonist.y);
  greenPainted.delete(targetKey);
  redPainted.add(targetKey);
  updateStatus("The Nova Scotian antagonist moves and paints his new tile red.");
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
