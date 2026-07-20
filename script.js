const ROWS = 10;
const COLS = 19;

const startScreen = document.getElementById("start-screen");
const gameScreen = document.getElementById("game-screen");
const endScreen = document.getElementById("end-screen");
const board = document.getElementById("board");
const boardWrap = document.getElementById("board-wrap");
const selectionBox = document.getElementById("selection-box");
const scoreEl = document.getElementById("score");
const timerEl = document.getElementById("timer");
const finalScoreEl = document.getElementById("final-score");
const messageEl = document.getElementById("message");

let selectedSeconds = 120;
let remainingSeconds = 120;
let score = 0;
let timerId = null;

let dragging = false;
let dragStart = null;
let dragCurrent = null;

let apples = [];

document.querySelectorAll(".time-btn").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".time-btn").forEach((item) => {
      item.classList.remove("selected");
    });

    button.classList.add("selected");
    selectedSeconds = Number(button.dataset.seconds);
  });
});

document.getElementById("start-btn").addEventListener("click", startGame);
document.getElementById("restart-btn").addEventListener("click", startGame);

document.getElementById("play-again-btn").addEventListener("click", () => {
  endScreen.classList.add("hidden");
  startScreen.classList.remove("hidden");
});

document
  .getElementById("shuffle-btn")
  .addEventListener("click", shuffleRemaining);

document
  .getElementById("hint-btn")
  .addEventListener("click", showHint);

boardWrap.addEventListener("pointerdown", handlePointerDown);
window.addEventListener("pointermove", handlePointerMove);
window.addEventListener("pointerup", handlePointerUp);
window.addEventListener("pointercancel", cancelDrag);

function startGame() {
  clearInterval(timerId);

  score = 0;
  remainingSeconds = selectedSeconds;

  scoreEl.textContent = score;
  timerEl.textContent = remainingSeconds;
  messageEl.textContent = "";

  startScreen.classList.add("hidden");
  endScreen.classList.add("hidden");
  gameScreen.classList.remove("hidden");

  buildBoard();

  timerId = setInterval(() => {
    remainingSeconds -= 1;
    timerEl.textContent = remainingSeconds;

    if (remainingSeconds <= 0) {
      finishGame();
    }
  }, 1000);
}

function buildBoard() {
  board.innerHTML = "";
  apples = [];

  const values = createPlayableValues();

  values.forEach((value, index) => {
    const appleElement = document.createElement("button");

    appleElement.className = "apple";
    appleElement.type = "button";
    appleElement.textContent = value;
    appleElement.dataset.value = value;
    appleElement.dataset.index = index;
    appleElement.setAttribute("aria-label", `숫자 ${value} 사과`);

    board.appendChild(appleElement);

    apples.push({
      element: appleElement,
      value,
      removed: false,
      row: Math.floor(index / COLS),
      col: index % COLS,
    });
  });
}

function createPlayableValues() {
  const values = [];

  const pairChoices = [
    [1, 9],
    [2, 8],
    [3, 7],
    [4, 6],
    [5, 5],
  ];

  for (let i = 0; i < (ROWS * COLS) / 2; i += 1) {
    const randomIndex = Math.floor(
      Math.random() * pairChoices.length
    );

    const pair = pairChoices[randomIndex];
    values.push(...pair);
  }

  return shuffleArray(values);
}

function handlePointerDown(event) {
  if (
    gameScreen.classList.contains("hidden") ||
    remainingSeconds <= 0
  ) {
    return;
  }

  if (event.button !== undefined && event.button !== 0) {
    return;
  }

  dragging = true;

  boardWrap.setPointerCapture?.(event.pointerId);

  dragStart = getPointInBoardWrap(event);
  dragCurrent = dragStart;

  updateSelectionLine(dragStart, dragCurrent);
  updateSelectedApples(dragStart, dragCurrent);

  event.preventDefault();
}

function handlePointerMove(event) {
  if (!dragging) return;

  dragCurrent = getPointInBoardWrap(event);

  updateSelectionLine(dragStart, dragCurrent);
  updateSelectedApples(dragStart, dragCurrent);

  event.preventDefault();
}

function handlePointerUp(event) {
  if (!dragging) return;

  dragCurrent = getPointInBoardWrap(event);

  updateSelectionLine(dragStart, dragCurrent);
  updateSelectedApples(dragStart, dragCurrent);

  const selected = apples.filter((apple) => {
    return (
      !apple.removed &&
      apple.element.classList.contains("selected")
    );
  });

  const sum = selected.reduce((total, apple) => {
    return total + apple.value;
  }, 0);

  if (selected.length > 0 && sum === 10) {
    selected.forEach((apple) => {
      apple.removed = true;
      apple.element.classList.add("removed");
      apple.element.classList.remove("selected");
    });

    score += selected.length;
    scoreEl.textContent = score;

    showMessage(
      `성공! ${selected.length}개 제거`,
      true
    );

    if (apples.every((apple) => apple.removed)) {
      finishGame();
    }
  } else if (selected.length > 0) {
    showMessage(
      `합계 ${sum} — 10이 아닙니다.`,
      false
    );

    selected.forEach((apple) => {
      apple.element.classList.remove("selected");
    });
  }

  cancelDrag();
  boardWrap.releasePointerCapture?.(event.pointerId);
}

function cancelDrag() {
  dragging = false;
  dragStart = null;
  dragCurrent = null;

  selectionBox.style.display = "none";

  apples.forEach((apple) => {
    apple.element.classList.remove("selected");
  });
}

