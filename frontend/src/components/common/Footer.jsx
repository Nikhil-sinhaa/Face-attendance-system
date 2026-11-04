import React from 'react'
import { LogoMark } from './Logo'

export const Footer = () => (
  <footer className="mt-auto border-t border-slate-800 py-6">
    <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 text-sm text-slate-400 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
      <div className="flex items-center gap-2.5">
        <LogoMark className="h-4 w-4 text-slate-500" />
        <span className="font-medium text-slate-300">FaceVPlus</span>
        <span className="text-slate-600">/</span>
        <span>Face &amp; voice attendance for classrooms</span>
      </div>
      <span className="eyebrow">v2.0</span>
    </div>
  </footer>
)
