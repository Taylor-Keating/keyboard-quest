// Progress is saved locally in this browser. It is only a list of completed
// lesson IDs, such as ["home-anchors"].
const progressKey = "keyboard-quest-completed-objectives";
const completedLessonIds = new Set(JSON.parse(localStorage.getItem(progressKey) || "[]"));

let currentLesson = QUEST_LESSONS.find((lesson) => !completedLessonIds.has(lesson.id)) || QUEST_LESSONS[0];
let position = 0;

const targetElement = document.querySelector("#target");
const feedbackElement = document.querySelector("#feedback");
const restartButton = document.querySelector("#restart-button");
const questMapElement = document.querySelector("#quest-map");
const lessonTitleElement = document.querySelector("#lesson-title");
const lessonDescriptionElement = document.querySelector("#lesson-description");
const progressTextElement = document.querySelector("#progress-text");
const fingerCueElement = document.querySelector("#finger-cue");
const keyboardGuideElement = document.querySelector("#keyboard-guide");

// Each key belongs to one finger. The text labels provide the instruction;
// the matching keyboard colors make it easier to see the pattern at a glance.
const KEYBOARD_ROWS = [
  ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
  ["a", "s", "d", "f", "g", "h", "j", "k", "l", ";"],
  ["z", "x", "c", "v", "b", "n", "m", ",", ".", "/"],
];

const KEY_FINGERS = {
  q: "left pinky", a: "left pinky", z: "left pinky",
  w: "left ring", s: "left ring", x: "left ring",
  e: "left middle", d: "left middle", c: "left middle",
  r: "left index", f: "left index", v: "left index", t: "left index", g: "left index", b: "left index",
  y: "right index", h: "right index", n: "right index", u: "right index", j: "right index", m: "right index",
  i: "right middle", k: "right middle", ",": "right middle",
  o: "right ring", l: "right ring", ".": "right ring",
  p: "right pinky", ";": "right pinky", "/": "right pinky",
};

function isLessonUnlocked(lesson) {
  const lessonIndex = QUEST_LESSONS.indexOf(lesson);
  return lessonIndex === 0 || completedLessonIds.has(QUEST_LESSONS[lessonIndex - 1].id);
}

function drawProgress() {
  progressTextElement.innerHTML = `<span aria-hidden="true">✦</span> ${completedLessonIds.size} of ${QUEST_LESSONS.length} objectives complete`;
}

function drawQuestMap() {
  questMapElement.innerHTML = QUEST_LESSONS.map((lesson, index) => {
    const completed = completedLessonIds.has(lesson.id);
    const unlocked = isLessonUnlocked(lesson);
    const status = completed ? "completed" : unlocked && lesson.id === currentLesson.id ? "current" : unlocked ? "available" : "locked";
    const icon = completed ? "✓" : unlocked ? index + 1 : "🔒";
    const details = `<span class="stop-icon" aria-hidden="true">${icon}</span>
      <span><strong class="stop-title">${lesson.title}</strong>
      <span class="stop-description">${lesson.description}</span></span>`;

    if (unlocked) {
      return `<li class="quest-stop ${status}"><button class="quest-stop-button" type="button" data-lesson-id="${lesson.id}">${details}</button></li>`;
    }

    return `<li class="quest-stop ${status}"><span class="quest-stop-content">${details}</span></li>`;
  }).join("");

  document.querySelectorAll("[data-lesson-id]").forEach((button) => {
    button.addEventListener("click", () => loadLesson(button.dataset.lessonId));
  });
}

function drawLesson() {
  targetElement.innerHTML = currentLesson.practice.map((letter, index) => {
    const displayLetter = letter === " " ? "·" : letter;
    if (index < position) return `<span class="completed-letter">${displayLetter}</span>`;
    if (index === position) return `<span class="current-letter">${displayLetter}</span>`;
    return `<span>${displayLetter}</span>`;
  }).join("");

  drawFingerGuide();
}

function drawFingerGuide() {
  const nextKey = currentLesson.practice[position];
  const visibleKey = nextKey === " " ? "space" : nextKey;
  const finger = KEY_FINGERS[nextKey];

  fingerCueElement.textContent = position === currentLesson.practice.length
    ? "Mission complete! Return your hands to home base."
    : nextKey === " "
      ? "Next: Space bar — use either thumb."
      : `Next: ${visibleKey.toUpperCase()} — ${finger} finger.`;

  const letterRows = KEYBOARD_ROWS.map((row) => `
    <div class="keyboard-row">
      ${row.map((key) => {
        const fingerClass = `finger-${KEY_FINGERS[key].replace(" ", "-")}`;
        const activeClass = key === nextKey ? "active-key" : "";
        return `<span class="keyboard-key ${fingerClass} ${activeClass}">${key === ";" ? ";" : key.toUpperCase()}</span>`;
      }).join("")}
    </div>`).join("");
  const spaceIsNext = nextKey === " " ? "active-key" : "";
  const spaceBar = `<div class="keyboard-space-row"><span class="keyboard-key keyboard-space ${spaceIsNext}">SPACE</span></div>`;
  keyboardGuideElement.innerHTML = letterRows + spaceBar;
}

function loadLesson(lessonId) {
  currentLesson = QUEST_LESSONS.find((lesson) => lesson.id === lessonId);
  position = 0;
  lessonTitleElement.textContent = currentLesson.title;
  lessonDescriptionElement.textContent = currentLesson.description;
  feedbackElement.textContent = "Press the first letter when you are ready.";
  feedbackElement.classList.remove("mistake");
  drawQuestMap();
  drawLesson();
}

function restartLesson() {
  position = 0;
  feedbackElement.textContent = "Press the first letter when you are ready.";
  feedbackElement.classList.remove("mistake");
  // A focused button treats Space as another click. Move focus away so Space
  // can be used as the next typing answer.
  restartButton.blur();
  drawLesson();
}

function completeCurrentLesson() {
  completedLessonIds.add(currentLesson.id);
  localStorage.setItem(progressKey, JSON.stringify([...completedLessonIds]));
  const nextLesson = QUEST_LESSONS[QUEST_LESSONS.indexOf(currentLesson) + 1];
  feedbackElement.textContent = nextLesson
    ? `Objective complete! ${nextLesson.title} is now available on the map.`
    : "You completed the whole Keyboard Quest!";
  drawProgress();
  drawQuestMap();
}

document.addEventListener("keydown", (event) => {
  if (event.key.length !== 1 || position === currentLesson.practice.length) return;

  const typedLetter = event.key.toLowerCase();
  const expectedLetter = currentLesson.practice[position];

  if (typedLetter === expectedLetter) {
    position += 1;
    feedbackElement.classList.remove("mistake");
    if (position === currentLesson.practice.length) completeCurrentLesson();
    else feedbackElement.textContent = "Nice! Keep going.";
    drawLesson();
  } else {
    const hint = expectedLetter === " " ? "the space bar" : expectedLetter.toUpperCase();
    feedbackElement.textContent = `Almost! Try ${hint}.`;
    feedbackElement.classList.add("mistake");
  }
});

restartButton.addEventListener("click", restartLesson);

drawProgress();
loadLesson(currentLesson.id);
