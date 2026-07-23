const profilesKey = "keyboard-quest-profiles";
const activeProfileKey = "keyboard-quest-active-profile";
const profileStatsBaseKey = "keyboard-quest-profile-stats";
const legacyMigrationKey = "keyboard-quest-profile-migration-complete";
const legacyProfileKeys = [
  "keyboard-quest-completed-objectives",
  "keyboard-quest-show-all-finger-colors",
  "keyboard-quest-mistake-sound",
  "keyboard-quest-theme",
  "keyboard-quest-completed-stages",
];
const profileTransferFormat = "keyboard-quest-profile";
const profileTransferVersion = 1;
const profileAvatarChoices = ["🦈", "🐉", "🦄", "🦖", "🐙", "🚀"];
const completedObjectivesBaseKey = "keyboard-quest-completed-objectives";
const completedStagesBaseKey = "keyboard-quest-completed-stages";
const fingerColorsBaseKey = "keyboard-quest-show-all-finger-colors";
const mistakeSoundBaseKey = "keyboard-quest-mistake-sound";
const themeBaseKey = "keyboard-quest-theme";
const performanceGradeScale = [
  { grade: "S", minimumAccuracy: 98 },
  { grade: "A", minimumAccuracy: 95 },
  { grade: "B", minimumAccuracy: 90 },
  { grade: "C", minimumAccuracy: 80 },
  { grade: "D", minimumAccuracy: 70 },
  { grade: "F", minimumAccuracy: 0 },
];
const performanceGradeRanks = { F: 0, D: 1, C: 2, B: 3, A: 4, S: 5 };

function performanceGrade(accuracy) {
  const safeAccuracy = Number.isFinite(accuracy) ? Math.max(0, Math.min(100, accuracy)) : 0;
  return performanceGradeScale.find((entry) => safeAccuracy >= entry.minimumAccuracy).grade;
}

function drawPerformanceGrade(element, grade) {
  element.textContent = grade;
  element.className = `grade-badge grade-${grade.toLowerCase()}`;
}

function safeProfileRecords(value) {
  const safeRecords = { learn: {}, challenge: {}, memory: {} };
  Object.keys(safeRecords).forEach((category) => {
    const categoryValue = value?.[category];
    if (!categoryValue || typeof categoryValue !== "object" || Array.isArray(categoryValue)) return;
    Object.entries(categoryValue).slice(0, 100).forEach(([key, record]) => {
      if (!record || typeof record !== "object" || Array.isArray(record)) return;
      const safeKey = key.replace(/[^a-z0-9:_-]/gi, "").slice(0, 80);
      if (!safeKey || ["__proto__", "constructor", "prototype"].includes(safeKey.toLowerCase())) return;
      const grade = performanceGradeRanks[record.grade] === undefined ? "F" : record.grade;
      safeRecords[category][safeKey] = {
        label: typeof record.label === "string" ? record.label.slice(0, 80) : safeKey,
        grade,
        plays: Number.isFinite(record.plays) ? Math.max(0, Math.round(record.plays)) : 0,
        score: Number.isFinite(record.score) ? Math.max(0, Math.round(record.score)) : 0,
        accuracy: Number.isFinite(record.accuracy) ? Math.max(0, Math.min(100, Math.round(record.accuracy))) : 0,
        keysPerMinute: Number.isFinite(record.keysPerMinute) ? Math.max(0, Math.round(record.keysPerMinute)) : 0,
        fewestMistakes: Number.isFinite(record.fewestMistakes) ? Math.max(0, Math.round(record.fewestMistakes)) : null,
        goals: Number.isFinite(record.goals) ? Math.max(0, Math.round(record.goals)) : 0,
        wins: Number.isFinite(record.wins) ? Math.max(0, Math.round(record.wins)) : 0,
        updatedAt: typeof record.updatedAt === "string" ? record.updatedAt.slice(0, 40) : null,
      };
    });
  });
  return safeRecords;
}

