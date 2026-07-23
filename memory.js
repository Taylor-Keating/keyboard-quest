const MEMORY_KEYS = "abcdefghijklmnopqrstuvwxyz".split("");
const MEMORY_SPEED_FACTOR = 0.87;
const MEMORY_REGULATION_SHOTS = 5;
const MEMORY_COUNTDOWN_STEP_MS = 700;
const MEMORY_RESULT_PAUSE_MS = 1800;
const MEMORY_DIFFICULTIES = {
  easy: { label: "Easy", startSeconds: 4, fastestSeconds: 2 },
  medium: { label: "Medium", startSeconds: 3, fastestSeconds: 1.5 },
  hard: { label: "Hard", startSeconds: 2, fastestSeconds: 1 },
  extreme: { label: "Extreme", startSeconds: 1, fastestSeconds: 0.7 },
};

const memorySetupElement = document.querySelector("#memory-setup");
const memoryPlayElement = document.querySelector("#memory-play");
const memoryResultsElement = document.querySelector("#memory-results");
const memoryPlayHeadingElement = document.querySelector("#memory-play-heading");
const memoryLevelButtons = [...document.querySelectorAll("[data-memory-difficulty]")];
const memoryLevelSummaryElement = document.querySelector("#memory-level-summary");
const startMemoryButton = document.querySelector("#start-memory-button");
const endMemoryButton = document.querySelector("#end-memory-button");
const retryMemoryButton = document.querySelector("#retry-memory-button");
const changeMemoryButton = document.querySelector("#change-memory-button");
const memorySavesElement = document.querySelector("#memory-saves");
const memoryRivalGoalsElement = document.querySelector("#memory-rival-goals");
const memoryShotStatusElement = document.querySelector("#memory-shot-status");
const memoryPlayerShotsElement = document.querySelector("#memory-player-shots");
const memoryRivalShotsElement = document.querySelector("#memory-rival-shots");
const memoryScoreElement = document.querySelector("#memory-score");
const memoryTimeElement = document.querySelector("#memory-time");
const memoryCountdownFillElement = document.querySelector("#memory-countdown-fill");
const memoryTargetElement = document.querySelector("#memory-target");
const memoryLetterElement = document.querySelector("#memory-letter");
const memoryFeedbackElement = document.querySelector("#memory-feedback");
const memoryReadyButton = document.querySelector("#memory-ready-button");
const memoryPlayCalloutElement = document.querySelector("#memory-play-callout");
const memoryScoreResultElement = document.querySelector("#memory-score-result");
const memoryGradeResultElement = document.querySelector("#memory-grade-result");
const memoryGoalsResultElement = document.querySelector("#memory-goals-result");
const memoryLevelResultElement = document.querySelector("#memory-level-result");
const memorySpeedResultElement = document.querySelector("#memory-speed-result");
const memoryPaceResultElement = document.querySelector("#memory-pace-result");
const memoryResultsMessageElement = document.querySelector("#memory-results-message");

let selectedMemoryDifficulty = "easy";
let memoryTargetKey = "f";
let previousMemoryTargetKey = null;
let memoryPlayerShots = [];
let memoryRivalShots = [];
let memoryScore = 0;
let memoryMistakes = 0;
let memoryCorrectKeys = 0;
let memoryActiveMilliseconds = 0;
let memoryRoundSeconds = MEMORY_DIFFICULTIES.easy.startSeconds;
let memoryKickSeconds = MEMORY_DIFFICULTIES.easy.startSeconds;
let memoryRoundStartedAt = null;
let memoryRoundTimeout = null;
let memoryNextRoundTimeout = null;
let memoryAnimationFrame = null;
let memoryCalloutTimeout = null;
let memoryGameRunning = false;
let memoryAcceptingInput = false;
let memorySuddenDeath = false;
let memoryTurn = "player";

