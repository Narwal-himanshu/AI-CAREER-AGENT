// Static, locally-evaluated 5-question diagnostic quiz.
// This replaces the AI-agent-generated quiz for now so the assessment
// always works, even with the backend offline.

export const QUIZ_QUESTIONS = [
  {
    question_id: 'q1',
    topic: 'Data Structures & Algorithms',
    category: 'dsa',
    difficulty: 'Easy',
    estimated_time_seconds: 45,
    question_text: 'What is the time complexity of binary search on a sorted array of n elements?',
    options: { A: 'O(n)', B: 'O(log n)', C: 'O(n log n)', D: 'O(1)' },
    correct_option: 'B'
  },
  {
    question_id: 'q2',
    topic: 'Data Structures & Algorithms',
    category: 'dsa',
    difficulty: 'Medium',
    estimated_time_seconds: 60,
    question_text: 'Which data structure uses LIFO (Last In, First Out) ordering?',
    options: { A: 'Queue', B: 'Linked List', C: 'Stack', D: 'Graph' },
    correct_option: 'C'
  },
  {
    question_id: 'q3',
    topic: 'Programming Fundamentals',
    category: 'programming',
    difficulty: 'Easy',
    estimated_time_seconds: 45,
    question_text: 'In most object-oriented languages, which keyword is used to create a new object instance?',
    options: { A: 'new', B: 'create', C: 'instance', D: 'object' },
    correct_option: 'A'
  },
  {
    question_id: 'q4',
    topic: 'Logical & Analytics',
    category: 'logic',
    difficulty: 'Medium',
    estimated_time_seconds: 60,
    question_text: 'If all Bloops are Razzies and all Razzies are Lazzies, which statement must be true?',
    options: {
      A: 'All Lazzies are Bloops',
      B: 'All Bloops are Lazzies',
      C: 'No Bloops are Lazzies',
      D: 'All Razzies are Bloops'
    },
    correct_option: 'B'
  },
  {
    question_id: 'q5',
    topic: 'Domain Specific',
    category: 'domain_specific',
    difficulty: 'Medium',
    estimated_time_seconds: 60,
    question_text: 'Which HTTP method is generally used to update an existing resource in a REST API?',
    options: { A: 'GET', B: 'POST', C: 'PUT', D: 'DELETE' },
    correct_option: 'C'
  }
]

const CATEGORIES = ['dsa', 'programming', 'logic', 'domain_specific']

function levelFromScore(score) {
  if (score >= 80) return 'Advanced'
  if (score >= 45) return 'Intermediate'
  return 'Beginner'
}

/**
 * Evaluates a completed quiz session locally (no backend call).
 * `quizAnswers` = [{ question_id, selected_option, topic, category, ... }]
 * Returns an analysis object matching what Dashboard.jsx expects.
 */
export function evaluateQuizLocally(profilePayload, quizAnswers) {
  const byId = Object.fromEntries(QUIZ_QUESTIONS.map((q) => [q.question_id, q]))

  const categoryTotals = { dsa: 0, programming: 0, logic: 0, domain_specific: 0 }
  const categoryCorrect = { dsa: 0, programming: 0, logic: 0, domain_specific: 0 }
  const wrongTopics = []
  let correctCount = 0

  quizAnswers.forEach((ans) => {
    const q = byId[ans.question_id]
    if (!q) return
    categoryTotals[q.category] += 1
    const isCorrect = ans.selected_option === q.correct_option
    if (isCorrect) {
      correctCount += 1
      categoryCorrect[q.category] += 1
    } else {
      wrongTopics.push(q.topic)
    }
  })

  const overall_score = Math.round((correctCount / QUIZ_QUESTIONS.length) * 100)
  const level = levelFromScore(overall_score)

  const category_scores = {}
  CATEGORIES.forEach((cat) => {
    category_scores[cat] = categoryTotals[cat] > 0
      ? Math.round((categoryCorrect[cat] / categoryTotals[cat]) * 100)
      : 0
  })

  const weak_areas = [...new Set(wrongTopics)]
  if (weak_areas.length === 0) weak_areas.push('Advanced Problem Solving')

  const goal = profilePayload?.career_goal || 'Placement'
  const name = profilePayload?.profile?.name || 'Student'

  const overall_risk_level =
    overall_score >= 80 ? 'Low' : overall_score >= 50 ? 'Medium' : overall_score >= 30 ? 'High' : 'Critical'

  const monthsAvailable = Math.max(1, (5 - (profilePayload?.profile?.year || 3)) * 6)
  const monthsNeeded = overall_score >= 80 ? 2 : overall_score >= 50 ? 4 : 8

  return {
    skill_profile: {
      level,
      overall_score,
      classification_reason: `Based on ${correctCount} of ${QUIZ_QUESTIONS.length} correct answers across DSA, programming, logic, and domain-specific questions.`,
      classifier_version: 'local-v1',
      confidence: 0.75,
      category_scores,
      weak_areas
    },
    summary: {
      summary_text: `${name}, you're currently classified at the ${level} level with an overall readiness score of ${overall_score}%. Focus on ${weak_areas[0]} next to keep improving toward your ${goal} goal.`,
      focus_areas: weak_areas.slice(0, 3),
      recommended_next_step: `Spend the next 2 weeks reinforcing ${weak_areas[0]}, then retake the assessment to track progress.`,
      estimated_placement_readiness: `${monthsNeeded} months`
    },
    risk_report: {
      overall_risk_level,
      timeline_risk: {
        reason: overall_score >= 70
          ? 'You are on track for your target timeline based on current performance.'
          : 'Your current pace suggests you should increase practice hours to stay on schedule.',
        months_needed: monthsNeeded,
        months_available: monthsAvailable
      },
      quick_wins: [
        `Revise ${weak_areas[0]} fundamentals this week`,
        'Solve 5 easy problems daily on your weakest topic',
        'Review your last 3 wrong answers and note the pattern'
      ],
      skill_gaps: weak_areas.map((area) => ({
        area,
        description: `Diagnostic answers indicate a gap in ${area}. Dedicated practice is recommended.`,
        severity: overall_score < 40 ? 'Critical' : overall_score < 60 ? 'High' : 'Medium',
        fix_timeline_weeks: overall_score < 40 ? 4 : 2
      })),
      red_flags: overall_score < 30 ? ['Overall readiness score is critically low for your target timeline.'] : [],
      strategic_risks: [
        {
          risk: 'Limited hands-on project experience can weaken your resume.',
          mitigation: 'Build 1-2 full-stack or domain-specific projects and publish them on GitHub.'
        }
      ]
    }
  }
}
