import React from 'react'
import { CalendarDays, Download } from 'lucide-react'
import { Button } from '../common/Button'
import { Badge } from '../common/Badge'
import { LoadingSpinner } from '../common/LoadingSpinner'
import { EmptyState } from '../common/EmptyState'

const th = 'px-4 py-3 font-medium'

export const AttendanceRecordsTab = ({ records, loadingRecords, onExportCSV }) => (
  <div className="space-y-6">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 className="text-xl font-bold text-slate-50">Session history</h2>
        <p className="mt-1 text-sm text-slate-400">Every saved session, newest first.</p>
      </div>
      {records.length > 0 && (
        <Button variant="outline" size="sm" onClick={onExportCSV} icon={Download}>
          Export CSV
        </Button>
      )}
    </div>

    {loadingRecords ? (
      <LoadingSpinner text="Loading history" />
    ) : records.length === 0 ? (
      <EmptyState
        icon={CalendarDays}
        title="No sessions recorded yet"
        body="Sessions appear here once you run and confirm attendance."
      />
    ) : (
      <div className="overflow-x-auto rounded-lg border border-slate-800 bg-slate-900" role="region" aria-label="Attendance sessions" tabIndex={0}>
        <table className="w-full min-w-[40rem] text-left text-sm">
          <thead>
            <tr className="eyebrow border-b border-slate-700 bg-slate-800">
              <th scope="col" className={th}>Session</th>
              <th scope="col" className={th}>Subject</th>
              <th scope="col" className={th}>Code</th>
              <th scope="col" className={th}>Section</th>
              <th scope="col" className={`${th} text-right`}>Present</th>
              <th scope="col" className={`${th} text-right`}>Rate</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {records.map((record, index) => (
              <tr key={index} className="transition-colors hover:bg-slate-800">
                <td className="num whitespace-nowrap px-4 py-3.5 text-slate-300">
                  {new Date(record.timestamp).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                </td>
                <td className="px-4 py-3.5 font-semibold text-slate-50">{record.subject_name}</td>
                <td className="px-4 py-3.5"><Badge variant="indigo">{record.subject_code}</Badge></td>
                <td className="px-4 py-3.5 text-slate-400">{record.section}</td>
                <td className="num px-4 py-3.5 text-right">
                  <span className="font-semibold text-emerald-300">{record.present_count}</span>
                  <span className="text-slate-500"> / {record.total_count}</span>
                </td>
                <td className="num px-4 py-3.5 text-right font-semibold text-indigo-300">{record.rate}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}
  </div>
)
