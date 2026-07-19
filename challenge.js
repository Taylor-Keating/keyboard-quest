const CHALLENGE_KEY_GROUPS = {
  anchors: ["f", "j"],
  "home-row": ["a", "s", "d", "g", "h", "k", "l", ";"],
  "inner-sky": ["e", "r", "t", "y", "u", "i"],
  "outer-sky": ["q", "w", "o", "p"],
  "inner-cave": ["c", "v", "b", "n", "m"],
  "outer-cave": ["z", "x", ",", ".", "/"],
  numbers: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"],
  symbols: ["!", "@", "#", "$", "%", "^", "&", "*", "(", ")"],
};

const CHALLENGE_LEVELS = [
  ["anchors"],
  ["anchors", "home-row"],
  ["anchors", "home-row", "inner-sky"],
  ["anchors", "home-row", "inner-sky", "outer-sky"],
  ["anchors", "home-row", "inner-sky", "outer-sky", "inner-cave"],
  ["anchors", "home-row", "inner-sky", "outer-sky", "inner-cave", "outer-cave"],
  ["anchors", "home-row", "inner-sky", "outer-sky", "inner-cave", "outer-cave", "numbers"],
  ["anchors", "home-row", "inner-sky", "outer-sky", "inner-cave", "outer-cave", "numbers", "symbols"],
];

const CHALLENGE_LINE_LENGTH = 12;
const CHALLENGE_GROUP_ORDER = ["anchors", "home-row", "inner-sky", "outer-sky", "inner-cave", "outer-cave", "numbers", "symbols"];
const CHALLENGE_NUMBER_ROW = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"];
const CHALLENGE_KEYBOARD_ROWS = [CHALLENGE_NUMBER_ROW, ...KEYBOARD_ROWS];
const SHIFTED_NUMBER_KEYS = {
  "1": "!", "2": "@", "3": "#", "4": "$", "5": "%",
  "6": "^", "7": "&", "8": "*", "9": "(", "0": ")",
};
const SYMBOL_TO_NUMBER_KEY = Object.fromEntries(Object.entries(SHIFTED_NUMBER_KEYS).map(([number, symbol]) => [symbol, number]));
const CHALLENGE_KEY_FINGERS = {
  ...KEY_FINGERS,
  "1": "left pinky", "2": "left ring", "3": "left middle", "4": "left index", "5": "left index",
  "6": "right index", "7": "right index", "8": "right middle", "9": "right ring", "0": "right pinky",
};

const learnModeElement = document.querySelector("#learn-mode");
const challengeModeElement = document.querySelector("#challenge-mode");
const learnModeButton = document.querySelector("#learn-mode-button");
const challengeModeButton = document.querySelector("#challenge-mode-button");
const challengeSetupElement = document.querySelector("#challenge-setup");
const challengePlayElement = document.querySelector("#challenge-play");
const challengeResultsElement = document.querySelector("#challenge-results");
const levelButtons = [...document.querySelectorAll("[data-challenge-level]")];
const challengeKeyCheckboxes = [...document.querySelectorAll('[name="challenge-keys"]')];
const challengeSpaceCheckbox = document.querySelector("#challenge-spaces");
const challengeCapitalsCheckbox = document.querySelector("#challenge-capitals");
const showChallengeFingerGuideCheckbox = document.querySelector("#show-challenge-finger-guide");
const challengeDurationRadios = [...document.querySelectorAll('[name="challenge-duration"]')];
const challengeKeyboardElement = document.querySelector("#challenge-keyboard-guide");
const challengePlayFingerGuideElement = document.querySelector("#challenge-play-finger-guide");
const challengePlayKeyboardElement = document.querySelector("#challenge-play-keyboard-guide");
const challengeFingerCueElement = document.querySelector("#challenge-finger-cue");
const challengeSetupErrorElement = document.querySelector("#challenge-setup-error");
const startChallengeButton = document.querySelector("#start-challenge-button");
const endChallengeButton = document.querySelector("#end-challenge-button");
const retryChallengeButton = document.querySelector("#retry-challenge-button");
const changeChallengeButton = document.querySelector("#change-challenge-button");
const challengeLinesTrackElement = document.querySelector("#challenge-lines-track");
const challengeFeedbackElement = document.querySelector("#challenge-feedback");
const challengeTimeElement = document.querySelector("#challenge-time");
const challengeMistakesElement = document.querySelector("#challenge-mistakes");
const challengeStreakElement = document.querySelector("#challenge-streak");
const challengeScoreElement = document.querySelector("#challenge-score");
const challengeScoreResultElement = document.querySelector("#challenge-score-result");
const challengeScoreBreakdownElement = document.querySelector("#challenge-score-breakdown");
const challengeAccuracyResultElement = document.querySelector("#challenge-accuracy-result");
const challengeMistakesResultElement = document.querySelector("#challenge-mistakes-result");
const challengePaceResultElement = document.querySelector("#challenge-pace-result");
const challengeStreakResultElement = document.querySelector("#challenge-streak-result");
const challengeResultsMessageElement = document.querySelector("#challenge-results-message");

