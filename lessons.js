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
        randomPractice: { keys: "fj", length: 6 },
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
        randomPractice: { keys: "fj", length: 8 },
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
        randomPractice: { keys: "fj", length: 10 },
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
    description: "Learn every home-row key, including the index-finger reaches to G and H.",
    missions: [
      { phase: "Lesson", title: "Left-hand team", practice: "a s d f g", note: "Your left index finger rests on F and also reaches to G.", learning: { heading: "Fill in the left home row", copy: "Your left hand has four resting keys, and your index finger also reaches one key inward.", steps: ["Pinky rests on A; ring finger rests on S.", "Middle finger rests on D; index finger rests on F.", "Reach your left index finger from F to G, then return to F."], goal: "Goal: press A through G with the assigned left-hand fingers." } },
      { phase: "Application", title: "Right-hand team", practice: "h j k l ;", note: "Your right index finger rests on J and also reaches to H.", learning: { heading: "Fill in the right home row", copy: "Your right hand mirrors the left, with the index finger covering one extra key inward.", steps: ["Reach your right index finger from J to H, then return to J.", "Middle rests on K and ring finger rests on L.", "Pinky rests on ;."], goal: "Goal: press H through ; with the assigned right-hand fingers." } },
      { phase: "Mastery", title: "Whole home row", practice: "a s d f g h j k l ;", randomPractice: { keys: "asdfghjkl;", length: 14 }, note: "Use every home-row key in a changing order, then settle your hands back home.", learning: { heading: "Mix the whole home row", copy: "Use all ten home-row keys in an unpredictable sequence.", steps: ["Keep thumbs relaxed over the space bar.", "Use the left index for F and G; use the right index for H and J.", "Return both index fingers to F and J whenever you need to reset."], goal: "Mastery goal: use every home-row key accurately without looking down." } },
    ],
  },
  {
    id: "top-row",
    title: "Sky Keys: Inner Reach",
    description: "Reach to E, R, T, Y, U, and I, then return home.",
    missions: [
      { phase: "Lesson", title: "Middle-finger lifts", practice: "e i e i", randomPractice: { keys: "ei", length: 6 }, note: "Lift straight up from D to E and from K to I.", learning: { heading: "Reach with your middle fingers", copy: "E belongs to your left middle finger; I belongs to your right middle finger.", steps: ["Start on D and K.", "Lift to E or I without moving your whole hand.", "Return to D or K after every press."], goal: "Goal: make one small up-and-back reach at a time." } },
      { phase: "Application", title: "Index-finger lifts", practice: "r t y u r t y u", randomPractice: { keys: "rtyu", length: 8 }, note: "Your index fingers cover two top-row keys each.", learning: { heading: "Give your index fingers room", copy: "The left index reaches R and T; the right index reaches Y and U.", steps: ["Start from F or J.", "Reach to the matching top key with the same index finger.", "Return to F or J before the next key."], goal: "Goal: use a controlled reach instead of sliding your hand." } },
      { phase: "Mastery", title: "Inner-sky mix", practice: "e r t y u i", randomPractice: { keys: "ertyui", length: 12 }, note: "Mix middle and index reaches while returning home.", learning: { heading: "Blend the inner top row", copy: "Now you will use all six inner top-row keys in a changing sequence.", steps: ["Watch the next key on screen.", "Choose the matching finger before you move.", "Come home after every reach."], goal: "Mastery goal: complete the inner top-row mix accurately." } },
    ],
  },
  {
    id: "top-row-edges",
    title: "Sky Keys: Outer Reach",
    description: "Add Q, W, O, and P with ring and pinky fingers.",
    missions: [
      { phase: "Lesson", title: "Ring-finger lifts", practice: "w o w o", randomPractice: { keys: "wo", length: 6 }, note: "Lift from S to W and from L to O.", learning: { heading: "Reach with your ring fingers", copy: "W belongs to the left ring finger and O belongs to the right ring finger.", steps: ["Start on S and L.", "Lift one ring finger at a time.", "Return to the home row after each press."], goal: "Goal: keep your ring fingers working independently." } },
      { phase: "Application", title: "Pinky-finger lifts", practice: "q p q p", randomPractice: { keys: "qp", length: 6 }, note: "Pinky reaches are small and careful.", learning: { heading: "Reach with your pinkies", copy: "Q belongs to the left pinky and P belongs to the right pinky.", steps: ["Start on A and ;.", "Let only the pinky lift toward the top row.", "Bring it back to its home key every time."], goal: "Goal: press Q and P without twisting your wrist." } },
      { phase: "Mastery", title: "Whole-sky mix", practice: "q w e r t y u i o p", randomPractice: { keys: "qwertyuiop", length: 14 }, note: "Mix every top-row key using the finger guide.", learning: { heading: "Complete the top row", copy: "Every top-row letter now has a finger assignment. The order will change each time you practice.", steps: ["Move one key at a time.", "Use the highlighted key to check your reach.", "Return home whenever you need to reset."], goal: "Mastery goal: use every top-row key accurately, not quickly." } },
    ],
  },
  {
    id: "bottom-row",
    title: "Cave Keys: Inner Reach",
    description: "Reach to C, V, B, N, and M, then return home.",
    missions: [
      { phase: "Lesson", title: "Middle-finger drops", practice: "c m c m", randomPractice: { keys: "cm", length: 6 }, note: "Drop straight down from D to C and from K to M.", learning: { heading: "Reach with your middle fingers", copy: "C belongs to the left middle finger; M belongs to the right middle finger.", steps: ["Start on D and K.", "Drop to C or M with a small motion.", "Return to the home row after each press."], goal: "Goal: make a gentle down-and-back reach." } },
      { phase: "Application", title: "Index-finger drops", practice: "v b n", randomPractice: { keys: "vbn", length: 7 }, note: "Your index fingers cover the three middle bottom keys.", learning: { heading: "Use your index-finger zone", copy: "The left index reaches V and B; the right index reaches N.", steps: ["Start from F or J.", "Reach down only as far as the highlighted key.", "Come back to F or J before switching."], goal: "Goal: make one careful reach to each index-finger key." } },
      { phase: "Mastery", title: "Inner-cave mix", practice: "c v b n m c v b n m", randomPractice: { keys: "cvbnm", length: 12 }, note: "Mix the inner bottom-row keys slowly and carefully.", learning: { heading: "Blend the inner bottom row", copy: "These five keys use your middle and index fingers. The changing pattern asks you to switch between them smoothly.", steps: ["Check the next key before moving.", "Use the matching finger only.", "Reset on the home row if you lose your place."], goal: "Mastery goal: complete a longer inner-row mix accurately." } },
    ],
  },
  {
    id: "bottom-row-edges",
    title: "Cave Keys: Outer Reach",
    description: "Add Z, X, comma, period, and slash.",
    missions: [
      { phase: "Lesson", title: "Ring-finger drops", practice: "x , x ,", randomPractice: { keys: "x,", length: 6 }, note: "Drop from S to X and from L to comma.", learning: { heading: "Reach with your ring fingers", copy: "X belongs to the left ring finger and comma belongs to the right ring finger.", steps: ["Start on S and L.", "Drop the ring finger without shifting your hand.", "Return to home after each press."], goal: "Goal: make a small, relaxed ring-finger reach." } },
      { phase: "Application", title: "Pinky-finger drops", practice: "z . / z . /", randomPractice: { keys: "z./", length: 8 }, note: "Use careful pinky reaches at the bottom edge.", learning: { heading: "Reach with your pinkies", copy: "Z belongs to the left pinky; period and slash belong to the right pinky.", steps: ["Start on A and ;.", "Drop only the finger you need.", "Return to the home row between presses."], goal: "Goal: use the edge keys without moving your wrists." } },
      { phase: "Mastery", title: "Whole-cave mix", practice: "z x c v b n m , . /", randomPractice: { keys: "zxcvbnm,./", length: 14 }, note: "Mix every bottom-row key using the finger guide.", learning: { heading: "Complete the bottom row", copy: "You now have a finger plan for every bottom-row key. The order will change each time you practice.", steps: ["Move one key at a time.", "Use the highlighted key as your map.", "Return to home whenever you need a reset."], goal: "Mastery goal: use every bottom-row key accurately." } },
    ],
  },
  {
    id: "word-builder",
    title: "Word Workshop",
    description: "Turn your new keys into short words.",
    showFullKeyboard: true,
    missions: [
      { phase: "Lesson", title: "First words", practice: "sad dad", note: "Type each small word, then use either thumb for the space.", learning: { heading: "Connect letters into words", copy: "Words are just key patterns your fingers already know.", steps: ["Type one letter at a time.", "Use either thumb for the space.", "Return your fingers to home between words."], goal: "Goal: finish two short words accurately." } },
      { phase: "Application", title: "Home-row words", practice: "fall ask", note: "Let the letters flow while your fingers keep their places.", learning: { heading: "Build smooth word shapes", copy: "Keep your eyes on the word instead of chasing your fingers.", steps: ["Read the whole word first.", "Type steadily, not quickly.", "Use the space bar to separate the words."], goal: "Goal: type two words with a smooth pause at the space." } },
      { phase: "Mastery", title: "Word workshop", practice: "sad fall dad", note: "Practice smooth spaces between whole words.", learning: { heading: "Make a tiny phrase", copy: "This is your first multi-word challenge.", steps: ["Keep a calm rhythm.", "Make each space with a thumb.", "Correctness matters more than speed."], goal: "Mastery goal: complete the phrase without looking down." } },
    ],
  },
  {
    id: "launch",
    title: "Launch Challenge",
    description: "Combine the whole keyboard in phrases and a complete sentence.",
    showFullKeyboard: true,
    missions: [
      { phase: "Lesson", title: "Sentence launch", practice: "the quick brown fox", note: "Use the full keyboard map while you connect four different words.", learning: { heading: "Build the first half", copy: "Longer typing asks you to look ahead while your fingers travel between every keyboard row.", steps: ["Read one word ahead before you begin.", "Use a thumb for each space.", "Return to home base whenever your hands lose their place."], goal: "Goal: type the opening phrase accurately and smoothly." } },
      { phase: "Application", title: "Flight path", practice: "jumps over the lazy dog", note: "Keep a calm rhythm through five words with very different letter patterns.", learning: { heading: "Build the second half", copy: "This phrase adds less common reaches like J, V, Z, and Y.", steps: ["Let accuracy set your pace.", "Keep your eyes on the next word instead of your hands.", "Pause at a space if you need to reset on F and J."], goal: "Goal: move confidently between common and less common letters." } },
      { phase: "Mastery", title: "Full launch", practice: "the quick brown fox jumps over the lazy dog.", note: "One complete sentence uses every letter of the alphabet—accuracy first, then rhythm.", learning: { heading: "Complete your keyboard journey", copy: "The final stage combines every letter, repeated spaces, and a period in one full sentence.", steps: ["Read ahead without rushing.", "Trust the finger assignments you practiced.", "Finish with the period, then check your results."], goal: "Mastery goal: type the full sentence with confident, accurate control." } },
    ],
  },
];
