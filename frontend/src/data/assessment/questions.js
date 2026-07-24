// Question content for the 5-category assessment. Kept fully separate from
// scoring logic (scoring.js) and rendering (Onboarding.jsx) so new questions
// can be added here without touching either.

// --- Category 1: Personal Profile (one calibration MCQ, rest stays free text) ---
export const CODING_JOURNEY_QUESTION = {
  id: 'coding_journey',
  question: 'How would you describe your coding journey so far?',
  type: 'single',
  options: [
    { value: 'just_started', label: 'Just started — I know the basics of one language' },
    { value: 'coursework_only', label: "I've done coursework but never built anything on my own" },
    { value: 'small_projects', label: "I've built 1-2 small personal projects" },
    { value: 'real_projects', label: "I've built real projects and know my way around Git/GitHub" },
  ],
}

// --- Category 2: Career Goals ---
// Domain interest itself is rendered separately (drives Skill Assessment), so
// it isn't in this array — see DOMAINS in config.js.
export const CAREER_GOAL_QUESTIONS = [
  {
    id: 'primary_target',
    question: "What's your primary target after graduation?",
    type: 'single',
    options: [
      { value: 'product_based', label: 'Product-based company' },
      { value: 'service_based', label: 'Service-based company' },
      { value: 'startup', label: 'Startup' },
      { value: 'higher_studies', label: 'Higher studies (MS/MTech)' },
      { value: 'government_exams', label: 'Government exams (GATE/PSU)' },
    ],
  },
  {
    id: 'urgency',
    question: 'How urgent is this for you?',
    type: 'single',
    options: [
      { value: 'long_term', label: 'I have 3+ years — I want to build deep fundamentals' },
      { value: 'steady', label: 'I have 1-2 years — steady, consistent prep' },
      { value: 'efficient', label: 'I have under a year — I need an efficient, no-fluff plan' },
      { value: 'urgent', label: "I'm placement-season now — I need to move fast" },
    ],
  },
  {
    id: 'company_type',
    question: 'What kind of company excites you more?',
    type: 'single',
    options: [
      { value: 'big_brand', label: 'Big brand names — stability and prestige matter to me' },
      { value: 'startup_growth', label: 'Fast-growing startups — I want to build and ship a lot' },
      { value: 'either', label: 'Either — I just want strong engineering fundamentals' },
      { value: 'unsure', label: 'Not sure yet — help me figure this out' },
    ],
  },
]

// --- Category 3: Learning Style ---
export const LEARNING_STYLE_QUESTIONS = [
  {
    id: 'learn_best',
    question: 'How do you learn a new concept best?',
    type: 'multi',
    options: [
      { value: 'video', label: 'Watching video explanations' },
      { value: 'reading', label: 'Reading docs/articles and going at my own pace' },
      { value: 'building', label: 'Jumping straight into building something' },
      { value: 'problems', label: 'Solving problems and learning from mistakes' },
    ],
  },
  {
    id: 'stuck_move',
    question: "When you're stuck on a problem, what's your first move?",
    type: 'single',
    options: [
      { value: 'search', label: 'Google it / search Stack Overflow' },
      { value: 'ai_tool', label: 'Ask an AI tool (ChatGPT/Claude) to explain' },
      { value: 'ask_someone', label: 'Ask a friend or senior' },
      { value: 'figure_out', label: 'Sit with it and try to figure it out myself first' },
    ],
  },
  {
    id: 'hours_per_day',
    question: 'Realistically, how much time can you give this daily?',
    type: 'single',
    options: [
      { value: '0.5', label: 'Under 1 hour' },
      { value: '1.5', label: '1-2 hours' },
      { value: '3', label: '2-4 hours' },
      { value: '5', label: '4+ hours' },
    ],
  },
  {
    id: 'study_format',
    question: "What's your ideal study format?",
    type: 'single',
    options: [
      { value: 'short_bursts', label: 'Short daily bursts, one topic at a time' },
      { value: 'deep_focus', label: 'Long deep-focus sessions, fewer days a week' },
      { value: 'flexible', label: 'Mixed — flexible based on my schedule' },
      { value: 'structured', label: 'Structured like a course, with deadlines to keep me honest' },
    ],
  },
]

