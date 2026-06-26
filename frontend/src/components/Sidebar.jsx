import React from 'react'
import { LayoutDashboard, Award, RefreshCw, GraduationCap } from 'lucide-react'

function Sidebar({ currentPage, setCurrentPage, onRestart }) {
  const menuItems = [
    { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
    { id: 'opportunities', name: 'Opportunities', icon: Award },
  ]

  return (
    <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 border-r border-white/5 bg-[#0f1422] md:block">
      <div className="flex h-full flex-col justify-between p-6">
        <div>
          {/* Logo Brand */}
          <div className="flex items-center gap-3 px-2 py-4">
            <GraduationCap className="h-8 w-8 text-violet-500 glow-violet" />
            <span className="bg-gradient-to-r from-white to-gray-400 bg-clip-text text-xl font-extrabold tracking-wide text-transparent">
              CareerAgent
            </span>
          </div>

          {/* Navigation Links */}
          <nav className="mt-8 space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon
              const isActive = currentPage === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentPage(item.id)}
                  className={`flex w-full items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                    isActive
                      ? 'bg-violet-600/20 border border-violet-500/20 text-violet-400 font-bold'
                      : 'text-gray-400 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <Icon className={`h-5 w-5 ${isActive ? 'text-violet-400' : 'text-gray-400'}`} />
                  {item.name}
                </button>
              )
            })}
          </nav>
        </div>

        {/* Footer Area with Reset Option */}
        <div className="border-t border-white/5 pt-6">
          <button
            onClick={onRestart}
            className="flex w-full items-center justify-center gap-2 px-4 py-3 rounded-xl border border-white/5 bg-white/3 hover:bg-white/8 text-sm font-semibold text-gray-300 hover:text-white transition-all"
          >
            <RefreshCw className="h-4 w-4" />
            Restart Assessment
          </button>
          <div className="mt-4 text-center text-xs text-gray-500 font-medium">
            AI Career Agent v1.0
          </div>
        </div>
      </div>
    </aside>
  )
}

export default Sidebar
