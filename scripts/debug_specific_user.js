const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // set in .env.local, never commit

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
});

async function debug() {
    console.log('--- Tracing Patient for "Kristipati Karteya Reddy" ---');

    // 1. Find Caretaker
    const { data: caretakers, error: cError } = await supabase
        .from('caretakers')
        .select('id, name, user_id')
        .ilike('name', '%Karteya%'); // Loose match just in case

    if (cError) { console.error(cError); return; }
    if (!caretakers || caretakers.length === 0) { console.log('❌ No caretaker found with that name.'); return; }

    console.log('Found Caretakers:', caretakers);

    for (const c of caretakers) {
        // 2. Find Patients linked to this Caretaker
        const { data: patients, error: pError } = await supabase
            .from('patients')
            .select('id, name, user_id')
            .eq('caretaker_id', c.id);

        if (pError) console.error(pError);

        if (patients && patients.length > 0) {
            console.log(`\nPatients linked to Caretaker "${c.name}":`);
            console.table(patients);

            for (const p of patients) {
                // 3. Find Family linked to this Patient
                const { data: family, error: fError } = await supabase
                    .from('profiles')
                    .select('id, full_name, email, role, linked_patient_id')
                    .eq('linked_patient_id', p.id);

                if (fError) console.error(fError);

                if (family && family.length > 0) {
                    console.log(`✅ Family linked to Patient "${p.name}":`);
                    console.table(family);
                } else {
                    console.log(`❌ NO Family linked to Patient "${p.name}" (ID: ${p.id})`);
                }
            }
        } else {
            console.log(`⚠️ No patients assigned to Caretaker "${c.name}"`);
        }
    }
}

debug();
