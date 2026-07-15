import React from 'react'
import { YEAR_OPTIONS, isYearActive } from '../lib/yearNav'

function YearDropdown({ pathname, onSelectYear, buttonClassName, panelClassName }) {
  const [open, setOpen] = React.useState(false)

  return (
    <div className="relative" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button className={buttonClassName}>
        By Year <span className="text-[10px]">▼</span>
      </button>
      {open && (
        <div className={panelClassName}>
          {YEAR_OPTIONS.map((item) => {
            const active = isYearActive(pathname, item.slug)
            return (
              <button
                key={item.slug}
                onClick={() => { setOpen(false); onSelectYear(item.slug); }}
                className={`w-full text-left py-2 px-3 text-sm font-medium rounded-lg transition-colors ${
                  active ? 'bg-signal-tint text-signal font-bold' : 'text-ink hover:bg-mist'
                }`}
              >
                {item.label}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default YearDropdown
