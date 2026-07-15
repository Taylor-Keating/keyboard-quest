const progressKey = "keyboard-quest-completed-objectives";
const completedLessonIds = new Set(JSON.parse(localStorage.getItem(progressKey) || "[]"));

let currentLesson = QUEST_LESSONS.find((lesson) => !completedLessonIds.has(lesson.id)) || QUEST_LESSONS[0];
let missionIndex = 0;
let position = 0;
let waitingToContinue = false;

const targetElement = document.querySelector("#target");
const feedbackElement = document.querySelector("#feedback");
const restartButton = document.querySelector("#restart-button");
const continueButton = document.querySelector("#continue-button");
const nextChapterButton = document.querySelector("#next-chapter-button");
const questMapElement = document.querySelector("#quest-map");
const lessonTitleElement = document.querySelector("#lesson-title");
const lessonDescriptionElement = document.querySelector("#lesson-description");
const progressTextElement = document.querySelector("#progress-text");
const missionHeadingElement = document.querySelector("#exercise-heading");
const missionNoteElement = document.querySelector("#mission-note");
const fingerCueElement = document.querySelector("#finger-cue");
const keyboardGuideElement = document.querySelector("#keyboard-guide");

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

function currentMission() {
  return currentLesson.missions[missionIndex];
}

function currentPractice() {
  return Array.from(currentMission().practice);
}

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

    if (unlocked) return `<li class="quest-stop ${status}"><button class="quest-stop-button" type="button" data-lesson-id="${lesson.id}">${details}</button></li>`;
    return `<li class="quest-stop ${status}"><span class="quest-stop-content">${details}</span></li>`;
  }).join("");

  document.querySelectorAll("[data-lesson-id]").forEach((button) => {
    button.addEventListener("click", () => loadLesson(button.dataset.lessonId));
  });
}

function drawMissionHeading() {
  missionHeadingElement.textContent = `Mission ${missionIndex + 1} of ${currentLesson.missions.length}: ${currentMission().title}`;
  missionNoteElement.textContent = currentMission().note || (missionIndex === 0
    ? "Learn the pattern slowly and carefully."
    : "Keep your fingers returning to home base.");
}

function drawLesson() {
  const practice = currentPractice();
  targetElement.innerHTML = practice.map((letter, index) => {
    const displayLetter = letter === " " ? "·" : letter;
    if (index < position) return `<span class="completed-letter">${displayLetter}</span>`;
    if (index === position) return `<span class="current-letter">${displayLetter}</span>`;
    return `<span>${displayLetter}</span>`;
  }).join("");
  drawFingerGuide();
}

function drawFingerGuide() {
  const practice = currentPractice();
  const nextKey = practice[position];
  const finger = KEY_FINGERS[nextKey];

  if (position === practice.length) fingerCueElement.textContent = "Mission complete! Return your hands to home base.";
  else if (nextKey === " ") fingerCueElement.textContent = "Next: Space bar — use either thumb.";
  else fingerCueElement.textContent = `Next: ${nextKey.toUpperCase()} — ${finger} finger.`;

  const letterRows = KEYBOARD_ROWS.map((row) => `
    <div class="keyboard-row">
      ${row.map((key) => {
        const fingerClass = `finger-${KEY_FINGERS[key].replace(" ", "-")}`;
        const activeClass = key === nextKey ? "active-key" : "";
        return `<span class="keyboard-key ${fingerClass} ${activeClass}">${key.toUpperCase()}</span>`;
      }).join("")}
    </div>`).join("");
  const spaceIsNext = nextKey === " " ? "active-key" : "";
  keyboardGuideElement.innerHTML = `${letterRows}<div class="keyboard-space-row"><span class="keyboard-key keyboard-space ${spaceIsNext}">SPACE</span></div>`;
}

function startCurrentMission() {
  position = 0;
  waitingToContinue = false;
  continueButton.hidden = true;
  nextChapterButton.hidden = true;
  feedbackElement.textContent = "Press the first letter when you are ready.";
  feedbackElement.classList.remove("mistake");
  drawMissionHeading();
  drawLesson();
}

function loadLesson(lessonId) {
  currentLesson = QUEST_LESSONS.find((lesson) => lesson.id === lessonId);
  missionIndex = 0;
  lessonTitleElement.textContent = currentLesson.title;
  lessonDescriptionElement.textContent = currentLesson.description;
  drawQuestMap();
  startCurrentMission();
}

function restartMission() {
  restartButton.blur();
  startCurrentMission();
}

function completeCurrentMission() {
  const isFinalMission = missionIndex === currentLesson.missions.length - 1;
  if (isFinalMission) {
    completeCurrentLesson();
    return;
  }

  waitingToContinue = true;
  continueButton.textContent = `Start mission ${missionIndex + 2}`;
  continueButton.hidden = false;
  feedbackElement.textContent = "Mission complete! Take a breath, then continue.";
  drawLesson();
}

function completeCurrentLesson() {
  completedLessonIds.add(currentLesson.id);
  localStorage.setItem(progressKey, JSON.stringify([...completedLessonIds]));
  const nextLesson = QUEST_LESSONS[QUEST_LESSONS.indexOf(currentLesson) + 1];
  feedbackElement.textContent = nextLesson ? `Objective complete! ${nextLesson.title} is now available on the map.` : "You completed the whole Keyboard Quest!";
  if (nextLesson) {
    nextChapterButton.textContent = `Continue to ${nextLesson.title}`;
    nextChapterButton.hidden = false;
  }
  drawProgress();
  drawQuestMap();
}

document.addEventListener("keydown", (event) => {
  const practice = currentPractice();
  if (event.key.length !== 1 || waitingToContinue || position === practice.length) return;

  const typedLetter = event.key.toLowerCase();
  const expectedLetter = practice[position];
  if (typedLetter === expectedLetter) {
    position += 1;
    feedbackElement.classList.remove("mistake");
    if (position === practice.length) completeCurrentMission();
    else feedbackElement.textContent = "Nice! Keep going.";
    drawLesson();
  } else {
    const hint = expectedLetter === " " ? "the space bar" : expectedLetter.toUpperCase();
    feedbackElement.textContent = `Almost! Try ${hint}.`;
    feedbackElement.classList.add("mistake");
  }
});

restartButton.addEventListener("click", restartMission);
continueButton.addEventListener("click", () => {
  missionIndex += 1;
  continueButton.blur();
  startCurrentMission();
});
nextChapterButton.addEventListener("click", () => {
  const nextLesson = QUEST_LESSONS[QUEST_LESSONS.indexOf(currentLesson) + 1];
  if (nextLesson) loadLesson(nextLesson.id);
});

drawProgress();
loadLesson(currentLesson.id);
