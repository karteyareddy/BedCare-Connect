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
        const { email, password, name, organization_id, patient_id } = body

        if (!email || !password || !name || !organization_id || !patient_id) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        // 1. Create Auth User
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email: email,
            password: password,
            email_confirm: true, // Bypass email verification
            user_metadata: { role: 'family' }
        })

        if (authError) throw authError

        // Force confirm just in case
        if (authData.user && !authData.user.email_confirmed_at) {
            const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
                authData.user.id,
                { email_confirm: true }
            )
            if (updateError) {
                console.error('Error confirming family email:', updateError)
            }
        }

        if (authData.user) {
            // 2. Create Profile with linked_patient_id
            const { error: profileError } = await supabaseAdmin
                .from('profiles')
                .insert([
                    {
                        id: authData.user.id,
                        organization_id: organization_id,
                        role: 'family',
                        full_name: name,
                        email: email,
                        linked_patient_id: patient_id
                    }
                ])

            if (profileError) {
                // Ideally rollback
                throw profileError
            }
        }

        return NextResponse.json({ success: true, user: authData.user })

    } catch (error: any) {
        console.error('Error creating family user:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
