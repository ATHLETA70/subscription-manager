import * as dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { resolve } from 'path';

// Load .env.local explicitly
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
// Use service role key to bypass RLS for seeding
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

const servicesData = [
    {
        service_name: 'ahamo',
        cancellation_url: 'https://ahamo.com/support/leave/index.html',
        is_cancellable: true,
        cancellation_steps: [
            { id: 1, label: 'ahamo公式サイトにアクセス', description: 'https://ahamo.com/ にアクセスし、dアカウントでログインしてください。' },
            { id: 2, label: '解約手続きページに移動', description: '「ahamoお手続きページ」またはMy docomoから解約手続きに進んでください。' },
            { id: 3, label: '手続き完了', description: '画面の指示に従って解約手続きを完了してください。' }
        ],
        required_info: [
            { label: 'dアカウント', value: 'ログインに必要' },
            { label: 'SIMカードまたはeSIM', value: '契約中のもの' }
        ],
        verified: true
    },
    {
        service_name: 'netflix',
        cancellation_url: 'https://help.netflix.com/ja/node/407',
        is_cancellable: true,
        cancellation_steps: [
            { id: 1, label: 'Netflixにログイン', description: 'Netflixのウェブサイトにアクセスし、アカウントにログインします。' },
            { id: 2, label: 'メンバーシップの管理', description: 'アカウントページから「メンバーシップの管理」に移動します。' },
            { id: 3, label: 'キャンセル手続き', description: '「キャンセル」をクリックし、「キャンセル手続きの完了」を選択します。' }
        ],
        required_info: [
            { label: 'メールアドレス', value: 'ログインに必要' },
            { label: 'パスワード', value: 'ログインに必要' }
        ],
        verified: true
    },
    {
        service_name: 'amazon prime',
        cancellation_url: '',  // 直接URLなし、アカウント設定から
        is_cancellable: true,
        cancellation_steps: [
            { id: 1, label: 'Amazonにログイン', description: 'Amazon.co.jpにアクセスし、アカウントにログインします。' },
            { id: 2, label: 'アカウントサービス', description: 'メニューから「アカウントサービス」を選択します。' },
            { id: 3, label: 'プライム会員情報', description: '「プライム」または「プライム会員情報の設定・変更」をクリックします。' },
            { id: 4, label: '会員資格を終了', description: '「プライム会員資格を終了し、特典の利用を止める」を選択し、画面の指示に従います。' }
        ],
        required_info: [
            { label: 'メールアドレスまたは電話番号', value: 'ログインに必要' },
            { label: 'パスワード', value: 'ログインに必要' }
        ],
        verified: true
    },
    {
        service_name: 'youtube premium',
        cancellation_url: 'https://support.google.com/youtube/answer/6308278',
        is_cancellable: true,
        cancellation_steps: [
            { id: 1, label: 'YouTubeにアクセス', description: 'YouTube.comにアクセスし、アカウントにログインします。' },
            { id: 2, label: 'メンバーシップ設定', description: '右上のプロフィールアイコンから「購入とメンバーシップ」を選択します。' },
            { id: 3, label: '解約手続き', description: 'YouTube Premiumの横にある「管理」をクリックし、「解約」を選択します。' }
        ],
        required_info: [
            { label: 'Googleアカウント', value: 'ログインに必要' }
        ],
        verified: true
    },
    {
        service_name: 'spotify',
        cancellation_url: 'https://support.spotify.com/jp/article/cancel-subscription/',
        is_cancellable: true,
        cancellation_steps: [
            { id: 1, label: 'Spotifyにログイン', description: 'Spotify.comにアクセスし、アカウントにログインします。' },
            { id: 2, label: 'アカウント設定', description: 'アカウントページから「サブスクリプション」セクションに移動します。' },
            { id: 3, label: 'プラン変更', description: '「プランを変更」をクリックし、無料プランまたは「Premium をキャンセル」を選択します。' }
        ],
        required_info: [
            { label: 'メールアドレス', value: 'ログインに必要' },
            { label: 'パスワード', value: 'ログインに必要' }
        ],
        verified: true
    },
    {
        service_name: 'disney+',
        cancellation_url: 'https://help.disneyplus.com/csp',
        is_cancellable: true,
        cancellation_steps: [
            { id: 1, label: 'Disney+にログイン', description: 'DisneyPlus.comにアクセスし、アカウントにログインします。' },
            { id: 2, label: 'アカウント設定', description: 'プロフィールアイコンから「アカウント」を選択します。' },
            { id: 3, label: 'サブスクリプション管理', description: '「サブスクリプション」から「Disney+をキャンセル」を選択し、手続きを完了します。' }
        ],
        required_info: [
            { label: 'メールアドレス', value: 'ログインに必要' },
            { label: 'パスワード', value: 'ログインに必要' }
        ],
        verified: true
    }
];

async function seedCancellationData() {
    console.log('Starting data seeding...');

    for (const service of servicesData) {
        try {
            const { data, error } = await supabase
                .from('service_cancellation_info')
                .upsert({
                    service_name: service.service_name,
                    cancellation_url: service.cancellation_url,
                    cancellation_steps: service.cancellation_steps,
                    required_info: service.required_info,
                    is_cancellable: service.is_cancellable,
                    verified: service.verified,
                    updated_at: new Date().toISOString()
                }, {
                    onConflict: 'service_name',
                    ignoreDuplicates: false
                });

            if (error) {
                console.error(`Error seeding ${service.service_name}:`, error);
            } else {
                console.log(`✓ Successfully seeded: ${service.service_name}`);
            }
        } catch (err) {
            console.error(`Exception seeding ${service.service_name}:`, err);
        }
    }

    console.log('Data seeding completed!');
}

seedCancellationData();
