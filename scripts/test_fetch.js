const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qkbstsilkczvzgxmhsnw.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFrYnN0c2lsa2N6dnpneG1oc253Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTQxNDkxMywiZXhwIjoyMDg2OTkwOTEzfQ.L8VrQbtMKtl7KWmq4tpH048hICLwH_VT95NzqRhochE';

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
