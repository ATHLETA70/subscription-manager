import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// .env.localを読み込む
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const devUserId = process.env.DEV_USER_ID;

if (!supabaseUrl || !supabaseKey || !devUserId) {
    console.error('Missing environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function resetData() {
    console.log(`Resetting data for user: ${devUserId}`);

    const { error } = await supabase
        .from('subscriptions')
        .delete()
        .eq('user_id', devUserId);

    if (error) {
        console.error('Error deleting data:', error);
    } else {
        console.log('Successfully deleted all subscriptions for the test user.');
    }
}

resetData();
