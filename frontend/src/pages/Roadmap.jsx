import React, { useState } from 'react'
import { Milestone, CheckCircle2, Circle, Target, Calendar, BookOpen, Briefcase, GraduationCap, ArrowRight } from 'lucide-react'

const ROADMAPS = {
  Placement: {
    'DSA/CP': [
      { sem: 'Current Sem', tasks: ['Build fundamentals: Arrays, Strings, Linked Lists, Recursion', 'Solve 50 easy problems on LeetCode', 'Learn time & space complexity analysis', 'Practice sorting & searching algorithms'], icon: BookOpen },
      { sem: 'Next Sem', tasks: ['Master Trees, Graphs, Dynamic Programming', 'Solve 100 medium problems on LeetCode', 'Participate in weekly contests', 'Start CS Fundamentals: OS, DBMS, Networks'], icon: Target },
      { sem: 'Prep Sem', tasks: ['System Design basics for interviews', 'Solve company-specific previous year questions', 'Build 2 full-stack projects for resume', 'Aptitude & verbal preparation'], icon: Briefcase },
      { sem: 'Placement Season', tasks: ['Revise all core topics from notes', 'Give mock interviews weekly', 'Apply through campus placements & off-campus', 'Negotiate offers and finalise'], icon: GraduationCap },
    ],
    'Web Development': [
      { sem: 'Current Sem', tasks: ['HTML/CSS/JavaScript fundamentals', 'Build 3 static websites', 'Learn Git & GitHub', 'Understand DOM manipulation & Fetch API'], icon: BookOpen },
      { sem: 'Next Sem', tasks: ['Learn React.js or Next.js', 'Build a full-stack app with Node.js + DB', 'Deploy on Vercel/Render', 'Contribute to open-source'], icon: Target },
      { sem: 'Prep Sem', tasks: ['System Design for frontend & backend', 'Build a portfolio with 2-3 live projects', 'Practice DSA (medium level)', 'Start applying for internships'], icon: Briefcase },
      { sem: 'Placement Season', tasks: ['Revise CS fundamentals & projects', 'Give mock interviews', 'Apply through campus & off-campus drives', 'Finalise offer'], icon: GraduationCap },
    ],
    'AI/ML': [
      { sem: 'Current Sem', tasks: ['Linear Algebra & Statistics review', 'Learn Python for ML (NumPy, Pandas, Matplotlib)', 'Complete Kaggle beginner courses', 'Build first regression model'], icon: BookOpen },
      { sem: 'Next Sem', tasks: ['Supervised & Unsupervised learning algorithms', 'Learn Scikit-learn, TensorFlow basics', 'Do 2 Kaggle competitions', 'Build an end-to-end ML project'], icon: Target },
      { sem: 'Prep Sem', tasks: ['Deep Learning with CNNs, RNNs, Transformers', 'Learn deployment: Flask/FastAPI, Docker', 'Read 10 ML research papers', 'Build portfolio with 3 projects'], icon: Briefcase },
      { sem: 'Placement Season', tasks: ['Revise ML theory & project details', 'Mock interviews for ML roles', 'Apply for AI/ML roles', 'Finalise offer'], icon: GraduationCap },
    ],
    CyberSec: [
      { sem: 'Current Sem', tasks: ['Computer Networks & OS fundamentals', 'Learn Linux command line & scripting', 'Set up a home lab with VirtualBox', 'Understand OWASP Top 10'], icon: BookOpen },
      { sem: 'Next Sem', tasks: ['Web security: XSS, SQLi, CSRF', 'Learn network scanning with Nmap & Wireshark', 'Practice on TryHackMe/HackTheBox', 'Start cryptography basics'], icon: Target },
      { sem: 'Prep Sem', tasks: ['Binary exploitation & reverse engineering', 'Get certifications: CEH or CompTIA Security+', 'Write security research blog posts', 'Build a security tool project'], icon: Briefcase },
      { sem: 'Placement Season', tasks: ['Revise security concepts & tools', 'Practice interview questions', 'Apply for security analyst/engineer roles', 'Finalise offer'], icon: GraduationCap },
    ],
  },
  GATE: {
    default: [
      { sem: 'Current Sem', tasks: ['Complete GATE syllabus for Mathematics', 'Study Aptitude & Verbal Ability', 'Start core subjects: DS, Algorithms, CO, OS', 'Solve previous year GATE papers'], icon: BookOpen },
      { sem: 'Next Sem', tasks: ['Complete remaining core subjects', 'Solve topic-wise question banks', 'Join test series for mock tests', 'Revise weak topics identified'], icon: Target },
      { sem: 'Revision', tasks: ['Full-length mock tests every weekend', 'Analyze mistakes & improve speed', 'Revise all formulas & key concepts', 'Focus on time management'], icon: Briefcase },
      { sem: 'Exam Season', tasks: ['Give GATE exam', 'Apply for PSUs accepting GATE scores', 'Prepare for interviews (if shortlisted)', 'Plan for M.Tech or direct jobs'], icon: GraduationCap },
    ],
  },
  Startup: {
    default: [
      { sem: 'Current Sem', tasks: ['Identify problem statement through user research', 'Build MVP with no-code/low-code tools', 'Talk to 20 potential users', 'Validate problem-solution fit'], icon: BookOpen },
      { sem: 'Next Sem', tasks: ['Build actual product with tech stack', 'Implement basic analytics & feedback loop', 'Launch beta to closed user group', 'Iterate based on feedback'], icon: Target },
      { sem: 'Growth', tasks: ['Acquire first 100 users', 'Set up basic business ops & team', 'Apply for incubator/accelerator programs', 'Refine pitch deck'], icon: Briefcase },
      { sem: 'Scale', tasks: ['Apply for funding (angel/seed)', 'Scale product & team', 'Focus on unit economics', 'Plan for full launch'], icon: GraduationCap },
    ],
  },
  Research: {
    default: [
      { sem: 'Current Sem', tasks: ['Identify research area of interest', 'Read 10 papers in that domain', 'Learn LaTeX for academic writing', 'Set up Google Scholar profile'], icon: BookOpen },
      { sem: 'Next Sem', tasks: ['Narrow down to specific problem', 'Implement baseline for chosen problem', 'Run first experiments & log results', 'Write a survey paper'], icon: Target },
      { sem: 'Advanced', tasks: ['Propose novel method/improvement', 'Write full research paper', 'Submit to conference (Springer/ACM/IEEE)', 'Apply for research internships'], icon: Briefcase },
      { sem: 'Publish', tasks: ['Address reviewer comments & resubmit', 'Apply for PhD programs or research roles', 'Present at conferences', 'Build academic network'], icon: GraduationCap },
    ],
  },
}

