const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // set in .env.local, never commit

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function testFetch() {
    console.log('Testing fetch...');
    const { data, error } = await supabase
        .from('tasks')
        .select(`
        *,
        caretakers (name),
        patients (name)
    `)
        .limit(1);

    if (error) {
        console.error('Fetch Error:', error);
        console.error('Fetch Error Details:', JSON.stringify(error, null, 2));
    } else {
        console.log('Fetch Success:', data);
    }
}

testFetch();
