import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, ScanFace, Mic, QrCode, ClipboardCheck } from 'lucide-react'

// Illustrative rows only — shows the shape of a session register, not real data.
const SAMPLE_ROWS = [
  { id: '2301', name: 'Aarav Mehta', how: 'Face', state: 'P' },
  { id: '2302', name: 'Diya Kapoor', how: 'Face', state: 'P' },
  { id: '2305', name: 'Kabir Nair', how: 'Voice', state: 'P' },
  { id: '2309', name: 'Meera Joshi', how: '—', state: 'A' },
  { id: '2311', name: 'Rohan Das', how: 'Face', state: 'P' },
  { id: '2314', name: 'Sana Qureshi', how: 'Face', state: 'P' },
]

const STEPS = [
  { icon: QrCode, title: 'Enrol', body: 'Students join a subject with its code or a QR link and register their face once.' },
  { icon: ScanFace, title: 'Capture', body: 'Upload photos of the classroom. Every recognised face is matched to the subject’s students.' },
  { icon: Mic, title: 'Or call the roll', body: 'Record an audio roll call and match each voice to a stored voiceprint.' },
  { icon: ClipboardCheck, title: 'Review & save', body: 'Check the result, correct any row, then commit it to the register.' },
]

export const HomePage = () => (
  <div className="pb-16">
    {/* Hero */}
    <section className="grid gap-12 py-10 sm:py-16 lg:grid-cols-12 lg:gap-10 lg:py-20">
      <div className="rise lg:col-span-6 lg:pr-6">
        <p className="eyebrow mb-6 flex items-center gap-3">
          <span className="h-px w-8 bg-indigo-400" aria-hidden="true" />
          Face &amp; voice attendance
        </p>
        <h1 className="font-display text-[2.6rem] font-extrabold leading-[1.02] tracking-tight text-slate-50 sm:text-6xl lg:text-[4.25rem]">
          Take the register from a photo of the room.
        </h1>
        <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-300">
          FaceVPlus recognises students by face and voice, so a class of sixty takes seconds, not a
          lesson’s first five minutes. You review every result before it’s saved.
        </p>
        <div className="mt-9 flex flex-wrap items-center gap-3">
          <Link
            to="/teacher/login"
            className="inline-flex min-h-12 items-center gap-2.5 rounded-md border border-indigo-400 bg-indigo-400 px-5 text-[0.9375rem] font-semibold text-slate-950 transition-colors hover:bg-indigo-300"
          >
            I’m a teacher <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
          <Link
            to="/student/login"
            className="inline-flex min-h-12 items-center gap-2.5 rounded-md border border-slate-600 px-5 text-[0.9375rem] font-semibold text-slate-100 transition-colors hover:border-slate-400 hover:bg-slate-800"
          >
            I’m a student
          </Link>
        </div>
      </div>

      {/* Register specimen */}
      <div className="rise lg:col-span-6" style={{ '--i': 2 }}>
        <figure className="sheet overflow-hidden" aria-label="Sample attendance register">
          <figcaption className="flex items-center justify-between border-b border-slate-700 bg-slate-800/60 px-4 py-3">
            <span className="eyebrow text-slate-300">Session register</span>
            <span className="num text-xs text-slate-400">Sample data</span>
          </figcaption>
          <table className="w-full text-sm">
            <thead>
              <tr className="eyebrow border-b border-slate-800 text-left">
                <th scope="col" className="px-4 py-2.5 font-medium">Reg. no</th>
                <th scope="col" className="px-4 py-2.5 font-medium">Student</th>
                <th scope="col" className="hidden px-4 py-2.5 font-medium sm:table-cell">Matched by</th>
                <th scope="col" className="px-4 py-2.5 text-right font-medium">Mark</th>
              </tr>
            </thead>
            <tbody>
              {SAMPLE_ROWS.map((r) => (
                <tr key={r.id} className="border-b border-slate-800/70 last:border-0">
                  <td className="num px-4 py-3 text-slate-400">{r.id}</td>
                  <td className="px-4 py-3 font-medium text-slate-100">{r.name}</td>
                  <td className="hidden px-4 py-3 text-slate-400 sm:table-cell">{r.how}</td>
                  <td className="px-4 py-3 text-right">
                    <span
                      className={`num inline-grid h-6 w-6 place-items-center rounded-sm text-xs font-semibold ${
                        r.state === 'P' ? 'bg-emerald-400/15 text-emerald-300' : 'bg-red-400/15 text-red-300'
                      }`}
                    >
                      <span className="sr-only">{r.state === 'P' ? 'Present' : 'Absent'}</span>
                      <span aria-hidden="true">{r.state}</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="num flex items-center justify-between border-t border-slate-700 bg-slate-800/40 px-4 py-2.5 text-xs text-slate-400">
            <span>5 present · 1 absent</span>
            <span className="text-indigo-300">83%</span>
          </div>
        </figure>
      </div>
    </section>

    {/* How a session runs */}
    <section aria-labelledby="how" className="border-t border-slate-800 pt-12">
      <div className="mb-8 flex items-end justify-between gap-6">
        <h2 id="how" className="font-display text-2xl font-bold text-slate-50 sm:text-3xl">
          How a session runs
        </h2>
        <span className="eyebrow hidden sm:block">4 steps</span>
      </div>
      <ol className="grid gap-px overflow-hidden rounded-lg border border-slate-800 bg-slate-800 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map(({ icon: Icon, title, body }, i) => (
          <li key={title} className="flex flex-col gap-4 bg-slate-950 p-6">
            <div className="flex items-center justify-between">
              <span className="num text-sm text-indigo-400">0{i + 1}</span>
              <Icon className="h-5 w-5 text-slate-500" aria-hidden="true" />
            </div>
            <h3 className="text-lg font-bold text-slate-50">{title}</h3>
            <p className="text-sm leading-relaxed text-slate-400">{body}</p>
          </li>
        ))}
      </ol>
    </section>

    {/* Portals */}
    <section aria-labelledby="portals" className="mt-16">
      <h2 id="portals" className="sr-only">Choose your portal</h2>
      <div className="grid overflow-hidden rounded-lg border border-slate-800 md:grid-cols-2">
        <Link
          to="/student/login"
          className="group flex flex-col gap-10 border-b border-slate-800 p-7 transition-colors hover:bg-slate-900 md:border-b-0 md:border-r sm:p-9"
        >
          <div>
            <p className="eyebrow mb-4 text-emerald-300">Students</p>
            <p className="font-display text-3xl font-bold text-slate-50">Sign in with your face.</p>
            <p className="mt-3 max-w-md text-slate-400">
              No password to forget. Join subjects by code or QR and watch your attendance rate per course.
            </p>
          </div>
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-slate-100">
            Student portal
            <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" aria-hidden="true" />
          </span>
        </Link>
        <Link
          to="/teacher/login"
          className="group flex flex-col gap-10 p-7 transition-colors hover:bg-slate-900 sm:p-9"
        >
          <div>
            <p className="eyebrow mb-4 text-pink-300">Teachers</p>
            <p className="font-display text-3xl font-bold text-slate-50">Run the whole register.</p>
            <p className="mt-3 max-w-md text-slate-400">
              Create subjects, share enrolment QR codes, take attendance by photo or voice, and open the full register.
            </p>
          </div>
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-slate-100">
            Teacher portal
            <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" aria-hidden="true" />
          </span>
        </Link>
      </div>
    </section>
  </div>
)
