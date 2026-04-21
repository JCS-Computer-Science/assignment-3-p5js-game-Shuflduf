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

class Tetromino {
  constructor(index) {
    this.index = index;
    this.pos = [3, 0];
    this.rot = 0;
  }

  getColor() {
    return COLOURS[this.index];
  }

  getShape() {
    return SRS.pieces[this.index][this.rot];
  }

  move(dx, dy) {
    this.pos[0] += dx;
    this.pos[1] += dy;
  }

  rotate(newRot) {
    this.rot = newRot;
  }

  reset() {
    this.pos = [3, 0];
    this.rot = 0;
  }

  draw() {
    fill(color(this.getColor()));
    for (const pos of this.getShape()) {
      tileAt(this.pos[0] + pos[0], this.pos[1] + pos[1]);
    }
  }

  drawGhost() {
    let depth = 0;
    outer: for (let i = 0; i < HEIGHT; i++) {
      for (const pos of this.getShape()) {
        const testPos = [
          this.pos[0] + pos[0],
          this.pos[1] + pos[1] + i,
        ];
        if (!safePlace(testPos[0], testPos[1])) {
          depth = i - 1;
          break outer;
        }
      }
    }
    fill(color(20));
    for (const pos of this.getShape()) {
      const blockPos = [
        this.pos[0] + pos[0],
        this.pos[1] + pos[1] + depth,
      ];
      tileAt(blockPos[0], blockPos[1]);
    }
  }

  canMove(dx, dy) {
    for (const pos of this.getShape()) {
      const testPos = [
        this.pos[0] + pos[0] + dx,
        this.pos[1] + pos[1] + dy,
      ];
      if (!safePlace(testPos[0], testPos[1])) return false;
    }
    return true;
  }

  tryMove(dx, dy) {
    if (this.canMove(dx, dy)) {
      this.move(dx, dy);
      return true;
    }
    return false;
  }

  canRotate(newRot) {
    for (const pos of SRS.pieces[this.index][newRot]) {
      const testPos = [
        this.pos[0] + pos[0],
        this.pos[1] + pos[1],
      ];
      if (!safePlace(testPos[0], testPos[1])) return false;
    }
    return true;
  }

  tryRotate(newRot) {
    if (this.canRotate(newRot)) {
      this.rotate(newRot);
      return true;
    }
    return false;
  }

  place() {
    for (const pos of this.getShape()) {
      const blockPos = [
        this.pos[0] + pos[0],
        this.pos[1] + pos[1],
      ];
      board[blockPos[0]][blockPos[1]] = this.index;
    }
  }

  isColliding() {
    for (const pos of this.getShape()) {
      const blockPos = [
        this.pos[0] + pos[0],
        this.pos[1] + pos[1],
      ];
      if (!safePlace(blockPos[0], blockPos[1])) return true;
    }
    return false;
  }
}

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
  currentPiece.drawGhost();
}

function setup() {
  // noStroke();
  createCanvas(CANVAS_SIZE, CANVAS_SIZE);
  resetGame();
}

function drawCurrentPiece() {
  currentPiece.draw();
}

function placePiece() {
  currentPiece.place();
  currentPiece = nextPiece();
  clearLines();
  if (currentPiece.isColliding()) {
    resetGame();
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
  return new Tetromino(next.shift());
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
    let moved = currentPiece.tryMove(0, 1);
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
      currentPiece.tryMove(-1, 0);
      break;
    case "KeyD":
      currentPiece.tryMove(1, 0);
      break;
    case "KeyW":
      currentPiece.tryMove(0, 1);
      break;
    case "KeyS":
      while (currentPiece.tryMove(0, 1)) {}
      placePiece();
      break;
    case "ArrowLeft":
      currentPiece.tryRotate((currentPiece.rot + 3) % 4);
      break;
    case "ArrowRight":
      currentPiece.tryRotate((currentPiece.rot + 1) % 4);
      break;
    case "ShiftLeft":
      hold();
      break;
  }
  console.log(event);
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
    currentPiece = new Tetromino(held);
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
