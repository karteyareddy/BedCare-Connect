import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

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
        const { action, organization_id } = body

        if (!organization_id || !action) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        if (action === 'TOGGLE_STATUS') {
            const { status } = body
            const { error } = await supabaseAdmin
                .from('organizations')
                .update({ status })
                .eq('id', organization_id)

            if (error) throw error
            return NextResponse.json({ success: true })
        }

        if (action === 'DELETE') {
            // 1. Delete Profiles (Users) - Trigger DB cascade if configured, or delete manually
            // Since we didn't set up ON DELETE CASCADE for everything, we must be careful.
            // Profiles reference Auth Users (Cascade is on Profile -> Auth, wait no, Auth -> Profile usually)
            // But we can't easily delete Auth users from here without listing them.

            // Getting all profiles in org
            const { data: profiles } = await supabaseAdmin
                .from('profiles')
                .select('id')
                .eq('organization_id', organization_id)

            if (profiles && profiles.length > 0) {
                const userIds = profiles.map(p => p.id)
                // Delete Auth Users (This cascade deletes profiles usually if designed right, but here Profile -> User? No User -> Profile)
                // In Supabase, if we delete Auth User, Profile goes if "references auth.users on delete cascade".
                // Schema said: "id uuid references auth.users on delete cascade primary key" -> YES.

                for (const userId of userIds) {
                    await supabaseAdmin.auth.admin.deleteUser(userId)
                }
            }

            // 2. Delete the Organization (This should fail if other tables like 'patients' still exist and don't cascade)
            // Let's delete related tables manually to be safe
            await supabaseAdmin.from('caretakers').delete().eq('organization_id', organization_id)
            await supabaseAdmin.from('patients').delete().eq('organization_id', organization_id)
            await supabaseAdmin.from('alerts').delete().eq('organization_id', organization_id)

            // Delete Org
            const { error } = await supabaseAdmin
                .from('organizations')
                .delete()
                .eq('id', organization_id)

            if (error) throw error
            return NextResponse.json({ success: true })
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })

    } catch (error: any) {
        console.error('Error managing org:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
