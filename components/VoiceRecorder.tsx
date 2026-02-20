'use client'

import { useState, useRef } from 'react'
import { Mic, MicOff, Send, Square } from 'lucide-react'

interface VoiceRecorderProps {
    onSendVoice: (audioBase64: string) => void
    disabled?: boolean
}

export default function VoiceRecorder({ onSendVoice, disabled }: VoiceRecorderProps) {
    const [isRecording, setIsRecording] = useState(false)
    const [duration, setDuration] = useState(0)
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
    const [audioUrl, setAudioUrl] = useState<string | null>(null)
    const mediaRecorderRef = useRef<MediaRecorder | null>(null)
    const chunksRef = useRef<Blob[]>([])
    const timerRef = useRef<NodeJS.Timeout | null>(null)

    const getSupportedMimeType = () => {
        const types = [
            'audio/webm;codecs=opus',
            'audio/webm',
            'audio/mp4',
            'audio/ogg;codecs=opus',
            'audio/aac'
        ]
        for (const type of types) {
            if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(type)) {
                return type
            }
        }
        return ''
    }

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
            const mimeType = getSupportedMimeType()
            const options = mimeType ? { mimeType } : undefined

            const mediaRecorder = new MediaRecorder(stream, options)
            mediaRecorderRef.current = mediaRecorder
            chunksRef.current = []
            setDuration(0)
            setAudioBlob(null)
            setAudioUrl(null)

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunksRef.current.push(e.data)
            }

            mediaRecorder.onstop = () => {
                // Use the actual mime type from the recorder or fallback
                const type = mediaRecorder.mimeType || 'audio/webm'
                const blob = new Blob(chunksRef.current, { type })
                setAudioBlob(blob)
                setAudioUrl(URL.createObjectURL(blob))
                stream.getTracks().forEach(t => t.stop())
            }

            mediaRecorder.start()
            setIsRecording(true)

            timerRef.current = setInterval(() => {
                setDuration(d => {
                    if (d >= 60) {
                        stopRecording()
                        return d
                    }
                    return d + 1
                })
            }, 1000)
        } catch (err: any) {
            console.error('Error accessing microphone:', err)
            alert(`Microphone access denied or error occurred: ${err.message || err.name}. Please check permissions.`)
        }
    }

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop()
            setIsRecording(false)
            if (timerRef.current) clearInterval(timerRef.current)
        }
    }

    const sendVoice = async () => {
        if (!audioBlob) return
        const reader = new FileReader()
        reader.onloadend = () => {
            const base64 = reader.result as string
            onSendVoice(base64)
            setAudioBlob(null)
            setAudioUrl(null)
            setDuration(0)
        }
        reader.readAsDataURL(audioBlob)
    }

    const discard = () => {
        setAudioBlob(null)
        setAudioUrl(null)
        setDuration(0)
    }

    const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`

    if (audioBlob && audioUrl) {
        return (
            <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-full px-3 py-2">
                <audio src={audioUrl} controls className="h-8 max-w-[160px]" />
                <button
                    onClick={sendVoice}
                    disabled={disabled}
                    className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors flex-shrink-0"
                    title="Send voice message"
                >
                    <Send size={14} />
                </button>
                <button
                    onClick={discard}
                    className="w-8 h-8 bg-gray-200 text-gray-600 rounded-full flex items-center justify-center hover:bg-gray-300 transition-colors flex-shrink-0"
                    title="Discard"
                >
                    <MicOff size={14} />
                </button>
            </div>
        )
    }

    if (isRecording) {
        return (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-full px-4 py-2">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse flex-shrink-0"></span>
                <span className="text-red-600 font-mono text-sm font-medium min-w-[40px]">{formatTime(duration)}</span>
                <span className="text-red-500 text-xs flex-1">Recording...</span>
                <button
                    onClick={stopRecording}
                    className="w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors flex-shrink-0"
                    title="Stop recording"
                >
                    <Square size={14} fill="white" />
                </button>
            </div>
        )
    }

    return (
        <button
            onClick={startRecording}
            disabled={disabled}
            className="w-10 h-10 bg-gray-100 hover:bg-blue-100 text-gray-500 hover:text-blue-600 rounded-full flex items-center justify-center transition-colors flex-shrink-0 disabled:opacity-50"
            title="Record voice message"
        >
            <Mic size={18} />
        </button>
    )
}