// --- Category 5: Personality & Motivation ---
export const PERSONALITY_QUESTIONS = [
  {
    id: 'plan_disruption',
    question: 'When a plan gets disrupted (missed a day, fell behind), what usually happens?',
    type: 'single',
    options: [
      { value: 'quick_recover', label: 'I get back on track within a day or two' },
      { value: 'slow_recover', label: 'I lose momentum for a while but eventually restart' },
      { value: 'abandon', label: 'I tend to abandon that plan and start something new' },
      { value: 'avoid', label: 'I feel guilty and avoid it altogether' },
    ],
  },
  {
    id: 'motivation',
    question: 'What motivates you more?',
    type: 'single',
    options: [
      { value: 'competition', label: 'Competing — leaderboards, streaks, beating my past self' },
      { value: 'deadline', label: 'A clear deadline or external accountability' },
      { value: 'curiosity', label: 'Curiosity — I like understanding how things work' },
      { value: 'fomo', label: 'Fear of falling behind my peers' },
    ],
  },
  {
    id: 'failure_handling',
    question: 'How do you usually handle failure (a bad test, a rejected application)?',
    type: 'single',
    options: [
      { value: 'analyze_fast', label: 'I analyze what went wrong and adjust quickly' },
      { value: 'push_through', label: 'It affects my confidence for a bit, but I push through' },
      { value: 'need_time', label: 'I need time to process before I can try again' },
      { value: 'avoid_similar', label: 'I tend to avoid similar situations afterward' },
    ],
  },
  {
    id: 'self_description',
    question: 'Pick the sentence that sounds most like you:',
    type: 'single',
    options: [
      { value: 'figure_as_i_go', label: "\"I'll figure it out as I go.\"" },
      { value: 'need_plan', label: '"I need a clear plan before I start."' },
      { value: 'under_pressure', label: '"I work best under a bit of pressure."' },
      { value: 'need_checkins', label: '"I need someone checking in on me to stay consistent."' },
    ],
  },
]