function drawMemoryLevel() {
  memoryLevelButtons.forEach((button) => {
    const selected = button.dataset.memoryDifficulty === selectedMemoryDifficulty;
    button.classList.toggle("selected", selected);
    button.setAttribute("aria-pressed", selected);
  });
  const difficulty = MEMORY_DIFFICULTIES[selectedMemoryDifficulty];
  memoryLevelSummaryElement.textContent = `${difficulty.label}: ${difficulty.startSeconds.toFixed(1)}s kicks, speeding up to ${difficulty.fastestSeconds.toFixed(1)}s. Goalie: ${difficulty.fastestSeconds.toFixed(1)}s.`;
}

function selectMemoryLevel(difficulty) {
  selectedMemoryDifficulty = difficulty;
  drawMemoryLevel();
}

function memorySecondsForShotCount(shotCount) {
  const difficulty = MEMORY_DIFFICULTIES[selectedMemoryDifficulty];
  return Math.max(difficulty.fastestSeconds, difficulty.startSeconds * (MEMORY_SPEED_FACTOR ** shotCount));
}

function chooseMemoryTarget() {
  let target = MEMORY_KEYS[Math.floor(Math.random() * MEMORY_KEYS.length)];
  if (MEMORY_KEYS.length > 1) {
    while (target === previousMemoryTargetKey) {
      target = MEMORY_KEYS[Math.floor(Math.random() * MEMORY_KEYS.length)];
    }
  }
  previousMemoryTargetKey = target;
  return target;
}

function memoryKeyName(key) {
  return key === " " ? "SPACE" : key.toUpperCase();
}

function memoryGoalCount(shots) {
  return shots.filter(Boolean).length;
}

function memoryRoundLabel() {
  const isGoalieTurn = memoryTurn.startsWith("goalie");
  const shotNumber = isGoalieTurn ? memoryRivalShots.length + 1 : memoryPlayerShots.length + 1;
  if (memorySuddenDeath) {
    return `${isGoalieTurn ? "Goalie" : "Kick"}: sudden death ${Math.max(1, shotNumber - MEMORY_REGULATION_SHOTS)}`;
  }
  return `${isGoalieTurn ? "Goalie" : "Kick"} ${Math.min(shotNumber, MEMORY_REGULATION_SHOTS)} of ${MEMORY_REGULATION_SHOTS}`;
}

function memoryShotMarks(shots, totalSlots, side) {
  return Array.from({ length: totalSlots }, (_, index) => {
    const result = shots[index];
    const isPlayerShot = side === "player";
    const successfulForPlayer = result === undefined ? null : isPlayerShot ? result : !result;
    const state = successfulForPlayer === true ? "success" : successfulForPlayer === false ? "failure" : "pending";
    const symbol = result === undefined ? "•" : isPlayerShot ? result ? "⚽" : "×" : result ? "⚽" : "🧤";
    const label = result === undefined
      ? "Not taken"
      : isPlayerShot
        ? result ? "You scored" : "You missed"
        : result ? "Rival scored" : "You saved";
    return `<i class="memory-shot-mark ${state}" aria-label="${label}">${symbol}</i>`;
  }).join("");
}

function drawMemoryScoreboard() {
  const playerGoals = memoryGoalCount(memoryPlayerShots);
  const rivalGoals = memoryGoalCount(memoryRivalShots);
  const totalSlots = Math.max(MEMORY_REGULATION_SHOTS, memoryPlayerShots.length, memoryRivalShots.length, memorySuddenDeath ? MEMORY_REGULATION_SHOTS + 1 : 0);
  memorySavesElement.textContent = playerGoals;
  memoryRivalGoalsElement.textContent = rivalGoals;
  memoryShotStatusElement.textContent = memoryRoundLabel();
  memoryPlayerShotsElement.innerHTML = memoryShotMarks(memoryPlayerShots, totalSlots, "player");
  memoryRivalShotsElement.innerHTML = memoryShotMarks(memoryRivalShots, totalSlots, "rival");
  memoryScoreElement.textContent = memoryScore.toLocaleString();
}

function hideMemoryPlayCallout() {
  clearTimeout(memoryCalloutTimeout);
  memoryCalloutTimeout = null;
  memoryPlayCalloutElement.hidden = true;
  memoryPlayCalloutElement.className = "memory-play-callout";
}

