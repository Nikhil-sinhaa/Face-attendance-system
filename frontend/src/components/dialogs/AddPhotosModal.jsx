import React, { useState, useRef, useCallback } from 'react'
import Webcam from 'react-webcam'
import { Modal } from '../common/Modal'
import { Button } from '../common/Button'
import { Camera, Upload, Trash2, CheckCircle2 } from 'lucide-react'

export const AddPhotosModal = ({ isOpen, onClose, photos, setPhotos }) => {
  const [activeTab, setActiveTab] = useState('camera')
  const webcamRef = useRef(null)

    // Capture from webcam
  const handleCapture = useCallback(() => {
    if (!webcamRef.current) return
    const imageSrc = webcamRef.current.getScreenshot()
    if (!imageSrc) return

    // Convert base64 dataURL to Blob/File
    fetch(imageSrc)
      .then((res) => res.blob())
      .then((blob) => {
        const file = new File([blob], `webcam_${Date.now()}.jpg`, { type: 'image/jpeg' })
        // Create an object URL for preview
        file.previewUrl = imageSrc
        setPhotos((prev) => [...prev, file])
      })
  }, [setPhotos])

  // Handle file upload
  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    const preparedFiles = files.map((file) => {
      file.previewUrl = URL.createObjectURL(file)
      return file
    })

    setPhotos((prev) => [...prev, ...preparedFiles])
    e.target.value = ''
  }

  // Remove photo
  const handleRemovePhoto = (index) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index))
  }

    return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Capture or Upload Classroom Photos"
      subtitle="Add photos to scan and identify enrolled students"
      maxWidth="max-w-2xl"
    >
      <div className="space-y-5">
        {/* Tab Toggle */}
        <div className="flex rounded-xl border border-slate-800 bg-slate-950 p-1">
          <button
            type="button"
            onClick={() => setActiveTab('camera')}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-xs font-semibold transition ${
              activeTab === 'camera'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Camera className="h-4 w-4" />
            <span>Camera</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-xs font-semibold transition ${
              activeTab === 'upload'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Upload className="h-4 w-4" />
            <span>Upload Photos</span>
          </button>
        </div>

        {/* Camera Tab Content */}
        {activeTab === 'camera' && (
          <div className="flex flex-col items-center">
            <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-slate-800 bg-black shadow-inner">
              <Webcam
                audio={false}
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                videoConstraints={{ facingMode: 'user', width: 1280, height: 720 }}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="mt-3 w-full">
              <Button variant="secondary" onClick={handleCapture} className="w-full" icon={Camera}>
                Take Photo
              </Button>
            </div>
          </div>
        )}

        {/* Upload Tab Content */}
        {activeTab === 'upload' && (
          <label className="flex aspect-video w-full cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-700 bg-slate-950/60 p-6 transition hover:border-indigo-500 hover:bg-slate-950">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-400">
              <Upload className="h-7 w-7" />
            </div>
            <p className="mt-3 text-sm font-semibold text-slate-200">
              Click to browse or drag &amp; drop photos
            </p>
            <p className="mt-1 text-xs text-slate-500">Supports JPG, PNG, WEBP (Multiple files allowed)</p>
            <input
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={handleFileUpload}
            />
          </label>
        )}


        