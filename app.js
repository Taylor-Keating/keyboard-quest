const progressKey = profileStorageKey("keyboard-quest-completed-objectives");
const fingerColorKey = profileStorageKey("keyboard-quest-show-all-finger-colors");
const mistakeSoundKey = profileStorageKey("keyboard-quest-mistake-sound");
const themeKey = profileStorageKey("keyboard-quest-theme");
const stageProgressKey = profileStorageKey("keyboard-quest-completed-stages");
const completedLessonIds = new Set(JSON.parse(localStorage.getItem(progressKey) || "[]"));
const completedStageIds = new Set(JSON.parse(localStorage.getItem(stageProgressKey) || "[]"));
let showsFullFingerColors = localStorage.getItem(fingerColorKey) === "true";
let playsMistakeSound = localStorage.getItem(mistakeSoundKey) !== "false";
let selectedTheme = localStorage.getItem(themeKey) || "classic";
let mistakeAudioContext = null;
let lastMistakeSoundAt = 0;

let currentLesson = QUEST_LESSONS.find((lesson) => !completedLessonIds.has(lesson.id)) || QUEST_LESSONS[0];
let missionIndex = 0;
let position = 0;
let generatedPractice = null;
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
const mistakeSoundButton = document.querySelector("#mistake-sound-button");
const settingsButton = document.querySelector("#settings-button");
const settingsPanel = document.querySelector("#settings-panel");
const closeSettingsButton = document.querySelector("#close-settings-button");
const themeOptions = [...document.querySelectorAll('[name="app-theme"]')];
const profileGateElement = document.querySelector("#profile-gate");
const stageButtonsElement = document.querySelector("#stage-buttons");

function stageId(lesson, stageIndex) {
  return `${lesson.id}:${stageIndex + 1}`;
}

let migratedCompletedStages = false;
completedLessonIds.forEach((lessonId) => {
  const completedLesson = QUEST_LESSONS.find((lesson) => lesson.id === lessonId);
  completedLesson?.missions.forEach((mission, stageIndex) => {
    const id = stageId(completedLesson, stageIndex);
    if (!completedStageIds.has(id)) {
      completedStageIds.add(id);
      migratedCompletedStages = true;
    }
  });
});
if (migratedCompletedStages) localStorage.setItem(stageProgressKey, JSON.stringify([...completedStageIds]));

function applyTheme(theme) {
  const availableThemes = ["classic", "rebel-royal", "shark"];
  selectedTheme = availableThemes.includes(theme) ? theme : "classic";
  document.body.dataset.theme = selectedTheme;
  themeOptions.forEach((option) => {
    option.checked = option.value === selectedTheme;
  });
  localStorage.setItem(themeKey, selectedTheme);
}

function setSettingsOpen(isOpen, shouldReturnFocus = false) {
  settingsPanel.hidden = !isOpen;
  settingsButton.setAttribute("aria-expanded", isOpen);
  settingsButton.setAttribute("aria-label", isOpen ? "Close settings" : "Open settings");
  if (isOpen) {
    const selectedOption = themeOptions.find((option) => option.checked);
    selectedOption?.focus();
  } else if (shouldReturnFocus) {
    settingsButton.focus();
  }
}

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

function stageLabel(stageIndex = missionIndex) {
  return `Stage ${stageIndex + 1}`;
}

function isStageUnlocked(stageIndex) {
  return stageIndex === 0 || completedStageIds.has(stageId(currentLesson, stageIndex - 1));
}