function showMemoryPlayCallout(message, type) {
  hideMemoryPlayCallout();
  memoryPlayCalloutElement.textContent = message;
  memoryPlayCalloutElement.hidden = false;
  void memoryPlayCalloutElement.offsetWidth;
  memoryPlayCalloutElement.classList.add("showing", type);
  memoryCalloutTimeout = setTimeout(hideMemoryPlayCallout, 1600);
}

function clearMemoryRoundTimers() {
  clearTimeout(memoryRoundTimeout);
  clearTimeout(memoryNextRoundTimeout);
  cancelAnimationFrame(memoryAnimationFrame);
  memoryRoundTimeout = null;
  memoryNextRoundTimeout = null;
  memoryAnimationFrame = null;
  hideMemoryPlayCallout();
}

function drawMemoryCountdown() {
  if (!memoryGameRunning || !memoryAcceptingInput) return;
  const elapsedSeconds = (Date.now() - memoryRoundStartedAt) / 1000;
  const remainingSeconds = Math.max(0, memoryRoundSeconds - elapsedSeconds);
  memoryTimeElement.textContent = `${remainingSeconds.toFixed(1)}s`;
  memoryCountdownFillElement.style.width = `${(remainingSeconds / memoryRoundSeconds) * 100}%`;
  if (remainingSeconds > 0) memoryAnimationFrame = requestAnimationFrame(drawMemoryCountdown);
}

function prepareMemoryPlayerRound() {
  if (!memoryGameRunning) return;
  memoryTurn = "player-ready";
  memoryAcceptingInput = false;
  memoryKickSeconds = memorySecondsForShotCount(memoryPlayerShots.length);
  memoryPlayHeadingElement.textContent = "Your turn to kick";
  memoryTargetElement.classList.remove("goalie-turn");
  memoryTargetElement.classList.add("waiting");
  memoryTargetElement.setAttribute("aria-label", "Ready to take a penalty");
  memoryLetterElement.textContent = "READY";
  memoryFeedbackElement.textContent = "Press Enter or Space when you are ready.";
  memoryFeedbackElement.classList.remove("mistake");
  memoryReadyButton.hidden = false;
  memoryTimeElement.textContent = "Ready";
  memoryCountdownFillElement.style.width = "0%";
  drawMemoryScoreboard();
}

function prepareMemoryGoalieRound() {
  if (!memoryGameRunning) return;
  memoryTurn = "goalie-ready";
  memoryAcceptingInput = false;
  memoryPlayHeadingElement.textContent = "Your turn in goal";
  memoryTargetElement.classList.add("goalie-turn", "waiting");
  memoryTargetElement.setAttribute("aria-label", "Ready to defend a penalty");
  memoryLetterElement.textContent = "READY";
  memoryFeedbackElement.textContent = "Press Enter or Space when you are ready to defend.";
  memoryFeedbackElement.classList.remove("mistake");
  memoryReadyButton.hidden = false;
  memoryTimeElement.textContent = "Ready";
  memoryCountdownFillElement.style.width = "0%";
  drawMemoryScoreboard();
}

function startMemoryReadyCountdown() {
  const isGoalie = memoryTurn === "goalie-ready";
  if (!memoryGameRunning || (!isGoalie && memoryTurn !== "player-ready")) return;
  const countdownTurn = isGoalie ? "goalie-countdown" : "player-countdown";
  let count = 3;
  memorySoundContext();
  memoryTurn = countdownTurn;
  memoryReadyButton.hidden = true;
  memoryTargetElement.classList.remove("waiting");
  memoryPlayHeadingElement.textContent = isGoalie ? "Get ready to save!" : "Get ready to kick!";
  memoryFeedbackElement.textContent = "The letter appears after the countdown.";
  memoryTimeElement.textContent = "—";

  function showNextCount() {
    if (!memoryGameRunning || memoryTurn !== countdownTurn) return;
    if (count === 0) {
      if (isGoalie) startMemoryGoalieRound();
      else startMemoryRound();
      return;
    }
    memoryLetterElement.textContent = count;
    memoryCountdownFillElement.style.width = `${((4 - count) / 3) * 100}%`;
    count -= 1;
    memoryNextRoundTimeout = setTimeout(showNextCount, MEMORY_COUNTDOWN_STEP_MS);
  }

  showNextCount();
}