// --- Category 4: Skill Assessment, keyed by domain id (matches config.js DOMAINS) ---
// Each question: { id, level, question, options: [{key,text}], correct }
export const SKILL_QUESTIONS_BY_DOMAIN = {
  'DSA/CP': [
    {
      id: 'dsa_1', level: 'Recognition',
      question: 'You need to store items where the most recently added item should be removed first. Which structure fits?',
      options: [{ key: 'A', text: 'Queue' }, { key: 'B', text: 'Stack' }, { key: 'C', text: 'Array' }, { key: 'D', text: 'Linked List' }],
      correct: 'B',
    },
    {
      id: 'dsa_2', level: 'Application',
      question: "You're given a sorted array and need to check if a target value exists. What's the most efficient approach?",
      options: [{ key: 'A', text: 'Loop through every element' }, { key: 'B', text: 'Binary search' }, { key: 'C', text: 'Sort it again first' }, { key: 'D', text: 'Use a hash map' }],
      correct: 'B',
    },
    {
      id: 'dsa_3', level: 'Comprehension',
      question: 'Why is O(n²) considered bad for large inputs, but fine for small ones?',
      options: [
        { key: 'A', text: "It's always bad" },
        { key: 'B', text: 'Growth rate matters more as n increases — 10 items vs 10,000 items behave very differently' },
        { key: 'C', text: 'O(n²) is actually the fastest' },
        { key: 'D', text: 'It depends only on the language used' },
      ],
      correct: 'B',
    },
    {
      id: 'dsa_4', level: 'Design thinking',
      question: 'You need fast lookups by key in your program. What is your first instinct?',
      options: [{ key: 'A', text: 'Use an array and loop through it' }, { key: 'B', text: 'Use a hash map/dictionary' }, { key: 'C', text: 'Sort the data first' }, { key: 'D', text: 'Use recursion' }],
      correct: 'B',
    },
    {
      id: 'dsa_5', level: 'Intermediate+',
      question: "Why might a recursive solution cause a 'stack overflow' error on large inputs even if the logic is correct?",
      options: [
        { key: 'A', text: 'The logic must be wrong' },
        { key: 'B', text: 'Each recursive call adds a frame to the call stack, and deep recursion can exceed its limit' },
        { key: 'C', text: 'Recursion always fails on large inputs' },
        { key: 'D', text: "It's a compiler bug" },
      ],
      correct: 'B',
    },
  ],

  'Web Development': [
    {
      id: 'web_1', level: 'Recognition',
      question: 'What does HTML primarily define on a webpage?',
      options: [{ key: 'A', text: 'Styling/colors' }, { key: 'B', text: 'Structure and content' }, { key: 'C', text: 'Server logic' }, { key: 'D', text: 'Database queries' }],
      correct: 'B',
    },
    {
      id: 'web_2', level: 'Application',
      question: 'You want a button to do something when clicked, without reloading the page. What do you reach for?',
      options: [{ key: 'A', text: 'CSS' }, { key: 'B', text: 'JavaScript event listener' }, { key: 'C', text: 'HTML alone' }, { key: 'D', text: 'A new HTML page' }],
      correct: 'B',
    },
    {
      id: 'web_3', level: 'Comprehension',
      question: 'Why do we use APIs instead of having the frontend talk directly to a database?',
      options: [
        { key: 'A', text: 'APIs are just a trend' },
        { key: 'B', text: 'Security, control over data access, and separation of concerns between frontend/backend' },
        { key: 'C', text: "Databases can't be accessed from a browser at all" },
        { key: 'D', text: "There's no real reason" },
      ],
      correct: 'B',
    },
    {
      id: 'web_4', level: 'Design thinking',
      question: 'Your webpage feels sluggish because it re-renders unnecessarily. What would you investigate first?',
      options: [
        { key: 'A', text: 'Change the font' },
        { key: 'B', text: 'Whether state updates are causing unnecessary re-renders' },
        { key: 'C', text: 'Add more CSS' },
        { key: 'D', text: 'Switch programming languages' },
      ],
      correct: 'B',
    },
    {
      id: 'web_5', level: 'Intermediate+',
      question: "What's the practical difference between localStorage and cookies for storing data in a browser?",
      options: [
        { key: 'A', text: 'No difference' },
        { key: 'B', text: 'Cookies are sent to the server with every request and can expire; localStorage stays client-side with no automatic expiry' },
        { key: 'C', text: 'localStorage is only for images' },
        { key: 'D', text: "Cookies can't store text" },
      ],
      correct: 'B',
    },
  ],

  'AI/ML': [
    {
      id: 'ai_1', level: 'Recognition',
      question: "In machine learning, what is 'training data' used for?",
      options: [{ key: 'A', text: 'Testing the final product only' }, { key: 'B', text: "Teaching the model patterns before it's evaluated" }, { key: 'C', text: 'Storing user passwords' }, { key: 'D', text: 'Speeding up the CPU' }],
      correct: 'B',
    },
    {
      id: 'ai_2', level: 'Application',
      question: 'You want a model to predict house prices from features like size and location. What type of problem is this?',
      options: [{ key: 'A', text: 'Classification' }, { key: 'B', text: 'Regression' }, { key: 'C', text: 'Clustering' }, { key: 'D', text: 'Reinforcement learning' }],
      correct: 'B',
    },
    {
      id: 'ai_3', level: 'Comprehension',
      question: 'Why do we split data into training and test sets instead of using all data to train?',
      options: [
        { key: 'A', text: 'To save disk space' },
        { key: 'B', text: 'To check if the model generalizes to unseen data, not just memorizes' },
        { key: 'C', text: "It's required by law" },
        { key: 'D', text: 'Test sets train faster' },
      ],
      correct: 'B',
    },
    {
      id: 'ai_4', level: 'Design thinking',
      question: 'Your model performs great on training data but poorly on new data. What is likely happening?',
      options: [
        { key: 'A', text: 'The model is underfitting' },
        { key: 'B', text: 'The model is overfitting — memorizing rather than generalizing' },
        { key: 'C', text: 'The computer is broken' },
        { key: 'D', text: 'This is normal and fine' },
      ],
      correct: 'B',
    },
    {
      id: 'ai_5', level: 'Intermediate+',
      question: 'Why might you choose a simpler model (like logistic regression) over a complex neural network for a small dataset?',
      options: [
        { key: 'A', text: 'Simple models are always better' },
        { key: 'B', text: 'Complex models need more data to avoid overfitting; simpler models generalize better with limited data' },
        { key: 'C', text: "Neural networks can't run on small datasets" },
        { key: 'D', text: 'There is no reason to ever choose simpler models' },
      ],
      correct: 'B',
    },
  ],

  'Cloud': [
    {
      id: 'cloud_1', level: 'Recognition',
      question: "What does 'the cloud' mean in practical terms?",
      options: [
        { key: 'A', text: 'A specific physical location' },
        { key: 'B', text: 'Renting computing resources (servers, storage) over the internet instead of owning hardware' },
        { key: 'C', text: 'A type of programming language' },
        { key: 'D', text: 'A backup CD' },
      ],
      correct: 'B',
    },
    {
      id: 'cloud_2', level: 'Application',
      question: "You've written code that works on your laptop but fails on a teammate's. What tool helps ensure consistency?",
      options: [{ key: 'A', text: 'A faster laptop' }, { key: 'B', text: 'Containerization (e.g., Docker)' }, { key: 'C', text: 'A different code editor' }, { key: 'D', text: 'Printing the code' }],
      correct: 'B',
    },
    {
      id: 'cloud_3', level: 'Comprehension',
      question: 'Why do teams use CI/CD pipelines instead of manually deploying code?',
      options: [
        { key: 'A', text: "It's more fun" },
        { key: 'B', text: 'To catch bugs early and deploy reliably/consistently without manual error' },
        { key: 'C', text: "It's required to write code at all" },
        { key: 'D', text: 'It makes code run faster' },
      ],
      correct: 'B',
    },
    {
      id: 'cloud_4', level: 'Design thinking',
      question: 'Your app needs to handle sudden traffic spikes without crashing. What approach helps?',
      options: [
        { key: 'A', text: 'Buy one very powerful server' },
        { key: 'B', text: 'Auto-scaling — adding more server instances as demand increases' },
        { key: 'C', text: 'Turn off the app during spikes' },
        { key: 'D', text: 'Reduce the number of users allowed' },
      ],
      correct: 'B',
    },
    {
      id: 'cloud_5', level: 'Intermediate+',
      question: "What's the tradeoff between using a managed cloud service (e.g., managed database) versus self-hosting your own?",
      options: [
        { key: 'A', text: 'No tradeoff, managed is always better' },
        { key: 'B', text: 'Managed services cost more but reduce operational overhead; self-hosting is cheaper but needs more maintenance expertise' },
        { key: 'C', text: 'Self-hosting is always faster' },
        { key: 'D', text: "Managed services can't be scaled" },
      ],
      correct: 'B',
    },
  ],

  'CyberSec': [
    {
      id: 'sec_1', level: 'Recognition',
      question: 'What is the purpose of a firewall?',
      options: [
        { key: 'A', text: 'To speed up internet' },
        { key: 'B', text: 'To monitor and control incoming/outgoing network traffic based on rules' },
        { key: 'C', text: 'To store passwords' },
        { key: 'D', text: 'To compress files' },
      ],
      correct: 'B',
    },
    {
      id: 'sec_2', level: 'Application',
      question: "A website form doesn't validate user input before using it in a database query. What risk does this create?",
      options: [
        { key: 'A', text: 'The page loads slower' },
        { key: 'B', text: 'SQL injection — malicious input manipulating the database' },
        { key: 'C', text: 'The website looks different' },
        { key: 'D', text: 'No real risk' },
      ],
      correct: 'B',
    },
    {
      id: 'sec_3', level: 'Comprehension',
      question: 'Why is storing passwords in plain text considered a serious security flaw?',
      options: [
        { key: 'A', text: 'It takes more storage space' },
        { key: 'B', text: 'If the database is breached, all user passwords are immediately exposed' },
        { key: 'C', text: "It's slower to check passwords" },
        { key: 'D', text: "It's not actually a problem" },
      ],
      correct: 'B',
    },
    {
      id: 'sec_4', level: 'Design thinking',
      question: "You're designing a login system. Why would you add rate-limiting on login attempts?",
      options: [
        { key: 'A', text: 'To annoy users' },
        { key: 'B', text: 'To prevent brute-force password-guessing attacks' },
        { key: 'C', text: 'To make the server faster' },
        { key: 'D', text: "It's not necessary" },
      ],
      correct: 'B',
    },
    {
      id: 'sec_5', level: 'Intermediate+',
      question: "What's the key difference between authentication and authorization?",
      options: [
        { key: 'A', text: "They're the same thing" },
        { key: 'B', text: 'Authentication verifies who you are; authorization determines what you are allowed to do' },
        { key: 'C', text: 'Authorization happens before authentication always' },
        { key: 'D', text: 'Authentication is only for admins' },
      ],
      correct: 'B',
    },
  ],

  'Mobile': [
    {
      id: 'mob_1', level: 'Recognition',
      question: "What's the main difference between a native app and a web app?",
      options: [
        { key: 'A', text: 'No difference' },
        { key: 'B', text: 'Native apps are built for a specific OS (iOS/Android) and can access device features more directly' },
        { key: 'C', text: "Web apps can't be used on phones" },
        { key: 'D', text: "Native apps don't need code" },
      ],
      correct: 'B',
    },
    {
      id: 'mob_2', level: 'Application',
      question: 'Your app needs to work on both iPhone and Android without writing two separate codebases. What is your approach?',
      options: [
        { key: 'A', text: 'Only support one platform' },
        { key: 'B', text: 'Use a cross-platform framework like React Native or Flutter' },
        { key: 'C', text: 'Ask users to use a browser instead' },
        { key: 'D', text: "It's impossible" },
      ],
      correct: 'B',
    },
    {
      id: 'mob_3', level: 'Comprehension',
      question: "Why do mobile apps need to handle 'lifecycle events' (like app going to background)?",
      options: [
        { key: 'A', text: "They don't need to" },
        { key: 'B', text: "To properly save state and free up resources when the app isn't actively in use, since mobile OSes manage memory aggressively" },
        { key: 'C', text: 'Only games need this' },
        { key: 'D', text: "It's purely for looks" },
      ],
      correct: 'B',
    },
    {
      id: 'mob_4', level: 'Design thinking',
      question: 'Your app feels slow when scrolling through a long list of items. What would you investigate?',
      options: [
        { key: 'A', text: 'The phone is too old, nothing to do' },
        { key: 'B', text: 'Whether the list is rendering all items at once instead of only visible ones (list virtualization)' },
        { key: 'C', text: 'Add more images to the list' },
        { key: 'D', text: 'Reduce screen brightness' },
      ],
      correct: 'B',
    },
    {
      id: 'mob_5', level: 'Intermediate+',
      question: 'Why is offline support (caching data locally) important for mobile apps specifically?',
      options: [
        { key: 'A', text: "It's not important" },
        { key: 'B', text: 'Mobile users frequently have unstable/no connectivity, and local caching keeps the app usable' },
        { key: 'C', text: 'Only for gaming apps' },
        { key: 'D', text: 'It makes the app file size smaller' },
      ],
      correct: 'B',
    },
  ],
}
