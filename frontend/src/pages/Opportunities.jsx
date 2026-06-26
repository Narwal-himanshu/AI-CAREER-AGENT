import React, { useState } from 'react'
import { Calendar, MapPin, ExternalLink, Trophy, Filter, ShieldCheck } from 'lucide-react'

function Opportunities({ profile, analysis }) {
  const [filterType, setFilterType] = useState('All')

  const primaryDomain = profile?.domain_interest?.[0] || 'DSA/CP'
  const studentLevel = analysis?.skill_profile?.level || 'Beginner'

  // Curate dynamic opportunities list based on domain
  const getOpportunitiesList = (domain, level) => {
    const baseOpportunities = [
      {
        id: 'opp_001',
        title: 'Smart India Hackathon 2026',
        type: 'Hackathon',
        organiser: 'Ministry of Education, India',
        deadline: '2026-08-15',
        url: 'https://sih.gov.in',
        tags: ['Web Development', 'AI/ML', 'National'],
        level_filter: 'Beginner',
        description: 'National-level hackathon solving real-world problem statements from government ministries.'
      },
      {
        id: 'opp_002',
        title: 'Google Summer of Code (GSoC)',
        type: 'Open Source',
        organiser: 'Google',
        deadline: '2026-04-10',
        url: 'https://summerofcode.withgoogle.com',
        tags: ['Open Source', 'Programming', 'Global'],
        level_filter: 'Intermediate',
        description: 'A global program focused on bringing student developers into open source software development.'
      },
      {
        id: 'opp_003',
        title: 'LeetCode Weekly Biweekly Contest',
        type: 'Contest',
        organiser: 'LeetCode',
        deadline: 'Every Saturday & Sunday',
        url: 'https://leetcode.com/contest',
        tags: ['DSA/CP', 'Coding', 'Weekly'],
        level_filter: 'Beginner',
        description: 'Compete in weekly coding rounds to build speed, accuracy, and global rating rankings.'
      }
    ]

    const domainSpecific = {
      'AI/ML': [
        {
          id: 'opp_ml_1',
          title: 'Kaggle Titanic Disaster Challenge',
          type: 'Contest',
          organiser: 'Kaggle',
          deadline: 'Ongoing',
          url: 'https://kaggle.com',
          tags: ['AI/ML', 'NumPy', 'Pandas'],
          level_filter: 'Beginner',
          description: 'Predict survival on the Titanic. The perfect entry point for ML classification patterns.'
        },
        {
          id: 'opp_ml_2',
          title: 'HuggingFace AI Hackathon',
          type: 'Hackathon',
          organiser: 'HuggingFace',
          deadline: '2026-07-20',
          url: 'https://huggingface.co',
          tags: ['AI/ML', 'Transformers', 'Open Source'],
          level_filter: 'Intermediate',
          description: 'Build open-source spaces using Gradio/Streamlit and models from Hugging Face hub.'
        }
      ],
      'Web Development': [
        {
          id: 'opp_web_1',
          title: 'Vercel Next.js Dev Challenge',
          type: 'Contest',
          organiser: 'Vercel',
          deadline: '2026-09-02',
          url: 'https://vercel.com',
          tags: ['Web Development', 'React', 'Next.js'],
          level_filter: 'Intermediate',
          description: 'Build and deploy optimized serverless edge rendering applications.'
        },
        {
          id: 'opp_web_2',
          title: 'Hacktoberfest 2026',
          type: 'Open Source',
          organiser: 'DigitalOcean',
          deadline: '2026-10-31',
          url: 'https://hacktoberfest.com',
          tags: ['Web Development', 'Git', 'Open Source'],
          level_filter: 'Beginner',
          description: 'Submit 4 pull requests to open source repositories to win trees or swag.'
        }
      ],
      'CyberSec': [
        {
          id: 'opp_sec_1',
          title: 'InCTF Junior Capture The Flag',
          type: 'CTF',
          organiser: 'Amrita Vishwa Vidyapeetham',
          deadline: '2026-11-12',
          url: 'https://inctf.in',
          tags: ['CyberSec', 'Reverse Engineering', 'Web Security'],
          level_filter: 'Beginner',
          description: 'Indias premier national level capture the flag contest for beginners.'
        },
        {
          id: 'opp_sec_2',
          title: 'Google CTF 2026',
          type: 'CTF',
          organiser: 'Google Security Team',
          deadline: '2026-07-05',
          url: 'https://capturetheflag.withgoogle.com',
          tags: ['CyberSec', 'Cryptography', 'Pwn'],
          level_filter: 'Advanced',
          description: 'Global CTF featuring highly complex security challenges for advanced hackers.'
        }
      ],
      'DSA/CP': [
        {
          id: 'opp_cp_1',
          title: 'Codechef SnackDown 2026',
          type: 'Contest',
          organiser: 'Codechef',
          deadline: '2026-10-01',
          url: 'https://codechef.com',
          tags: ['DSA/CP', 'Algorithms', 'Team'],
          level_filter: 'Intermediate',
          description: 'A multi-round coding team tournament involving top competitive programmers globally.'
        }
      ]
    }

    const domainList = domainSpecific[domain] || []
    return [...baseOpportunities, ...domainList].filter(opp => {
      // Prioritize filtering matching level
      // Advanced matches intermediate/advanced; beginner matches all; etc.
      return true
    })
  }

  const allOpps = getOpportunitiesList(primaryDomain, studentLevel)
  const filteredOpps = filterType === 'All' 
    ? allOpps 
    : allOpps.filter(opp => opp.type === filterType)

  const filterCategories = ['All', 'Hackathon', 'Contest', 'CTF', 'Open Source']

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      
      {/* Header banner */}
      <div className="glass-panel p-6 relative overflow-hidden">
        <div className="absolute -top-12 -left-12 h-32 w-32 rounded-full bg-violet-600/10 blur-2xl"></div>
        <div className="flex items-center gap-3">
          <Trophy className="h-8 w-8 text-violet-500 glow-violet" />
          <div>
            <h1 className="text-2xl font-extrabold text-white">Live Opportunities</h1>
            <p className="text-sm text-gray-400 mt-1">
              Personalized hackathons, contests, and open-source campaigns matching your <span className="text-white font-bold">{primaryDomain}</span> domain.
            </p>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-white/5 pb-4">
        <Filter className="h-4 w-4 text-gray-500 mr-2" />
        {filterCategories.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilterType(cat)}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              filterType === cat
                ? 'bg-violet-600 text-white shadow shadow-violet-600/20'
                : 'bg-white/3 border border-white/5 text-gray-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Grid container */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredOpps.length > 0 ? (
          filteredOpps.map((opp) => (
            <div 
              key={opp.id} 
              className="glass-panel p-6 flex flex-col justify-between glass-panel-hover transition-all duration-300 relative"
            >
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-bold text-violet-400 uppercase tracking-widest bg-violet-500/10 border border-violet-500/25 px-2.5 py-0.5 rounded-full">
                      {opp.type}
                    </span>
                    <h3 className="text-base font-bold text-white mt-2 leading-snug">
                      {opp.title}
                    </h3>
                  </div>
                  
                  {/* Skill compatibility level badge */}
                  <span className={`text-[10px] font-semibold flex items-center gap-1 flex-shrink-0 ${
                    opp.level_filter === studentLevel 
                      ? 'text-emerald-400' 
                      : 'text-gray-400'
                  }`}>
                    <ShieldCheck className="h-4.5 w-4.5 text-current" />
                    {opp.level_filter} Matches
                  </span>
                </div>

                <p className="text-xs text-gray-400 leading-relaxed">
                  {opp.description}
                </p>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {opp.tags.map((tag, i) => (
                    <span key={i} className="px-2 py-0.5 rounded text-[10px] font-medium bg-white/5 text-gray-300 border border-white/5">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Card Footer details */}
              <div className="flex justify-between items-center border-t border-white/5 pt-4 mt-6">
                <div className="space-y-1">
                  <span className="text-[9px] text-gray-500 uppercase block font-semibold">Organiser</span>
                  <span className="text-xs text-gray-300 font-medium block">{opp.organiser}</span>
                </div>
                <div className="space-y-1 text-right">
                  <span className="text-[9px] text-gray-500 uppercase block font-semibold">Deadline</span>
                  <span className="text-xs text-amber-400 font-bold block flex items-center justify-end gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    {opp.deadline}
                  </span>
                </div>
              </div>

              {/* Action Apply button */}
              <a
                href={opp.url}
                target="_blank"
                rel="noreferrer"
                className="mt-4 py-2.5 rounded-xl bg-white/3 hover:bg-white/8 text-center text-xs font-bold text-white flex items-center justify-center gap-2 border border-white/5 transition-all"
              >
                Apply / Register
                <ExternalLink className="h-3.5 w-3.5" />
              </a>

            </div>
          ))
        ) : (
          <div className="col-span-2 text-center py-12 text-gray-500 text-sm font-semibold">
            No opportunities found for the selected filter.
          </div>
        )}
      </div>

    </div>
  )
}

export default Opportunities
