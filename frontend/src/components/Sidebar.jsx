import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Award, RefreshCw, GraduationCap, Milestone, Code2, BookOpen, FileText,
  PanelLeftClose, PanelLeftOpen, X
} from 'lucide-react'
import UserMenu from './UserMenu'
import { isRoadmapSection } from '../lib/yearNav'

// Shared sidebar widths so App.jsx can offset the main content by the same amount.
export const SIDEBAR_WIDTH_EXPANDED = 'w-64'
export const SIDEBAR_WIDTH_COLLAPSED = 'w-20'

function Sidebar({
  onRestart, onGoHome, email, displayName, onGoToProfile, onSignOut,
  collapsed = false, onToggleCollapse, mobileOpen = false, onCloseMobile,
}) {
  const navigate = useNavigate()
  const location = useLocation()

  const menuItems = [
    { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
    { id: 'roadmap', name: 'Career Roadmap', icon: Milestone },
    { id: 'dsa', name: 'DSA Practice', icon: Code2 },
    { id: 'courses', name: 'Courses', icon: BookOpen },
    { id: 'opportunities', name: 'Opportunities', icon: Award },
    { id: 'resume', name: 'Resume Builder', icon: FileText },
  ]

  const handleNavigate = (id) => {
    navigate(`/${id}`)
    onCloseMobile?.()
  }

  const widthClass = collapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH_EXPANDED

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-ink/40 md:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 ${widthClass} border-r border-mist bg-paper
          transition-all duration-300 ease-in-out
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}
      >
        <div className="flex h-full flex-col justify-between p-4 md:p-6">
          <div>
            <div className={`flex items-center gap-2 py-4 ${collapsed ? 'justify-center px-0' : 'justify-between px-2'}`}>
              <div
                onClick={() => { onGoHome(); onCloseMobile?.() }}
                className={`flex items-center gap-3 cursor-pointer hover:opacity-85 transition-opacity ${collapsed ? 'justify-center' : ''}`}
              >
                <GraduationCap className="h-7 w-7 text-signal flex-shrink-0" />
                {!collapsed && (
                  <span className="font-display font-extrabold text-xl text-ink tracking-tight whitespace-nowrap">
                    CareerAgent
                  </span>
                )}
              </div>

              {/* Close button on mobile drawer */}
              <button
                onClick={onCloseMobile}
                className="md:hidden p-1 text-slate hover:text-ink cursor-pointer"
                aria-label="Close sidebar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Desktop collapse/expand toggle */}
            <button
              onClick={onToggleCollapse}
              className={`hidden md:flex items-center gap-2 w-full px-2 py-2 mb-2 rounded-lg text-slate hover:bg-mist hover:text-ink transition-all cursor-pointer ${collapsed ? 'justify-center' : 'justify-start'}`}
              title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {collapsed ? <PanelLeftOpen className="h-4.5 w-4.5" /> : <PanelLeftClose className="h-4.5 w-4.5" />}
              {!collapsed && <span className="text-[10px] font-bold uppercase tracking-wider">Hide</span>}
            </button>

            {email && (
              <div className={`pb-4 ${collapsed ? 'flex justify-center px-0' : 'px-2'}`}>
                <UserMenu
                  email={email}
                  displayName={displayName}
                  onGoToProfile={onGoToProfile}
                  onSignOut={onSignOut}
                  align="left"
                />
              </div>
            )}

            <nav className="mt-2 space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon
                const isActive = item.id === 'roadmap'
                  ? isRoadmapSection(location.pathname)
                  : location.pathname === `/${item.id}`

                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavigate(item.id)}
                    title={collapsed ? item.name : undefined}
                    className={`flex w-full items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all duration-250 cursor-pointer ${
                      collapsed ? 'justify-center px-0' : ''
                    } ${
                      isActive ? 'bg-signal-tint border border-signal/10 text-signal font-extrabold' : 'text-slate hover:bg-mist hover:text-ink'
                    }`}
                  >
                    <Icon className={`h-4.5 w-4.5 flex-shrink-0 ${isActive ? 'text-signal' : 'text-slate'}`} />
                    {!collapsed && <span className="whitespace-nowrap">{item.name}</span>}
                  </button>
                )
              })}
            </nav>
          </div>

          <div className="border-t border-mist pt-6">
            <button
              onClick={onRestart}
              title={collapsed ? 'Restart Assessment' : undefined}
              className={`flex w-full items-center justify-center gap-2 px-4 py-3 rounded-full border border-signal text-signal hover:bg-signal-tint text-xs font-bold transition-all cursor-pointer ${collapsed ? 'px-0' : ''}`}
            >
              <RefreshCw className="h-3.5 w-3.5 flex-shrink-0" />
              {!collapsed && 'Restart Assessment'}
            </button>
            {!collapsed && (
              <div className="mt-4 text-center text-[10px] text-slate font-medium">
                AI Career Agent v1.0
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  )
}

export default Sidebar
