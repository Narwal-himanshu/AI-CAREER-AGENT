import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'

// ---------------------------------------------------------------------------
// Central Firestore-backed user document.
// Path: users/{uid}
// Shape:
// {
//   email, createdAt,
//   profile: { name, age, branch, college, year, domain_interest, career_goal, cgpa, college_tier, hours_per_day, preferred_style },
//   streak: { current, longest, lastLoginDate },
//   analysis: <last quiz analysis object, or null>,
//   quizProfilePayload: <payload sent alongside quiz answers, or null>
// }
// ---------------------------------------------------------------------------

const todayStr = () => new Date().toISOString().slice(0, 10) // YYYY-MM-DD

const emptyProfile = () => ({
  name: '',
  age: '',
  branch: '',
  college: '',
  year: '',
  domain_interest: [],
  career_goal: '',
  cgpa: '',
  college_tier: '',
  hours_per_day: '',
  preferred_style: []
})

function computeStreakUpdate(existingStreak) {
  const today = todayStr()
  const prev = existingStreak || { current: 0, longest: 0, lastLoginDate: null }

  if (prev.lastLoginDate === today) {
    // Already recorded today, no change
    return prev
  }

  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  let current = 1
  if (prev.lastLoginDate === yesterday) {
    current = (prev.current || 0) + 1
  }
  const longest = Math.max(current, prev.longest || 0)

  return { current, longest, lastLoginDate: today }
}

/**
 * Called on every successful auth resolution. Creates the user doc if missing,
 * and updates the login streak. Returns the fresh user doc.
 */
export async function ensureUserAndRecordLogin(uid, email) {
  const ref = doc(db, 'users', uid)
  const snap = await getDoc(ref)

  if (!snap.exists()) {
    const fresh = {
      email: email || '',
      createdAt: serverTimestamp(),
      profile: emptyProfile(),
      streak: { current: 1, longest: 1, lastLoginDate: todayStr() },
      analysis: null,
      quizProfilePayload: null
    }
    await setDoc(ref, fresh)
    return { ...fresh, createdAt: new Date() }
  }

  const existing = snap.data()
  const streak = computeStreakUpdate(existing.streak)
  if (streak !== existing.streak) {
    await setDoc(ref, { streak }, { merge: true })
  }
  return { ...existing, streak }
}

/** Merge-save profile fields (name, age, branch, interests, goal, etc.) */
export async function saveUserProfile(uid, profileFields) {
  const ref = doc(db, 'users', uid)
  await setDoc(ref, { profile: profileFields }, { merge: true })
}

/** Persist the latest quiz analysis + the payload used to generate it */
export async function saveQuizResult(uid, quizProfilePayload, analysis) {
  const ref = doc(db, 'users', uid)
  await setDoc(ref, { quizProfilePayload, analysis }, { merge: true })
}

export async function getUserDoc(uid) {
  const ref = doc(db, 'users', uid)
  const snap = await getDoc(ref)
  return snap.exists() ? snap.data() : null
}

/**
 * Readiness / completion score shown on the marketing hero ring.
 * - Guest (no account): 0
 * - Logged in, empty profile: 25
 * - +15 for each of: name, age, branch (course), domain_interest, career_goal
 * Caps at 100.
 */
export function computeReadinessScore(userDoc) {
  if (!userDoc) return 0

  let score = 25
  const p = userDoc.profile || {}
  const filledChecks = [
    !!p.name,
    !!p.age,
    !!p.branch,
    Array.isArray(p.domain_interest) && p.domain_interest.length > 0,
    !!p.career_goal
  ]
  const filled = filledChecks.filter(Boolean).length
  score += filled * 15
  return Math.min(100, score)
}

export function computeReadinessLabel(userDoc) {
  if (!userDoc) return 'Log in to calculate your Readiness Score'
  const score = computeReadinessScore(userDoc)
  if (score >= 100) return 'Profile complete — great job!'
  if (score >= 70) return 'Almost there — finish your profile'
  if (score > 25) return 'Keep going — complete your profile'
  return 'Account created — set up your profile'
}

export function isProfileComplete(userDoc) {
  return computeReadinessScore(userDoc) >= 100
}
