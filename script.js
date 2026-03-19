const HEIGHT = 20;
const WIDTH = 10;
const BOARD_COLOUR = "#282728";
const COLOURS = [
  "#fa3434",
  "#fb8535",
  "#facc33",
  "#5fe33f",
  "#43cde6",
  "#4455e7",
  "#f64ed8",
];
const CANVAS_SIZE = 700;
const TILE_SIZE = CANVAS_SIZE / (HEIGHT + 1);
const HORIZ_OFFSET = ((WIDTH + 1) * TILE_SIZE) / 2;
const GRAVITY_TIME = 300;
const NEXT_PIECES = 1;

let gravityTime = 0;

let currentPiece;
let board = Array.from(Array(WIDTH), () => new Array(HEIGHT).fill(null));
let bag = [];
let next = [];
let held = null;
let justHeld = false;

function tileAt(x, y) {
  square(x * TILE_SIZE + HORIZ_OFFSET, y * TILE_SIZE, TILE_SIZE);
}

function drawBoard() {
  fill(color(BOARD_COLOUR));
  for (let y = 0; y < HEIGHT + 1; y++) {
    tileAt(-1, y);
    tileAt(WIDTH, y);
  }
  for (let x = 0; x < WIDTH; x++) {
    tileAt(x, HEIGHT);
  }

  for (let x = 0; x < WIDTH; x++) {
    for (let y = 0; y < HEIGHT; y++) {
      const blockIndex = board[x][y];
      if (blockIndex == null) continue;

      fill(color(COLOURS[blockIndex]));
      tileAt(x, y);
    }
  }
}

function drawGhost() {
  let depth = 0;
  outer: for (let i = 0; i < HEIGHT; i++) {
    for (const pos of SRS.pieces[currentPiece.index][currentPiece.rot]) {
      const testPos = [
        currentPiece.pos[0] + pos[0],
        currentPiece.pos[1] + pos[1] + i,
      ];
      if (!safePlace(testPos[0], testPos[1])) {
        depth = i - 1;
        break outer;
      }
    }
  }
  fill(color(20));
  for (const pos of SRS.pieces[currentPiece.index][currentPiece.rot]) {
    const blockPos = [
      currentPiece.pos[0] + pos[0],
      currentPiece.pos[1] + pos[1] + depth,
    ];
    tileAt(blockPos[0], blockPos[1]);
  }
}

function setup() {
  // noStroke();
  createCanvas(CANVAS_SIZE, CANVAS_SIZE);
  resetGame();
}

function drawCurrentPiece() {
  fill(color(COLOURS[currentPiece.index]));
  for (const pos of SRS.pieces[currentPiece.index][currentPiece.rot]) {
    tileAt(currentPiece.pos[0] + pos[0], currentPiece.pos[1] + pos[1]);
  }
}

function placePiece() {
  for (const pos of SRS.pieces[currentPiece.index][currentPiece.rot]) {
    const blockPos = [
      currentPiece.pos[0] + pos[0],
      currentPiece.pos[1] + pos[1],
    ];
    board[blockPos[0]][blockPos[1]] = currentPiece.index;
  }
  currentPiece = nextPiece();
  clearLines();
  for (const pos of SRS.pieces[currentPiece.index][currentPiece.rot]) {
    const blockPos = [
      currentPiece.pos[0] + pos[0],
      currentPiece.pos[1] + pos[1],
    ];
    if (!safePlace(blockPos[0], blockPos[1])) resetGame();
  }
  gravityTime = 0;
  justHeld = false;
}

function resetGame() {
  board = Array.from(Array(WIDTH), () => new Array(HEIGHT).fill(null));
  bag = [];
  next = [];
  justHeld = false;
  held = null;
  currentPiece = nextPiece();
  for (let i = 0; i < NEXT_PIECES; i++) {
    next.push(nextBagIndex());
  }
}

function nextPiece() {
  next.push(nextBagIndex());
  return {
    index: next.shift(),
    pos: [3, 0],
    rot: 0,
  };
}

