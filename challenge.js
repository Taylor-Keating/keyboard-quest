const CHALLENGE_KEY_GROUPS = {
  anchors: ["f", "j"],
  "home-row": ["a", "s", "d", "g", "h", "k", "l", ";"],
  "inner-sky": ["e", "r", "t", "y", "u", "i"],
  "outer-sky": ["q", "w", "o", "p"],
  "inner-cave": ["c", "v", "b", "n", "m"],
  "outer-cave": ["z", "x", ",", ".", "/"],
};

const CHALLENGE_LEVELS = [
  ["anchors"],
  ["anchors", "home-row"],
  ["anchors", "home-row", "inner-sky"],
  ["anchors", "home-row", "inner-sky", "outer-sky"],
  ["anchors", "home-row", "inner-sky", "outer-sky", "inner-cave"],
  ["anchors", "home-row", "inner-sky", "outer-sky", "inner-cave", "outer-cave"],
];

const CHALLENGE_LINE_LENGTH = 12;

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
const challengeDurationRadios = [...document.querySelectorAll('[name="challenge-duration"]')];
const challengeKeyboardElement = document.querySelector("#challenge-keyboard-guide");
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

function drawChallengeKeyboard(nextKey = null) {
  const selectedKeys = new Set(selectedChallengeKeys());
  const letterRows = KEYBOARD_ROWS.map((row) => `
    <div class="keyboard-row">
      ${row.map((key) => {
        const fingerClass = `finger-${KEY_FINGERS[key].replace(" ", "-")}`;
        const selectedClass = selectedKeys.has(key) ? "mission-key" : "not-in-mission-key";
        const activeClass = key === nextKey ? "active-key" : "";
        return `<span class="keyboard-key ${fingerClass} ${selectedClass} ${activeClass}">${key.toUpperCase()}</span>`;
      }).join("")}
    </div>`).join("");
  const spaceClass = challengeIncludesSpaces() ? "mission-key" : "not-in-mission-key";
  const activeSpaceClass = nextKey === " " ? "active-key" : "";
  challengeKeyboardElement.innerHTML = `${letterRows}<div class="keyboard-space-row"><span class="keyboard-key keyboard-space ${spaceClass} ${activeSpaceClass}">SPACE</span></div>`;
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
    if (keys.length > 1 && generated.length > 1) {
      while (key === generated[generated.length - 1] && key === generated[generated.length - 2]) {
        key = keys[Math.floor(Math.random() * keys.length)];
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
      const displayKey = key === " " ? "·" : key;
      if (index < challengePosition) return `<span class="completed-letter">${displayKey}</span>`;
      if (index === challengePosition) return `<span class="current-letter">${displayKey}</span>`;
      return `<span>${displayKey}</span>`;
    }).join("")}</span>`);
  }

  challengeLinesTrackElement.innerHTML = lines.join("");
  challengeLinesTrackElement.style.transform = `translateY(-${currentLine * 1.65}em)`;
  drawChallengeKeyboard(challengeSequence[challengePosition]);
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
  challengeStreakElement.textContent = challengeBestStreak;
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
  const typedKey = event.key.toLowerCase();

  if (typedKey === expectedKey) {
    challengePosition += 1;
    challengeCurrentStreak += 1;
    challengeBestStreak = Math.max(challengeBestStreak, challengeCurrentStreak);
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
    const hint = expectedKey === " " ? "the space bar" : expectedKey.toUpperCase();
    challengeFeedbackElement.textContent = `Almost! Try ${hint}.`;
    challengeFeedbackElement.classList.add("mistake");
  }

  updateChallengeStats();
  drawChallengeTarget();
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

  challengeAccuracyResultElement.textContent = `${accuracy}%`;
  challengeMistakesResultElement.textContent = challengeMistakes;
  challengePaceResultElement.textContent = keysPerMinute;
  challengeStreakResultElement.textContent = challengeBestStreak;
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
