// Find the one objective currently available on the map.
const currentLesson = QUEST_LESSONS.find((lesson) => lesson.status === "current");
const lesson = currentLesson.practice;
let position = 0;

const targetElement = document.querySelector("#target");
const feedbackElement = document.querySelector("#feedback");
const restartButton = document.querySelector("#restart-button");
const questMapElement = document.querySelector("#quest-map");
const lessonTitleElement = document.querySelector("#lesson-title");
const lessonDescriptionElement = document.querySelector("#lesson-description");

function drawQuestMap() {
  questMapElement.innerHTML = QUEST_LESSONS.map((lesson, index) => {
    const icon = lesson.status === "locked" ? "🔒" : index + 1;

    return `
      <li class="quest-stop ${lesson.status}">
        <span class="stop-icon" aria-hidden="true">${icon}</span>
        <span>
          <strong class="stop-title">${lesson.title}</strong>
          <span class="stop-description">${lesson.description}</span>
        </span>
      </li>`;
  }).join("");
}

function drawLesson() {
  targetElement.innerHTML = lesson.map((letter, index) => {
    const displayLetter = letter === " " ? "·" : letter;
    if (index < position) return `<span class="completed-letter">${displayLetter}</span>`;
    if (index === position) return `<span class="current-letter">${displayLetter}</span>`;
    return `<span>${displayLetter}</span>`;
  }).join("");
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

document.addEventListener("keydown", (event) => {
  if (event.key.length !== 1 || position === lesson.length) return;

  const typedLetter = event.key.toLowerCase();
  const expectedLetter = lesson[position];

  if (typedLetter === expectedLetter) {
    position += 1;
    feedbackElement.classList.remove("mistake");
    feedbackElement.textContent = position === lesson.length
      ? "You did it—the first path marker is glowing!"
      : "Nice! Keep going.";
    drawLesson();
  } else {
    const hint = expectedLetter === " " ? "the space bar" : expectedLetter.toUpperCase();
    feedbackElement.textContent = `Almost! Try ${hint}.`;
    feedbackElement.classList.add("mistake");
  }
});

restartButton.addEventListener("click", restartLesson);

lessonTitleElement.textContent = currentLesson.title;
lessonDescriptionElement.textContent = currentLesson.description;
drawQuestMap();
drawLesson();
