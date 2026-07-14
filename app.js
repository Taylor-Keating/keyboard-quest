// This array is our lesson data. Spaces are included because the child
// should practice pressing the space bar too.
const lesson = ["f", " ", "j", " ", "f", " ", "j"];

// These variables remember the state of the exercise while the page is open.
let position = 0;

const targetElement = document.querySelector("#target");
const feedbackElement = document.querySelector("#feedback");
const restartButton = document.querySelector("#restart-button");

function drawLesson() {
  // Turn each lesson character into a visible span so CSS can style it.
  targetElement.innerHTML = lesson
    .map((letter, index) => {
      const displayLetter = letter === " " ? "·" : letter;

      if (index < position) {
        return `<span class="completed-letter">${displayLetter}</span>`;
      }

      if (index === position) {
        return `<span class="current-letter">${displayLetter}</span>`;
      }

      return `<span>${displayLetter}</span>`;
    })
    .join("");
}

function restartLesson() {
  position = 0;
  feedbackElement.textContent = "Press the first letter when you are ready.";
  feedbackElement.classList.remove("mistake");
  drawLesson();
}

document.addEventListener("keydown", (event) => {
  // Ignore keys such as Shift and ArrowLeft. They are not typing answers.
  if (event.key.length !== 1 || position === lesson.length) {
    return;
  }

  const typedLetter = event.key.toLowerCase();
  const expectedLetter = lesson[position];

  if (typedLetter === expectedLetter) {
    position += 1;
    feedbackElement.classList.remove("mistake");

    if (position === lesson.length) {
      feedbackElement.textContent = "You did it—the robot is awake!";
    } else {
      feedbackElement.textContent = "Nice! Keep going.";
    }

    drawLesson();
  } else {
    feedbackElement.textContent = `Almost! Try ${expectedLetter === " " ? "the space bar" : expectedLetter.toUpperCase()}.`;
    feedbackElement.classList.add("mistake");
  }
});

restartButton.addEventListener("click", restartLesson);

// Draw the initial exercise when the page first loads.
drawLesson();