function drawStageSelector() {
  stageButtonsElement.innerHTML = currentLesson.missions.map((mission, stageIndex) => {
    const completed = completedStageIds.has(stageId(currentLesson, stageIndex));
    const unlocked = isStageUnlocked(stageIndex);
    const current = stageIndex === missionIndex;
    const classes = ["stage-button", completed ? "completed" : "", current ? "current" : "", unlocked ? "" : "locked"].filter(Boolean).join(" ");
    const state = completed ? "complete" : current ? "current" : unlocked ? "available" : "locked";
    const stateMark = completed ? "✓" : unlocked ? "" : "🔒";
    return `<button class="${classes}" type="button" data-stage-index="${stageIndex}" ${unlocked ? "" : "disabled"} aria-label="${stageLabel(stageIndex)}: ${mission.title}, ${state}" ${current ? 'aria-current="step"' : ""} title="${mission.title}"><strong>${stageIndex + 1}</strong><span aria-hidden="true">${stateMark}</span></button>`;
  }).join("");

  stageButtonsElement.querySelectorAll("[data-stage-index]").forEach((button) => {
    button.addEventListener("click", () => {
      const selectedStageIndex = Number(button.dataset.stageIndex);
      if (!isStageUnlocked(selectedStageIndex)) return;
      missionIndex = selectedStageIndex;
      startCurrentMission(true);
    });
  });
}

function currentPractice() {
  return Array.from(generatedPractice || currentMission().practice);
}

function shuffledKeys(keys) {
  const shuffled = [...keys];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]];
  }
  return shuffled;
}

function generateMissionPractice() {
  const config = currentMission().randomPractice;
  if (!config) return currentMission().practice;

  const keys = Array.from(config.keys);
  const sequence = [];
  while (sequence.length < config.length) {
    const nextCycle = shuffledKeys(keys);
    if (sequence.length >= 2 && sequence.at(-1) === sequence.at(-2) && nextCycle[0] === sequence.at(-1)) {
      const differentKeyIndex = nextCycle.findIndex((key) => key !== sequence.at(-1));
      [nextCycle[0], nextCycle[differentKeyIndex]] = [nextCycle[differentKeyIndex], nextCycle[0]];
    }
    sequence.push(...nextCycle);
  }
  return sequence.slice(0, config.length).join(config.separator ?? " ");
}

function targetKeySpan(key, stateClass = "") {
  const classes = [stateClass, key === " " ? "space-pill" : ""].filter(Boolean).join(" ");
  const classAttribute = classes ? ` class="${classes}"` : "";
  return `<span${classAttribute}>${key === " " ? "SPACE" : key}</span>`;
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
  objectiveLabelElement.textContent = `Objective ${QUEST_LESSONS.indexOf(currentLesson) + 1} · ${stageLabel()}`;
  missionHeadingElement.textContent = `${stageLabel()} · ${mission.title}`;
  missionNoteElement.textContent = currentMission().note || (missionIndex === 0
    ? "Learn the pattern slowly and carefully."
    : "Keep your fingers returning to home base.");
}

function drawLearningContent() {
  const learning = currentMission().learning;
  learningCardElement.hidden = !learning;
  if (!learning) return;

  learningPhaseElement.textContent = stageLabel();
  learningHeadingElement.textContent = learning.heading;
  learningCopyElement.textContent = learning.copy;
  learningStepsElement.innerHTML = learning.steps.map((step) => `<li>${step}</li>`).join("");
  learningGoalElement.textContent = learning.goal.replace(/^Mastery goal:/, "Stage 3 goal:");
}

function drawLesson() {
  const practice = currentPractice();
  targetElement.innerHTML = practice.map((letter, index) => {
    if (index < position) return targetKeySpan(letter, "completed-letter");
    if (index === position) return targetKeySpan(letter, "current-letter");
    return targetKeySpan(letter);
  }).join("");
  drawFingerGuide();
}

function scrollTo(element) {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  element.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" });
}

