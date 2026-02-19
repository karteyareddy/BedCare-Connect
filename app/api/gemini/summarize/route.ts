import { GoogleGenerativeAI } from '@google/generative-ai'
import { NextResponse } from 'next/server'
import { v2 as cloudinary } from 'cloudinary'

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
})

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

export async function POST(req: Request) {
    try {
        const formData = await req.formData()
        const file = formData.get('file') as File
        const patientId = formData.get('patientId') as string

        if (!file || !patientId) {
            return NextResponse.json({ error: 'Missing file or patient ID' }, { status: 400 })
        }

        // 1. Convert File to Buffer
        const arrayBuffer = await file.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)
        const base64Data = buffer.toString('base64')

        // 2. Upload to Cloudinary (for storage)
        let fileUrl = ''
        try {
            const uploadResult: any = await new Promise((resolve, reject) => {
                cloudinary.uploader.upload_stream({
                    resource_type: 'auto',
                    folder: 'bedcare_casesheets',
                }, (error, result) => {
                    if (error) reject(error)
                    else resolve(result)
                }).end(buffer)
            })
            fileUrl = uploadResult.secure_url
        } catch (uploadError) {
            console.error('Cloudinary Upload Failed:', uploadError)
            // Continue if upload fails? No, for now let's prioritize analysis, but usually we need storage.
            // If upload fails, we can't save fileUrl.
            // We'll proceed with analysis but return empty fileUrl or error?
            // Let's assume upload is critical for "Case Sheet" record.
            throw new Error('Failed to upload file to storage')
        }

        // 3. Call Gemini to summarize (Multimodal)
        // Use gemini-1.5-flash for speed and multimodal capability
        const model = genAI.getGenerativeModel({
            model: 'gemini-1.5-flash',
            generationConfig: { responseMimeType: "application/json" }
        })

        const prompt = `Analyze the following medical case sheet (which may be an image or PDF) and provide a detailed summary.
        Extract the following information and return strictly as a JSON object with these keys:
        - "patient_overview": A brief summary of the patient's identity and reason for admission.
        - "diagnosed_conditions": List of conditions or diagnoses found.
        - "medications": List of medications prescribed or mentioned.
        - "allergies": List of allergies if any.
        - "critical_warnings": Any high-priority warnings or critical alerts.
        - "daily_care_instructions": Recommended daily care steps.

        Do not include markdown code blocks, just the raw JSON.`

        const result = await model.generateContent([
            prompt,
            {
                inlineData: {
                    data: base64Data,
                    mimeType: file.type
                }
            }
        ])

        const response = await result.response
        const summaryText = response.text()

        // Verify JSON parsing logic if needed, but responseMimeType should handle it.
        // We return the raw string (which is JSON) as 'summary' because frontend expects a string summary?
        // Wait, frontend displays it as text. If we return JSON string, it might look ugly.
        // Frontend code: <p className="whitespace-pre-wrap">{summary}</p>
        // If we return JSON, users will see braces {}.
        // The user probably wants READABLE text.
        // So we should ask Gemini for "formatted text" or "markdown" OR
        // we parse the JSON and return a formatted string?
        // The previous code returned "summaryText".
        // The prompt asked for "JSON format...".
        // If I change format to JSON, existing frontend (which just displays text) will show JSON source.
        // I should ask for "Markdown" or "Human readable text" if the frontend simple displays it.
        // OR better: Parse the JSON here and reconstruct a nice string.
        // Let's parse the JSON and format it nicely for the current frontend.

        let formattedSummary = summaryText
        try {
            const jsonSummary = JSON.parse(summaryText)
            formattedSummary = `
**Patient Overview**: ${jsonSummary.patient_overview}

**Conditions**: ${Array.isArray(jsonSummary.diagnosed_conditions) ? jsonSummary.diagnosed_conditions.join(', ') : jsonSummary.diagnosed_conditions}

**Medications**: ${Array.isArray(jsonSummary.medications) ? jsonSummary.medications.join(', ') : jsonSummary.medications}

**Allergies**: ${Array.isArray(jsonSummary.allergies) ? jsonSummary.allergies.join(', ') : jsonSummary.allergies}

**Critical Warnings**: ${jsonSummary.critical_warnings}

**Daily Care**: ${jsonSummary.daily_care_instructions}
            `.trim()
        } catch (e) {
            // Fallback if parsing fails or if model returns text
            console.warn('Failed to parse JSON summary, returning raw text', e)
        }

        return NextResponse.json({
            summary: formattedSummary,
            fileUrl: fileUrl
        })

    } catch (error: any) {
        console.error('API Error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