let challengeSequence = [];
let challengePosition = 0;
let challengeAttempts = 0;
let challengeMistakes = 0;
let challengeCurrentStreak = 0;
let challengeBestStreak = 0;
let challengeDurationSeconds = 0;
let challengeStartedAt = null;
let challengeTimer = null;
let challengeRunning = false;
let challengeScore = 0;
let challengePenaltyPoints = 0;
let challengeLevel = 1;
let challengeLevelMultiplier = 1;
let challengeOptionMultiplier = 1;
let challengeUsesCapitals = false;
let challengeShowsFingerGuide = true;

function selectedChallengeGroups() {
  return challengeKeyCheckboxes.filter((checkbox) => checkbox.checked).map((checkbox) => checkbox.value);
}

function selectedChallengeKeys() {
  return [...new Set(selectedChallengeGroups()
    .flatMap((group) => CHALLENGE_KEY_GROUPS[group]))];
}

function challengeIncludesSpaces() {
  return challengeSpaceCheckbox.checked;
}

function selectedChallengeDifficultyLevel() {
  const selectedGroups = selectedChallengeGroups();
  return Math.max(1, ...selectedGroups.map((group) => CHALLENGE_GROUP_ORDER.indexOf(group) + 1));
}

function streakMultiplier(streak) {
  return 1 + Math.min(Math.floor(streak / 10) * 0.05, 0.25);
}

function setMode(mode) {
  const isLearnMode = mode === "learn";
  if (isLearnMode && challengeRunning) finishChallenge(false);
  activeMode = mode;
  learnModeElement.hidden = !isLearnMode;
  challengeModeElement.hidden = isLearnMode;
  learnModeButton.classList.toggle("active", isLearnMode);
  challengeModeButton.classList.toggle("active", !isLearnMode);
  learnModeButton.setAttribute("aria-pressed", isLearnMode);
  challengeModeButton.setAttribute("aria-pressed", !isLearnMode);
  scrollTo(isLearnMode ? learnModeElement : challengeModeElement);
}

function selectChallengeLevel(level) {
  const includedGroups = CHALLENGE_LEVELS[level - 1];
  challengeKeyCheckboxes.forEach((checkbox) => {
    checkbox.checked = includedGroups.includes(checkbox.value);
  });
  updateSelectedLevel();
  drawChallengeKeyboard();
}

function updateSelectedLevel() {
  const selected = selectedChallengeGroups();
  const matchingLevel = CHALLENGE_LEVELS.findIndex((groups) =>
    groups.length === selected.length && groups.every((group) => selected.includes(group)));

  levelButtons.forEach((button) => {
    const isSelected = Number(button.dataset.challengeLevel) === matchingLevel + 1;
    button.classList.toggle("selected", isSelected);
    button.setAttribute("aria-pressed", isSelected);
  });
}

function physicalChallengeKey(key) {
  if (!key || key === " ") return key;
  return SYMBOL_TO_NUMBER_KEY[key] || key.toLowerCase();
}

function challengeKeyLabel(key) {
  if (!SHIFTED_NUMBER_KEYS[key]) return key.toUpperCase();
  return `<span class="number-key-label"><span>${SHIFTED_NUMBER_KEYS[key]}</span><span>${key}</span></span>`;
}

