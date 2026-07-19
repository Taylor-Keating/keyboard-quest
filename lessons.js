// Curriculum data lives here. Each objective contains several short missions:
// introduce a skill, repeat it deliberately, then combine it in a review.
const QUEST_LESSONS = [
  {
    id: "home-anchors",
    title: "Home-Row Anchors",
    description: "Find the F and J bumps and practice returning home.",
    missions: [
      {
        phase: "Lesson",
        title: "Meet the anchors",
        practice: "f j f j",
        note: "Find the raised bumps on F and J before you begin.",
        learning: {
          heading: "Your index-finger home keys",
          copy: "F and J are special: their tiny raised bumps help you find the home row without looking down.",
          steps: [
            "Rest your left index finger on F and your right index finger on J.",
            "Let your other fingers relax beside them on the home row.",
            "Feel for the bumps, then look back at the screen before you type.",
          ],
          goal: "Goal: find F and J by touch, then press them with the matching index finger.",
        },
      },
      {
        phase: "Application",
        title: "Anchor rhythm",
        practice: "f f j j f j f",
        note: "Keep both index fingers close to their home keys.",
        learning: {
          heading: "Use the anchors in a pattern",
          copy: "Now you will switch between F and J. Let each index finger do its own job while the other fingers stay relaxed.",
          steps: [
            "Press F twice with your left index finger.",
            "Press J twice with your right index finger.",
            "Keep your wrists still and return to the bumps after each press.",
          ],
          goal: "Goal: make a steady left-right rhythm without watching your hands.",
        },
      },
      {
        phase: "Mastery",
        title: "Home-base challenge",
        practice: "f j j f f j f j",
        note: "Finish each key press by returning to home base.",
        learning: {
          heading: "Show your home-row control",
          copy: "This final pattern changes direction more often. Slow, accurate key presses are the win.",
          steps: [
            "Find the next key with your eyes on the screen.",
            "Use only the matching index finger for F or J.",
            "After every press, settle back onto the F and J bumps.",
          ],
          goal: "Mastery goal: complete the whole pattern accurately with your hands staying on home base.",
        },
      },
    ],
  },
  {
    id: "home-row",
    title: "Home-Row Team",
    description: "Bring A, S, D, K, L, and ; into the team.",
    missions: [
      { phase: "Lesson", title: "Left-hand team", practice: "a s d f", note: "One finger per key: pinky, ring, middle, then index.", learning: { heading: "Fill in the left home row", copy: "Your left hand has four home keys. Each finger owns one key.", steps: ["Pinky rests on A.", "Ring finger rests on S.", "Middle finger rests on D; index finger returns to F."], goal: "Goal: press each key with its resting finger." } },
      { phase: "Application", title: "Right-hand team", practice: "j k l ;", note: "Mirror the pattern with your right hand.", learning: { heading: "Fill in the right home row", copy: "Your right hand mirrors the left: index, middle, ring, then pinky.", steps: ["Index rests on J.", "Middle rests on K and ring finger rests on L.", "Pinky rests on ;."], goal: "Goal: keep each finger paired with its home key." } },
      { phase: "Mastery", title: "Whole home row", practice: "a s d f j k l ;", note: "Travel across the row, then settle your hands back home.", learning: { heading: "Cross the whole home row", copy: "Use all eight home keys in one calm sweep.", steps: ["Keep thumbs relaxed over the space bar.", "Let each finger press only its own key.", "End with both index fingers back on F and J."], goal: "Mastery goal: travel across the row without looking down." } },
    ],
  },
  {
    id: "top-row",
    title: "Sky Keys: Inner Reach",
    description: "Reach to E, R, T, Y, U, and I, then return home.",
    missions: [
      { phase: "Lesson", title: "Middle-finger lifts", practice: "e i e i", note: "Lift straight up from D to E and from K to I.", learning: { heading: "Reach with your middle fingers", copy: "E belongs to your left middle finger; I belongs to your right middle finger.", steps: ["Start on D and K.", "Lift to E or I without moving your whole hand.", "Return to D or K after every press."], goal: "Goal: make one small up-and-back reach at a time." } },
      { phase: "Application", title: "Index-finger lifts", practice: "r t y u r t y u", note: "Your index fingers cover two top-row keys each.", learning: { heading: "Give your index fingers room", copy: "The left index reaches R and T; the right index reaches Y and U.", steps: ["Start from F or J.", "Reach to the matching top key with the same index finger.", "Return to F or J before the next key."], goal: "Goal: use a controlled reach instead of sliding your hand." } },
      { phase: "Mastery", title: "Inner-sky mix", practice: "e r t y u i", note: "Mix middle and index reaches while returning home.", learning: { heading: "Blend the inner top row", copy: "Now you will use all six inner top-row keys in one sequence.", steps: ["Watch the next key on screen.", "Choose the matching finger before you move.", "Come home after every reach."], goal: "Mastery goal: complete the inner top row accurately." } },
    ],
  },
  {
    id: "top-row-edges",
    title: "Sky Keys: Outer Reach",
    description: "Add Q, W, O, and P with ring and pinky fingers.",
    missions: [
      { phase: "Lesson", title: "Ring-finger lifts", practice: "w o w o", note: "Lift from S to W and from L to O.", learning: { heading: "Reach with your ring fingers", copy: "W belongs to the left ring finger and O belongs to the right ring finger.", steps: ["Start on S and L.", "Lift one ring finger at a time.", "Return to the home row after each press."], goal: "Goal: keep your ring fingers working independently." } },
      { phase: "Application", title: "Pinky-finger lifts", practice: "q p q p", note: "Pinky reaches are small and careful.", learning: { heading: "Reach with your pinkies", copy: "Q belongs to the left pinky and P belongs to the right pinky.", steps: ["Start on A and ;.", "Let only the pinky lift toward the top row.", "Bring it back to its home key every time."], goal: "Goal: press Q and P without twisting your wrist." } },
      { phase: "Mastery", title: "Whole-sky mix", practice: "q w e r t y u i o p", note: "Travel across the top row using the finger guide.", learning: { heading: "Complete the top row", copy: "Every top-row letter now has a finger assignment.", steps: ["Move one key at a time.", "Use the highlighted key to check your reach.", "Return home whenever you need to reset."], goal: "Mastery goal: cross the top row accurately, not quickly." } },
    ],
  },
  {
    id: "bottom-row",
    title: "Cave Keys: Inner Reach",
    description: "Reach to C, V, B, N, and M, then return home.",
    missions: [
      { phase: "Lesson", title: "Middle-finger drops", practice: "c m c m", note: "Drop straight down from D to C and from K to M.", learning: { heading: "Reach with your middle fingers", copy: "C belongs to the left middle finger; M belongs to the right middle finger.", steps: ["Start on D and K.", "Drop to C or M with a small motion.", "Return to the home row after each press."], goal: "Goal: make a gentle down-and-back reach." } },
      { phase: "Application", title: "Index-finger drops", practice: "v b n", note: "Your index fingers cover the three middle bottom keys.", learning: { heading: "Use your index-finger zone", copy: "The left index reaches V and B; the right index reaches N.", steps: ["Start from F or J.", "Reach down only as far as the highlighted key.", "Come back to F or J before switching."], goal: "Goal: make one careful reach to each index-finger key." } },
      { phase: "Mastery", title: "Inner-cave mix", practice: "c v b n m c v b n m", note: "Mix the inner bottom-row keys slowly and carefully.", learning: { heading: "Blend the inner bottom row", copy: "These five keys use your middle and index fingers. This longer pattern asks you to switch between them smoothly.", steps: ["Check the next key before moving.", "Use the matching finger only.", "Reset on the home row if you lose your place."], goal: "Mastery goal: complete two accurate passes across the inner bottom row." } },
    ],
  },
  {
    id: "bottom-row-edges",
    title: "Cave Keys: Outer Reach",
    description: "Add Z, X, comma, period, and slash.",
    missions: [
      { phase: "Lesson", title: "Ring-finger drops", practice: "x , x ,", note: "Drop from S to X and from L to comma.", learning: { heading: "Reach with your ring fingers", copy: "X belongs to the left ring finger and comma belongs to the right ring finger.", steps: ["Start on S and L.", "Drop the ring finger without shifting your hand.", "Return to home after each press."], goal: "Goal: make a small, relaxed ring-finger reach." } },
      { phase: "Application", title: "Pinky-finger drops", practice: "z . / z . /", note: "Use careful pinky reaches at the bottom edge.", learning: { heading: "Reach with your pinkies", copy: "Z belongs to the left pinky; period and slash belong to the right pinky.", steps: ["Start on A and ;.", "Drop only the finger you need.", "Return to the home row between presses."], goal: "Goal: use the edge keys without moving your wrists." } },
      { phase: "Mastery", title: "Whole-cave mix", practice: "z x c v b n m , . /", note: "Travel across the bottom row using the finger guide.", learning: { heading: "Complete the bottom row", copy: "You now have a finger plan for every bottom-row key.", steps: ["Move slowly across the row.", "Use the highlighted key as your map.", "Return to home whenever you need a reset."], goal: "Mastery goal: cross the bottom row accurately." } },
    ],
  },
  {
    id: "word-builder",
    title: "Word Workshop",
    description: "Turn your new keys into short words.",
    missions: [
      { phase: "Lesson", title: "First words", practice: "sad dad", note: "Type each small word, then use either thumb for the space.", learning: { heading: "Connect letters into words", copy: "Words are just key patterns your fingers already know.", steps: ["Type one letter at a time.", "Use either thumb for the space.", "Return your fingers to home between words."], goal: "Goal: finish two short words accurately." } },
      { phase: "Application", title: "Home-row words", practice: "fall ask", note: "Let the letters flow while your fingers keep their places.", learning: { heading: "Build smooth word shapes", copy: "Keep your eyes on the word instead of chasing your fingers.", steps: ["Read the whole word first.", "Type steadily, not quickly.", "Use the space bar to separate the words."], goal: "Goal: type two words with a smooth pause at the space." } },
      { phase: "Mastery", title: "Word workshop", practice: "sad fall dad", note: "Practice smooth spaces between whole words.", learning: { heading: "Make a tiny phrase", copy: "This is your first multi-word challenge.", steps: ["Keep a calm rhythm.", "Make each space with a thumb.", "Correctness matters more than speed."], goal: "Mastery goal: complete the phrase without looking down." } },
    ],
  },
  {
    id: "launch",
    title: "Launch Challenge",
    description: "Complete a mixed-key typing mission.",
    missions: [
      { phase: "Lesson", title: "Mixed-key warmup", practice: "fun run", note: "Use the finger guide to combine keys from different rows.", learning: { heading: "Mix your new reaches", copy: "Real typing moves between rows, then returns home.", steps: ["Notice which row each key uses.", "Follow the finger guide when you are unsure.", "Reset to home after every word."], goal: "Goal: type two mixed-row words accurately." } },
      { phase: "Application", title: "Flight check", practice: "sad fun run", note: "Mix familiar words and stay calm between each key.", learning: { heading: "Keep your route steady", copy: "The words change, but your finger assignments stay the same.", steps: ["Read ahead to the next word.", "Use a thumb for every space.", "Stay relaxed if you make a mistake."], goal: "Goal: keep your hands on home base while changing words." } },
      { phase: "Mastery", title: "Launch challenge", practice: "fun dad sad run", note: "A final smooth run—accuracy first, then speed.", learning: { heading: "Complete your keyboard journey", copy: "This challenge blends home, top, and bottom-row practice into a short phrase.", steps: ["Start slowly.", "Trust your finger plan.", "Celebrate accurate typing, then try again for smoother rhythm."], goal: "Mastery goal: finish the mixed phrase with confident control." } },
    ],
  },
];