function nextBagIndex() {
  if (bag.length == 0) {
    bag = Array.from({ length: 7 }, (_, i) => i);
    shuffle(bag);
  }
  return bag.pop();
}

const shuffle = (array) => {
  let currentIndex = array.length;
  let randomIndex;

  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex],
      array[currentIndex],
    ];
  }

  return array;
};

function draw() {
  clear();
  drawBoard();
  gravityTime += deltaTime;
  if (gravityTime > GRAVITY_TIME) {
    let moved = tryMove(0, 1);
    if (!moved) {
      placePiece();
    }
    gravityTime = 0;
  }
  drawGhost();
  drawCurrentPiece();
  drawNext();
  drawHeld();
}

function keyPressed(event) {
  switch (event.code) {
    case "KeyA":
      tryMove(-1, 0);
      break;
    case "KeyD":
      tryMove(1, 0);
      break;
    case "KeyW":
      tryMove(0, 1);
      break;
    case "KeyS":
      while (tryMove(0, 1)) {}
      placePiece();
      break;
    case "ArrowLeft":
      tryRotate((currentPiece.rot + 3) % 4);
      break;
    case "ArrowRight":
      tryRotate((currentPiece.rot + 1) % 4);
      break;
    case "ShiftLeft":
      hold();
      break;
  }
  console.log(event);
}

function tryMove(dx, dy) {
  for (const pos of SRS.pieces[currentPiece.index][currentPiece.rot]) {
    const testPos = [
      currentPiece.pos[0] + pos[0] + dx,
      currentPiece.pos[1] + pos[1] + dy,
    ];
    if (!safePlace(testPos[0], testPos[1])) return false;
  }
  currentPiece.pos[0] += dx;
  currentPiece.pos[1] += dy;
  return true;
}

function clearLines() {
  const linesToClear = fullLines();

  let removed = 0;
  for (const line of linesToClear) {
    for (let y = line; y >= 0; y--) {
      for (let x = 0; x < WIDTH; x++) {
        board[x][y + removed] = board[x][y - 1 + removed];
      }
    }
  }
}

function tryRotate(newRot) {
  for (const pos of SRS.pieces[currentPiece.index][newRot]) {
    const testPos = [
      currentPiece.pos[0] + pos[0],
      currentPiece.pos[1] + pos[1],
    ];
    if (!safePlace(testPos[0], testPos[1])) return false;
  }
  currentPiece.rot = newRot;
  return true;
}

function fullLines() {
  let full = [];
  outer: for (let y = 0; y < HEIGHT; y++) {
    for (let x = 0; x < WIDTH; x++) {
      if (board[x][y] == null) continue outer;
    }
    full.push(y);
  }
  return full;
}

function safePlace(x, y) {
  if (x < 0 || x >= WIDTH) return false;
  if (y >= HEIGHT) return false;
  if (board[x][y] != null) return false;

  return true;
}

function drawNext() {
  for (let i = 0; i < next.length; i++) {
    fill(color(COLOURS[next[i]]));
    for (const pos of SRS.pieces[next[i]][0]) {
      const blockPos = [12 + pos[0], i * 4 + pos[1]];
      tileAt(blockPos[0], blockPos[1]);
    }
  }
}

function hold() {
  if (justHeld) return;
  if (held != null) {
    let t = currentPiece.index;
    currentPiece = {
      index: held,
      pos: [3, 0],
      rot: 0,
    };
    held = t;
  } else {
    held = currentPiece.index;
    currentPiece = nextPiece();
  }
  justHeld = true;
}

function drawHeld() {
  if (held == null) return;

  if (justHeld) {
    fill(color(20));
  } else {
    fill(color(COLOURS[held]));
  }
  for (const pos of SRS.pieces[held][0]) {
    const blockPos = [pos[0] - 5, pos[1]];
    tileAt(blockPos[0], blockPos[1]);
  }
}
