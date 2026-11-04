import React from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { LogOut } from 'lucide-react'
import { LogoMark, Wordmark } from './Logo'

const navLink =
  'px-3 py-2 text-sm font-medium transition-colors rounded-md hover:text-slate-50 hover:bg-slate-800'

export const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth()
  const navigate = useNavigate()
  const isTeacher = user?.role === 'teacher'

  const handleLogout = async () => {
    await logout()
    navigate('/', { replace: true })
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/95">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-2 focus:z-50 focus:rounded-md focus:bg-indigo-400 focus:px-3 focus:py-2 focus:text-sm focus:font-semibold focus:text-slate-950"
      >
        Skip to content
      </a>
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2.5 text-indigo-400" aria-label="FaceVPlus home">
          <LogoMark className="h-6 w-6" />
          <Wordmark />
        </Link>

        <nav className="flex items-center gap-1 sm:gap-2" aria-label="Primary">
          {isAuthenticated ? (
            <>
              <NavLink
                to={isTeacher ? '/teacher/dashboard' : '/student/dashboard'}
                className={({ isActive }) =>
                  `${navLink} ${isActive ? 'text-indigo-300' : 'text-slate-300'}`
                }
              >
                Dashboard
              </NavLink>
              <div className="mx-1 hidden h-5 w-px bg-slate-700 sm:block" />
              <div className="hidden items-center gap-2 pr-1 sm:flex">
                <span className={`h-2 w-2 rounded-full ${isTeacher ? 'bg-pink-400' : 'bg-emerald-400'}`} aria-hidden="true" />
                <span className="max-w-40 truncate text-sm font-medium text-slate-100">{user?.name}</span>
                <span className="eyebrow">{user?.role}</span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 rounded-md border border-slate-700 px-3 py-1.5 text-sm font-medium text-slate-300 transition-colors hover:border-red-400/50 hover:bg-red-500/10 hover:text-red-300"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                <span className="hidden sm:inline">Log out</span>
                <span className="sr-only sm:hidden">Log out</span>
              </button>
            </>
          ) : (
            <>
              <Link to="/student/login" className={`${navLink} text-slate-300`}>
                Student
              </Link>
              <Link
                to="/teacher/login"
                className="rounded-md border border-indigo-400 bg-indigo-400 px-3.5 py-1.5 text-sm font-semibold text-slate-950 transition-colors hover:bg-indigo-300"
              >
                Teacher sign in
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}
