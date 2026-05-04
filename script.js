// ================================
// SNAKE GAME - script.js
// ================================

// --- CONFIG ---
const COLS = 20; // grid columns
const ROWS = 18; // grid rows
const CELL_COUNT = COLS * ROWS;
const SPEED = 150; // ms per tick (lower = faster)

// --- DOM ---
const boardEl = document.getElementById("board");
const scoreEl = document.getElementById("score");
const highScoreEl = document.getElementById("high-score");
const timeEl = document.getElementById("time");
const statusEl = document.getElementById("status-text");

// --- STATE ---
let cells = []; // all .block div elements
let snake = []; // array of index positions
let direction = 0; // current movement direction (as index delta)
let nextDirection = 0; // buffered direction (prevents double-tap reversal)
let food = -1; // food cell index
let score = 0;
let highScore = Number(localStorage.getItem("snakeHS") || 0);
let gameLoop = null;
let timerLoop = null;
let seconds = 0;
let running = false;
let started = false; // game started by first keypress

// --- SET CSS GRID SIZE ---
boardEl.style.gridTemplateColumns = `repeat(${COLS}, var(--cell-size))`;
boardEl.style.gridTemplateRows = `repeat(${ROWS}, var(--cell-size))`;

// ================================
// STEP 1: BUILD GRID (JS se cells banao)
// ================================
function buildGrid() {
  boardEl.innerHTML = "";
  cells = [];

  for (let i = 0; i < CELL_COUNT; i++) {
    const div = document.createElement("div");
    div.classList.add("block");
    boardEl.appendChild(div);
    cells.push(div);
  }
}

// ================================
// STEP 2: INDEX HELPERS
// ================================

// Convert row,col to flat index
function toIndex(col, row) {
  return row * COLS + col;
}

// Get col from index
function getCol(idx) {
  return idx % COLS;
}

// Get row from index
function getRow(idx) {
  return Math.floor(idx / COLS);
}

// ================================
// STEP 3: DIRECTION DELTAS
// Each direction = index offset
// ================================
const DIRS = {
  RIGHT: 1,
  LEFT: -1,
  DOWN: COLS,
  UP: -COLS,
};

// Opposite directions (to prevent 180 degree turns)
const OPPOSITE = {
  [DIRS.RIGHT]: DIRS.LEFT,
  [DIRS.LEFT]: DIRS.RIGHT,
  [DIRS.DOWN]: DIRS.UP,
  [DIRS.UP]: DIRS.DOWN,
};

// ================================
// STEP 4: RENDER
// ================================
function render() {
  // Clear all cells
  cells.forEach((cell) => {
    cell.className = "block";
  });

  // Draw food
  if (food >= 0) cells[food].classList.add("food");

  // Draw snake body (reverse so head is drawn last / on top visually)
  for (let i = snake.length - 1; i >= 0; i--) {
    if (i === 0) {
      cells[snake[i]].classList.add("snake-head");
    } else {
      cells[snake[i]].classList.add("snake-body");
    }
  }
}

// ================================
// STEP 5: SPAWN FOOD
// ================================
function spawnFood() {
  let idx;
  do {
    idx = Math.floor(Math.random() * CELL_COUNT);
  } while (snake.includes(idx)); // don't place on snake
  food = idx;
}

// ================================
// STEP 6: MOVE SNAKE (main tick)
// ================================
function tick() {
  // Apply buffered direction
  direction = nextDirection;

  const head = snake[0];
  const headCol = getCol(head);
  const headRow = getRow(head);
  let newHead = head + direction;

  // --- WALL COLLISION CHECK ---
  // Horizontal wrap prevention
  if (direction === DIRS.RIGHT && headCol === COLS - 1) {
    endGame();
    return;
  }
  if (direction === DIRS.LEFT && headCol === 0) {
    endGame();
    return;
  }
  // Vertical bounds
  if (newHead < 0 || newHead >= CELL_COUNT) {
    endGame();
    return;
  }

  // --- SELF COLLISION ---
  if (snake.includes(newHead)) {
    endGame();
    return;
  }

  // Move: add new head
  snake.unshift(newHead);

  // --- ATE FOOD? ---
  if (newHead === food) {
    score++;
    updateScore();
    spawnFood();
    // don't pop tail -> snake grows
  } else {
    snake.pop(); // remove tail
  }

  render();
}

// ================================
// STEP 7: SCORE UPDATE
// ================================
function updateScore() {
  scoreEl.textContent = String(score).padStart(3, "0");
  if (score > highScore) {
    highScore = score;
    highScoreEl.textContent = String(highScore).padStart(3, "0");
    localStorage.setItem("snakeHS", highScore);
  }
}

// ================================
// STEP 8: TIMER
// ================================
function startTimer() {
  seconds = 0;
  clearInterval(timerLoop);
  timerLoop = setInterval(() => {
    seconds++;
    const m = String(Math.floor(seconds / 60)).padStart(2, "0");
    const s = String(seconds % 60).padStart(2, "0");
    timeEl.textContent = `${m}:${s}`;
  }, 1000);
}

// ================================
// STEP 9: KEYBOARD INPUT
// ================================
document.addEventListener("keydown", (e) => {
  const keyMap = {
    ArrowRight: DIRS.RIGHT,
    ArrowLeft: DIRS.LEFT,
    ArrowDown: DIRS.DOWN,
    ArrowUp: DIRS.UP,
  };

  const newDir = keyMap[e.key];
  if (!newDir) return;

  e.preventDefault(); // prevent page scroll

  // Start game on first keypress
  if (!started) {
    started = true;
    nextDirection = newDir;
    direction = newDir;
    statusEl.textContent = "Playing...";
    gameLoop = setInterval(tick, SPEED);
    startTimer();
    return;
  }

  // Prevent reversing into itself
  if (newDir !== OPPOSITE[direction]) {
    nextDirection = newDir;
  }
});

// ================================
// STEP 10: GAME OVER
// ================================
function endGame() {
  running = false;
  clearInterval(gameLoop);
  clearInterval(timerLoop);

  // Flash effect
  boardEl.classList.add("game-over-flash");

  // Show overlay after flash
  setTimeout(() => {
    boardEl.classList.remove("game-over-flash");
    showOverlay();
  }, 900);
}

function showOverlay() {
  const overlay = document.createElement("div");
  overlay.classList.add("overlay");
  overlay.innerHTML = `
    <h2>GAME OVER</h2>
    <p class="final-score">SCORE — ${String(score).padStart(3, "0")}</p>
    <p>HIGH SCORE — ${String(highScore).padStart(3, "0")}</p>
    <button class="restart-btn" id="restart-btn">PLAY AGAIN</button>
  `;
  boardEl.appendChild(overlay);

  document.getElementById("restart-btn").addEventListener("click", () => {
    initGame();
  });
}

// ================================
// STEP 11: INIT / RESTART
// ================================
function initGame() {
  // Reset state
  score = 0;
  seconds = 0;
  started = false;
  direction = DIRS.RIGHT;
  nextDirection = DIRS.RIGHT;

  // Reset UI
  scoreEl.textContent = "000";
  highScoreEl.textContent = String(highScore).padStart(3, "0");
  timeEl.textContent = "00:00";
  statusEl.textContent = "Press any arrow to start";

  // Clear intervals
  clearInterval(gameLoop);
  clearInterval(timerLoop);

  // Build fresh grid
  buildGrid();

  // Spawn snake in middle
  const startIdx = toIndex(Math.floor(COLS / 2), Math.floor(ROWS / 2));
  snake = [startIdx];

  // Spawn food
  spawnFood();

  // Render initial state
  render();
}

// --- START ---
initGame();
