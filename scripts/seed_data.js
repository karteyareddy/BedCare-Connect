const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load env
function loadEnv() {
    const envPath = path.resolve(process.cwd(), '.env.local');
    if (!fs.existsSync(envPath)) return {};
    const content = fs.readFileSync(envPath, 'utf8');
    const env = {};
    content.split(/\r?\n/).forEach(line => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) return;
        const eqIdx = trimmed.indexOf('=');
        if (eqIdx > 0) {
            const key = trimmed.substring(0, eqIdx).trim();
            let val = trimmed.substring(eqIdx + 1).trim();
            if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
                val = val.substring(1, val.length - 1);
            }
            env[key] = val;
        }
    });
    return env;
}

const env = loadEnv();
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
    console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY or URL in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

async function seed() {
    console.log('🌱 Seeding Test Data...');

    try {
        // 1. Create Organization
        console.log('Creating Organization...');
        const { data: org, error: orgError } = await supabase
            .from('organizations')
            .insert([{ name: 'City General Hospital', owner_name: 'Dr. House', license_number: 'CGH-12345' }])
            .select()
            .single();

        if (orgError) throw orgError;
        const orgId = org.id;

        // Helper to create user
        const createUser = async (email, password, role, name, extraData = {}) => {
            console.log(`Creating ${role}: ${email}...`);
            // 1. Create Auth User
            const { data: { user }, error: authError } = await supabase.auth.admin.createUser({
                email,
                password,
                email_confirm: true
            });

            if (authError) {
                console.log(`   ⚠️ Auth User ${email} might already exist: ${authError.message}`);
                // Try to get user if exists
                // For simplified seeding, we might just fail or skip. 
                // Let's assume we proceed to profile creation only if user creation succeeded OR we fetch the ID.
                return null;
            }

            // 2. Create Profile
            const { error: profileError } = await supabase
                .from('profiles')
                .insert([{
                    id: user.id,
                    email,
                    role,
                    full_name: name,
                    organization_id: role === 'super_admin' ? null : orgId
                }]);

            if (profileError) console.error(`   ❌ Profile Error: ${profileError.message}`);

            // 3. Role specific tables
            if (role === 'caretaker') {
                const { error: ctError } = await supabase.from('caretakers').insert([{
                    user_id: user.id,
                    organization_id: orgId,
                    name: name,
                    phone: '555-0101',
                    specialization: 'Geriatrics'
                }]);
                if (ctError) console.error(`   ❌ Caretaker Table Error: ${ctError.message}`);
            }

            return user.id;
        };

        // 2. Create Users
        await createUser('admin@bedcare.com', 'password123', 'super_admin', 'Super Admin User');
        await createUser('org@hospital.com', 'password123', 'org_admin', 'Hospital Admin');
        const caretakerId = await createUser('nurse@hospital.com', 'password123', 'caretaker', 'Nurse Jackie');

        // Need to get the caretaker UUID from the `caretakers` table, not `auth.users`
        let caretakerRecordId = null;
        if (caretakerId) { // if new user created
            const { data: ct } = await supabase.from('caretakers').select('id').eq('user_id', caretakerId).single();
            caretakerRecordId = ct?.id;
        }

        // 3. Create Patient (Linked to Caretaker)
        // We create a profile for patient too if they have login
        const patientUserId = await createUser('patient@hospital.com', 'password123', 'patient', 'John Doe');

        console.log('Creating Patient Record...');
        const { data: patient, error: patError } = await supabase.from('patients').insert([{
            user_id: patientUserId, // optional
            organization_id: orgId,
            caretaker_id: caretakerRecordId,
            name: 'John Doe',
            room_number: '101-A',
            condition: 'Recovering from Surgery',
            age: 72,
            gender: 'Male',
            admission_date: new Date()
        }]).select().single();

        if (patError) throw patError;

        // 4. Create Family (Linked to Patient)
        // In our dashboard code we "hacked" linking via organization match. 
        // Real app would link properly. 
        await createUser('family@home.com', 'password123', 'family', 'Jane Doe (Daughter)');

        // 5. Create some Tasks
        console.log('Creating Tasks...');
        await supabase.from('tasks').insert([
            { patient_id: patient.id, caretaker_id: caretakerRecordId, title: 'Morning Meds', description: 'Administer 500mg Paracetamol', status: 'pending', due_date: new Date() },
            { patient_id: patient.id, caretaker_id: caretakerRecordId, title: 'Check Vitals', description: 'Measure BP and Heart Rate', status: 'completed', proof_url: 'https://placehold.co/600x400', due_date: new Date(Date.now() - 86400000) }
        ]);

        console.log('✅ Seeding Complete!');

    } catch (err) {
        console.error('❌ Seeding Failed:', err);
    }
}

seed();