function readProfiles() {
  try {
    const profiles = JSON.parse(localStorage.getItem(profilesKey) || "[]");
    return Array.isArray(profiles) ? profiles : [];
  } catch {
    return [];
  }
}

let keyboardQuestProfiles = readProfiles();
let activeProfileId = localStorage.getItem(activeProfileKey);
if (!keyboardQuestProfiles.some((profile) => profile.id === activeProfileId)) activeProfileId = null;

function profileStorageKey(baseKey, profileId = activeProfileId) {
  return `${baseKey}::${profileId || "guest"}`;
}

function activeProfile() {
  return keyboardQuestProfiles.find((profile) => profile.id === activeProfileId) || null;
}

function readProfileStats(profileId) {
  const emptyStats = {
    missionsCompleted: 0,
    challengesCompleted: 0,
    totalMistakes: 0,
    bestKeysPerMinute: 0,
    bestChallengeScore: 0,
    memoryGamesPlayed: 0,
    memoryWins: 0,
    bestMemoryScore: 0,
    bestMemoryGoals: 0,
    records: { learn: {}, challenge: {}, memory: {} },
    lastPlayedAt: null,
  };

  try {
    const storedStats = JSON.parse(localStorage.getItem(profileStorageKey(profileStatsBaseKey, profileId)) || "{}");
    return { ...emptyStats, ...storedStats, records: safeProfileRecords(storedStats.records) };
  } catch {
    return emptyStats;
  }
}

function recordProfileActivity(activity) {
  if (!activeProfileId) return;
  const stats = readProfileStats(activeProfileId);
  if (activity.type === "mission") stats.missionsCompleted += 1;
  if (activity.type === "challenge") {
    stats.challengesCompleted += 1;
    stats.bestChallengeScore = Math.max(stats.bestChallengeScore, activity.score || 0);
  }
  if (activity.type === "memory") {
    stats.memoryGamesPlayed += 1;
    if (activity.won) stats.memoryWins += 1;
    stats.bestMemoryScore = Math.max(stats.bestMemoryScore, activity.score || 0);
    stats.bestMemoryGoals = Math.max(stats.bestMemoryGoals, activity.goals || 0);
  }
  if (["mission", "challenge", "memory"].includes(activity.type) && activity.segment) {
    const category = activity.type === "mission" ? "learn" : activity.type;
    const previousRecord = stats.records[category][activity.segment] || {};
    const grade = performanceGradeRanks[activity.grade] === undefined ? performanceGrade(activity.accuracy) : activity.grade;
    stats.records[category][activity.segment] = {
      label: activity.segmentLabel || previousRecord.label || activity.segment,
      grade: performanceGradeRanks[grade] > performanceGradeRanks[previousRecord.grade] ? grade : previousRecord.grade || grade,
      plays: (previousRecord.plays || 0) + 1,
      score: Math.max(previousRecord.score || 0, activity.score || 0),
      accuracy: Math.max(previousRecord.accuracy || 0, activity.accuracy || 0),
      keysPerMinute: Math.max(previousRecord.keysPerMinute || 0, activity.keysPerMinute || 0),
      fewestMistakes: previousRecord.fewestMistakes === null || previousRecord.fewestMistakes === undefined
        ? activity.mistakes || 0
        : Math.min(previousRecord.fewestMistakes, activity.mistakes || 0),
      goals: Math.max(previousRecord.goals || 0, activity.goals || 0),
      wins: (previousRecord.wins || 0) + (activity.won ? 1 : 0),
      updatedAt: new Date().toISOString(),
    };
  }
  stats.totalMistakes += activity.mistakes || 0;
  stats.bestKeysPerMinute = Math.max(stats.bestKeysPerMinute, activity.keysPerMinute || 0);
  stats.lastPlayedAt = new Date().toISOString();
  localStorage.setItem(profileStorageKey(profileStatsBaseKey), JSON.stringify(stats));
}

