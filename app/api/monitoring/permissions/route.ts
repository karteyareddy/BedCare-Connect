import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabaseClient';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId');
    const userId = searchParams.get('userId');

    const supabase = createClient();
    let query = supabase.from('monitoring_permissions').select('*');

    if (patientId) query = query.eq('patient_id', patientId);
    if (userId) query = query.eq('granted_to_user_id', userId);

    const { data, error } = await query;
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ permissions: data || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { patientId, grantedToUserId, canViewCamera, canViewTimeline } = body;

    if (!patientId || !grantedToUserId) {
      return NextResponse.json({ error: 'Missing patientId or grantedToUserId' }, { status: 400 });
    }

    const supabase = createClient();
    const { data, error } = await supabase
      .from('monitoring_permissions')
      .upsert({
        patient_id: patientId,
        granted_to_user_id: grantedToUserId,
        can_view_camera: canViewCamera ?? true,
        can_view_timeline: canViewTimeline ?? true,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, permission: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
