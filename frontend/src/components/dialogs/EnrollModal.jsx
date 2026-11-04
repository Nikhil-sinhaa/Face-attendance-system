import React, { useState, useEffect } from 'react'
import { Notice } from '../common/Notice'
import { Modal } from '../common/Modal'
import { Input } from '../common/Input'
import { Button } from '../common/Button'
import { subjectService } from '../../services/subjectService'
import { Hash } from 'lucide-react'

export const EnrollModal = ({ isOpen, onClose, onEnrolled }) => {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Reset all state when the modal opens fresh
  useEffect(() => {
    if (isOpen) {
      setCode('')
      setError('')
      setSuccess('')
      setLoading(false)
    }
  }, [isOpen])

  const handleSubmit = async (e) => {
    e.preventDefault()
    const trimmed = code.trim().toUpperCase()
    if (!trimmed) {
      setError('Please enter a subject code.')
      return
    }
    if (trimmed.length < 2) {
      setError('Subject code must be at least 2 characters.')
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')
    try {
      const res = await subjectService.enrollStudent(trimmed)
      setSuccess(res.message || 'Successfully enrolled!')
      setTimeout(() => {
        onEnrolled()
        onClose()
      }, 1200)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to enroll. Please check the code.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Enrol in subject"
      subtitle="Enter the subject code provided by your teacher"
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <Notice>{error}</Notice>}

        {success && <Notice tone="success">{success}</Notice>}

        <Input
          label="Subject Code"
          id="enroll_code"
          placeholder="e.g. CS101, PHY201"
          icon={Hash}
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          autoFocus
          disabled={loading || Boolean(success)}
        />

        <div className="flex items-center justify-end gap-3 border-t border-slate-800 pt-4">
          <Button variant="ghost" type="button" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={loading} disabled={Boolean(success)}>
            Enrol
          </Button>
        </div>
      </form>
    </Modal>
  )
}

