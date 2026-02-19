import { GoogleGenerativeAI } from '@google/generative-ai'
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

// Need a admin/service client to fetch patient data safely if not passed?
// actually we can rely on RLS if we forward the auth header, 
// but here we are in an API route. 
// We should use a Service Role client to fetch patient details to ensure we get the medical data 
// needed for the context, OR we require the client to pass it (less secure/trustworthy).
// Let's use the provided supabase client creator if we had one for server, 
// but here we might just use `process.env` keys.

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! // Fallback for hackathon

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(req: Request) {
    try {
        const { message, patientId } = await req.json()

        if (!message) {
            return NextResponse.json({ error: 'Message required' }, { status: 400 })
        }

        let context = ''
        if (patientId) {
            // Fetch patient medical context
            const { data: patient } = await supabase
                .from('patients')
                .select('*')
                .eq('id', patientId)
                .single()

            const { data: summary } = await supabase
                .from('case_summaries')
                .select('summary')
                .eq('patient_id', patientId)
                .order('created_at', { ascending: false })
                .limit(1)
                .single()

            if (patient) {
                context = `
            Patient Context:
            Name: ${patient.name}
            Condition: ${patient.condition}
            Room: ${patient.room_number}
            Medical Summary: ${summary?.summary || 'Not available'}
            `
            }
        }

        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })
        const systemPrompt = `You are BedCare AI, a medical assistant for caregivers. 
    Use the following patient context to answer the caregiver's question. 
    If the question involves a medical emergency or high risk, IMMEDIATELY advise consulting a doctor or calling emergency services.
    Keep answers concise and actionable for a caretaker on the move.
    
    ${context}
    
    Caregiver Question: ${message}`

        const result = await model.generateContent(systemPrompt)
        const response = await result.response
        const text = response.text()

        return NextResponse.json({ reply: text })

    } catch (error: any) {
        console.error('Gemini Chat Error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
