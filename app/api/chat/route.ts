import { GoogleGenerativeAI } from '@google/generative-ai'
import { NextResponse } from 'next/server'

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY!)

export async function POST(req: Request) {
    try {
        const { messages, context } = await req.json()

        // Simple context - could be enhanced with patient data if passed
        let systemPrompt = `You are a helpful AI assistant for medical caretakers using the BedCare Connect app. 
        Your goal is to assist caretakers with general medical questions, app navigation, and best practices for patient care.
        Do not provide definitive medical diagnoses. Always advise consulting a doctor for serious issues.
        Keep answers concise and supportive.`

        if (context) {
            systemPrompt += `\n\nContext: You are answering questions regarding a specific patient. ${context}`
        }

        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

        const chat = model.startChat({
            history: [
                {
                    role: 'user',
                    parts: [{ text: systemPrompt }],
                },
                {
                    role: 'model',
                    parts: [{ text: 'Understood. I am ready to assist caretakers.' }],
                },
                ...messages.slice(0, -1).map((msg: any) => ({
                    role: msg.role === 'user' ? 'user' : 'model',
                    parts: [{ text: msg.content }]
                }))
            ],
        })

        const lastMessage = messages[messages.length - 1].content
        const result = await chat.sendMessage(lastMessage)
        const response = await result.response
        const text = response.text()

        return NextResponse.json({ text })

    } catch (error: any) {
        console.error('Chat API Error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