function challengeKeyboardMarkup(nextKey = null, showAllColors = false) {
  const selectedPhysicalKeys = new Set(selectedChallengeKeys().map(physicalChallengeKey));
  const physicalNextKey = physicalChallengeKey(nextKey);
  const letterRows = CHALLENGE_KEYBOARD_ROWS.map((row) => `
    <div class="keyboard-row">
      ${row.map((key) => {
        const fingerClass = `finger-${CHALLENGE_KEY_FINGERS[key].replace(" ", "-")}`;
        const selectedClass = showAllColors ? "" : selectedPhysicalKeys.has(key) ? "mission-key" : "not-in-mission-key";
        const activeClass = key === physicalNextKey ? "active-key" : "";
        return `<span class="keyboard-key ${fingerClass} ${selectedClass} ${activeClass}">${challengeKeyLabel(key)}</span>`;
      }).join("")}
    </div>`).join("");
  const spaceClass = showAllColors || challengeIncludesSpaces() ? "mission-key" : "not-in-mission-key";
  const activeSpaceClass = nextKey === " " ? "active-key" : "";
  return `${letterRows}<div class="keyboard-space-row"><span class="keyboard-key keyboard-space ${spaceClass} ${activeSpaceClass}">SPACE</span></div>`;
}

function drawChallengeKeyboard() {
  challengeKeyboardElement.innerHTML = challengeKeyboardMarkup();
}

function drawChallengePlayKeyboard(nextKey) {
  challengePlayFingerGuideElement.hidden = !showChallengeFingerGuideCheckbox.checked;
  if (challengePlayFingerGuideElement.hidden) return;

  challengePlayKeyboardElement.innerHTML = challengeKeyboardMarkup(nextKey, true);
  if (nextKey === " ") {
    challengeFingerCueElement.textContent = "Next: Space bar — use either thumb.";
    return;
  }

  const physicalKey = physicalChallengeKey(nextKey);
  const finger = CHALLENGE_KEY_FINGERS[physicalKey];
  const needsShift = nextKey !== physicalKey;
  challengeFingerCueElement.textContent = needsShift
    ? `Next: Shift + ${physicalKey.toUpperCase()} — ${finger} finger.`
    : `Next: ${nextKey.toUpperCase()} — ${finger} finger.`;
}

function generateChallengeKeys(length) {
  const keys = selectedChallengeKeys();
  const includeSpaces = challengeIncludesSpaces();
  const generated = [];
  let keysSinceSpace = 0;
  let nextSpaceAfter = 4 + Math.floor(Math.random() * 4);

  while (generated.length < length) {
    if (includeSpaces && keysSinceSpace >= nextSpaceAfter) {
      generated.push(" ");
      keysSinceSpace = 0;
      nextSpaceAfter = 4 + Math.floor(Math.random() * 4);
      continue;
    }

    let key = keys[Math.floor(Math.random() * keys.length)];
    if (challengeCapitalsCheckbox.checked && /^[a-z]$/.test(key) && Math.random() < 0.3) {
      key = key.toUpperCase();
    }
    if (keys.length > 1 && generated.length > 1) {
      while (key === generated[generated.length - 1] && key === generated[generated.length - 2]) {
        key = keys[Math.floor(Math.random() * keys.length)];
        if (challengeCapitalsCheckbox.checked && /^[a-z]$/.test(key) && Math.random() < 0.3) {
          key = key.toUpperCase();
        }
      }
    }
    generated.push(key);
    keysSinceSpace += 1;
  }

  return generated;
}

function drawChallengeTarget() {
  const currentLine = Math.floor(challengePosition / CHALLENGE_LINE_LENGTH);
  const lines = [];

  for (let offset = 0; offset < challengeSequence.length; offset += CHALLENGE_LINE_LENGTH) {
    const lineKeys = challengeSequence.slice(offset, offset + CHALLENGE_LINE_LENGTH);
    const lineStart = offset;
    lines.push(`<span class="challenge-line">${lineKeys.map((key, keyOffset) => {
      const index = lineStart + keyOffset;
      if (index < challengePosition) return targetKeySpan(key, "completed-letter");
      if (index === challengePosition) return targetKeySpan(key, "current-letter");
      return targetKeySpan(key);
    }).join("")}</span>`);
  }

  challengeLinesTrackElement.innerHTML = lines.join("");
  challengeLinesTrackElement.style.transform = `translateY(-${currentLine * 1.65}em)`;
  drawChallengePlayKeyboard(challengeSequence[challengePosition]);
}

function selectedDuration() {
  return Number(challengeDurationRadios.find((radio) => radio.checked).value);
}

