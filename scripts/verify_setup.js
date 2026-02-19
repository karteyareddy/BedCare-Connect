const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Load env vars manually since we are running a raw script
function loadEnv() {
    const envPath = path.resolve(process.cwd(), '.env.local');
    console.log(`Checking env at: ${envPath}`);
    if (!fs.existsSync(envPath)) {
        console.error('❌ .env.local not found!');
        return {};
    }
    const content = fs.readFileSync(envPath, 'utf8');
    const env = {};
    content.split(/\r?\n/).forEach(line => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) return;

        const eqIdx = trimmed.indexOf('=');
        if (eqIdx > 0) {
            const key = trimmed.substring(0, eqIdx).trim();
            let val = trimmed.substring(eqIdx + 1).trim();
            // Remove quotes if present
            if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
                val = val.substring(1, val.length - 1);
            }
            env[key] = val;
        }
    });
    return env;
}

async function verify() {
    console.log('🔍 Starting Verification...');
    const env = loadEnv();

    const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const geminiKey = env.GEMINI_API_KEY;

    if (!supabaseUrl || !supabaseKey || !geminiKey) {
        console.error('❌ Missing environment variables in .env.local');
        console.log(`URL: ${supabaseUrl ? 'OK' : 'MISSING'}`);
        console.log(`Anon Key: ${supabaseKey ? 'OK' : 'MISSING'}`);
        console.log(`Gemini Key: ${geminiKey ? 'OK' : 'MISSING'}`);
        return;
    }

    // 1. Verify Supabase
    try {
        console.log('📡 Connecting to Supabase...');
        const supabase = createClient(supabaseUrl, supabaseKey);
        const { data, error } = await supabase.from('organizations').select('count', { count: 'exact', head: true });

        if (error) throw error;
        console.log('✅ Supabase Connection: SUCCESS');
    } catch (err) {
        console.error('❌ Supabase Connection: FAILED');
        console.error(err.message);
    }

    // 2. Verify Gemini
    try {
        console.log('🧠 Connecting to Gemini...');
        const genAI = new GoogleGenerativeAI(geminiKey);
        // List models to debug
        // Note: listModels is on the genAI instance or via a specific endpoint? 
        // Docs say genAI.getGenerativeModel... 
        // Actually, there isn't a direct listModels on the high-level `genAI` object in some versions.
        // But let's try to just use 'gemini-pro' again but with error logging, OR try a different approach.
        // Let's try to fetch the models via REST if SDK fails, but SDK should have it?
        // Actually, let's just log the error and tell user.
        // It's likely the key is for a different project or something. 
        // But let's try one more common name: 'gemini-1.0-pro'

        console.log("Trying model: 'gemini-pro' again with clear error handling...");
        const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
        try {
            const result = await model.generateContent('Hello');
            const response = await result.response;
            console.log(`✅ Gemini API: SUCCESS (Response: "${response.text()}")`);
            return;
        } catch (e) { console.log('gemini-pro failed'); }

        console.log("Trying model: 'gemini-1.5-flash'...");
        const model2 = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        try {
            const result = await model2.generateContent('Hello');
            const response = await result.response;
            console.log(`✅ Gemini API: SUCCESS (Response: "${response.text()}")`);
            return;
        } catch (e) { console.log('gemini-1.5-flash failed: ' + e.message); }

        console.error('❌ All model attempts failed. Please check your API key and enabled models in Google AI Studio.');

    } catch (err) {
        console.error('❌ Gemini API: FAILED (Initialization)');
        console.error(`Error: ${err.message}`);
    }
}

verify();