function playMistakeSound() {
  if (!playsMistakeSound) return;
  const soundRequestedAt = Date.now();
  const minimumSoundGap = selectedTheme === "shark" ? 1200 : selectedTheme === "rebel-royal" ? 450 : 75;
  if (soundRequestedAt - lastMistakeSoundAt < minimumSoundGap) return;
  lastMistakeSoundAt = soundRequestedAt;

  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    if (!mistakeAudioContext) mistakeAudioContext = new AudioContextClass();
    if (mistakeAudioContext.state === "suspended") mistakeAudioContext.resume();

    const now = mistakeAudioContext.currentTime;
    if (selectedTheme === "rebel-royal") {
      const oscillator = mistakeAudioContext.createOscillator();
      const filter = mistakeAudioContext.createBiquadFilter();
      const gain = mistakeAudioContext.createGain();
      oscillator.type = "sawtooth";
      oscillator.frequency.setValueAtTime(108, now);
      oscillator.frequency.setValueAtTime(82, now + 0.07);
      oscillator.frequency.setValueAtTime(94, now + 0.13);
      oscillator.frequency.setValueAtTime(68, now + 0.2);
      oscillator.frequency.exponentialRampToValueAtTime(43, now + 0.34);
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(310, now);
      filter.frequency.exponentialRampToValueAtTime(170, now + 0.34);
      filter.Q.setValueAtTime(1.8, now);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.045, now + 0.025);
      gain.gain.setValueAtTime(0.045, now + 0.2);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);
      oscillator.connect(filter);
      filter.connect(gain);
      gain.connect(mistakeAudioContext.destination);
      oscillator.start(now);
      oscillator.stop(now + 0.36);
      return;
    }

    if (selectedTheme === "shark") {
      const filter = mistakeAudioContext.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(380, now);
      filter.Q.setValueAtTime(0.8, now);
      filter.connect(mistakeAudioContext.destination);

      [
        { frequency: 36.71, start: 0, duration: 0.42, volume: 0.05 },
        { frequency: 38.89, start: 0.49, duration: 0.62, volume: 0.065 },
      ].forEach((note) => {
        const oscillator = mistakeAudioContext.createOscillator();
        const hornBody = mistakeAudioContext.createOscillator();
        const gain = mistakeAudioContext.createGain();
        const bodyGain = mistakeAudioContext.createGain();
        const noteStart = now + note.start;
        const noteEnd = noteStart + note.duration;
        oscillator.type = "triangle";
        oscillator.frequency.setValueAtTime(note.frequency, noteStart);
        hornBody.type = "sine";
        hornBody.frequency.setValueAtTime(note.frequency * 2, noteStart);
        gain.gain.setValueAtTime(0.0001, noteStart);
        gain.gain.exponentialRampToValueAtTime(note.volume, noteStart + 0.075);
        gain.gain.setValueAtTime(note.volume, noteEnd - 0.15);
        gain.gain.exponentialRampToValueAtTime(0.0001, noteEnd);
        bodyGain.gain.setValueAtTime(0.0001, noteStart);
        bodyGain.gain.exponentialRampToValueAtTime(note.volume * 0.18, noteStart + 0.1);
        bodyGain.gain.exponentialRampToValueAtTime(0.0001, noteEnd);
        oscillator.connect(gain);
        hornBody.connect(bodyGain);
        gain.connect(filter);
        bodyGain.connect(filter);
        oscillator.start(noteStart);
        hornBody.start(noteStart);
        oscillator.stop(noteEnd + 0.01);
        hornBody.stop(noteEnd + 0.01);
      });
      return;
    }

    const oscillator = mistakeAudioContext.createOscillator();
    const gain = mistakeAudioContext.createGain();
    oscillator.type = "triangle";
    oscillator.frequency.setValueAtTime(145, now);
    oscillator.frequency.exponentialRampToValueAtTime(105, now + 0.065);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.032, now + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.085);
    oscillator.connect(gain);
    gain.connect(mistakeAudioContext.destination);
    oscillator.start(now);
    oscillator.stop(now + 0.09);
  } catch {
    // Typing practice still works if browser audio is unavailable.
  }
}

function memorySoundContext() {
  if (!playsMistakeSound) return null;
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return null;
  if (!mistakeAudioContext) mistakeAudioContext = new AudioContextClass();
  if (mistakeAudioContext.state === "suspended") mistakeAudioContext.resume();
  return mistakeAudioContext;
}

