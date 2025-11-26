import 'dotenv/config';
import { resolve } from 'path';
import * as dotenv from 'dotenv';
import { GoogleGenAI } from "@google/genai";

// Load .env.local explicitly
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const apiKey = process.env.GEMINI_API_KEY;
const GEMINI_MODEL_NAME = "gemini-2.0-flash-exp";

async function testGeminiDirectly() {
    console.log('Testing Gemini API directly with Google Search...');

    if (!apiKey) {
        console.error('GEMINI_API_KEY is missing');
        return;
    }

    const genAI = new GoogleGenAI({ apiKey });
    const serviceName = "hulu";

    const prompt = `
      Service Name: ${serviceName}

      タスク: Web検索機能を使用して最新の情報を取得し、このサブスクリプションサービスの解約情報をJSON形式で提供してください。
      
      重要: 
      1. **最優先**: 解約手順が具体的に説明されている「公式ヘルプページ」「FAQ」「サポート記事」のURLを探してください。
      2. **次点**: ログイン不要でアクセスできる、解約についての案内ページ。
      3. **禁止**: 
         - ログインページ (例: /login, /signin)
         - トップページ (例: https://service.com/)
         - 汎用的なお問い合わせフォーム
         - 404エラーになる可能性が高い推測URL
      4. **判定**: 確実に「解約方法」が書かれている公開ページが見つからない場合は、無理にURLを返さず、cancellation_urlを空文字列にしてください。

      重要な注意事項:
      - URLは検索結果から取得したものをそのまま使用してください。
      - 自分でURLを推測したり組み立てたりしないでください。
      - ログインページやトップページは避けてください。

      以下のJSON形式で返してください:
      {
        "cancellation_url": "解約ページのURL (見つからない場合は空文字)",
        "steps": [
          { "id": 1, "label": "ステップ名", "description": "詳細な説明" }
        ],
        "required_info": [
          { "label": "必要な情報名", "value": "用途" }
        ],
        "is_cancellable": true
      }

      マークダウン形式は使わず、JSONのみを返してください。
    `;

    try {
        console.log(`Requesting info for: ${serviceName}`);

        const result = await genAI.models.generateContent({
            model: GEMINI_MODEL_NAME,
            contents: prompt,
            config: {
                tools: [{ googleSearch: {} }],
                responseMimeType: "application/json",
            }
        });

        const text = result.text;
        console.log('Raw Response:', text);

        if (text) {
            const data = JSON.parse(text);
            console.log('Parsed Data:', JSON.stringify(data, null, 2));

            if (data.cancellation_url && data.cancellation_url.includes('hulu')) {
                console.log('SUCCESS: Valid URL found!');
            } else {
                console.log('WARNING: URL might be invalid or empty.');
            }
        }
    } catch (error) {
        console.error('API Error:', error);
    }
}

testGeminiDirectly();