function startChallenge() {
  if (selectedChallengeKeys().length === 0) {
    challengeSetupErrorElement.textContent = "Choose at least one letter or punctuation group to begin.";
    return;
  }

  challengeSetupErrorElement.textContent = "";
  challengeDurationSeconds = selectedDuration();
  challengeSequence = generateChallengeKeys(challengeDurationSeconds > 0 ? 160 : 40);
  challengePosition = 0;
  challengeAttempts = 0;
  challengeMistakes = 0;
  challengeCurrentStreak = 0;
  challengeBestStreak = 0;
  challengeScore = 0;
  challengePenaltyPoints = 0;
  challengeLevel = selectedChallengeDifficultyLevel();
  challengeLevelMultiplier = 1 + ((challengeLevel - 1) * 0.15);
  challengeUsesCapitals = challengeCapitalsCheckbox.checked && selectedChallengeKeys().some((key) => /^[a-z]$/.test(key));
  challengeShowsFingerGuide = showChallengeFingerGuideCheckbox.checked;
  challengeOptionMultiplier = (challengeUsesCapitals ? 1.15 : 1) * (challengeShowsFingerGuide ? 1 : 1.1);
  challengeStartedAt = null;
  challengeRunning = true;
  clearInterval(challengeTimer);
  challengeTimer = null;

  challengeSetupElement.hidden = true;
  challengeResultsElement.hidden = true;
  challengePlayElement.hidden = false;
  challengeFeedbackElement.textContent = "Press the first key when you are ready.";
  challengeFeedbackElement.classList.remove("mistake");
  challengeMistakesElement.textContent = "0";
  challengeStreakElement.textContent = "0";
  challengeScoreElement.textContent = "0";
  challengeTimeElement.textContent = challengeDurationSeconds > 0 ? `${challengeDurationSeconds}s` : "40 keys";
  challengeLinesTrackElement.classList.add("no-transition");
  drawChallengeTarget();
  requestAnimationFrame(() => challengeLinesTrackElement.classList.remove("no-transition"));
  scrollTo(challengePlayElement);
}

function startChallengeTimer() {
  challengeStartedAt = Date.now();
  if (challengeDurationSeconds > 0) {
    challengeTimer = setInterval(updateChallengeTimer, 200);
  }
}

function updateChallengeTimer() {
  if (!challengeRunning || challengeStartedAt === null) return;
  const elapsedSeconds = (Date.now() - challengeStartedAt) / 1000;
  const remainingSeconds = Math.max(0, Math.ceil(challengeDurationSeconds - elapsedSeconds));
  challengeTimeElement.textContent = `${remainingSeconds}s`;
  if (elapsedSeconds >= challengeDurationSeconds) finishChallenge();
}

function updateChallengeStats() {
  challengeMistakesElement.textContent = challengeMistakes;
  const currentStreakMultiplier = streakMultiplier(challengeCurrentStreak);
  challengeStreakElement.textContent = currentStreakMultiplier > 1
    ? `${challengeCurrentStreak} ×${currentStreakMultiplier.toFixed(2)}`
    : challengeCurrentStreak;
  challengeScoreElement.textContent = Math.max(0, challengeScore - challengePenaltyPoints).toLocaleString();
  if (challengeDurationSeconds === 0) {
    challengeTimeElement.textContent = `${challengeSequence.length - challengePosition} keys`;
  }
}

function handleChallengeKey(event) {
  if (!challengeRunning || event.key.length !== 1) return;
  event.preventDefault();
  if (challengeStartedAt === null) startChallengeTimer();

  challengeAttempts += 1;
  const expectedKey = challengeSequence[challengePosition];
  const typedKey = event.key;
  const madeMistake = typedKey !== expectedKey;

  if (typedKey === expectedKey) {
    challengePosition += 1;
    challengeCurrentStreak += 1;
    challengeBestStreak = Math.max(challengeBestStreak, challengeCurrentStreak);
    const keyPoints = Math.round(20 * challengeLevelMultiplier * challengeOptionMultiplier * streakMultiplier(challengeCurrentStreak));
    challengeScore += keyPoints;
    challengeFeedbackElement.textContent = "Nice! Keep going.";
    challengeFeedbackElement.classList.remove("mistake");

    if (challengeDurationSeconds === 0 && challengePosition === challengeSequence.length) {
      finishChallenge();
      return;
    }
    if (challengeDurationSeconds > 0 && challengeSequence.length - challengePosition < 50) {
      challengeSequence.push(...generateChallengeKeys(100));
    }
  } else {
    challengeMistakes += 1;
    challengeCurrentStreak = 0;
    challengePenaltyPoints += 25;
    playMistakeSound();
    const hint = expectedKey === " " ? "the space bar" : expectedKey.toUpperCase();
    challengeFeedbackElement.textContent = `Almost! Try ${hint}.`;
    challengeFeedbackElement.classList.add("mistake");
  }

  updateChallengeStats();
  drawChallengeTarget();
  if (madeMistake) animateMistakeLetter(challengeLinesTrackElement);
}