function playMemorySuccessSound(kind = "goal") {
  try {
    const audioContext = memorySoundContext();
    if (!audioContext) return;
    const now = audioContext.currentTime;
    const notes = kind === "save" ? [523.25, 659.25, 783.99] : [392, 523.25, 659.25, 783.99];

    notes.forEach((frequency, index) => {
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      const noteStart = now + (index * 0.085);
      const noteEnd = noteStart + 0.32;
      oscillator.type = "triangle";
      oscillator.frequency.setValueAtTime(frequency, noteStart);
      gain.gain.setValueAtTime(0.0001, noteStart);
      gain.gain.exponentialRampToValueAtTime(0.045, noteStart + 0.025);
      gain.gain.exponentialRampToValueAtTime(0.0001, noteEnd);
      oscillator.connect(gain);
      gain.connect(audioContext.destination);
      oscillator.start(noteStart);
      oscillator.stop(noteEnd + 0.01);
    });

    const cheerDuration = 0.65;
    const cheerBuffer = audioContext.createBuffer(1, Math.floor(audioContext.sampleRate * cheerDuration), audioContext.sampleRate);
    const cheerData = cheerBuffer.getChannelData(0);
    for (let index = 0; index < cheerData.length; index += 1) {
      const progress = index / cheerData.length;
      const envelope = Math.sin(Math.PI * progress) * (1 - (progress * 0.35));
      cheerData[index] = ((Math.random() * 2) - 1) * envelope;
    }
    const cheer = audioContext.createBufferSource();
    const cheerFilter = audioContext.createBiquadFilter();
    const cheerGain = audioContext.createGain();
    cheer.buffer = cheerBuffer;
    cheerFilter.type = "bandpass";
    cheerFilter.frequency.setValueAtTime(kind === "save" ? 1500 : 1200, now);
    cheerFilter.Q.setValueAtTime(0.55, now);
    cheerGain.gain.setValueAtTime(0.0001, now);
    cheerGain.gain.exponentialRampToValueAtTime(0.028, now + 0.08);
    cheerGain.gain.exponentialRampToValueAtTime(0.0001, now + cheerDuration);
    cheer.connect(cheerFilter);
    cheerFilter.connect(cheerGain);
    cheerGain.connect(audioContext.destination);
    cheer.start(now);
  } catch {
    // The game stays playable if synthesized audio is unavailable.
  }
}

function playMemoryFailureSound() {
  try {
    const audioContext = memorySoundContext();
    if (!audioContext) return;
    const now = audioContext.currentTime;
    [196, 146.83].forEach((frequency, index) => {
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      const noteStart = now + (index * 0.2);
      const noteEnd = noteStart + 0.38;
      oscillator.type = "sawtooth";
      oscillator.frequency.setValueAtTime(frequency, noteStart);
      oscillator.frequency.exponentialRampToValueAtTime(frequency * 0.62, noteEnd);
      gain.gain.setValueAtTime(0.0001, noteStart);
      gain.gain.exponentialRampToValueAtTime(0.028, noteStart + 0.025);
      gain.gain.exponentialRampToValueAtTime(0.0001, noteEnd);
      oscillator.connect(gain);
      gain.connect(audioContext.destination);
      oscillator.start(noteStart);
      oscillator.stop(noteEnd + 0.01);
    });
  } catch {
    // The game stays playable if synthesized audio is unavailable.
  }
}

function drawMistakeSoundButton() {
  const isMuted = !playsMistakeSound;
  const label = isMuted ? "Unmute sound effects" : "Mute sound effects";
  mistakeSoundButton.classList.toggle("muted", isMuted);
  mistakeSoundButton.setAttribute("aria-pressed", isMuted);
  mistakeSoundButton.setAttribute("aria-label", label);
  mistakeSoundButton.title = label;
}

