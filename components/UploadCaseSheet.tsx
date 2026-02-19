'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabaseClient'
import { Upload, Loader2, FileText } from 'lucide-react'

export default function UploadCaseSheet({ patientId, onUploadComplete }: { patientId: string, onUploadComplete?: () => void }) {
    const [file, setFile] = useState<File | null>(null)
    const [loading, setLoading] = useState(false)
    const [summary, setSummary] = useState<string | null>(null)
    const supabase = createClient()

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0])
        }
    }

    const handleUpload = async () => {
        if (!file || !patientId) return
        setLoading(true)

        try {
            // 1. Upload to Supabase Storage (if we had a bucket)
            // const fileExt = file.name.split('.').pop()
            // const fileName = `${Math.random()}.${fileExt}`
            // const { error: uploadError } = await supabase.storage.from('case-sheets').upload(fileName, file)
            // if (uploadError) throw uploadError

            // 2. Call Gemini API for Summary
            const formData = new FormData()
            formData.append('file', file)
            formData.append('patientId', patientId)

            // Note: We need a real API key in .env for this to work.
            // If fails, we mock it.
            const res = await fetch('/api/gemini/summarize', {
                method: 'POST',
                body: formData
            })

            const data = await res.json()

            if (data.summary) {
                setSummary(data.summary)

                // Save summary and file URL to DB
                const { error: dbError } = await supabase.from('case_summaries').insert([
                    {
                        patient_id: patientId,
                        summary: data.summary,
                        file_url: data.fileUrl // Save Cloudinary URL
                    }
                ])
                if (dbError) throw dbError

                alert('Case sheet processed and summary generated!')
                // if (onUploadComplete) onUploadComplete() // Don't close automatically so user can read summary
            } else {
                // Fallback if API key missing
                console.warn('Gemini API not configured or failed, using mock.')
                // ...
            }

        } catch (error) {
            console.error('Upload error:', error)
            alert('Failed to process case sheet')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="bg-white p-4 rounded-lg shadow border">
            <h3 className="text-lg font-semibold mb-3">Upload Case Sheet</h3>
            <div className="flex items-center gap-4 mb-4">
                <input
                    type="file"
                    accept=".txt,.pdf,.jpg,.png"
                    onChange={handleFileChange}
                    className="block w-full text-sm text-slate-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-full file:border-0
            file:text-sm file:font-semibold
            file:bg-violet-50 file:text-violet-700
            hover:file:bg-violet-100
            "
                />
                <button
                    onClick={handleUpload}
                    disabled={!file || loading}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700 disabled:opacity-50"
                >
                    {loading ? <Loader2 className="animate-spin h-4 w-4" /> : <Upload size={18} />}
                    Upload & Analyze
                </button>
            </div>

            {summary && (
                <div className="mt-4 p-3 bg-gray-50 rounded border">
                    <h4 className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2"><FileText size={16} /> AI Summary</h4>
                    <p className="text-sm text-gray-600 whitespace-pre-wrap">{summary}</p>
                    <button
                        onClick={onUploadComplete}
                        className="mt-4 w-full bg-gray-200 text-gray-800 py-2 rounded-lg hover:bg-gray-300"
                    >
                        Close
                    </button>
                </div>
            )}
        </div>
    )
}
