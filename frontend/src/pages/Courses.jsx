import React, { useState } from 'react'
import { BookOpen, ExternalLink, Filter, Clock, Star, Award, GraduationCap, Monitor, Video, FileText } from 'lucide-react'

const COURSES = {
  'DSA/CP': {
    Beginner: [
      { title: 'Data Structures & Algorithms in Python', platform: 'Udemy', url: 'https://www.udemy.com/course/data-structures-algorithms-python/', hours: 44, rating: 4.6, format: 'Video', certification: true },
      { title: 'Master the Coding Interview: Big Tech', platform: 'Udemy', url: 'https://www.udemy.com/course/master-the-coding-interview-data-structures-algorithms/', hours: 52, rating: 4.7, format: 'Video', certification: true },
      { title: 'GeeksforGeeks DSA Self-Paced', platform: 'GeeksforGeeks', url: 'https://www.geeksforgeeks.org/courses/dsa-self-paced', hours: 60, rating: 4.5, format: 'Video', certification: true },
      { title: 'LeetCode Explore: Arrays 101', platform: 'LeetCode', url: 'https://leetcode.com/explore/learn/card/arrays-101/', hours: 10, rating: 4.4, format: 'Interactive', certification: false },
    ],
    Intermediate: [
      { title: 'Grooking Algorithms', platform: 'Book', url: 'https://www.manning.com/books/grooking-algorithms', hours: 15, rating: 4.8, format: 'Book', certification: false },
      { title: 'Algorithms Specialization (Stanford)', platform: 'Coursera', url: 'https://www.coursera.org/specializations/algorithms', hours: 80, rating: 4.8, format: 'Video', certification: true },
      { title: 'Competitive Programming Essentials', platform: 'Udemy', url: 'https://www.udemy.com/course/competitive-programming-essentials/', hours: 30, rating: 4.5, format: 'Video', certification: true },
      { title: 'LeetCode Explore: DP & Graphs', platform: 'LeetCode', url: 'https://leetcode.com/explore/learn/card/dynamic-programming/', hours: 25, rating: 4.6, format: 'Interactive', certification: false },
    ],
    Advanced: [
      { title: 'Advanced Algorithms (MIT 6.006)', platform: 'MIT OCW', url: 'https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-spring-2020/', hours: 60, rating: 4.9, format: 'Video', certification: false },
      { title: 'Competitive Programming Advanced', platform: 'Codeforces', url: 'https://codeforces.com/blog/entry/57282', hours: 40, rating: 4.7, format: 'Reading', certification: false },
    ],
  },
  'Web Development': {
    Beginner: [
      { title: 'The Odin Project', platform: 'Open Source', url: 'https://www.theodinproject.com/', hours: 100, rating: 4.8, format: 'Interactive', certification: false },
      { title: 'CS50W: Web Programming', platform: 'Harvard edX', url: 'https://cs50.harvard.edu/web/2020/', hours: 60, rating: 4.8, format: 'Video', certification: true },
      { title: 'Web Development Bootcamp', platform: 'Udemy', url: 'https://www.udemy.com/course/the-web-developer-bootcamp/', hours: 62, rating: 4.7, format: 'Video', certification: true },
    ],
    Intermediate: [
      { title: 'Full Stack Open (React + Node)', platform: 'University of Helsinki', url: 'https://fullstackopen.com/en/', hours: 80, rating: 4.9, format: 'Interactive', certification: true },
      { title: 'React - The Complete Guide', platform: 'Udemy', url: 'https://www.udemy.com/course/react-the-complete-guide-incl-redux/', hours: 48, rating: 4.6, format: 'Video', certification: true },
      { title: 'Next.js & App Router', platform: 'Frontend Masters', url: 'https://frontendmasters.com/courses/next-js-app-router/', hours: 10, rating: 4.5, format: 'Video', certification: false },
    ],
    Advanced: [
      { title: 'System Design Interview', platform: 'Course', url: 'https://www.designgurus.io/course/grokking-system-design-interview', hours: 20, rating: 4.7, format: 'Reading', certification: false },
      { title: 'Microservices Architecture', platform: 'Udemy', url: 'https://www.udemy.com/course/microservices-with-node-js-and-react/', hours: 35, rating: 4.4, format: 'Video', certification: true },
    ],
  },
  'AI/ML': {
    Beginner: [
      { title: 'Machine Learning Specialization (Stanford)', platform: 'Coursera', url: 'https://www.coursera.org/specializations/machine-learning-introduction', hours: 60, rating: 4.9, format: 'Video', certification: true },
      { title: 'CS50 Introduction to AI', platform: 'Harvard edX', url: 'https://cs50.harvard.edu/ai/2020/', hours: 40, rating: 4.7, format: 'Video', certification: true },
      { title: 'Python for Data Science', platform: 'Kaggle', url: 'https://www.kaggle.com/learn-python', hours: 15, rating: 4.5, format: 'Interactive', certification: false },
    ],
    Intermediate: [
      { title: 'Deep Learning Specialization', platform: 'Coursera', url: 'https://www.coursera.org/specializations/deep-learning', hours: 80, rating: 4.8, format: 'Video', certification: true },
      { title: 'Fast.ai Practical Deep Learning', platform: 'Fast.ai', url: 'https://course.fast.ai/', hours: 50, rating: 4.7, format: 'Interactive', certification: false },
      { title: 'MLOps Specialization', platform: 'Coursera', url: 'https://www.coursera.org/specializations/mlops-machine-learning-duke', hours: 40, rating: 4.5, format: 'Video', certification: true },
    ],
    Advanced: [
      { title: 'CS224N: NLP with Deep Learning', platform: 'Stanford', url: 'https://web.stanford.edu/class/cs224n/', hours: 60, rating: 4.9, format: 'Video', certification: false },
      { title: 'Full Stack Deep Learning', platform: 'Course', url: 'https://fullstackdeeplearning.com/', hours: 30, rating: 4.6, format: 'Interactive', certification: false },
    ],
  },
  'CyberSec': {
    Beginner: [
      { title: 'Google Cybersecurity Certificate', platform: 'Coursera', url: 'https://www.coursera.org/professional-certificates/google-cybersecurity', hours: 80, rating: 4.7, format: 'Video', certification: true },
      { title: 'Introduction to Cyber Security', platform: 'TryHackMe', url: 'https://tryhackme.com/path/outline/introtocyber', hours: 20, rating: 4.8, format: 'Interactive', certification: false },
      { title: 'Cybersecurity Fundamentals', platform: 'edX IBM', url: 'https://www.edx.org/course/cybersecurity-fundamentals', hours: 30, rating: 4.5, format: 'Video', certification: true },
    ],
    Intermediate: [
      { title: 'Web Hacking 101', platform: 'TryHackMe', url: 'https://tryhackme.com/path/outline/webhacking', hours: 40, rating: 4.7, format: 'Interactive', certification: false },
      { title: 'Practical Ethical Hacking', platform: 'Udemy', url: 'https://www.udemy.com/course/practical-ethical-hacking/', hours: 25, rating: 4.6, format: 'Video', certification: true },
      { title: 'Network Security', platform: 'Coursera', url: 'https://www.coursera.org/specializations/network-security', hours: 50, rating: 4.4, format: 'Video', certification: true },
    ],
    Advanced: [
      { title: 'Advanced Penetration Testing', platform: 'SANS', url: 'https://www.sans.org/cyber-security-courses/advanced-penetration-testing/', hours: 40, rating: 4.8, format: 'Video', certification: true },
      { title: 'Binary Exploitation (Pwn)', platform: 'pwn.college', url: 'https://pwn.college/', hours: 60, rating: 4.6, format: 'Interactive', certification: false },
    ],
  },
  'Mobile': {
    Beginner: [
      { title: 'Android Development with Kotlin', platform: 'Google', url: 'https://developer.android.com/courses', hours: 50, rating: 4.5, format: 'Interactive', certification: true },
      { title: 'iOS App Development with Swift', platform: 'Stanford', url: 'https://cs193p.sites.stanford.edu/', hours: 40, rating: 4.7, format: 'Video', certification: false },
      { title: 'React Native - The Practical Guide', platform: 'Udemy', url: 'https://www.udemy.com/course/react-native-the-practical-guide/', hours: 35, rating: 4.6, format: 'Video', certification: true },
    ],
    Intermediate: [
      { title: 'Flutter & Dart - Complete Guide', platform: 'Udemy', url: 'https://www.udemy.com/course/learn-flutter-dart-to-build-ios-android-apps/', hours: 40, rating: 4.5, format: 'Video', certification: true },
      { title: 'Android Advanced Concepts', platform: 'Coursera', url: 'https://www.coursera.org/specializations/android-app-development', hours: 30, rating: 4.3, format: 'Video', certification: true },
    ],
    Advanced: [
      { title: 'iOS Advanced (SwiftUI + Combine)', platform: 'Kodeco', url: 'https://www.kodeco.com/ios', hours: 25, rating: 4.5, format: 'Video', certification: false },
    ],
  },
  'Cloud': {
    Beginner: [
      { title: 'AWS Cloud Practitioner Essentials', platform: 'AWS', url: 'https://aws.amazon.com/training/learn-about/cloud-practitioner/', hours: 6, rating: 4.6, format: 'Video', certification: true },
      { title: 'Google Cloud Digital Leader', platform: 'Google', url: 'https://cloud.google.com/learn/certification/cloud-digital-leader', hours: 10, rating: 4.4, format: 'Video', certification: true },
      { title: 'Docker for Beginners', platform: 'Udemy', url: 'https://www.udemy.com/course/docker-for-beginners/', hours: 12, rating: 4.5, format: 'Video', certification: false },
    ],
    Intermediate: [
      { title: 'AWS Solutions Architect Associate', platform: 'Udemy', url: 'https://www.udemy.com/course/aws-certified-solutions-architect-associate-saa-c03/', hours: 40, rating: 4.7, format: 'Video', certification: true },
      { title: 'Kubernetes for Developers', platform: 'Coursera', url: 'https://www.coursera.org/specializations/kubernetes-development', hours: 25, rating: 4.5, format: 'Video', certification: true },
      { title: 'Terraform Associate', platform: 'HashiCorp', url: 'https://developer.hashicorp.com/terraform/tutorials/certification', hours: 20, rating: 4.5, format: 'Reading', certification: true },
    ],
    Advanced: [
      { title: 'AWS DevOps Engineer Professional', platform: 'A Cloud Guru', url: 'https://learn.acloud.guru/course/aws-devops-engineer-professional', hours: 30, rating: 4.6, format: 'Video', certification: true },
      { title: 'Cloud Architecture - Advanced', platform: 'Google Cloud Skills', url: 'https://cloud.google.com/learn/certification/cloud-architect', hours: 40, rating: 4.5, format: 'Video', certification: true },
    ],
  },
}

