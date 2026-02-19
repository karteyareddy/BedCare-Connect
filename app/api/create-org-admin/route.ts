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
        const { name, owner_name, license_number, email } = body

        if (!name || !owner_name || !license_number || !email) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        // 1. Create Organization
        const { data: orgData, error: orgError } = await supabaseAdmin
            .from('organizations')
            .insert([{
                name,
                owner_name,
                license_number
            }])
            .select()
            .single()

        if (orgError) throw orgError

        // 2. Generate Credentials
        const password = Math.random().toString(36).slice(-8) + 'Aa1!' // Simple random password

        // 3. Create Auth User
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email: email,
            password: password,
            email_confirm: true,
            user_metadata: { role: 'org_admin' }
        })

        if (authError) throw authError

        if (authData.user) {
            // 4. Create Profile
            const { error: profileError } = await supabaseAdmin
                .from('profiles')
                .insert([
                    {
                        id: authData.user.id,
                        organization_id: orgData.id,
                        role: 'org_admin',
                        full_name: owner_name
                    }
                ])

            if (profileError) {
                // Rollback user creation if profile fails (ideally)
                await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
                throw profileError
            }
        }

        return NextResponse.json({
            organization: orgData,
            credentials: {
                email,
                password
            }
        })

    } catch (error: any) {
        console.error('Error creating org admin:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