function finishChallenge(shouldScroll = true) {
  if (!challengeRunning) return;
  challengeRunning = false;
  clearInterval(challengeTimer);
  challengeTimer = null;

  const correctKeys = challengePosition;
  const accuracy = challengeAttempts === 0 ? 0 : Math.round((correctKeys / challengeAttempts) * 100);
  const elapsedMilliseconds = challengeStartedAt === null ? 0 : Date.now() - challengeStartedAt;
  const measuredMilliseconds = challengeDurationSeconds > 0
    ? Math.min(elapsedMilliseconds, challengeDurationSeconds * 1000)
    : elapsedMilliseconds;
  const elapsedMinutes = Math.max(measuredMilliseconds, 1000) / 60000;
  const keysPerMinute = Math.round(correctKeys / elapsedMinutes);
  const paceBonus = Math.round(keysPerMinute * 10 * challengeLevelMultiplier * challengeOptionMultiplier);
  const finalScore = Math.max(0, challengeScore + paceBonus - challengePenaltyPoints);
  recordProfileActivity({ type: "challenge", mistakes: challengeMistakes, keysPerMinute, score: finalScore });

  challengeAccuracyResultElement.textContent = `${accuracy}%`;
  challengeMistakesResultElement.textContent = challengeMistakes;
  challengePaceResultElement.textContent = keysPerMinute;
  challengeStreakResultElement.textContent = challengeBestStreak;
  challengeScoreResultElement.textContent = finalScore.toLocaleString();
  const multiplierParts = [`Level ${challengeLevel} ×${challengeLevelMultiplier.toFixed(2)}`];
  if (challengeUsesCapitals) multiplierParts.push("Capitals ×1.15");
  if (!challengeShowsFingerGuide) multiplierParts.push("No guide ×1.10");
  challengeScoreBreakdownElement.textContent = `${multiplierParts.join(" · ")} · Key points +${challengeScore.toLocaleString()} · Pace bonus +${paceBonus.toLocaleString()} · Mistake penalties −${challengePenaltyPoints.toLocaleString()}`;
  challengeResultsMessageElement.textContent = accuracy >= 95
    ? "Excellent control—accuracy stayed strong throughout the challenge!"
    : accuracy >= 80
      ? "Nice work. Try the same challenge again and aim for an even steadier rhythm."
      : "Good persistence. Slowing down will help accuracy grow on the next run.";

  challengePlayElement.hidden = true;
  challengeResultsElement.hidden = false;
  if (shouldScroll) scrollTo(challengeResultsElement);
}

function changeChallenge() {
  challengeResultsElement.hidden = true;
  challengePlayElement.hidden = true;
  challengeSetupElement.hidden = false;
  drawChallengeKeyboard();
  scrollTo(challengeSetupElement);
}

learnModeButton.addEventListener("click", () => setMode("learn"));
challengeModeButton.addEventListener("click", () => setMode("challenge"));
levelButtons.forEach((button) => {
  button.addEventListener("click", () => selectChallengeLevel(Number(button.dataset.challengeLevel)));
});
challengeKeyCheckboxes.forEach((checkbox) => {
  checkbox.addEventListener("change", () => {
    updateSelectedLevel();
    drawChallengeKeyboard();
  });
});
challengeSpaceCheckbox.addEventListener("change", () => drawChallengeKeyboard());
startChallengeButton.addEventListener("click", startChallenge);
endChallengeButton.addEventListener("click", () => finishChallenge());
retryChallengeButton.addEventListener("click", startChallenge);
changeChallengeButton.addEventListener("click", changeChallenge);

drawChallengeKeyboard();
