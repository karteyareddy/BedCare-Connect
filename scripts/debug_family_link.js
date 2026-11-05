const { createClient } = require('@supabase/supabase-js');

// Using the credentials from seed_data.js for admin access
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // set in .env.local, never commit

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function debug() {
    console.log('--- Debugging Family Linkage ---');

    console.log('\n1. Fetching All Patients:');
    const { data: patients, error: pError } = await supabase.from('patients').select('id, name, user_id');
    if (pError) console.error(pError);
    else console.table(patients);

    console.log('\n2. Fetching All Family Profiles:');
    const { data: families, error: fError } = await supabase
        .from('profiles')
        .select('id, full_name, email, role, linked_patient_id')
        .eq('role', 'family');

    if (fError) console.error(fError);
    else console.table(families);

    console.log('\n3. Checking for specific linkage issues:');
    if (families && patients) {
        families.forEach(fam => {
            if (fam.linked_patient_id) {
                const linkedPatient = patients.find(p => p.id === fam.linked_patient_id);
                if (linkedPatient) {
                    console.log(`✅ Family '${fam.full_name}' is linked to Patient '${linkedPatient.name}' (ID Match)`);
                } else {
                    console.log(`❌ Family '${fam.full_name}' has linked_patient_id ${fam.linked_patient_id}, but NO PATIENT found with that ID.`);
                }
            } else {
                console.log(`⚠️ Family '${fam.full_name}' is NOT linked to any patient.`);
            }
        });
    }
}

debug();
