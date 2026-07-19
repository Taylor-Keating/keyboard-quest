const progressKey = "keyboard-quest-completed-objectives";
const fingerColorKey = "keyboard-quest-show-all-finger-colors";
const completedLessonIds = new Set(JSON.parse(localStorage.getItem(progressKey) || "[]"));
let showsFullFingerColors = localStorage.getItem(fingerColorKey) === "true";

let currentLesson = QUEST_LESSONS.find((lesson) => !completedLessonIds.has(lesson.id)) || QUEST_LESSONS[0];
let missionIndex = 0;
let position = 0;
let waitingToContinue = false;
let waitingToStartPractice = false;
let activeMode = "learn";
let mistakeCount = 0;
let attemptCount = 0;
let missionStartedAt = null;

const targetElement = document.querySelector("#target");
const feedbackElement = document.querySelector("#feedback");
const restartButton = document.querySelector("#restart-button");
const continueButton = document.querySelector("#continue-button");
const nextChapterButton = document.querySelector("#next-chapter-button");
const questMapElement = document.querySelector("#quest-map");
const objectiveLabelElement = document.querySelector("#objective-label");
const lessonTitleElement = document.querySelector("#lesson-title");
const lessonDescriptionElement = document.querySelector("#lesson-description");
const progressTextElement = document.querySelector("#progress-text");
const missionHeadingElement = document.querySelector("#exercise-heading");
const missionNoteElement = document.querySelector("#mission-note");
const missionResultsElement = document.querySelector("#mission-results");
const accuracyResultElement = document.querySelector("#accuracy-result");
const mistakesResultElement = document.querySelector("#mistakes-result");
const paceResultElement = document.querySelector("#pace-result");
const resultsMessageElement = document.querySelector("#results-message");
const learningCardElement = document.querySelector("#learning-card");
const learningPhaseElement = document.querySelector("#learning-phase");
const learningHeadingElement = document.querySelector("#learning-heading");
const learningCopyElement = document.querySelector("#learning-copy");
const learningStepsElement = document.querySelector("#learning-steps");
const learningGoalElement = document.querySelector("#learning-goal");
const startPracticeButton = document.querySelector("#start-practice-button");
const practiceAreaElement = document.querySelector("#practice-area");
const fingerCueElement = document.querySelector("#finger-cue");
const keyboardGuideElement = document.querySelector("#keyboard-guide");
const fullColorToggle = document.querySelector("#full-color-toggle");

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
  const mission = currentMission();
  missionHeadingElement.textContent = `${mission.phase || "Mission"} · ${missionIndex + 1} of ${currentLesson.missions.length}: ${mission.title}`;
  missionNoteElement.textContent = currentMission().note || (missionIndex === 0
    ? "Learn the pattern slowly and carefully."
    : "Keep your fingers returning to home base.");
}

