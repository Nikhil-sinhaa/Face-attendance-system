import React, { useState, useRef, useCallback } from 'react'
import Webcam from 'react-webcam'
import { Modal } from '../common/Modal'
import { Button } from '../common/Button'
import { Camera, Upload, Trash2, CheckCircle2 } from 'lucide-react'

export const AddPhotosModal = ({ isOpen, onClose, photos, setPhotos }) => {
  const [activeTab, setActiveTab] = useState('camera')
  const webcamRef = useRef(null)

  