const profileGate = document.querySelector("#profile-gate");
const profileList = document.querySelector("#profile-list");
const createProfileForm = document.querySelector("#create-profile-form");
const profileNameInput = document.querySelector("#profile-name-input");
const profileFormError = document.querySelector("#profile-form-error");
const closeProfileGateButton = document.querySelector("#close-profile-gate-button");
const switchProfileButton = document.querySelector("#switch-profile-button");
const settingsProfileAvatar = document.querySelector("#settings-profile-avatar");
const settingsProfileName = document.querySelector("#settings-profile-name");
const settingsProfileHeading = document.querySelector("#settings-profile-heading");
const resetProfileProgressButton = document.querySelector("#reset-profile-progress-button");
const resetProgressDialog = document.querySelector("#reset-progress-dialog");
const resetProfileName = document.querySelector("#reset-profile-name");
const cancelResetButton = document.querySelector("#cancel-reset-button");
const confirmResetButton = document.querySelector("#confirm-reset-button");
const editProfileButton = document.querySelector("#edit-profile-button");
const editProfileDialog = document.querySelector("#edit-profile-dialog");
const editProfileForm = document.querySelector("#edit-profile-form");
const editProfileNameInput = document.querySelector("#edit-profile-name-input");
const editProfileError = document.querySelector("#edit-profile-error");
const cancelEditProfileButton = document.querySelector("#cancel-edit-profile-button");
const deleteProfileFromEditButton = document.querySelector("#delete-profile-from-edit-button");
const deleteProfileDialog = document.querySelector("#delete-profile-dialog");
const deleteProfileName = document.querySelector("#delete-profile-name");
const cancelDeleteProfileButton = document.querySelector("#cancel-delete-profile-button");
const confirmDeleteProfileButton = document.querySelector("#confirm-delete-profile-button");
const exportProfileButton = document.querySelector("#export-profile-button");
const importProfileSettingsButton = document.querySelector("#import-profile-settings-button");
const importProfileGateButton = document.querySelector("#import-profile-gate-button");
const profileImportFile = document.querySelector("#profile-import-file");
const profileImportError = document.querySelector("#profile-import-error");
const profileTransferStatus = document.querySelector("#profile-transfer-status");
const viewRecordsButton = document.querySelector("#view-records-button");
const recordsDialog = document.querySelector("#records-dialog");
const recordsProfileName = document.querySelector("#records-profile-name");
const learnRecordsList = document.querySelector("#learn-records-list");
const challengeRecordsList = document.querySelector("#challenge-records-list");
const memoryRecordsList = document.querySelector("#memory-records-list");
const closeRecordsButton = document.querySelector("#close-records-button");
const recordsBestPace = document.querySelector("#records-best-pace");
const recordsBestChallenge = document.querySelector("#records-best-challenge");
const recordsBestMemory = document.querySelector("#records-best-memory");
const recordsMemoryWins = document.querySelector("#records-memory-wins");

function profileObjectiveCount(profileId) {
  try {
    const completed = JSON.parse(localStorage.getItem(profileStorageKey(completedObjectivesBaseKey, profileId)) || "[]");
    return Array.isArray(completed) ? completed.length : 0;
  } catch {
    return 0;
  }
}

function readStoredArray(baseKey, profileId = activeProfileId) {
  try {
    const value = JSON.parse(localStorage.getItem(profileStorageKey(baseKey, profileId)) || "[]");
    return Array.isArray(value) ? value.filter((item) => typeof item === "string").slice(0, 200) : [];
  } catch {
    return [];
  }
}

