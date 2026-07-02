import React, { useState } from 'react'
import { CheckCircle2, Circle, Code2, TrendingUp, AlertCircle } from 'lucide-react'

const TOPICS_BY_LEVEL = {
  Beginner: {
    'Arrays & Hashing': ['Two Sum', 'Contains Duplicate', 'Valid Anagram', 'Best Time to Buy Stock', 'Product of Array Except Self'],
    'Strings': ['Valid Palindrome', 'Valid Parentheses', 'Reverse String', 'First Unique Character', 'Longest Common Prefix'],
    'Linked Lists': ['Reverse Linked List', 'Merge Two Sorted Lists', 'Middle of Linked List', 'Remove Duplicates', 'Linked List Cycle'],
    'Searching & Sorting': ['Binary Search', 'First Bad Version', 'Merge Sorted Array', 'Selection/Bubble Sort'],
    'Recursion': ['Fibonacci', 'Factorial', 'Power of Two', 'Reverse String via Recursion'],
  },
  Intermediate: {
    'Trees': ['Invert Binary Tree', 'Maximum Depth', 'Same Tree', 'Level Order Traversal', 'Validate BST'],
    'Graphs': ['Number of Islands', 'Clone Graph', 'Course Schedule', 'Pacific Atlantic Water Flow'],
    'Dynamic Programming': ['Climbing Stairs', 'Coin Change', 'Longest Increasing Subsequence', 'House Robber', '0/1 Knapsack'],
    'Heaps & Priority Queues': ['Kth Largest Element', 'Top K Frequent Elements', 'Merge K Sorted Lists'],
    'Sliding Window': ['Maximum Subarray', 'Longest Substring Without Repeat', 'Minimum Window Substring'],
  },
  Advanced: {
    'Advanced DP': ['Edit Distance', 'Longest Palindromic Substring', 'Burst Balloons', 'Word Break II', 'Regular Expression Matching'],
    'Advanced Graphs': ['Word Ladder II', 'Alien Dictionary', 'Cheapest Flights Within K Stops'],
    'Segment Trees & Tries': ['Range Sum Query', 'Implement Trie', 'Word Search II', 'Design Add and Search Words'],
    'System Design': ['Design LRU Cache', 'Design Twitter', 'Design HashMap', 'Serialize and Deserialize Binary Tree'],
  },
}

const DIFFICULTY_MAP = {
  Beginner: { label: 'Beginner', color: 'bg-emerald-500/10 text-emerald-600' },
  Intermediate: { label: 'Medium', color: 'bg-amber-500/10 text-amber-600' },
  Advanced: { label: 'Advanced', color: 'bg-red-500/10 text-red-600' },
}

function DSA({ profile, analysis }) {
  const skillLevel = analysis?.skill_profile?.level || 'Beginner'
  const weakAreas = analysis?.skill_profile?.weak_areas || []
  const careerGoal = profile?.career_goal || 'Placement'

  const levels = ['Beginner', 'Intermediate', 'Advanced']
  const currentLevelIdx = levels.indexOf(skillLevel) >= 0 ? levels.indexOf(skillLevel) : 0

  const [completed, setCompleted] = useState({})
  const [expandedLevel, setExpandedLevel] = useState(skillLevel)

  const toggleTopic = (level, topic, problem) => {
    const key = `${level}::${topic}::${problem}`
    setCompleted((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const relevantLevels = levels.slice(0, currentLevelIdx + 2)

  const allTopics = relevantLevels.flatMap((l) => Object.keys(TOPICS_BY_LEVEL[l] || {}))
  const weakTopicMatches = allTopics.filter((t) =>
    weakAreas.some((w) => t.toLowerCase().includes(w.toLowerCase()))
  )

  return (
    <div className="min-h-screen bg-mist p-6 md:p-8 font-sans text-ink">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="theme-card bg-paper p-6 border border-gray-200/60 shadow-sm">
          <div className="flex items-center gap-3 mb-1">
            <Code2 className="h-6 w-6 text-signal" />
            <div>
              <h1 className="text-xl font-display font-extrabold text-ink">DSA Practice</h1>
              <p className="text-xs text-slate mt-0.5">Topic-wise problems · Level: {skillLevel} · Goal: {careerGoal}</p>
            </div>
          </div>

          {weakAreas.length > 0 && (
            <div className="mt-4 p-3 rounded-xl border border-amber-200 bg-amber-50 flex items-start gap-2.5">
              <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <span className="text-xs font-bold text-amber-700">Focus Areas from Assessment</span>
                <p className="text-[11px] text-amber-600 mt-0.5">Prioritise these topics: {weakAreas.join(', ')}</p>
              </div>
            </div>
          )}
        </div>

        {relevantLevels.map((level) => {
          const topics = TOPICS_BY_LEVEL[level]
          if (!topics) return null
          const diff = DIFFICULTY_MAP[level]
          const topicEntries = Object.entries(topics)

          const levelTotal = topicEntries.reduce((sum, [, probs]) => sum + probs.length, 0)
          const levelDone = topicEntries.reduce((sum, [topic, probs]) =>
            sum + probs.filter((p) => completed[`${level}::${topic}::${p}`]).length, 0
          )
          const isExpanded = expandedLevel === level

          return (
            <div key={level} className="theme-card bg-paper border border-gray-200/60 shadow-sm overflow-hidden">
              <button
                onClick={() => setExpandedLevel(isExpanded ? null : level)}
                className="w-full flex items-center justify-between p-5 cursor-pointer hover:bg-mist/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <TrendingUp className={`h-5 w-5 ${isExpanded ? 'text-signal' : 'text-slate'}`} />
                  <div className="text-left">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${diff.color}`}>{diff.label}</span>
                    <span className="text-xs text-slate ml-2">{levelTotal} problems</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-bold text-slate">{levelDone}/{levelTotal} done</span>
                  <div className="w-20 h-1.5 bg-mist rounded-full overflow-hidden">
                    <div
                      className="h-full bg-signal rounded-full transition-all"
                      style={{ width: `${levelTotal ? (levelDone / levelTotal) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              </button>

              {isExpanded && (
                <div className="px-5 pb-5 space-y-4 border-t border-mist pt-4">
                  {weakTopicMatches.length > 0 && level === skillLevel && (
                    <div className="p-3 rounded-xl border border-signal/10 bg-signal-tint">
                      <span className="text-[10px] font-bold text-signal uppercase tracking-wider">Recommended focus</span>
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {weakTopicMatches.map((t) => (
                          <span key={t} className="text-[10px] font-bold px-2 py-0.5 rounded bg-signal text-white">{t}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {topicEntries.map(([topic, problems]) => {
                    const topicDone = problems.filter((p) => completed[`${level}::${topic}::${p}`]).length
                    return (
                      <div key={topic}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-ink">{topic}</span>
                          <span className="text-[10px] font-medium text-slate">{topicDone}/{problems.length}</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                          {problems.map((problem) => {
                            const key = `${level}::${topic}::${problem}`
                            const done = completed[key]
                            return (
                              <button
                                key={key}
                                onClick={() => toggleTopic(level, topic, problem)}
                                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-left transition-all cursor-pointer ${
                                  done
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : 'bg-mist text-slate hover:bg-signal-tint hover:text-signal border border-transparent'
                                }`}
                              >
                                {done ? (
                                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
                                ) : (
                                  <Circle className="h-3.5 w-3.5 text-slate flex-shrink-0" />
                                )}
                                <span className={done ? 'line-through opacity-70' : ''}>{problem}</span>
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default DSA
