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
let apples = [];

document.querySelectorAll(".time-btn").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".time-btn").forEach((item) => item.classList.remove("selected"));
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
document.getElementById("shuffle-btn").addEventListener("click", shuffleRemaining);
document.getElementById("hint-btn").addEventListener("click", showHint);

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
    const apple = document.createElement("button");
    apple.className = "apple";
    apple.type = "button";
    apple.textContent = value;
    apple.dataset.value = value;
    apple.dataset.index = index;
    apple.setAttribute("aria-label", `숫자 ${value} 사과`);

    board.appendChild(apple);
    apples.push({
      element: apple,
      value,
      removed: false,
      row: Math.floor(index / COLS),
      col: index % COLS,
    });
  });
}

function createPlayableValues() {
  // 190칸을 두 숫자의 합이 10이 되는 쌍으로 먼저 구성한 뒤 섞습니다.
  // 따라서 게임판에 최소한 여러 개의 정답 조합이 존재합니다.
  const values = [];
  const pairChoices = [
    [1, 9], [2, 8], [3, 7], [4, 6], [5, 5],
  ];

  for (let i = 0; i < (ROWS * COLS) / 2; i += 1) {
    const pair = pairChoices[Math.floor(Math.random() * pairChoices.length)];
    values.push(...pair);
  }

  return shuffleArray(values);
}

function handlePointerDown(event) {
  if (gameScreen.classList.contains("hidden") || remainingSeconds <= 0) return;
  if (event.button !== undefined && event.button !== 0) return;

  dragging = true;
  boardWrap.setPointerCapture?.(event.pointerId);
  dragStart = getPointInBoardWrap(event);
  updateSelectionBox(dragStart, dragStart);
  event.preventDefault();
}

function handlePointerMove(event) {
  if (!dragging) return;

  const current = getPointInBoardWrap(event);
  updateSelectionBox(dragStart, current);
  updateSelectedApples();
  event.preventDefault();
}

function handlePointerUp(event) {
  if (!dragging) return;
  updateSelectedApples();

  const selected = apples.filter(
    (apple) => !apple.removed && apple.element.classList.contains("selected")
  );
  const sum = selected.reduce((total, apple) => total + apple.value, 0);

  if (selected.length > 0 && sum === 10) {
    selected.forEach((apple) => {
      apple.removed = true;
      apple.element.classList.add("removed");
      apple.element.classList.remove("selected");
    });
    score += selected.length;
    scoreEl.textContent = score;
    showMessage(`성공! ${selected.length}개 제거`, true);

    if (apples.every((apple) => apple.removed)) {
      finishGame();
    }
  } else if (selected.length > 0) {
    showMessage(`합계 ${sum} — 10이 아닙니다.`, false);
    selected.forEach((apple) => apple.element.classList.remove("selected"));
  }

  cancelDrag();
  boardWrap.releasePointerCapture?.(event.pointerId);
}

function cancelDrag() {
  dragging = false;
  dragStart = null;
  selectionBox.style.display = "none";
  apples.forEach((apple) => apple.element.classList.remove("selected"));
}

function getPointInBoardWrap(event) {
  const rect = boardWrap.getBoundingClientRect();
  return {
    x: event.clientX - rect.left + boardWrap.scrollLeft,
    y: event.clientY - rect.top + boardWrap.scrollTop,
  };
}

function updateSelectionBox(start, current) {
  const left = Math.min(start.x, current.x);
  const top = Math.min(start.y, current.y);
  const width = Math.abs(current.x - start.x);
  const height = Math.abs(current.y - start.y);

  selectionBox.style.display = "block";
  selectionBox.style.left = `${left}px`;
  selectionBox.style.top = `${top}px`;
  selectionBox.style.width = `${Math.max(width, 2)}px`;
  selectionBox.style.height = `${Math.max(height, 2)}px`;
}

function updateSelectedApples() {
  const selectionRect = selectionBox.getBoundingClientRect();

  apples.forEach((apple) => {
    if (apple.removed) return;

    const rect = apple.element.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const inside =
      centerX >= selectionRect.left &&
      centerX <= selectionRect.right &&
      centerY >= selectionRect.top &&
      centerY <= selectionRect.bottom;

    apple.element.classList.toggle("selected", inside);
  });
}

function shuffleRemaining() {
  const remaining = apples.filter((apple) => !apple.removed);
  const values = shuffleArray(remaining.map((apple) => apple.value));

  remaining.forEach((apple, index) => {
    apple.value = values[index];
    apple.element.dataset.value = values[index];
    apple.element.textContent = values[index];
    apple.element.setAttribute("aria-label", `숫자 ${values[index]} 사과`);
  });

  showMessage("남은 사과를 섞었습니다.", true);
}

function showHint() {
  const answer = findRectangleSumTen();

  if (!answer) {
    showMessage("현재 직사각형 정답이 없습니다. 섞기를 눌러 주세요.", false);
    return;
  }

  answer.forEach((apple) => {
    apple.element.classList.remove("hint");
    void apple.element.offsetWidth;
    apple.element.classList.add("hint");
  });

  showMessage("반짝이는 사과들을 직사각형으로 드래그해 보세요.", true);
}

function findRectangleSumTen() {
  // 직사각형 내부의 살아 있는 사과 합이 10인 첫 조합을 찾습니다.
  for (let top = 0; top < ROWS; top += 1) {
    for (let left = 0; left < COLS; left += 1) {
      for (let bottom = top; bottom < ROWS; bottom += 1) {
        let running = 0;
        const cells = [];

        for (let right = left; right < COLS; right += 1) {
          for (let row = top; row <= bottom; row += 1) {
            const apple = apples[row * COLS + right];
            if (!apple.removed) {
              running += apple.value;
              cells.push(apple);
            }
          }

          if (running === 10 && cells.length > 0) return [...cells];
          if (running > 10) break;
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
  selectionBox.style.display = "none";

  gameScreen.classList.add("hidden");
  endScreen.classList.remove("hidden");
  finalScoreEl.textContent = score;
}

function showMessage(text, success) {
  messageEl.textContent = text;
  messageEl.style.color = success ? "#fff46b" : "#ff9da6";

  window.clearTimeout(showMessage.timeoutId);
  showMessage.timeoutId = window.setTimeout(() => {
    messageEl.textContent = "";
  }, 1800);
}

function shuffleArray(array) {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
