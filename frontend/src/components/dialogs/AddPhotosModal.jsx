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

  