function uniqueImportedProfileName(requestedName) {
  const cleanedName = requestedName.trim().replace(/\s+/g, " ").slice(0, 18) || "Imported Player";
  if (!keyboardQuestProfiles.some((profile) => profile.name.toLowerCase() === cleanedName.toLowerCase())) return cleanedName;

  for (let copyNumber = 2; copyNumber < 100; copyNumber += 1) {
    const suffix = ` (${copyNumber})`;
    const candidate = `${cleanedName.slice(0, 18 - suffix.length)}${suffix}`;
    if (!keyboardQuestProfiles.some((profile) => profile.name.toLowerCase() === candidate.toLowerCase())) return candidate;
  }
  return `Imported ${Date.now().toString().slice(-6)}`;
}

function safeProfileStats(value) {
  const safeStats = {};
  const numericFields = [
    "missionsCompleted",
    "challengesCompleted",
    "totalMistakes",
    "bestKeysPerMinute",
    "bestChallengeScore",
    "memoryGamesPlayed",
    "memoryWins",
    "bestMemoryScore",
    "bestMemoryGoals",
  ];
  numericFields.forEach((field) => {
    if (Number.isFinite(value?.[field])) safeStats[field] = Math.max(0, Math.round(value[field]));
  });
  if (typeof value?.lastPlayedAt === "string") safeStats.lastPlayedAt = value.lastPlayedAt.slice(0, 40);
  safeStats.records = safeProfileRecords(value?.records);
  return safeStats;
}

function profileExportData() {
  const profile = activeProfile();
  if (!profile) return null;
  const storedTheme = localStorage.getItem(profileStorageKey(themeBaseKey));
  return {
    format: profileTransferFormat,
    version: profileTransferVersion,
    exportedAt: new Date().toISOString(),
    profile: { name: profile.name, avatar: profile.avatar },
    progress: {
      completedObjectives: readStoredArray(completedObjectivesBaseKey),
      completedStages: readStoredArray(completedStagesBaseKey),
    },
    preferences: {
      showAllFingerColors: localStorage.getItem(profileStorageKey(fingerColorsBaseKey)) === "true",
      mistakeSound: localStorage.getItem(profileStorageKey(mistakeSoundBaseKey)) !== "false",
      theme: ["classic", "rebel-royal", "shark"].includes(storedTheme) ? storedTheme : "classic",
    },
    statistics: safeProfileStats(readProfileStats(activeProfileId)),
  };
}

function exportActiveProfile() {
  const exportData = profileExportData();
  if (!exportData) return;
  const fileContents = JSON.stringify(exportData, null, 2);
  const blob = new Blob([fileContents], { type: "application/json" });
  const downloadUrl = URL.createObjectURL(blob);
  const downloadLink = document.createElement("a");
  const safeName = exportData.profile.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "player";
  downloadLink.href = downloadUrl;
  downloadLink.download = `keyboard-quest-${safeName}.json`;
  document.body.append(downloadLink);
  downloadLink.click();
  downloadLink.remove();
  setTimeout(() => URL.revokeObjectURL(downloadUrl), 0);
  profileTransferStatus.textContent = `Exported ${exportData.profile.name}’s profile.`;
}

function normalizedImportData(value) {
  if (value?.format !== profileTransferFormat) throw new Error("That file is not a Keyboard Quest profile.");
  if (value.version !== profileTransferVersion) throw new Error("That profile was created by an unsupported version of Keyboard Quest.");
  if (typeof value.profile?.name !== "string") throw new Error("The profile file is missing a player name.");

  const theme = value.preferences?.theme;
  return {
    name: uniqueImportedProfileName(value.profile.name),
    avatar: profileAvatarChoices.includes(value.profile.avatar) ? value.profile.avatar : "🚀",
    completedObjectives: Array.isArray(value.progress?.completedObjectives)
      ? value.progress.completedObjectives.filter((item) => typeof item === "string").slice(0, 200)
      : [],
    completedStages: Array.isArray(value.progress?.completedStages)
      ? value.progress.completedStages.filter((item) => typeof item === "string").slice(0, 200)
      : [],
    showAllFingerColors: value.preferences?.showAllFingerColors === true,
    mistakeSound: value.preferences?.mistakeSound !== false,
    theme: ["classic", "rebel-royal", "shark"].includes(theme) ? theme : "classic",
    statistics: safeProfileStats(value.statistics),
  };
}

