
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const profileId = searchParams.get('profileId')

        if (!profileId) {
            return NextResponse.json({ error: 'Profile ID required' }, { status: 400 })
        }

        const { data, error } = await supabaseAdmin
            .from('assigned_organizations')
            .select('*')
            .eq('profile_id', profileId)

        return NextResponse.json({ data, error })
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
