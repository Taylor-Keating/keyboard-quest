const MEMORY_START_SECONDS = 5;
const MEMORY_MIN_SECONDS = 0.65;
const MEMORY_SPEED_FACTOR = 0.94;

const memorySetupElement = document.querySelector("#memory-setup");
const memoryPlayElement = document.querySelector("#memory-play");
const memoryResultsElement = document.querySelector("#memory-results");
const memoryLevelButtons = [...document.querySelectorAll("[data-memory-level]")];
const memoryLevelSummaryElement = document.querySelector("#memory-level-summary");
const startMemoryButton = document.querySelector("#start-memory-button");
const endMemoryButton = document.querySelector("#end-memory-button");
const retryMemoryButton = document.querySelector("#retry-memory-button");
const changeMemoryButton = document.querySelector("#change-memory-button");
const memorySavesElement = document.querySelector("#memory-saves");
const memoryScoreElement = document.querySelector("#memory-score");
const memoryTimeElement = document.querySelector("#memory-time");
const memoryCountdownFillElement = document.querySelector("#memory-countdown-fill");
const memoryTargetElement = document.querySelector("#memory-target");
const memoryLetterElement = document.querySelector("#memory-letter");
const memoryFeedbackElement = document.querySelector("#memory-feedback");
const memoryScoreResultElement = document.querySelector("#memory-score-result");
const memoryGoalsResultElement = document.querySelector("#memory-goals-result");
const memoryLevelResultElement = document.querySelector("#memory-level-result");
const memorySpeedResultElement = document.querySelector("#memory-speed-result");
const memoryPaceResultElement = document.querySelector("#memory-pace-result");
const memoryResultsMessageElement = document.querySelector("#memory-results-message");

let selectedMemoryLevel = 1;
let memoryKeys = [];
let memoryTargetKey = "f";
let previousMemoryTargetKey = null;
let memoryGoals = 0;
let memoryScore = 0;
let memoryRoundSeconds = MEMORY_START_SECONDS;
let memoryRoundStartedAt = null;
let memoryRunStartedAt = null;
let memoryRoundTimeout = null;
let memoryNextRoundTimeout = null;
let memoryAnimationFrame = null;
let memoryGameRunning = false;
let memoryAcceptingInput = false;

function memoryKeysForLevel(level) {
  return [...new Set(CHALLENGE_LEVELS[level - 1]
    .flatMap((group) => CHALLENGE_KEY_GROUPS[group])
    .filter((key) => /^[a-z]$/.test(key)))];
}

function drawMemoryLevel() {
  memoryLevelButtons.forEach((button) => {
    const selected = Number(button.dataset.memoryLevel) === selectedMemoryLevel;
    button.classList.toggle("selected", selected);
    button.setAttribute("aria-pressed", selected);
  });
  const keys = memoryKeysForLevel(selectedMemoryLevel);
  memoryLevelSummaryElement.textContent = `Level ${selectedMemoryLevel} letters: ${keys.map((key) => key.toUpperCase()).join(" ")}`;
}

function selectMemoryLevel(level) {
  selectedMemoryLevel = level;
  drawMemoryLevel();
}

function memorySecondsForGoalCount(goalCount) {
  return Math.max(MEMORY_MIN_SECONDS, MEMORY_START_SECONDS * (MEMORY_SPEED_FACTOR ** goalCount));
}

function chooseMemoryTarget() {
  let target = memoryKeys[Math.floor(Math.random() * memoryKeys.length)];
  if (memoryKeys.length > 1) {
    while (target === previousMemoryTargetKey) {
      target = memoryKeys[Math.floor(Math.random() * memoryKeys.length)];
    }
  }
  previousMemoryTargetKey = target;
  return target;
}

function memoryKeyName(key) {
  return key === " " ? "SPACE" : key.toUpperCase();
}

function clearMemoryRoundTimers() {
  clearTimeout(memoryRoundTimeout);
  clearTimeout(memoryNextRoundTimeout);
  cancelAnimationFrame(memoryAnimationFrame);
  memoryRoundTimeout = null;
  memoryNextRoundTimeout = null;
  memoryAnimationFrame = null;
}

function drawMemoryCountdown() {
  if (!memoryGameRunning || !memoryAcceptingInput) return;
  const elapsedSeconds = (Date.now() - memoryRoundStartedAt) / 1000;
  const remainingSeconds = Math.max(0, memoryRoundSeconds - elapsedSeconds);
  const remainingRatio = remainingSeconds / memoryRoundSeconds;
  memoryTimeElement.textContent = `${remainingSeconds.toFixed(1)}s`;
  memoryCountdownFillElement.style.width = `${remainingRatio * 100}%`;
  if (remainingSeconds > 0) memoryAnimationFrame = requestAnimationFrame(drawMemoryCountdown);
}

