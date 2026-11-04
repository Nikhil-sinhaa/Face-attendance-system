import React, { useEffect, useState } from 'react'
import { Notice } from '../common/Notice'
import { Modal } from '../common/Modal'
import { Button } from '../common/Button'
import { QRCodeSVG } from 'qrcode.react'
import { Copy, Check, Download } from 'lucide-react'
import { subjectService } from '../../services/subjectService'

export const ShareSubjectModal = ({ isOpen, onClose, subject }) => {
  const [shareData, setShareData] = useState(null)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState('')

  useEffect(() => {
    if (!isOpen || !subject?.subject_id) return
    setShareData(null)
    setError('')
    subjectService.getShareDetails(subject.subject_id)
      .then(setShareData)
      .catch(() => setError('Unable to create the invitation link.'))
  }, [isOpen, subject?.subject_id])

  const subjectCode = shareData?.subject_code || subject?.subject_code || ''
  const joinUrl = shareData?.join_url || ''

  const copyValue = async (value, label) => {
    if (!value) return
    await navigator.clipboard.writeText(value)
    setCopied(label)
    setTimeout(() => setCopied(''), 2000)
  }

  const handleDownload = () => {
    if (!shareData?.qr_data_url) return
    const link = document.createElement('a')
    link.href = shareData.qr_data_url
    link.download = `${subjectCode}-join-qr.png`
    link.click()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Share ${subject?.name || 'Class'}`}
      subtitle={`Code: ${subjectCode} | Section: ${subject?.section || ''}`}
      maxWidth="max-w-md"
    >
      <div className="space-y-6">
        {error && <Notice>{error}</Notice>}
        {!shareData && !error && <p className="text-sm text-slate-400">Generating secure invitation...</p>}
        {shareData && (
          <>
            <div className="flex flex-col items-center gap-4 rounded-lg border border-slate-700 bg-slate-950 p-6 text-center">
              <div className="rounded-md bg-white p-3">
                <QRCodeSVG value={joinUrl} size={180} level="M" />
              </div>
              <Button size="sm" variant="tertiary" onClick={handleDownload} icon={Download}>
                Download QR Code
              </Button>
              <p className="text-sm text-slate-400">Scan with a phone camera to enrol instantly.</p>
            </div>

            <div>
              <p className="eyebrow mb-2">Invite link</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 truncate rounded-md border border-slate-600 bg-slate-950 px-3.5 py-2.5 num text-xs text-slate-300">{joinUrl}</div>
                <Button size="sm" variant={copied === 'link' ? 'tertiary' : 'primary'} onClick={() => copyValue(joinUrl, 'link')}>
                  {copied === 'link' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  <span>{copied === 'link' ? 'Copied' : 'Copy'}</span>
                </Button>
              </div>
            </div>
          </>
        )}

        <div>
          <p className="eyebrow mb-2">Subject code</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 rounded-md border border-slate-600 bg-slate-950 px-3.5 py-2 num text-base font-semibold tracking-wider text-indigo-300">{subjectCode}</div>
            <Button size="sm" variant="tertiary" onClick={() => copyValue(subjectCode, 'code')}>
              {copied === 'code' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              <span>{copied === 'code' ? 'Copied' : 'Copy'}</span>
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  )
}
