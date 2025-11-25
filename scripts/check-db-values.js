const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase URL or Key');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkValues() {
    const { data: categories, error: catError } = await supabase
        .from('subscriptions')
        .select('category');

    if (catError) {
        console.error('Error fetching categories:', catError);
    } else {
        const uniqueCategories = [...new Set(categories.map(c => c.category))];
        console.log('Unique Categories:', uniqueCategories);
    }

    const { data: statuses, error: statError } = await supabase
        .from('subscriptions')
        .select('status');

    if (statError) {
        console.error('Error fetching statuses:', statError);
    } else {
        const uniqueStatuses = [...new Set(statuses.map(s => s.status))];
        console.log('Unique Statuses:', uniqueStatuses);
    }
}

checkValues();
