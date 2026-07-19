const profilesKey = "keyboard-quest-profiles";
const activeProfileKey = "keyboard-quest-active-profile";
const profileStatsBaseKey = "keyboard-quest-profile-stats";
const legacyMigrationKey = "keyboard-quest-profile-migration-complete";
const legacyProfileKeys = [
  "keyboard-quest-completed-objectives",
  "keyboard-quest-show-all-finger-colors",
  "keyboard-quest-mistake-sound",
  "keyboard-quest-theme",
];

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
    lastPlayedAt: null,
  };

  try {
    return { ...emptyStats, ...JSON.parse(localStorage.getItem(profileStorageKey(profileStatsBaseKey, profileId)) || "{}") };
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

function profileObjectiveCount(profileId) {
  try {
    const completed = JSON.parse(localStorage.getItem(profileStorageKey("keyboard-quest-completed-objectives", profileId)) || "[]");
    return Array.isArray(completed) ? completed.length : 0;
  } catch {
    return 0;
  }
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

function deleteProfile(profileId) {
  const profile = keyboardQuestProfiles.find((candidate) => candidate.id === profileId);
  if (!profile || !window.confirm(`Delete ${profile.name}’s profile and all of its saved progress?`)) return;

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
closeProfileGateButton.addEventListener("click", () => closeProfileChooser(false));
profileGate.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && activeProfileId) {
    event.preventDefault();
    closeProfileChooser(true);
  }
});

drawActiveProfile();
if (!activeProfileId) openProfileChooser(false);