function saveImportedProfile(importData) {
  const profile = {
    id: globalThis.crypto?.randomUUID?.() || `player-${Date.now()}`,
    name: importData.name,
    avatar: importData.avatar,
    createdAt: new Date().toISOString(),
  };
  keyboardQuestProfiles.push(profile);
  localStorage.setItem(profilesKey, JSON.stringify(keyboardQuestProfiles));
  localStorage.setItem(profileStorageKey(completedObjectivesBaseKey, profile.id), JSON.stringify(importData.completedObjectives));
  localStorage.setItem(profileStorageKey(completedStagesBaseKey, profile.id), JSON.stringify(importData.completedStages));
  localStorage.setItem(profileStorageKey(fingerColorsBaseKey, profile.id), String(importData.showAllFingerColors));
  localStorage.setItem(profileStorageKey(mistakeSoundBaseKey, profile.id), String(importData.mistakeSound));
  localStorage.setItem(profileStorageKey(themeBaseKey, profile.id), importData.theme);
  localStorage.setItem(profileStorageKey(profileStatsBaseKey, profile.id), JSON.stringify(importData.statistics));
  localStorage.setItem(activeProfileKey, profile.id);
  window.location.reload();
}

async function importProfileFile(file) {
  if (!file) return;
  profileImportError.textContent = "";
  profileTransferStatus.textContent = "";
  try {
    if (file.size > 500_000) throw new Error("That profile file is too large.");
    const parsedFile = JSON.parse(await file.text());
    saveImportedProfile(normalizedImportData(parsedFile));
  } catch (error) {
    const message = error instanceof SyntaxError ? "That file is damaged or is not valid JSON." : error.message;
    profileImportError.textContent = message;
    profileTransferStatus.textContent = message;
  } finally {
    profileImportFile.value = "";
  }
}

function chooseProfileImportFile() {
  profileImportFile.click();
}

function drawProfileList() {
  profileList.replaceChildren();
  keyboardQuestProfiles.forEach((profile) => {
    const stats = readProfileStats(profile.id);
    const profileCard = document.createElement("article");
    profileCard.className = "profile-card";
    if (profile.id === activeProfileId) profileCard.classList.add("active");

    const selectButton = document.createElement("button");
    selectButton.className = "profile-select-button";
    selectButton.type = "button";
    selectButton.dataset.profileId = profile.id;
    selectButton.setAttribute("aria-label", `Play as ${profile.name}`);

    const avatar = document.createElement("span");
    avatar.className = "profile-avatar";
    avatar.setAttribute("aria-hidden", "true");
    avatar.textContent = profile.avatar;

    const details = document.createElement("span");
    details.className = "profile-details";
    const name = document.createElement("strong");
    name.textContent = profile.name;
    const progress = document.createElement("small");
    const objectiveCount = profileObjectiveCount(profile.id);
    progress.textContent = `${objectiveCount} objective${objectiveCount === 1 ? "" : "s"} · Best pace ${stats.bestKeysPerMinute} KPM`;
    details.append(name, progress);
    selectButton.append(avatar, details);

    const deleteButton = document.createElement("button");
    deleteButton.className = "delete-profile-button";
    deleteButton.type = "button";
    deleteButton.dataset.deleteProfileId = profile.id;
    deleteButton.setAttribute("aria-label", `Delete ${profile.name}’s profile`);
    deleteButton.title = `Delete ${profile.name}`;
    deleteButton.textContent = "×";
    profileCard.append(selectButton, deleteButton);
    profileList.append(profileCard);
  });

  profileList.hidden = keyboardQuestProfiles.length === 0;
}

function drawActiveProfile() {
  const profile = activeProfile();
  settingsProfileAvatar.textContent = profile?.avatar || "";
  settingsProfileName.textContent = profile?.name || "No player selected";
}