function startMemoryRound() {
  if (!memoryGameRunning) return;
  memoryTurn = "player";
  memoryKickSeconds = memorySecondsForShotCount(memoryPlayerShots.length);
  memoryRoundSeconds = memoryKickSeconds;
  memoryTargetKey = chooseMemoryTarget();
  memoryPlayHeadingElement.textContent = "Take the kick!";
  memoryTargetElement.classList.remove("goalie-turn", "waiting");
  memoryTargetElement.setAttribute("aria-label", "Letter to type for the penalty kick");
  memoryReadyButton.hidden = true;
  memoryLetterElement.textContent = memoryTargetKey.toUpperCase();
  memoryFeedbackElement.textContent = memorySuddenDeath ? "Sudden death—score!" : "Take your shot!";
  memoryFeedbackElement.classList.remove("mistake");
  memoryRoundStartedAt = Date.now();
  memoryAcceptingInput = true;
  memoryTimeElement.textContent = `${memoryRoundSeconds.toFixed(1)}s`;
  memoryCountdownFillElement.style.width = "100%";
  drawMemoryScoreboard();
  memoryAnimationFrame = requestAnimationFrame(drawMemoryCountdown);
  memoryRoundTimeout = setTimeout(() => resolveMemoryPlayerShot(false, "timeout"), memoryRoundSeconds * 1000);
}

function startMemoryGame() {
  previousMemoryTargetKey = null;
  memoryPlayerShots = [];
  memoryRivalShots = [];
  memoryScore = 0;
  memoryMistakes = 0;
  memoryCorrectKeys = 0;
  memoryActiveMilliseconds = 0;
  memorySuddenDeath = false;
  memoryTurn = "player";
  memoryRoundSeconds = MEMORY_DIFFICULTIES[selectedMemoryDifficulty].startSeconds;
  memoryKickSeconds = memoryRoundSeconds;
  memoryGameRunning = true;
  memoryAcceptingInput = false;
  clearMemoryRoundTimers();
  memorySetupElement.hidden = true;
  memoryResultsElement.hidden = true;
  memoryPlayElement.hidden = false;
  startMemoryButton.blur();
  retryMemoryButton.blur();
  drawMemoryScoreboard();
  scrollTo(memoryPlayElement);
  prepareMemoryPlayerRound();
}

function resolveMemoryPlayerShot(scored, reason = "goal", typedKey = null) {
  if (!memoryGameRunning || memoryTurn !== "player") return;
  memoryAcceptingInput = false;
  clearMemoryRoundTimers();
  const responseMilliseconds = Math.min(Date.now() - memoryRoundStartedAt, memoryRoundSeconds * 1000);
  memoryActiveMilliseconds += responseMilliseconds;

  if (scored) {
    const remainingRatio = Math.max(0, memoryRoundSeconds - (responseMilliseconds / 1000)) / memoryRoundSeconds;
    const roundPoints = Math.round(100 + (memoryPlayerShots.length * 12) + (remainingRatio * 100));
    memoryScore += roundPoints;
    memoryCorrectKeys += 1;
    memoryFeedbackElement.textContent = `GOAL! +${roundPoints} points`;
    memoryFeedbackElement.classList.remove("mistake");
    showMemoryPlayCallout("GOOOOOOAAAAAAALLLLL!", "goal");
    playMemorySuccessSound("goal");
  } else {
    if (reason === "wrong") memoryMistakes += 1;
    memoryFeedbackElement.textContent = reason === "timeout"
      ? `MISS! Time ran out on ${memoryKeyName(memoryTargetKey)}.`
      : `MISS! ${memoryKeyName(typedKey)} was not ${memoryKeyName(memoryTargetKey)}.`;
    memoryFeedbackElement.classList.add("mistake");
    showMemoryPlayCallout("MISSED!", "failure");
    playMemoryFailureSound();
  }

  memoryPlayerShots.push(scored);
  memoryTimeElement.textContent = "—";
  memoryCountdownFillElement.style.width = "0%";
  memoryTurn = "goalie-wait";
  drawMemoryScoreboard();
  memoryNextRoundTimeout = setTimeout(prepareMemoryGoalieRound, MEMORY_RESULT_PAUSE_MS);
}

