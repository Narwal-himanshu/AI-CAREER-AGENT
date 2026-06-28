import React from 'react'
import { LayoutDashboard, Award, RefreshCw, GraduationCap } from 'lucide-react'

function Sidebar({ currentPage, setCurrentPage, onRestart, onGoHome }) {
  const menuItems = [
    { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
    { id: 'opportunities', name: 'Opportunities', icon: Award },
  ]

  return (
    <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 border-r border-mist bg-paper md:block">
      <div className="flex h-full flex-col justify-between p-6">
        <div>
          {/* Logo Brand */}
          <div onClick={onGoHome} className="flex items-center gap-3 px-2 py-4 cursor-pointer hover:opacity-85 transition-opacity">
            <GraduationCap className="h-7 w-7 text-signal" />
            <span className="font-display font-extrabold text-xl text-ink tracking-tight">
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
                  className={`flex w-full items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all duration-250 ${
                    isActive
                      ? 'bg-signal-tint border border-signal/10 text-signal font-extrabold'
                      : 'text-slate hover:bg-mist hover:text-ink'
                  }`}
                >
                  <Icon className={`h-4.5 w-4.5 ${isActive ? 'text-signal' : 'text-slate'}`} />
                  {item.name}
                </button>
              )
            })}
          </nav>
        </div>

        {/* Footer Area with Reset Option */}
        <div className="border-t border-mist pt-6">
          <button
            onClick={onRestart}
            className="flex w-full items-center justify-center gap-2 px-4 py-3 rounded-full border border-signal text-signal hover:bg-signal-tint text-xs font-bold transition-all cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Restart Assessment
          </button>
          <div className="mt-4 text-center text-[10px] text-slate font-medium">
            AI Career Agent v1.0
          </div>
        </div>
      </div>
    </aside>
  )
}

export default Sidebar
