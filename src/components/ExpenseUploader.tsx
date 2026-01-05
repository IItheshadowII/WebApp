"use client"

import React, { useState, useRef, useEffect } from 'react'
import { Card, Button } from './ui-glass'
import { Upload, Camera, Loader2, Check, X } from 'lucide-react'

export const ExpenseUploader = () => {
    const [isUploading, setIsUploading] = useState(false)
    const [preview, setPreview] = useState<string | null>(null)
    const [extractedData, setExtractedData] = useState<any>(null)

    const [isCameraOpen, setIsCameraOpen] = useState(false)
    const videoRef = useRef<HTMLVideoElement | null>(null)
    const streamRef = useRef<MediaStream | null>(null)

    const uploadBlob = async (file: Blob, fileName: string) => {
        setIsUploading(true)
        setPreview(URL.createObjectURL(file))

        const formData = new FormData()
        formData.append('file', file, fileName)

        try {
            const response = await fetch('/api/ai/upload-ticket', {
                method: 'POST',
                body: formData,
            })
            const data = await response.json()
            setExtractedData(data)
        } catch (error) {
            console.error("Error uploading ticket:", error)
        } finally {
            setIsUploading(false)
        }
    }

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (!file) return

        await uploadBlob(file, file.name)
    }

    // Camera handling
    const openCamera = async () => {
        if (isCameraOpen) return
        if (!navigator.mediaDevices?.getUserMedia) {
            alert('Tu navegador no soporta acceso a la cámara')
            return
        }
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
            streamRef.current = stream
            if (videoRef.current) {
                videoRef.current.srcObject = stream
            }
            setIsCameraOpen(true)
        } catch (e) {
            console.error('No se pudo acceder a la cámara', e)
            alert('No se pudo acceder a la cámara')
        }
    }

    const closeCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(t => t.stop())
            streamRef.current = null
        }
        setIsCameraOpen(false)
    }

    const handleCapture = async () => {
        if (!videoRef.current) return

        const video = videoRef.current
        const canvas = document.createElement('canvas')
        canvas.width = video.videoWidth || 1280
        canvas.height = video.videoHeight || 720

        const ctx = canvas.getContext('2d')
        if (!ctx) return

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

        canvas.toBlob(async (blob) => {
            if (!blob) return
            await uploadBlob(blob, 'ticket-camera.jpg')
            closeCamera()
        }, 'image/jpeg', 0.9)
    }

    useEffect(() => {
        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(t => t.stop())
            }
        }
    }, [])

    return (
        <div className="space-y-6">
            <div className="w-full h-64 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center bg-white/[0.02] hover:bg-white/[0.04] transition cursor-pointer relative overflow-hidden group">
                {preview ? (
                    <img src={preview} alt="Preview" className="w-full h-full object-cover opacity-40 group-hover:opacity-60 transition-opacity" />
                ) : (
                    <>
                        <Upload className="w-12 h-12 mb-3 opacity-20 group-hover:opacity-40 transition-opacity" />
                        <p className="text-sm opacity-40 font-medium">Arrastra una imagen o haz clic para seleccionar</p>
                        <p className="text-xs opacity-20 mt-1">JPG, PNG o PDF</p>
                    </>
                )}
                <input
                    type="file"
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    accept="image/*"
                    onChange={handleFileUpload}
                />
            </div>

            <div className="flex items-center justify-center gap-3">
                <Button variant="secondary" onClick={openCamera} className="flex items-center gap-2 text-xs">
                    <Camera className="w-4 h-4" />
                    Usar cámara
                </Button>
            </div>

            {isUploading && (
                <div className="flex items-center justify-center gap-3 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                    <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
                    <span className="text-sm font-medium text-blue-400">Analizando con IA...</span>
                </div>
            )}

            {extractedData && (
                <div className="p-6 bg-emerald-500/10 border border-emerald-500/20 rounded-xl space-y-4">
                    <div className="flex items-center gap-2 text-emerald-400 mb-4">
                        <Check className="w-5 h-5" />
                        <span className="font-bold text-sm">Datos Extraídos</span>
                    </div>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="opacity-60">Monto:</span>
                            <span className="font-bold">${extractedData.amount}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="opacity-60">Concepto:</span>
                            <span className="font-bold">{extractedData.description}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="opacity-60">Categoría:</span>
                            <span className="font-bold capitalize">{extractedData.category}</span>
                        </div>
                    </div>
                    <Button variant="success" fullWidth className="mt-4">
                        Confirmar y Guardar
                    </Button>
                </div>
            )}

            {isCameraOpen && (
                <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center">
                    <div className="bg-[#050505] border border-white/10 rounded-2xl w-full max-w-lg p-4 flex flex-col gap-4">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-sm font-bold uppercase tracking-wide text-white/60">Capturar ticket con cámara</h3>
                            <button
                                onClick={closeCamera}
                                className="p-1 rounded-full hover:bg-white/10 text-white/60"
                                aria-label="Cerrar cámara"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="relative rounded-xl overflow-hidden border border-white/10 bg-black">
                            <video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                className="w-full h-64 object-contain bg-black"
                            />
                        </div>
                        <div className="flex justify-end gap-3 mt-2">
                            <Button variant="secondary" onClick={closeCamera}>
                                Cancelar
                            </Button>
                            <Button variant="primary" onClick={handleCapture} className="flex items-center gap-2">
                                <Camera className="w-4 h-4" />
                                Tomar foto
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