function startMemoryGoalieRound() {
  if (!memoryGameRunning) return;
  memoryTurn = "goalie";
  memoryRoundSeconds = MEMORY_DIFFICULTIES[selectedMemoryDifficulty].fastestSeconds;
  memoryTargetKey = chooseMemoryTarget();
  memoryPlayHeadingElement.textContent = "Make the save!";
  memoryTargetElement.classList.add("goalie-turn");
  memoryTargetElement.classList.remove("waiting");
  memoryTargetElement.setAttribute("aria-label", "Letter to type to save the penalty");
  memoryReadyButton.hidden = true;
  memoryLetterElement.textContent = memoryTargetKey.toUpperCase();
  memoryFeedbackElement.textContent = "Rival shoots—make the save!";
  memoryFeedbackElement.classList.remove("mistake");
  memoryRoundStartedAt = Date.now();
  memoryAcceptingInput = true;
  memoryTimeElement.textContent = `${memoryRoundSeconds.toFixed(1)}s`;
  memoryCountdownFillElement.style.width = "100%";
  drawMemoryScoreboard();
  memoryAnimationFrame = requestAnimationFrame(drawMemoryCountdown);
  memoryRoundTimeout = setTimeout(() => resolveMemoryGoalieAttempt(false, "timeout"), memoryRoundSeconds * 1000);
}

function resolveMemoryGoalieAttempt(saved, reason = "save", typedKey = null) {
  if (!memoryGameRunning || memoryTurn !== "goalie") return;
  memoryAcceptingInput = false;
  clearMemoryRoundTimers();
  const responseMilliseconds = Math.min(Date.now() - memoryRoundStartedAt, memoryRoundSeconds * 1000);
  memoryActiveMilliseconds += responseMilliseconds;

  if (saved) {
    const remainingRatio = Math.max(0, memoryRoundSeconds - (responseMilliseconds / 1000)) / memoryRoundSeconds;
    const savePoints = Math.round(75 + (remainingRatio * 75));
    memoryScore += savePoints;
    memoryCorrectKeys += 1;
    memoryFeedbackElement.textContent = `SAVE! +${savePoints} points`;
    memoryFeedbackElement.classList.remove("mistake");
    showMemoryPlayCallout("SAVE!!!", "save");
    playMemorySuccessSound("save");
  } else {
    if (reason === "wrong") memoryMistakes += 1;
    memoryFeedbackElement.textContent = reason === "timeout"
      ? `GOAL! Time ran out on ${memoryKeyName(memoryTargetKey)}.`
      : `GOAL! ${memoryKeyName(typedKey)} was not ${memoryKeyName(memoryTargetKey)}.`;
    memoryFeedbackElement.classList.add("mistake");
    showMemoryPlayCallout("THEY SCORE!", "failure");
    playMemoryFailureSound();
  }

  memoryRivalShots.push(!saved);
  memoryTimeElement.textContent = "—";
  memoryCountdownFillElement.style.width = "0%";
  memoryTurn = "transition";
  drawMemoryScoreboard();
  memoryNextRoundTimeout = setTimeout(continueMemoryMatch, MEMORY_RESULT_PAUSE_MS);
}

function continueMemoryMatch() {
  if (!memoryGameRunning) return;
  const equalAttempts = memoryPlayerShots.length === memoryRivalShots.length;
  const regulationComplete = memoryPlayerShots.length >= MEMORY_REGULATION_SHOTS && equalAttempts;
  const scoresDiffer = memoryGoalCount(memoryPlayerShots) !== memoryGoalCount(memoryRivalShots);

  if (regulationComplete && scoresDiffer) {
    finishMemoryGame("complete");
    return;
  }
  if (regulationComplete) memorySuddenDeath = true;
  prepareMemoryPlayerRound();
}

