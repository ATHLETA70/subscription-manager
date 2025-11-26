import 'dotenv/config';
import { resolve } from 'path';
import * as dotenv from 'dotenv';
import { refreshCancellationInfo } from '../src/actions/cancellation';

// Load .env.local explicitly
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

async function testGeminiSearch() {
    console.log('Testing Gemini Search with "hulu"...');
    try {
        const result = await refreshCancellationInfo('hulu');
        console.log('Result:', JSON.stringify(result, null, 2));

        if (result?.cancellation_url && result.cancellation_url.includes('hulu')) {
            console.log('SUCCESS: Valid URL found!');
        } else {
            console.log('WARNING: URL might be invalid or empty.');
        }
    } catch (error) {
        console.error('ERROR:', error);
    }
}

testGeminiSearch();