function drawRecordList(container, records, category) {
  container.replaceChildren();
  const recordEntries = Object.values(records).sort((left, right) => left.label.localeCompare(right.label, undefined, { numeric: true }));
  if (recordEntries.length === 0) {
    const emptyMessage = document.createElement("p");
    emptyMessage.className = "records-empty";
    emptyMessage.textContent = "No records yet—complete this activity to set the first one.";
    container.append(emptyMessage);
    return;
  }

  recordEntries.forEach((record) => {
    const row = document.createElement("article");
    row.className = "record-row";
    const grade = document.createElement("span");
    grade.className = `grade-badge grade-${record.grade.toLowerCase()}`;
    grade.textContent = record.grade;
    grade.setAttribute("aria-label", `Grade ${record.grade}`);
    const details = document.createElement("span");
    details.className = "record-details";
    const label = document.createElement("strong");
    label.textContent = record.label;
    const metrics = document.createElement("small");
    const commonMetrics = `${record.score.toLocaleString()} points · ${record.accuracy}% accuracy · ${record.keysPerMinute} KPM`;
    metrics.textContent = category === "memory"
      ? `${commonMetrics} · ${record.goals} goals · ${record.wins} wins`
      : `${commonMetrics} · ${record.plays} play${record.plays === 1 ? "" : "s"}`;
    details.append(label, metrics);
    row.append(grade, details);
    container.append(row);
  });
}

function drawProfileRecords() {
  const profile = activeProfile();
  if (!profile) return;
  const stats = readProfileStats(profile.id);
  const records = stats.records;
  recordsProfileName.textContent = profile.name;
  recordsBestPace.textContent = stats.bestKeysPerMinute.toLocaleString();
  recordsBestChallenge.textContent = stats.bestChallengeScore.toLocaleString();
  recordsBestMemory.textContent = stats.bestMemoryScore.toLocaleString();
  recordsMemoryWins.textContent = stats.memoryWins.toLocaleString();
  drawRecordList(learnRecordsList, records.learn, "learn");
  drawRecordList(challengeRecordsList, records.challenge, "challenge");
  drawRecordList(memoryRecordsList, records.memory, "memory");
}

function openProfileChooser(canClose = Boolean(activeProfileId)) {
  drawProfileList();
  profileGate.hidden = false;
  closeProfileGateButton.hidden = !canClose;
  document.body.classList.add("profile-gate-open");
  document.querySelector(".app-shell").inert = true;
  document.querySelector("#mistake-sound-button").inert = true;
  document.querySelector("#settings-button").inert = true;
  const activeButton = profileList.querySelector(`[data-profile-id="${activeProfileId}"]`);
  (activeButton || profileNameInput).focus();
}

function closeProfileChooser(shouldReturnFocus = false) {
  if (!activeProfileId) return;
  profileGate.hidden = true;
  document.body.classList.remove("profile-gate-open");
  document.querySelector(".app-shell").inert = false;
  document.querySelector("#mistake-sound-button").inert = false;
  document.querySelector("#settings-button").inert = false;
  if (shouldReturnFocus) switchProfileButton.focus();
  else closeProfileGateButton.blur();
}

function migrateLegacyProgress(profileId) {
  if (localStorage.getItem(legacyMigrationKey) === "true") return;
  legacyProfileKeys.forEach((baseKey) => {
    const legacyValue = localStorage.getItem(baseKey);
    const destinationKey = profileStorageKey(baseKey, profileId);
    if (legacyValue !== null && localStorage.getItem(destinationKey) === null) {
      localStorage.setItem(destinationKey, legacyValue);
    }
  });
  localStorage.setItem(legacyMigrationKey, "true");
}

function chooseProfile(profileId) {
  if (!keyboardQuestProfiles.some((profile) => profile.id === profileId)) return;
  localStorage.setItem(activeProfileKey, profileId);
  window.location.reload();
}

