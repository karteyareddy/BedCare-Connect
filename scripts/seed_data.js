const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qkbstsilkczvzgxmhsnw.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFrYnN0c2lsa2N6dnpneG1oc253Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTQxNDkxMywiZXhwIjoyMDg2OTkwOTEzfQ.L8VrQbtMKtl7KWmq4tpH048hICLwH_VT95NzqRhochE';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

const ORG_ID = '2aceabb5-b344-4664-af4f-4ebe8474b367';

async function seed() {
    console.log('Starting seed...');

    // 1. Create Caretaker
    const caretakerEmail = `caretaker_${Date.now()}@test.com`;
    const { data: cAuth, error: cAuthError } = await supabase.auth.admin.createUser({
        email: caretakerEmail,
        password: 'password123',
        email_confirm: true,
        user_metadata: { role: 'caretaker' }
    });

    if (cAuthError) {
        console.error('Error creating caretaker user:', cAuthError);
        return;
    }
    console.log('Caretaker Auth created:', cAuth.user.id);

    // Profile
    const { error: cProfileError } = await supabase.from('profiles').upsert({
        id: cAuth.user.id,
        organization_id: ORG_ID,
        role: 'caretaker',
        full_name: 'Seed Caretaker',
        email: caretakerEmail
    });
    if (cProfileError) console.error('Error creating caretaker profile:', cProfileError);

    // Caretaker Record
    const { data: caretakerData, error: cRecordError } = await supabase.from('caretakers').insert({
        user_id: cAuth.user.id,
        organization_id: ORG_ID,
        name: 'Seed Caretaker',
        phone: '555-0001'
    }).select().single();

    if (cRecordError) {
        console.error('Error creating caretaker record:', cRecordError);
        return;
    }
    console.log('Caretaker Record created:', caretakerData.id);


    // 2. Create Patient
    const patientEmail = `patient_${Date.now()}@test.com`;
    const { data: pAuth, error: pAuthError } = await supabase.auth.admin.createUser({
        email: patientEmail,
        password: 'password123',
        email_confirm: true,
        user_metadata: { role: 'patient' }
    });

    if (pAuthError) {
        console.error('Error creating patient user:', pAuthError);
        return;
    }
    console.log('Patient Auth created:', pAuth.user.id);

    // Profile
    const { error: pProfileError } = await supabase.from('profiles').upsert({
        id: pAuth.user.id,
        organization_id: ORG_ID,
        role: 'patient',
        full_name: 'Seed Patient',
        email: patientEmail
    });
    if (pProfileError) console.error('Error creating patient profile:', pProfileError);

    // Patient Record
    const { error: pRecordError } = await supabase.from('patients').insert({
        user_id: pAuth.user.id,
        organization_id: ORG_ID,
        name: 'Seed Patient',
        room_number: '101',
        condition: 'Stable',
        caretaker_id: caretakerData.id
    });

    if (pRecordError) {
        console.error('Error creating patient record:', pRecordError);
    } else {
        console.log('Patient Record created successfully linked to caretaker.');
    }
}

seed();