const FORMAT_ICONS = { Video: Video, Book: FileText, Interactive: Monitor, Reading: FileText }

const DOMAIN_TO_COURSE_KEY = {
  'DSA/CP': 'DSA/CP', 'Web Development': 'Web Development', 'AI/ML': 'AI/ML',
  'Cloud': 'Cloud', 'CyberSec': 'CyberSec', 'Mobile': 'Mobile',
}

function Courses({ profile, analysis }) {
  const domain = profile?.domain_interest?.[0] || 'DSA/CP'
  const skillLevel = analysis?.skill_profile?.level || 'Beginner'
  const careerGoal = profile?.career_goal || 'Placement'
  const weakAreas = analysis?.skill_profile?.weak_areas || []

  const [formatFilter, setFormatFilter] = useState('All')

  const courseKey = DOMAIN_TO_COURSE_KEY[domain] || 'DSA/CP'
  const domainCourses = COURSES[courseKey] || COURSES['DSA/CP']

  const levels = ['Beginner', 'Intermediate', 'Advanced']
  const startIdx = levels.indexOf(skillLevel)
  const relevantLevels = levels.slice(Math.max(0, startIdx), startIdx + 2)

  return (
    <div className="min-h-screen bg-mist p-6 md:p-8 font-sans text-ink">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="theme-card bg-paper p-6 border border-gray-200/60 shadow-sm">
          <div className="flex items-center gap-3 mb-1">
            <BookOpen className="h-6 w-6 text-signal" />
            <div>
              <h1 className="text-xl font-display font-extrabold text-ink">Course Recommendations</h1>
              <p className="text-xs text-slate mt-0.5">Curated for {domain} · Level: {skillLevel} · Goal: {careerGoal}</p>
            </div>
          </div>

          {weakAreas.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-mist">
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-600 border border-amber-200">Gaps: {weakAreas.join(', ')}</span>
            </div>
          )}

          <div className="flex items-center gap-2 mt-4 pt-4 border-t border-mist">
            <Filter className="h-3.5 w-3.5 text-slate" />
            <span className="text-[10px] font-bold text-slate uppercase tracking-wider mr-1">Format</span>
            {['All', 'Video', 'Interactive', 'Reading', 'Book'].map((f) => (
              <button
                key={f}
                onClick={() => setFormatFilter(f)}
                className={`text-[10px] font-bold px-2.5 py-1 rounded-full border transition-all cursor-pointer ${
                  formatFilter === f
                    ? 'bg-signal text-white border-signal'
                    : 'bg-paper text-slate border-mist hover:border-signal/30'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {relevantLevels.map((level) => {
          const courses = domainCourses[level]
          if (!courses) return null

          const filtered = formatFilter === 'All' ? courses : courses.filter((c) => c.format === formatFilter)
          if (filtered.length === 0) return null

          return (
            <div key={level}>
              <div className="flex items-center gap-2 mb-3">
                <Award className={`h-4 w-4 ${level === 'Beginner' ? 'text-emerald-500' : level === 'Intermediate' ? 'text-amber-500' : 'text-red-500'}`} />
                <span className={`text-xs font-bold uppercase tracking-wider ${
                  level === 'Beginner' ? 'text-emerald-600' : level === 'Intermediate' ? 'text-amber-600' : 'text-red-600'
                }`}>{level}</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                {filtered.map((course, i) => {
                  const FormatIcon = FORMAT_ICONS[course.format] || Video
                  return (
                    <div key={i} className="theme-card bg-paper p-5 border border-gray-200/60 shadow-sm hover:border-signal/25 transition-all">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-2 flex-1 min-w-0">
                          <h3 className="text-sm font-display font-bold text-ink leading-snug">{course.title}</h3>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-mist text-slate border border-mist">{course.platform}</span>
                            <span className="flex items-center gap-1 text-[10px] font-medium text-amber-600">
                              <Star className="h-3 w-3 fill-current" /> {course.rating}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-3 text-[10px] text-slate">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" /> {course.hours}h
                            </span>
                            <span className="flex items-center gap-1">
                              <FormatIcon className="h-3 w-3" /> {course.format}
                            </span>
                            {course.certification && (
                              <span className="flex items-center gap-1 font-bold text-signal">
                                <GraduationCap className="h-3 w-3" /> Certificate
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <a
                        href={course.url}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-4 w-full py-2 rounded-full border border-signal text-signal hover:bg-signal-tint text-center text-[10px] font-bold transition-all flex items-center justify-center gap-1.5"
                      >
                        Go to Course
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}

        {relevantLevels.every((l) => {
          const courses = domainCourses[l]
          if (!courses) return true
          const filtered = formatFilter === 'All' ? courses : courses.filter((c) => c.format === formatFilter)
          return filtered.length === 0
        }) && (
          <div className="text-center py-12 text-slate text-sm font-semibold">
            No courses found for the selected filter.
          </div>
        )}
      </div>
    </div>
  )
}

export default Courses