function removeProfile(profileId) {
  const profile = keyboardQuestProfiles.find((candidate) => candidate.id === profileId);
  if (!profile) return;

  keyboardQuestProfiles = keyboardQuestProfiles.filter((candidate) => candidate.id !== profileId);
  localStorage.setItem(profilesKey, JSON.stringify(keyboardQuestProfiles));
  const suffix = `::${profileId}`;
  Object.keys(localStorage).filter((key) => key.endsWith(suffix)).forEach((key) => localStorage.removeItem(key));
  if (activeProfileId === profileId) {
    localStorage.removeItem(activeProfileKey);
    window.location.reload();
    return;
  }
  drawProfileList();
}

function deleteProfile(profileId) {
  const profile = keyboardQuestProfiles.find((candidate) => candidate.id === profileId);
  if (!profile || !window.confirm(`Delete ${profile.name}’s profile and all of its saved progress?`)) return;
  removeProfile(profileId);
}

function setProfileModalBackgroundInert(isInert) {
  document.querySelector("#settings-panel").inert = isInert;
  document.querySelector(".app-shell").inert = isInert;
  document.querySelector("#mistake-sound-button").inert = isInert;
  document.querySelector("#settings-button").inert = isInert;
}

function setRecordsDialogOpen(isOpen) {
  if (isOpen && !activeProfile()) return;
  recordsDialog.hidden = !isOpen;
  setProfileModalBackgroundInert(isOpen);
  if (isOpen) {
    drawProfileRecords();
    closeRecordsButton.focus();
  } else {
    viewRecordsButton.focus();
  }
}

function setResetDialogOpen(isOpen, shouldReturnFocus = false) {
  resetProgressDialog.hidden = !isOpen;
  setProfileModalBackgroundInert(isOpen);
  if (isOpen) {
    resetProfileName.textContent = activeProfile()?.name || "this player";
    cancelResetButton.focus();
  } else if (shouldReturnFocus) settingsProfileHeading.focus();
}

function setEditProfileDialogOpen(isOpen, shouldReturnFocus = false) {
  const profile = activeProfile();
  if (isOpen && !profile) return;
  editProfileDialog.hidden = !isOpen;
  setProfileModalBackgroundInert(isOpen);
  if (isOpen) {
    editProfileNameInput.value = profile.name;
    editProfileError.textContent = "";
    editProfileForm.querySelectorAll('[name="edit-profile-avatar"]').forEach((option) => {
      option.checked = option.value === profile.avatar;
    });
    editProfileNameInput.focus();
    editProfileNameInput.select();
  } else if (shouldReturnFocus) settingsProfileHeading.focus();
}

function setDeleteProfileDialogOpen(isOpen) {
  const profile = activeProfile();
  if (isOpen && !profile) return;
  deleteProfileDialog.hidden = !isOpen;
  editProfileDialog.inert = isOpen;
  if (isOpen) {
    deleteProfileName.textContent = profile.name;
    cancelDeleteProfileButton.focus();
  } else {
    deleteProfileFromEditButton.focus();
  }
}

function saveEditedProfile(event) {
  event.preventDefault();
  const profile = activeProfile();
  if (!profile) return;
  const name = editProfileNameInput.value.trim().replace(/\s+/g, " ");
  if (!name) {
    editProfileError.textContent = "Enter a player name first.";
    editProfileNameInput.focus();
    return;
  }
  if (keyboardQuestProfiles.some((candidate) => candidate.id !== profile.id && candidate.name.toLowerCase() === name.toLowerCase())) {
    editProfileError.textContent = "That player name is already being used.";
    editProfileNameInput.focus();
    return;
  }

  profile.name = name;
  profile.avatar = editProfileForm.querySelector('[name="edit-profile-avatar"]:checked').value;
  localStorage.setItem(profilesKey, JSON.stringify(keyboardQuestProfiles));
  drawActiveProfile();
  drawProfileList();
  setEditProfileDialogOpen(false, true);
}