function drawLearningContent() {
  const learning = currentMission().learning;
  learningCardElement.hidden = !learning;
  if (!learning) return;

  learningPhaseElement.textContent = currentMission().phase;
  learningHeadingElement.textContent = learning.heading;
  learningCopyElement.textContent = learning.copy;
  learningStepsElement.innerHTML = learning.steps.map((step) => `<li>${step}</li>`).join("");
  learningGoalElement.textContent = learning.goal;
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

function scrollTo(element) {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  element.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" });
}

function drawMissionResults() {
  const correctKeys = currentPractice().length;
  const accuracy = Math.round((correctKeys / attemptCount) * 100);
  const elapsedMinutes = Math.max(Date.now() - missionStartedAt, 1000) / 60000;
  const keysPerMinute = Math.round(correctKeys / elapsedMinutes);

  accuracyResultElement.textContent = `${accuracy}%`;
  mistakesResultElement.textContent = mistakeCount;
  paceResultElement.textContent = keysPerMinute;
  resultsMessageElement.textContent = accuracy === 100
    ? "Perfect accuracy!"
    : accuracy >= 90
      ? "Great control!"
      : accuracy >= 75
        ? "Nice work. A slower rhythm may make the next run even smoother."
        : "Good persistence. Try the mission again when you want another practice run.";
  missionResultsElement.hidden = false;
}

function drawFingerGuide() {
  const practice = currentPractice();
  const missionKeys = new Set(practice.filter((key) => key !== " "));
  const showsEveryKey = showsFullFingerColors || currentLesson.showFullKeyboard;
  const nextKey = practice[position];
  const finger = KEY_FINGERS[nextKey];

  fullColorToggle.checked = showsEveryKey;
  fullColorToggle.disabled = Boolean(currentLesson.showFullKeyboard);

  if (position === practice.length) fingerCueElement.textContent = "Mission complete! Return your hands to home base.";
  else if (nextKey === " ") fingerCueElement.textContent = "Next: Space bar — use either thumb.";
  else fingerCueElement.textContent = `Next: ${nextKey.toUpperCase()} — ${finger} finger.`;

  const letterRows = KEYBOARD_ROWS.map((row) => `
    <div class="keyboard-row">
      ${row.map((key) => {
        const fingerClass = `finger-${KEY_FINGERS[key].replace(" ", "-")}`;
        const activeClass = key === nextKey ? "active-key" : "";
        const focusClass = missionKeys.has(key) ? "mission-key" : showsEveryKey ? "" : "not-in-mission-key";
        return `<span class="keyboard-key ${fingerClass} ${focusClass} ${activeClass}">${key.toUpperCase()}</span>`;
      }).join("")}
    </div>`).join("");
  const spaceIsNext = nextKey === " " ? "active-key" : "";
  keyboardGuideElement.innerHTML = `${letterRows}<div class="keyboard-space-row"><span class="keyboard-key keyboard-space ${spaceIsNext}">SPACE</span></div>`;
}

function startCurrentMission(shouldScroll = false) {
  position = 0;
  mistakeCount = 0;
  attemptCount = 0;
  missionStartedAt = null;
  waitingToContinue = false;
  continueButton.hidden = true;
  nextChapterButton.hidden = true;
  feedbackElement.textContent = "Press the first letter when you are ready.";
  feedbackElement.classList.remove("mistake");
  missionResultsElement.hidden = true;
  drawMissionHeading();
  drawLearningContent();
  drawLesson();
  waitingToStartPractice = Boolean(currentMission().learning);
  practiceAreaElement.hidden = waitingToStartPractice;
  startPracticeButton.hidden = !waitingToStartPractice;
  if (shouldScroll) scrollTo(learningCardElement);
}

function startPractice() {
  waitingToStartPractice = false;
  practiceAreaElement.hidden = false;
  startPracticeButton.hidden = true;
  startPracticeButton.blur();
  scrollTo(practiceAreaElement);
}

function loadLesson(lessonId, shouldScroll = true) {
  currentLesson = QUEST_LESSONS.find((lesson) => lesson.id === lessonId);
  missionIndex = 0;
  objectiveLabelElement.textContent = `Objective ${QUEST_LESSONS.indexOf(currentLesson) + 1} · Keyboard skills`;
  lessonTitleElement.textContent = currentLesson.title;
  lessonDescriptionElement.textContent = currentLesson.description;
  drawQuestMap();
  startCurrentMission(shouldScroll);
}

function restartMission() {
  restartButton.blur();
  startCurrentMission(true);
}

function completeCurrentMission() {
  drawMissionResults();
  requestAnimationFrame(() => scrollTo(missionResultsElement));
  const isFinalMission = missionIndex === currentLesson.missions.length - 1;
  if (isFinalMission) {
    completeCurrentLesson();
    return;
  }

  waitingToContinue = true;
  continueButton.textContent = `Start mission ${missionIndex + 2}`;
  continueButton.hidden = false;
  feedbackElement.textContent = "Mission complete! Press Enter or Space to continue.";
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
    feedbackElement.textContent += " Press Enter or Space to continue.";
  }
  drawProgress();
  drawQuestMap();
}

document.addEventListener("keydown", (event) => {
  if (activeMode !== "learn") {
    handleChallengeKey(event);
    return;
  }

  const isContinueKey = event.key === "Enter" || event.key === " ";
  if (waitingToStartPractice && isContinueKey) {
    event.preventDefault();
    startPractice();
    return;
  }

  if (waitingToContinue && isContinueKey) {
    event.preventDefault();
    missionIndex += 1;
    startCurrentMission(true);
    return;
  }

  if (!nextChapterButton.hidden && isContinueKey) {
    const nextLesson = QUEST_LESSONS[QUEST_LESSONS.indexOf(currentLesson) + 1];
    if (nextLesson) {
      event.preventDefault();
      loadLesson(nextLesson.id);
    }
    return;
  }

  const practice = currentPractice();
  if (event.key.length !== 1 || waitingToStartPractice || waitingToContinue || position === practice.length) return;

  if (missionStartedAt === null) missionStartedAt = Date.now();
  attemptCount += 1;
  const typedLetter = event.key.toLowerCase();
  const expectedLetter = practice[position];
  if (typedLetter === expectedLetter) {
    position += 1;
    feedbackElement.classList.remove("mistake");
    if (position === practice.length) completeCurrentMission();
    else feedbackElement.textContent = "Nice! Keep going.";
    drawLesson();
  } else {
    mistakeCount += 1;
    const hint = expectedLetter === " " ? "the space bar" : expectedLetter.toUpperCase();
    feedbackElement.textContent = `Almost! Try ${hint}.`;
    feedbackElement.classList.add("mistake");
  }
});

restartButton.addEventListener("click", restartMission);
continueButton.addEventListener("click", () => {
  missionIndex += 1;
  continueButton.blur();
  startCurrentMission(true);
});
startPracticeButton.addEventListener("click", startPractice);
fullColorToggle.checked = showsFullFingerColors;
fullColorToggle.addEventListener("change", () => {
  showsFullFingerColors = fullColorToggle.checked;
  localStorage.setItem(fingerColorKey, showsFullFingerColors);
  drawFingerGuide();
});
nextChapterButton.addEventListener("click", () => {
  const nextLesson = QUEST_LESSONS[QUEST_LESSONS.indexOf(currentLesson) + 1];
  if (nextLesson) loadLesson(nextLesson.id);
});

drawProgress();
loadLesson(currentLesson.id, false);
