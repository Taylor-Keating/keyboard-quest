// Curriculum data lives here. Each objective contains several short missions:
// introduce a skill, repeat it deliberately, then combine it in a review.
const QUEST_LESSONS = [
  {
    id: "home-anchors",
    title: "Home-Row Anchors",
    description: "Find the F and J bumps and practice returning home.",
    missions: [
      { title: "Find the anchors", practice: "f j f j", note: "Find the raised bumps on F and J before you begin." },
      { title: "Anchor rhythm", practice: "f f j j f j f", note: "Keep both index fingers close to their home keys." },
      { title: "Home-base challenge", practice: "f j j f f j f j", note: "Finish each key press by returning to home base." },
    ],
  },
  {
    id: "home-row",
    title: "Home-Row Team",
    description: "Bring A, S, D, K, L, and ; into the team.",
    missions: [
      { title: "Left-hand team", practice: "a s d f", note: "One finger per key: pinky, ring, middle, then index." },
      { title: "Right-hand team", practice: "j k l ;", note: "Mirror the pattern with your right hand." },
      { title: "Whole home row", practice: "a s d f j k l ;", note: "Travel across the row, then settle your hands back home." },
    ],
  },
  {
    id: "top-row",
    title: "Sky Keys",
    description: "Reach up to the top row, then return home.",
    missions: [
      { title: "Sky-key starter", practice: "r u r u", note: "Reach up with each index finger, then return home." },
      { title: "Sky-key pairs", practice: "r r u u r u", note: "Keep the reach small and relaxed." },
      { title: "Sky-key switch", practice: "r u u r r u", note: "Alternate hands without losing your home-row position." },
    ],
  },
  {
    id: "bottom-row",
    title: "Cave Keys",
    description: "Explore the bottom row with careful fingers.",
    missions: [
      { title: "Cave-key starter", practice: "c m c m", note: "Reach down with your middle fingers, then come back home." },
      { title: "Cave-key pairs", practice: "c c m m c m", note: "Use a gentle reach—your hands should not wander." },
      { title: "Cave-key switch", practice: "c m m c c m", note: "Switch sides slowly, then try for an even rhythm." },
    ],
  },
  {
    id: "word-builder",
    title: "Word Workshop",
    description: "Turn your new keys into short words.",
    missions: [
      { title: "First words", practice: "sad dad", note: "Type each small word, then use either thumb for the space." },
      { title: "Home-row words", practice: "fall ask", note: "Let the letters flow while your fingers keep their places." },
      { title: "Word workshop", practice: "dad fall", note: "Practice smooth spaces between whole words." },
    ],
  },
  {
    id: "launch",
    title: "Launch Challenge",
    description: "Complete a mixed-key typing mission.",
    missions: [
      { title: "Launch sequence", practice: "fun", note: "Use the finger guide to finish this mixed-key word." },
      { title: "Flight check", practice: "sad fun", note: "Mix familiar words and stay calm between each key." },
      { title: "Launch challenge", practice: "fun dad", note: "A final smooth run—accuracy first, then speed." },
    ],
  },
];