function resetActiveProfileProgress() {
  if (!activeProfileId) return;
  localStorage.removeItem(profileStorageKey("keyboard-quest-completed-objectives"));
  localStorage.removeItem(profileStorageKey(profileStatsBaseKey));
  localStorage.removeItem(profileStorageKey("keyboard-quest-completed-stages"));
  window.location.reload();
}

profileList.addEventListener("click", (event) => {
  const selectButton = event.target.closest("[data-profile-id]");
  if (selectButton) {
    chooseProfile(selectButton.dataset.profileId);
    return;
  }
  const deleteButton = event.target.closest("[data-delete-profile-id]");
  if (deleteButton) deleteProfile(deleteButton.dataset.deleteProfileId);
});

createProfileForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const name = profileNameInput.value.trim().replace(/\s+/g, " ");
  if (!name) {
    profileFormError.textContent = "Enter a player name first.";
    profileNameInput.focus();
    return;
  }
  if (keyboardQuestProfiles.some((profile) => profile.name.toLowerCase() === name.toLowerCase())) {
    profileFormError.textContent = "That player name is already being used.";
    profileNameInput.focus();
    return;
  }

  const avatar = createProfileForm.querySelector('[name="profile-avatar"]:checked').value;
  const profile = {
    id: globalThis.crypto?.randomUUID?.() || `player-${Date.now()}`,
    name,
    avatar,
    createdAt: new Date().toISOString(),
  };
  const isFirstProfile = keyboardQuestProfiles.length === 0;
  keyboardQuestProfiles.push(profile);
  localStorage.setItem(profilesKey, JSON.stringify(keyboardQuestProfiles));
  if (isFirstProfile) migrateLegacyProgress(profile.id);
  chooseProfile(profile.id);
});

switchProfileButton.addEventListener("click", () => openProfileChooser(true));
viewRecordsButton.addEventListener("click", () => setRecordsDialogOpen(true));
closeRecordsButton.addEventListener("click", () => setRecordsDialogOpen(false));
recordsDialog.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    event.preventDefault();
    event.stopPropagation();
    setRecordsDialogOpen(false);
  }
});
exportProfileButton.addEventListener("click", exportActiveProfile);
importProfileSettingsButton.addEventListener("click", chooseProfileImportFile);
importProfileGateButton.addEventListener("click", chooseProfileImportFile);
profileImportFile.addEventListener("change", () => importProfileFile(profileImportFile.files[0]));
editProfileButton.addEventListener("click", () => setEditProfileDialogOpen(true));
editProfileForm.addEventListener("submit", saveEditedProfile);
cancelEditProfileButton.addEventListener("click", () => setEditProfileDialogOpen(false, true));
deleteProfileFromEditButton.addEventListener("click", () => setDeleteProfileDialogOpen(true));
cancelDeleteProfileButton.addEventListener("click", () => setDeleteProfileDialogOpen(false));
confirmDeleteProfileButton.addEventListener("click", () => removeProfile(activeProfileId));
deleteProfileDialog.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    event.preventDefault();
    event.stopPropagation();
    setDeleteProfileDialogOpen(false);
  }
});
editProfileDialog.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    event.preventDefault();
    event.stopPropagation();
    setEditProfileDialogOpen(false, true);
  }
});
resetProfileProgressButton.addEventListener("click", () => setResetDialogOpen(true));
cancelResetButton.addEventListener("click", () => setResetDialogOpen(false, true));
confirmResetButton.addEventListener("click", resetActiveProfileProgress);
resetProgressDialog.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    event.preventDefault();
    event.stopPropagation();
    setResetDialogOpen(false, true);
  }
});
closeProfileGateButton.addEventListener("click", () => closeProfileChooser(false));
profileGate.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && activeProfileId) {
    event.preventDefault();
    closeProfileChooser(true);
  }
});

drawActiveProfile();
if (!activeProfileId) openProfileChooser(false);