function handleMemoryKey(event) {
  const isStartKey = event.key === "Enter" || event.key === " ";
  if (!memoryGameRunning) {
    if (!memorySetupElement.hidden && isStartKey) {
      event.preventDefault();
      startMemoryGame();
    }
    return;
  }
  if ((memoryTurn === "player-ready" || memoryTurn === "goalie-ready") && isStartKey) {
    event.preventDefault();
    startMemoryReadyCountdown();
    return;
  }
  if (!memoryAcceptingInput) {
    if (isStartKey) event.preventDefault();
    return;
  }
  if (isStartKey) {
    event.preventDefault();
    return;
  }
  if (event.key.length !== 1) return;
  event.preventDefault();
  const typedKey = event.key.toLowerCase();
  if (typedKey !== memoryTargetKey) {
    animateMistakeLetter(memoryTargetElement);
    if (memoryTurn === "goalie") resolveMemoryGoalieAttempt(false, "wrong", typedKey);
    else resolveMemoryPlayerShot(false, "wrong", typedKey);
    return;
  }
  if (memoryTurn === "goalie") resolveMemoryGoalieAttempt(true);
  else resolveMemoryPlayerShot(true);
}

function finishMemoryGame(reason = "ended") {
  if (!memoryGameRunning) return;
  memoryGameRunning = false;
  memoryAcceptingInput = false;
  clearMemoryRoundTimers();

  const playerGoals = memoryGoalCount(memoryPlayerShots);
  const rivalGoals = memoryGoalCount(memoryRivalShots);
  const won = reason === "complete" && playerGoals > rivalGoals;
  const totalResponses = memoryPlayerShots.length + memoryRivalShots.length;
  const accuracy = totalResponses === 0 ? 0 : Math.round((memoryCorrectKeys / totalResponses) * 100);
  const grade = performanceGrade(accuracy);
  const elapsedMinutes = Math.max(memoryActiveMilliseconds, 1000) / 60000;
  const keysPerMinute = Math.round(memoryCorrectKeys / elapsedMinutes);
  recordProfileActivity({
    type: "memory",
    segment: selectedMemoryDifficulty,
    segmentLabel: MEMORY_DIFFICULTIES[selectedMemoryDifficulty].label,
    mistakes: memoryMistakes,
    accuracy,
    keysPerMinute,
    score: memoryScore,
    goals: playerGoals,
    won,
    grade,
  });

  drawPerformanceGrade(memoryGradeResultElement, grade);
  memoryScoreResultElement.textContent = memoryScore.toLocaleString();
  memoryGoalsResultElement.textContent = `${playerGoals}–${rivalGoals}`;
  memoryLevelResultElement.textContent = MEMORY_DIFFICULTIES[selectedMemoryDifficulty].label;
  memorySpeedResultElement.textContent = `${memoryKickSeconds.toFixed(1)}s`;
  memoryPaceResultElement.textContent = keysPerMinute;
  memoryResultsMessageElement.textContent = reason === "complete"
    ? won
      ? `You win ${playerGoals}–${rivalGoals}${memorySuddenDeath ? " in sudden death" : ""}!`
      : `The rival wins ${rivalGoals}–${playerGoals}${memorySuddenDeath ? " in sudden death" : ""}. Try the rematch!`
    : `Match ended early with the score ${playerGoals}–${rivalGoals}.`;
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
  button.addEventListener("click", () => selectMemoryLevel(button.dataset.memoryDifficulty));
});
startMemoryButton.addEventListener("click", startMemoryGame);
memoryReadyButton.addEventListener("click", startMemoryReadyCountdown);
endMemoryButton.addEventListener("click", () => finishMemoryGame("ended"));
retryMemoryButton.addEventListener("click", startMemoryGame);
changeMemoryButton.addEventListener("click", changeMemoryLevel);

drawMemoryLevel();