function animateMistakeLetter(container) {
  const currentLetter = container.querySelector(".current-letter");
  if (!currentLetter) return;

  currentLetter.classList.remove("mistake-letter");
  void currentLetter.offsetWidth;
  currentLetter.classList.add("mistake-letter");
  currentLetter.addEventListener("animationend", () => {
    currentLetter.classList.remove("mistake-letter");
  }, { once: true });
}

function drawMissionResults() {
  const correctKeys = currentPractice().length;
  const accuracy = Math.round((correctKeys / attemptCount) * 100);
  const elapsedMinutes = Math.max(Date.now() - missionStartedAt, 1000) / 60000;
  const keysPerMinute = Math.round(correctKeys / elapsedMinutes);
  recordProfileActivity({ type: "mission", mistakes: mistakeCount, keysPerMinute });

  accuracyResultElement.textContent = `${accuracy}%`;
  mistakesResultElement.textContent = mistakeCount;
  paceResultElement.textContent = keysPerMinute;
  resultsMessageElement.textContent = accuracy === 100
    ? "Perfect accuracy!"
    : accuracy >= 90
      ? "Great control!"
      : accuracy >= 75
        ? "Nice work. A slower rhythm may make the next run even smoother."
        : "Good persistence. Try the stage again when you want another practice run.";
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

  if (position === practice.length) fingerCueElement.textContent = "Stage complete! Return your hands to home base.";
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
  generatedPractice = generateMissionPractice();
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
  drawStageSelector();
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
  const firstIncompleteStage = currentLesson.missions.findIndex((mission, stageIndex) => !completedStageIds.has(stageId(currentLesson, stageIndex)));
  missionIndex = firstIncompleteStage === -1 ? 0 : firstIncompleteStage;
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
  completedStageIds.add(stageId(currentLesson, missionIndex));
  localStorage.setItem(stageProgressKey, JSON.stringify([...completedStageIds]));
  drawStageSelector();
  drawMissionResults();
  requestAnimationFrame(() => scrollTo(missionResultsElement));
  const isFinalMission = missionIndex === currentLesson.missions.length - 1;
  if (isFinalMission) {
    completeCurrentLesson();
    return;
  }

  waitingToContinue = true;
  continueButton.textContent = `Start Stage ${missionIndex + 2}`;
  continueButton.hidden = false;
  feedbackElement.textContent = "Stage complete! Press Enter or Space to continue.";
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
  if (!profileGateElement.hidden) return;

  if (!settingsPanel.hidden) {
    if (event.key === "Escape") {
      event.preventDefault();
      setSettingsOpen(false, true);
    }
    return;
  }

  if (event.target.closest?.(".mode-button")) return;

  if (activeMode === "challenge") {
    handleChallengeKey(event);
    return;
  }

  if (activeMode === "memory") {
    handleMemoryKey(event);
    return;
  }

  if (event.target.closest?.("[data-stage-index], [data-lesson-id]")) return;

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
    playMistakeSound();
    animateMistakeLetter(targetElement);
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
drawMistakeSoundButton();
mistakeSoundButton.addEventListener("click", () => {
  playsMistakeSound = !playsMistakeSound;
  localStorage.setItem(mistakeSoundKey, playsMistakeSound);
  drawMistakeSoundButton();
});
applyTheme(selectedTheme);
settingsButton.addEventListener("click", () => {
  setSettingsOpen(settingsPanel.hidden, !settingsPanel.hidden);
});
closeSettingsButton.addEventListener("click", () => {
  setSettingsOpen(false);
  closeSettingsButton.blur();
});
themeOptions.forEach((option) => {
  option.addEventListener("change", () => applyTheme(option.value));
});
document.addEventListener("click", (event) => {
  if (settingsPanel.hidden || settingsPanel.contains(event.target) || settingsButton.contains(event.target)) return;
  setSettingsOpen(false);
});
nextChapterButton.addEventListener("click", () => {
  const nextLesson = QUEST_LESSONS[QUEST_LESSONS.indexOf(currentLesson) + 1];
  if (nextLesson) loadLesson(nextLesson.id);
});

drawProgress();
loadLesson(currentLesson.id, false);
