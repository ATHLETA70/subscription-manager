-- Main Services Cancellation Data Seeding SQL
-- Run this in Supabase SQL Editor to seed the service_cancellation_info table

-- ahamo
INSERT INTO service_cancellation_info (service_name, cancellation_url, is_cancellable, cancellation_steps, required_info, verified, updated_at)
VALUES (
  'ahamo',
  'https://ahamo.com/support/leave/index.html',
  true,
  '[
    {"id": 1, "label": "ahamo公式サイトにアクセス", "description": "https://ahamo.com/ にアクセスし、dアカウントでログインしてください。"},
    {"id": 2, "label": "解約手続きページに移動", "description": "「ahamoお手続きページ」またはMy docomoから解約手続きに進んでください。"},
    {"id": 3, "label": "手続き完了", "description": "画面の指示に従って解約手続きを完了してください。"}
  ]'::jsonb,
  '[
    {"label": "dアカウント", "value": "ログインに必要"},
    {"label": "SIMカードまたはeSIM", "value": "契約中のもの"}
  ]'::jsonb,
  true,
  NOW()
)
ON CONFLICT (service_name) DO UPDATE SET
  cancellation_url = EXCLUDED.cancellation_url,
  cancellation_steps = EXCLUDED.cancellation_steps,
  required_info = EXCLUDED.required_info,
  verified = EXCLUDED.verified,
  updated_at = NOW();

-- Netflix
INSERT INTO service_cancellation_info (service_name, cancellation_url, is_cancellable, cancellation_steps, required_info, verified, updated_at)
VALUES (
  'netflix',
  'https://help.netflix.com/ja/node/407',
  true,
  '[
    {"id": 1, "label": "Netflixにログイン", "description": "Netflixのウェブサイトにアクセスし、アカウントにログインします。"},
    {"id": 2, "label": "メンバーシップの管理", "description": "アカウントページから「メンバーシップの管理」に移動します。"},
    {"id": 3, "label": "キャンセル手続き", "description": "「キャンセル」をクリックし、「キャンセル手続きの完了」を選択します。"}
  ]'::jsonb,
  '[
    {"label": "メールアドレス", "value": "ログインに必要"},
    {"label": "パスワード", "value": "ログインに必要"}
  ]'::jsonb,
  true,
  NOW()
)
ON CONFLICT (service_name) DO UPDATE SET
  cancellation_url = EXCLUDED.cancellation_url,
  cancellation_steps = EXCLUDED.cancellation_steps,
  required_info = EXCLUDED.required_info,
  verified = EXCLUDED.verified,
  updated_at = NOW();

-- Amazon Prime
INSERT INTO service_cancellation_info (service_name, cancellation_url, is_cancellable, cancellation_steps, required_info, verified, updated_at)
VALUES (
  'amazon prime',
  '',
  true,
  '[
    {"id": 1, "label": "Amazonにログイン", "description": "Amazon.co.jpにアクセスし、アカウントにログインします。"},
    {"id": 2, "label": "アカウントサービス", "description": "メニューから「アカウントサービス」を選択します。"},
    {"id": 3, "label": "プライム会員情報", "description": "「プライム」または「プライム会員情報の設定・変更」をクリックします。"},
    {"id": 4, "label": "会員資格を終了", "description": "「プライム会員資格を終了し、特典の利用を止める」を選択し、画面の指示に従います。"}
  ]'::jsonb,
  '[
    {"label": "メールアドレスまたは電話番号", "value": "ログインに必要"},
    {"label": "パスワード", "value": "ログインに必要"}
  ]'::jsonb,
  true,
  NOW()
)
ON CONFLICT (service_name) DO UPDATE SET
  cancellation_url = EXCLUDED.cancellation_url,
  cancellation_steps = EXCLUDED.cancellation_steps,
  required_info = EXCLUDED.required_info,
  verified = EXCLUDED.verified,
  updated_at = NOW();

-- YouTube Premium
INSERT INTO service_cancellation_info (service_name, cancellation_url, is_cancellable, cancellation_steps, required_info, verified, updated_at)
VALUES (
  'youtube premium',
  'https://support.google.com/youtube/answer/6308278',
  true,
  '[
    {"id": 1, "label": "YouTubeにアクセス", "description": "YouTube.comにアクセスし、アカウントにログインします。"},
    {"id": 2, "label": "メンバーシップ設定", "description": "右上のプロフィールアイコンから「購入とメンバーシップ」を選択します。"},
    {"id": 3, "label": "解約手続き", "description": "YouTube Premiumの横にある「管理」をクリックし、「解約」を選択します。"}
  ]'::jsonb,
  '[
    {"label": "Googleアカウント", "value": "ログインに必要"}
  ]'::jsonb,
  true,
  NOW()
)
ON CONFLICT (service_name) DO UPDATE SET
  cancellation_url = EXCLUDED.cancellation_url,
  cancellation_steps = EXCLUDED.cancellation_steps,
  required_info = EXCLUDED.required_info,
  verified = EXCLUDED.verified,
  updated_at = NOW();

-- Spotify
INSERT INTO service_cancellation_info (service_name, cancellation_url, is_cancellable, cancellation_steps, required_info, verified, updated_at)
VALUES (
  'spotify',
  'https://support.spotify.com/jp/article/cancel-subscription/',
  true,
  '[
    {"id": 1, "label": "Spotifyにログイン", "description": "Spotify.comにアクセスし、アカウントにログインします。"},
    {"id": 2, "label": "アカウント設定", "description": "アカウントページから「サブスクリプション」セクションに移動します。"},
    {"id": 3, "label": "プラン変更", "description": "「プランを変更」をクリックし、無料プランまたは「Premium をキャンセル」を選択します。"}
  ]'::jsonb,
  '[
    {"label": "メールアドレス", "value": "ログインに必要"},
    {"label": "パスワード", "value": "ログインに必要"}
  ]'::jsonb,
  true,
  NOW()
)
ON CONFLICT (service_name) DO UPDATE SET
  cancellation_url = EXCLUDED.cancellation_url,
  cancellation_steps = EXCLUDED.cancellation_steps,
  required_info = EXCLUDED.required_info,
  verified = EXCLUDED.verified,
  updated_at = NOW();

-- Disney+
INSERT INTO service_cancellation_info (service_name, cancellation_url, is_cancellable, cancellation_steps, required_info, verified, updated_at)
VALUES (
  'disney+',
  'https://help.disneyplus.com/csp',
  true,
  '[
    {"id": 1, "label": "Disney+にログイン", "description": "DisneyPlus.comにアクセスし、アカウントにログインします。"},
    {"id": 2, "label": "アカウント設定", "description": "プロフィールアイコンから「アカウント」を選択します。"},
    {"id": 3, "label": "サブスクリプション管理", "description": "「サブスクリプション」から「Disney+をキャンセル」を選択し、手続きを完了します。"}
  ]'::jsonb,
  '[
    {"label": "メールアドレス", "value": "ログインに必要"},
    {"label": "パスワード", "value": "ログインに必要"}
  ]'::jsonb,
  true,
  NOW()
)
ON CONFLICT (service_name) DO UPDATE SET
  cancellation_url = EXCLUDED.cancellation_url,
  cancellation_steps = EXCLUDED.cancellation_steps,
  required_info = EXCLUDED.required_info,
  verified = EXCLUDED.verified,
  updated_at = NOW();
