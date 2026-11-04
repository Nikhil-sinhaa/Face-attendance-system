import React, { useRef } from 'react'
import { ScanFace, BookOpen, CalendarDays } from 'lucide-react'

const TABS = [
  { id: 'take_attendance', label: 'Take attendance', Icon: ScanFace },
  { id: 'manage_subjects', label: 'Subjects', Icon: BookOpen },
  { id: 'attendance_records', label: 'Records', Icon: CalendarDays },
]

export const DashboardTabNav = ({ currentTab, onTabChange }) => {
  const listRef = useRef(null)

  // WAI-ARIA tabs pattern: arrow keys move between tabs, only the active tab is in the Tab order
  const handleKeyDown = (e) => {
    const index = TABS.findIndex((t) => t.id === currentTab)
    let next = null
    if (e.key === 'ArrowRight') next = (index + 1) % TABS.length
    else if (e.key === 'ArrowLeft') next = (index - 1 + TABS.length) % TABS.length
    else if (e.key === 'Home') next = 0
    else if (e.key === 'End') next = TABS.length - 1
    if (next === null) return
    e.preventDefault()
    onTabChange(TABS[next].id)
    listRef.current?.querySelectorAll('[role="tab"]')[next]?.focus()
  }

  return (
  <div ref={listRef} role="tablist" aria-label="Dashboard sections" onKeyDown={handleKeyDown} className="-mb-px flex gap-1 overflow-x-auto border-b border-slate-800">
    {TABS.map(({ id, label, Icon }) => {
      const active = currentTab === id
      return (
        <button
          key={id}
          role="tab"
          id={`tab-${id}`}
          aria-selected={active}
          tabIndex={active ? 0 : -1}
          aria-controls={`panel-${id}`}
          onClick={() => onTabChange(id)}
          className={`-mb-px flex shrink-0 items-center gap-2 border-b-2 px-3 py-3 sm:px-4 text-sm font-semibold transition-colors ${
            active
              ? 'border-indigo-400 text-slate-50'
              : 'border-transparent text-slate-400 hover:border-slate-600 hover:text-slate-100'
          }`}
        >
          <Icon className={`hidden h-4 w-4 sm:block ${active ? 'text-indigo-400' : ''}`} aria-hidden="true" />
          {label}
        </button>
      )
    })}
  </div>
  )
}
