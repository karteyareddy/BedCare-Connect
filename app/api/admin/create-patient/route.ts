import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Initialize Supabase Admin Client
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
)

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { email, password, name, organization_id, room_number, condition, caretaker_id } = body

        if (!email || !password || !name || !organization_id) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        // 1. Create Auth User
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email: email,
            password: password,
            email_confirm: true, // Bypass email verification
            user_metadata: { role: 'patient' }
        })

        if (authError) throw authError

        // Force confirm just in case
        if (authData.user && !authData.user.email_confirmed_at) {
            const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
                authData.user.id, { email_confirm: true }
            )
            if (updateError) {
                console.error('Error confirming email:', updateError)
            }
        }

        if (authData.user) {
            // 2. Create Profile
            const { error: profileError } = await supabaseAdmin
                .from('profiles')
                .insert([
                    {
                        id: authData.user.id,
                        organization_id: organization_id,
                        role: 'patient',
                        full_name: name,
                        email: email
                    }
                ])

            if (profileError) {
                // Ideally rollback, but for now just error
                throw profileError
            }

            // 3. Create Patient Record
            const { error: patientError } = await supabaseAdmin
                .from('patients')
                .insert([
                    {
                        user_id: authData.user.id,
                        organization_id: organization_id,
                        name: name,
                        room_number: room_number,
                        condition: condition,
                        caretaker_id: caretaker_id || null
                    }
                ])

            if (patientError) throw patientError
        }

        return NextResponse.json({ success: true, user: authData.user })

    } catch (error: any) {
        console.error('Error creating patient:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