function getPointInBoardWrap(event) {
  const rect = boardWrap.getBoundingClientRect();

  return {
    x:
      event.clientX -
      rect.left +
      boardWrap.scrollLeft,

    y:
      event.clientY -
      rect.top +
      boardWrap.scrollTop,
  };
}

function updateSelectionLine(start, current) {
  const dx = current.x - start.x;
  const dy = current.y - start.y;

  const length = Math.hypot(dx, dy);
  const angle = Math.atan2(dy, dx) * (180 / Math.PI);

  selectionBox.style.display = "block";
  selectionBox.style.left = `${start.x}px`;
  selectionBox.style.top = `${start.y}px`;

  selectionBox.style.width = `${Math.max(length, 2)}px`;
  selectionBox.style.height = "4px";

  selectionBox.style.transformOrigin = "0 50%";
  selectionBox.style.transform =
    `translateY(-2px) rotate(${angle}deg)`;

  selectionBox.style.pointerEvents = "none";
}

function updateSelectedApples(start, current) {
  const wrapRect = boardWrap.getBoundingClientRect();

  apples.forEach((apple) => {
    if (apple.removed) {
      apple.element.classList.remove("selected");
      return;
    }

    const rect = apple.element.getBoundingClientRect();

    const centerX =
      rect.left -
      wrapRect.left +
      boardWrap.scrollLeft +
      rect.width / 2;

    const centerY =
      rect.top -
      wrapRect.top +
      boardWrap.scrollTop +
      rect.height / 2;

    const distance = distanceToLineSegment(
      centerX,
      centerY,
      start.x,
      start.y,
      current.x,
      current.y
    );

    const selectDistance =
      Math.min(rect.width, rect.height) * 0.38;

    const isSelected =
      distance <= selectDistance;

    apple.element.classList.toggle(
      "selected",
      isSelected
    );
  });
}

function distanceToLineSegment(
  px,
  py,
  x1,
  y1,
  x2,
  y2
) {
  const lineX = x2 - x1;
  const lineY = y2 - y1;

  const lineLengthSquared =
    lineX * lineX + lineY * lineY;

  if (lineLengthSquared === 0) {
    return Math.hypot(px - x1, py - y1);
  }

  let position =
    ((px - x1) * lineX +
      (py - y1) * lineY) /
    lineLengthSquared;

  position = Math.max(
    0,
    Math.min(1, position)
  );

  const nearestX = x1 + position * lineX;
  const nearestY = y1 + position * lineY;

  return Math.hypot(
    px - nearestX,
    py - nearestY
  );
}

function shuffleRemaining() {
  const remaining = apples.filter((apple) => {
    return !apple.removed;
  });

  const values = shuffleArray(
    remaining.map((apple) => apple.value)
  );

  remaining.forEach((apple, index) => {
    apple.value = values[index];

    apple.element.dataset.value =
      values[index];

    apple.element.textContent =
      values[index];

    apple.element.setAttribute(
      "aria-label",
      `숫자 ${values[index]} 사과`
    );
  });

  showMessage(
    "남은 사과를 섞었습니다.",
    true
  );
}

function showHint() {
  clearHintClasses();

  const answer = findLineSumTen();

  if (!answer) {
    showMessage(
      "현재 합이 10인 직선 조합이 없습니다. 섞기를 눌러 주세요.",
      false
    );
    return;
  }

  answer.forEach((apple) => {
    apple.element.classList.remove("hint");

    void apple.element.offsetWidth;

    apple.element.classList.add("hint");
  });

  showMessage(
    "반짝이는 사과들을 한 줄로 드래그해 보세요.",
    true
  );
}

function clearHintClasses() {
  apples.forEach((apple) => {
    apple.element.classList.remove("hint");
  });
}

function findLineSumTen() {
  const directions = [
    { row: 0, col: 1 },
    { row: 1, col: 0 },
    { row: 1, col: 1 },
    { row: 1, col: -1 },
  ];

  for (let startRow = 0; startRow < ROWS; startRow += 1) {
    for (
      let startCol = 0;
      startCol < COLS;
      startCol += 1
    ) {
      for (const direction of directions) {
        const cells = [];
        let sum = 0;

        let row = startRow;
        let col = startCol;

        while (
          row >= 0 &&
          row < ROWS &&
          col >= 0 &&
          col < COLS
        ) {
          const apple =
            apples[row * COLS + col];

          if (apple && !apple.removed) {
            cells.push(apple);
            sum += apple.value;

            if (sum === 10) {
              return [...cells];
            }

            if (sum > 10) {
              break;
            }
          } else {
            cells.length = 0;
            sum = 0;
          }

          row += direction.row;
          col += direction.col;
        }
      }
    }
  }

  return null;
}

function finishGame() {
  clearInterval(timerId);

  timerId = null;
  dragging = false;
  dragStart = null;
  dragCurrent = null;

  selectionBox.style.display = "none";

  apples.forEach((apple) => {
    apple.element.classList.remove("selected");
  });

  gameScreen.classList.add("hidden");
  endScreen.classList.remove("hidden");

  finalScoreEl.textContent = score;
}

function showMessage(text, success) {
  messageEl.textContent = text;

  messageEl.style.color =
    success ? "#fff46b" : "#ff9da6";

  window.clearTimeout(
    showMessage.timeoutId
  );

  showMessage.timeoutId =
    window.setTimeout(() => {
      messageEl.textContent = "";
    }, 1800);
}

function shuffleArray(array) {
  const copy = [...array];

  for (
    let i = copy.length - 1;
    i > 0;
    i -= 1
  ) {
    const j = Math.floor(
      Math.random() * (i + 1)
    );

    [copy[i], copy[j]] = [
      copy[j],
      copy[i],
    ];
  }

  return copy;
}