const DOMAIN_KEYS = {
  'DSA/CP': 'DSA/CP',
  'Web Development': 'Web Development',
  'AI/ML': 'AI/ML',
  'Cloud': 'DSA/CP',
  'CyberSec': 'CyberSec',
  'Mobile': 'Web Development',
}

function Roadmap({ profile, analysis }) {
  const careerGoal = profile?.career_goal || 'Placement'
  const domain = profile?.domain_interest?.[0] || 'DSA/CP'
  const studentYear = profile?.profile?.year || 2
  const skillLevel = analysis?.skill_profile?.level || 'Not assessed'
  const weakAreas = analysis?.skill_profile?.weak_areas || []

  const roadmapKey = DOMAIN_KEYS[domain] || 'DSA/CP'
  const goalRoadmaps = ROADMAPS[careerGoal]
  const plan = goalRoadmaps?.[roadmapKey] || goalRoadmaps?.default || ROADMAPS.Placement['DSA/CP']

  return (
    <div className="min-h-screen bg-mist p-6 md:p-8 font-sans text-ink">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="theme-card bg-paper p-6 border border-gray-200/60 shadow-sm">
          <div className="flex items-center gap-3 mb-1">
            <Milestone className="h-6 w-6 text-signal" />
            <div>
              <h1 className="text-xl font-display font-extrabold text-ink">Career Roadmap</h1>
              <p className="text-xs text-slate mt-0.5">Personalised for {domain} · {careerGoal} · Year {studentYear}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-mist">
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-signal-tint text-signal border border-signal/10">Level: {skillLevel}</span>
            {weakAreas.length > 0 && (
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-600 border border-amber-200">Weak areas: {weakAreas.join(', ')}</span>
            )}
          </div>
        </div>

        <div className="relative">
          <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-signal/20" />

          {plan.map((phase, idx) => {
            const Icon = phase.icon
            return (
              <div key={idx} className="relative pl-16 pb-8 last:pb-0">
                <div className="absolute left-4 top-1 w-9 h-9 rounded-full bg-signal-tint border-2 border-signal flex items-center justify-center">
                  <Icon className="h-4 w-4 text-signal" />
                </div>

                <div className="theme-card bg-paper p-5 border border-gray-200/60 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <Calendar className="h-3.5 w-3.5 text-signal" />
                    <span className="text-xs font-bold text-signal uppercase tracking-wider">{phase.sem}</span>
                  </div>
                  <ul className="space-y-2">
                    {phase.tasks.map((task, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-xs text-slate">
                        <ArrowRight className="h-3.5 w-3.5 text-signal mt-0.5 flex-shrink-0" />
                        <span>{task}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default Roadmap
