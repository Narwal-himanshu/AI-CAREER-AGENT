import React, { useState, useRef, useEffect } from 'react'
import { UserCog, LogOut } from 'lucide-react'

function initialsFrom(nameOrEmail) {
  if (!nameOrEmail) return '?'
  const namePart = nameOrEmail.includes('@') ? nameOrEmail.split('@')[0] : nameOrEmail
  const parts = namePart.replace(/[._]/g, ' ').trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

// Avatar + dropdown showing account email, "My Profile", and "Sign Out".
function UserMenu({ email, displayName, onGoToProfile, onSignOut, align = 'right' }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const initials = initialsFrom(displayName || email)

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex h-9 w-9 items-center justify-center rounded-full bg-signal text-white text-xs font-bold tracking-wide hover:opacity-90 transition-all cursor-pointer shadow-sm"
        title={email}
      >
        {initials}
      </button>

      {open && (
        <div
          className={`absolute top-full mt-2 ${align === 'right' ? 'right-0' : 'left-0'} w-64 bg-white border border-mist rounded-2xl shadow-xl py-2 z-50`}
        >
          <div className="px-4 py-2.5 border-b border-mist">
            <span className="text-xs font-semibold text-signal break-all">{email}</span>
          </div>
          <button
            onClick={() => { setOpen(false); onGoToProfile() }}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-ink hover:bg-mist transition-all cursor-pointer text-left"
          >
            <UserCog className="h-4 w-4 text-slate" />
            My Profile
          </button>
          <div className="border-t border-mist my-1"></div>
          <button
            onClick={() => { setOpen(false); onSignOut() }}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-red-600 hover:bg-red-50 transition-all cursor-pointer text-left"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      )}
    </div>
  )
}

export default UserMenu
