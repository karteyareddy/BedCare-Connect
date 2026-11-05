import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabaseClient';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ patientId: string }> }
) {
  try {
    const { patientId } = await params;
    const supabase = createClient();

    // Fetch config
    const { data: config } = await supabase
      .from('monitoring_config')
      .select('*')
      .eq('patient_id', patientId)
      .single();

    // Fetch latest event
    const { data: latestEvents } = await supabase
      .from('monitoring_events')
      .select('*')
      .eq('patient_id', patientId)
      .order('detected_at', { ascending: false })
      .limit(1);

    const latestEvent = latestEvents && latestEvents.length > 0 ? latestEvents[0] : null;

    return NextResponse.json({
      patientId,
      isActive: config ? config.is_active : true,
      config: config || {
        is_active: true,
        inference_fps: 8,
        fall_detection_enabled: true,
        inactivity_threshold_mins: 60,
      },
      lastActivity: latestEvent,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
