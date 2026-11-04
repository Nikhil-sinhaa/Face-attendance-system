import React, { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { subjectService } from '../../services/subjectService'
import { attendanceService } from '../../services/attendanceService'
import { PageHeader } from '../../components/common/PageHeader'
import { Notice } from '../../components/common/Notice'
import { DashboardTabNav } from '../../components/dashboard/DashboardTabNav'
import { TakeAttendanceTab } from '../../components/dashboard/TakeAttendanceTab'
import { ManageSubjectsTab } from '../../components/dashboard/ManageSubjectsTab'
import { AttendanceRecordsTab } from '../../components/dashboard/AttendanceRecordsTab'
import { CreateSubjectModal } from '../../components/dialogs/CreateSubjectModal'
import { ShareSubjectModal } from '../../components/dialogs/ShareSubjectModal'
import { AddPhotosModal } from '../../components/dialogs/AddPhotosModal'
import { VoiceAttendanceModal } from '../../components/dialogs/VoiceAttendanceModal'
import { AttendanceReviewModal } from '../../components/dialogs/AttendanceReviewModal'

export const TeacherDashboard = () => {
  const { user } = useAuth()
  const [currentTab, setCurrentTab] = useState('take_attendance')

  // Subject state
  const [subjects, setSubjects] = useState([])
  const [selectedSubjectId, setSelectedSubjectId] = useState('')
  const [loadingSubjects, setLoadingSubjects] = useState(true)

  // Attendance photos state
  const [attendancePhotos, setAttendancePhotos] = useState([])
  const [analyzingFaces, setAnalyzingFaces] = useState(false)
  const [faceError, setFaceError] = useState('')

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)
  const [sharingSubject, setSharingSubject] = useState(null)
  const [isAddPhotosModalOpen, setIsAddPhotosModalOpen] = useState(false)
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false)
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false)
  const [reviewCandidates, setReviewCandidates] = useState([])

  // Records state
  const [records, setRecords] = useState([])
  const [loadingRecords, setLoadingRecords] = useState(false)
  const [saveToast, setSaveToast] = useState('')

  const fetchSubjects = async () => {
    try {
      const data = await subjectService.getSubjects()
      setSubjects(data)
      if (data.length > 0 && !selectedSubjectId) {
        setSelectedSubjectId(data[0].subject_id.toString())
      }
    } catch (err) {
      console.error('Failed to fetch subjects', err)
    } finally {
      setLoadingSubjects(false)
    }
  }

  const fetchRecords = async () => {
    setLoadingRecords(true)
    try {
      const data = await attendanceService.getTeacherAttendanceHistory()
      setRecords(data)
    } catch (err) {
      console.error('Failed to fetch attendance history', err)
    } finally {
      setLoadingRecords(false)
    }
  }

  useEffect(() => {
    fetchSubjects()
  }, [])

  useEffect(() => {
    if (currentTab === 'attendance_records') {
      fetchRecords()
    }
  }, [currentTab])

  // Run Face Analysis
  const handleRunFaceAnalysis = async () => {
    if (!selectedSubjectId || attendancePhotos.length === 0) return
    setAnalyzingFaces(true)
    setFaceError('')

    try {
      const data = await attendanceService.recognizeFaceAttendance(
        parseInt(selectedSubjectId),
        attendancePhotos
      )
      setReviewCandidates(data.candidates || [])
      setIsReviewModalOpen(true)
    } catch (err) {
      setFaceError(err.response?.data?.detail || 'Face analysis failed.')
    } finally {
      setAnalyzingFaces(false)
    }
  }

  // Handle Voice Attendance Complete
  const handleVoiceAnalysisComplete = (voiceData) => {
    setReviewCandidates(voiceData.candidates || [])
    setIsReviewModalOpen(true)
  }

  // Handle Attendance Confirmation Complete
  const handleAttendanceSaved = (res) => {
    setAttendancePhotos([])
    setSaveToast(res.message || 'Attendance session saved!')
    setTimeout(() => setSaveToast(''), 4000)
    fetchSubjects()
  }

  // Handle Subject Deletion
  const handleDeleteSubject = async (subjectId) => {
    if (window.confirm('Are you sure you want to delete this subject and its attendance logs?')) {
      try {
        await subjectService.deleteSubject(subjectId)
        fetchSubjects()
      } catch (_err) {
        alert('Failed to delete subject.')
      }
    }
  }

  // Export Records as CSV
  const handleExportCSV = () => {
    if (records.length === 0) return
    const headers = ['Session Time', 'Subject Code', 'Subject Name', 'Section', 'Present Count', 'Total Enrolled', 'Attendance Rate %']
    const rows = records.map((r) => [
      new Date(r.timestamp).toLocaleString(),
      `"${r.subject_code}"`,
      `"${r.subject_name}"`,
      `"${r.section}"`,
      r.present_count,
      r.total_count,
      `${r.rate}%`,
    ])

    const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `FaceVPlus_Attendance_${Date.now()}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-6 py-6">
      <PageHeader
        eyebrow="Teacher dashboard"
        title={`Welcome back, ${user?.name ?? ''}`}
        description="Take attendance, manage your subjects and review past sessions."
      >
        {saveToast && <Notice tone="success">{saveToast}</Notice>}
      </PageHeader>

      <DashboardTabNav currentTab={currentTab} onTabChange={setCurrentTab} />

      <div role="tabpanel" id={`panel-${currentTab}`} aria-labelledby={`tab-${currentTab}`} className="rise pt-4" key={currentTab}>
        {currentTab === 'take_attendance' && (
          <TakeAttendanceTab
            subjects={subjects}
            loadingSubjects={loadingSubjects}
            selectedSubjectId={selectedSubjectId}
            onSubjectChange={setSelectedSubjectId}
            attendancePhotos={attendancePhotos}
            onClearPhotos={() => setAttendancePhotos([])}
            onOpenAddPhotos={() => setIsAddPhotosModalOpen(true)}
            faceError={faceError}
            analyzingFaces={analyzingFaces}
            onRunFaceAnalysis={handleRunFaceAnalysis}
            onOpenVoiceModal={() => setIsVoiceModalOpen(true)}
            onOpenCreateModal={() => setIsCreateModalOpen(true)}
          />
        )}

        {currentTab === 'manage_subjects' && (
          <ManageSubjectsTab
            subjects={subjects}
            loadingSubjects={loadingSubjects}
            onOpenCreateModal={() => setIsCreateModalOpen(true)}
            onShareSubject={(s) => {
              setSharingSubject(s)
              setIsShareModalOpen(true)
            }}
            onDeleteSubject={handleDeleteSubject}
          />
        )}

        {currentTab === 'attendance_records' && (
          <AttendanceRecordsTab records={records} loadingRecords={loadingRecords} onExportCSV={handleExportCSV} />
        )}
      </div>

      {/* Modals */}
      <CreateSubjectModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreated={() => fetchSubjects()}
      />

      <ShareSubjectModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        subject={sharingSubject}
      />

      <AddPhotosModal
        isOpen={isAddPhotosModalOpen}
        onClose={() => setIsAddPhotosModalOpen(false)}
        photos={attendancePhotos}
        setPhotos={setAttendancePhotos}
      />

      <VoiceAttendanceModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        subjectId={parseInt(selectedSubjectId)}
        onAnalysisComplete={handleVoiceAnalysisComplete}
      />

      <AttendanceReviewModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        subjectId={parseInt(selectedSubjectId)}
        candidates={reviewCandidates}
        onConfirmed={handleAttendanceSaved}
      />
    </div>
  )
}
