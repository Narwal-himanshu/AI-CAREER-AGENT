import { SKILL_QUESTIONS_BY_DOMAIN } from './questions'

function levelFromScore(score) {
  if (score >= 80) return 'Advanced'
  if (score >= 45) return 'Intermediate'
  return 'Beginner'
}

// Personality/career answers nudge the risk narrative without needing an
// if-else ladder — each answer value maps to a small weight + optional note.
const RESILIENCE_WEIGHTS = {
  quick_recover: 1, slow_recover: 0.5, abandon: -0.5, avoid: -1,
}
const URGENCY_MONTHS_AVAILABLE = {
  long_term: 36, steady: 18, efficient: 10, urgent: 3,
}
const MOTIVATION_QUICK_WIN = {
  competition: 'Start a daily streak — try to beat your best run this week',
  deadline: 'Block out 3 fixed study sessions this week with a hard deadline for each',
  curiosity: 'Pick one topic from your weak areas and go one level deeper than required',
  fomo: 'Compare your progress against last week\u2019s, not against other people',
}

/**
 * Evaluates the full 5-category assessment locally (no backend call, matching
 * the existing architecture) and returns an object with the exact shape
 * Dashboard.jsx already expects: { skill_profile, summary, risk_report }.
 *
 * @param {object} formData - all onboarding + career/learning/personality answers
 * @param {object} skillAnswers - { [question_id]: selectedKey }
 */
export function evaluateAssessment(formData, skillAnswers) {
  const selectedDomains = formData.domain_interest?.length ? formData.domain_interest : ['DSA/CP']

  // --- Skill Assessment scoring, per selected domain ---
  const category_scores = {}
  const weak_areas = []
  let totalCorrect = 0
  let totalQuestions = 0

  selectedDomains.forEach((domain) => {
    const questions = SKILL_QUESTIONS_BY_DOMAIN[domain] || []
    let correct = 0
    questions.forEach((q) => {
      totalQuestions += 1
      if (skillAnswers[q.id] === q.correct) {
        correct += 1
        totalCorrect += 1
      }
    })
    const pct = questions.length ? Math.round((correct / questions.length) * 100) : 0
    category_scores[domain] = pct
    if (pct < 60) weak_areas.push(domain)
  })

  if (weak_areas.length === 0) weak_areas.push('Advanced Problem Solving')

  const overall_score = totalQuestions ? Math.round((totalCorrect / totalQuestions) * 100) : 0
  const level = levelFromScore(overall_score)

  // --- Personality-informed risk modifiers ---
  const resilience = RESILIENCE_WEIGHTS[formData.plan_disruption] ?? 0
  const riskAdjustedScore = Math.max(0, Math.min(100, overall_score + resilience * 8))
  const overall_risk_level =
    riskAdjustedScore >= 80 ? 'Low' : riskAdjustedScore >= 50 ? 'Medium' : riskAdjustedScore >= 30 ? 'High' : 'Critical'

  // --- Timeline math: urgency answer -> months available, hours/day -> pace ---
  const monthsAvailable = URGENCY_MONTHS_AVAILABLE[formData.urgency] ?? Math.max(1, (5 - (formData.year || 3)) * 6)
  const hoursPerDay = Number(formData.hours_per_day) || 2
  const baseMonthsNeeded = overall_score >= 80 ? 2 : overall_score >= 50 ? 4 : 8
  // Less daily time available stretches the timeline a bit; low resilience does too.
  const paceFactor = hoursPerDay < 1.5 ? 1.4 : hoursPerDay < 2.5 ? 1.15 : 1
  const resilienceFactor = resilience < 0 ? 1.2 : 1
  const monthsNeeded = Math.max(1, Math.round(baseMonthsNeeded * paceFactor * resilienceFactor))

  const goal = formData.career_goal || formData.primary_target || 'Placement'
  const name = formData.name || 'Student'

  // --- Personalized quick wins: one from weakest domain, one motivation-shaped, one generic ---
  const motivationWin = MOTIVATION_QUICK_WIN[formData.motivation] || 'Review your last 3 wrong answers and note the pattern'
  const quick_wins = [
    `Revise ${weak_areas[0]} fundamentals this week`,
    motivationWin,
    'Solve a handful of easy problems daily in your weakest domain',
  ]

  const red_flags = []
  if (overall_score < 30) red_flags.push('Overall readiness score is critically low for your target timeline.')
  if (resilience < 0) red_flags.push('Assessment answers suggest plans tend to get abandoned after a disruption — a lightweight accountability system is recommended.')

  return {
    skill_profile: {
      level,
      overall_score,
      classification_reason: `Based on ${totalCorrect} of ${totalQuestions} correct answers across ${selectedDomains.join(', ')}.`,
      classifier_version: 'local-v2',
      confidence: 0.8,
      category_scores,
      weak_areas,
    },
    summary: {
      summary_text: `${name}, you're currently classified at the ${level} level with an overall readiness score of ${overall_score}%. Focus on ${weak_areas[0]} next to keep improving toward your ${goal} goal.`,
      focus_areas: weak_areas.slice(0, 3),
      recommended_next_step: `Spend the next 2 weeks reinforcing ${weak_areas[0]}, then retake the assessment to track progress.`,
      estimated_placement_readiness: `${monthsNeeded} months`,
    },
    risk_report: {
      overall_risk_level,
      timeline_risk: {
        reason: overall_score >= 70
          ? 'You are on track for your target timeline based on current performance.'
          : 'Your current pace suggests you should increase practice hours to stay on schedule.',
        months_needed: monthsNeeded,
        months_available: monthsAvailable,
      },
      quick_wins,
      skill_gaps: weak_areas.map((area) => ({
        area,
        description: `Diagnostic answers indicate a gap in ${area}. Dedicated practice is recommended.`,
        severity: overall_score < 40 ? 'Critical' : overall_score < 60 ? 'High' : 'Medium',
        fix_timeline_weeks: overall_score < 40 ? 4 : 2,
      })),
      red_flags,
      strategic_risks: [
        {
          risk: 'Limited hands-on project experience can weaken your resume.',
          mitigation: 'Build 1-2 full-stack or domain-specific projects and publish them on GitHub.',
        },
      ],
    },
  }
}
