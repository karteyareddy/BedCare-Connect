import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabaseClient';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params;
    const body = await request.json();
    const { verificationStatus, verifiedBy } = body;

    if (!['VERIFIED', 'REJECTED'].includes(verificationStatus)) {
      return NextResponse.json(
        { error: 'Invalid verification status. Must be VERIFIED or REJECTED.' },
        { status: 400 }
      );
    }

    const supabase = createClient();
    const { data, error } = await supabase
      .from('monitoring_events')
      .update({
        verification_status: verificationStatus,
        status: verificationStatus === 'VERIFIED' ? 'VERIFIED' : 'REJECTED',
        verified_by: verifiedBy || null,
        verified_at: new Date().toISOString(),
      })
      .eq('id', eventId)
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
