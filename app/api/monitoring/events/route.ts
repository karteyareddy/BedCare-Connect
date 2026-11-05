import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabaseClient';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId');

    const supabase = createClient();
    let query = supabase
      .from('monitoring_events')
      .select('*')
      .order('detected_at', { ascending: false });

    if (patientId) {
      query = query.eq('patient_id', patientId);
    }

    const { data, error } = await query.limit(100);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ events: data || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { patientId, activityType, status, confidence, detectedAt, source, details } = body;

    if (!patientId || !activityType || !status) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabase = createClient();
    const { data, error } = await supabase
      .from('monitoring_events')
      .insert({
        patient_id: patientId,
        activity_type: activityType,
        status: status,
        confidence: confidence || 0.0,
        detected_at: detectedAt || new Date().toISOString(),
        source: source || 'AI',
        verification_status: 'PENDING',
        sync_status: 'synced',
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, event: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