function startMemoryRound() {
  if (!memoryGameRunning) return;
  memoryRoundSeconds = memorySecondsForGoalCount(memoryGoals);
  memoryTargetKey = chooseMemoryTarget();
  memoryLetterElement.textContent = memoryTargetKey.toUpperCase();
  memoryFeedbackElement.textContent = memoryGoals === 0 ? "Type the letter!" : "Next penalty—go!";
  memoryFeedbackElement.classList.remove("mistake");
  memoryRoundStartedAt = Date.now();
  memoryAcceptingInput = true;
  memoryTimeElement.textContent = `${memoryRoundSeconds.toFixed(1)}s`;
  memoryCountdownFillElement.style.width = "100%";
  memoryAnimationFrame = requestAnimationFrame(drawMemoryCountdown);
  memoryRoundTimeout = setTimeout(() => finishMemoryGame("timeout"), memoryRoundSeconds * 1000);
}

function startMemoryGame() {
  memoryKeys = memoryKeysForLevel(selectedMemoryLevel);
  previousMemoryTargetKey = null;
  memoryGoals = 0;
  memoryScore = 0;
  memoryRunStartedAt = Date.now();
  memoryGameRunning = true;
  memoryAcceptingInput = false;
  clearMemoryRoundTimers();
  memorySetupElement.hidden = true;
  memoryResultsElement.hidden = true;
  memoryPlayElement.hidden = false;
  memorySavesElement.textContent = "0";
  memoryScoreElement.textContent = "0";
  startMemoryButton.blur();
  retryMemoryButton.blur();
  scrollTo(memoryPlayElement);
  startMemoryRound();
}

function handleMemoryKey(event) {
  if (!memoryGameRunning || !memoryAcceptingInput || event.key.length !== 1) return;
  event.preventDefault();
  const typedKey = event.key.toLowerCase();
  if (typedKey !== memoryTargetKey) {
    playMistakeSound();
    animateMistakeLetter(memoryTargetElement);
    finishMemoryGame("wrong", typedKey);
    return;
  }

  memoryAcceptingInput = false;
  clearMemoryRoundTimers();
  const remainingRatio = Math.max(0, memoryRoundSeconds - ((Date.now() - memoryRoundStartedAt) / 1000)) / memoryRoundSeconds;
  const roundPoints = Math.round(100 + (memoryGoals * 12) + (remainingRatio * 100));
  memoryGoals += 1;
  memoryScore += roundPoints;
  memorySavesElement.textContent = memoryGoals;
  memoryScoreElement.textContent = memoryScore.toLocaleString();
  memoryTimeElement.textContent = `${memoryRoundSeconds.toFixed(1)}s`;
  memoryCountdownFillElement.style.width = "100%";
  memoryFeedbackElement.textContent = `GOAL! +${roundPoints} points`;
  memoryNextRoundTimeout = setTimeout(startMemoryRound, 420);
}

function finishMemoryGame(reason = "ended", typedKey = null) {
  if (!memoryGameRunning) return;
  memoryGameRunning = false;
  memoryAcceptingInput = false;
  clearMemoryRoundTimers();

  const elapsedMinutes = Math.max(Date.now() - memoryRunStartedAt, 1000) / 60000;
  const keysPerMinute = Math.round(memoryGoals / elapsedMinutes);
  const mistakes = reason === "wrong" ? 1 : 0;
  recordProfileActivity({ type: "memory", mistakes, keysPerMinute, score: memoryScore, goals: memoryGoals });

  memoryScoreResultElement.textContent = memoryScore.toLocaleString();
  memoryGoalsResultElement.textContent = memoryGoals;
  memoryLevelResultElement.textContent = selectedMemoryLevel;
  memorySpeedResultElement.textContent = `${memoryRoundSeconds.toFixed(1)}s`;
  memoryPaceResultElement.textContent = keysPerMinute;
  memoryResultsMessageElement.textContent = reason === "timeout"
    ? `Time ran out on ${memoryTargetKey.toUpperCase()}. You scored ${memoryGoals} goal${memoryGoals === 1 ? "" : "s"}!`
    : reason === "wrong"
      ? `${memoryKeyName(typedKey)} missed—the target was ${memoryKeyName(memoryTargetKey)}. You scored ${memoryGoals} goal${memoryGoals === 1 ? "" : "s"}!`
      : `Run ended with ${memoryGoals} goal${memoryGoals === 1 ? "" : "s"}.`;
  memoryPlayElement.hidden = true;
  memoryResultsElement.hidden = false;
  scrollTo(memoryResultsElement);
}

function leaveMemoryGame() {
  if (!memoryGameRunning) return;
  memoryGameRunning = false;
  memoryAcceptingInput = false;
  clearMemoryRoundTimers();
  memoryPlayElement.hidden = true;
  memoryResultsElement.hidden = true;
  memorySetupElement.hidden = false;
}

function changeMemoryLevel() {
  memoryResultsElement.hidden = true;
  memoryPlayElement.hidden = true;
  memorySetupElement.hidden = false;
  scrollTo(memorySetupElement);
}

memoryLevelButtons.forEach((button) => {
  button.addEventListener("click", () => selectMemoryLevel(Number(button.dataset.memoryLevel)));
});
startMemoryButton.addEventListener("click", startMemoryGame);
endMemoryButton.addEventListener("click", () => finishMemoryGame("ended"));
retryMemoryButton.addEventListener("click", startMemoryGame);
changeMemoryButton.addEventListener("click", changeMemoryLevel);

drawMemoryLevel();
