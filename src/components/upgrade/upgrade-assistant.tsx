"use client";

import { AlertTriangle, CheckCircle2, ExternalLink } from "lucide-react";

interface UpgradeAssistantProps {
    serviceName: string;
}

interface Step {
    id: number;
    label: string;
    description: string;
}

// Service-specific upgrade information
const UPGRADE_INFO: Record<string, { upgradeUrl: string; steps: Step[] }> = {
    "DAZN": {
        upgradeUrl: "https://www.dazn.com/ja-JP/subscribe",
        steps: [
            { id: 1, label: "DAZNのWebサイトにアクセス", description: "公式サイトから登録を開始します" },
            { id: 2, label: "プランを選択", description: "月額プランまたは年額プランを選択してください" },
            { id: 3, label: "アカウント情報を入力", description: "メールアドレスとパスワードを設定します" },
            { id: 4, label: "支払い情報を登録", description: "クレジットカード情報を入力して登録完了です" },
        ],
    },
    "Netflix": {
        upgradeUrl: "https://www.netflix.com/signup",
        steps: [
            { id: 1, label: "Netflixにアクセス", description: "公式サイトで新規登録を開始" },
            { id: 2, label: "プランを選択", description: "ベーシック、スタンダード、プレミアムから選択" },
            { id: 3, label: "アカウント作成", description: "メールアドレスとパスワードを設定" },
            { id: 4, label: "支払い方法を登録", description: "クレジットカードまたはその他の支払い方法を選択" },
        ],
    },
    "Spotify": {
        upgradeUrl: "https://www.spotify.com/premium/",
        steps: [
            { id: 1, label: "Spotify Premiumページへ", description: "プレミアムプランの詳細を確認" },
            { id: 2, label: "プランを選択", description: "Individual、Duo、Familyから選択" },
            { id: 3, label: "ログインまたは登録", description: "既存アカウントでログインまたは新規作成" },
            { id: 4, label: "支払い情報を追加", description: "クレジットカード情報を入力して開始" },
        ],
    },
    "default": {
        upgradeUrl: "",
        steps: [
            { id: 1, label: "サービスのWebサイトにアクセス", description: "公式サイトで登録ページを探します" },
            { id: 2, label: "プランを選択", description: "利用可能なプランと料金を確認" },
            { id: 3, label: "アカウントを作成", description: "メールアドレスとパスワードを設定" },
            { id: 4, label: "支払い情報を登録", description: "支払い方法を追加してサービス開始" },
        ],
    },
};

export function UpgradeAssistant({ serviceName }: UpgradeAssistantProps) {
    // Get upgrade info for this service
    let upgradeData = UPGRADE_INFO["default"];
    for (const [key, value] of Object.entries(UPGRADE_INFO)) {
        if (serviceName.toLowerCase().includes(key.toLowerCase())) {
            upgradeData = value;
            break;
        }
    }

    return (
        <div className="p-6 rounded-2xl border border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-cyan-500/5 space-y-4">
            <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                    <AlertTriangle className="w-5 h-5 text-blue-500" />
                </div>
                <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-1">有料化の準備はできましたか？</h3>
                    <p className="text-sm text-muted-foreground">
                        {serviceName} をスムーズに有料化するためのステップガイドを用意しました。
                        所要時間: 約2分
                    </p>
                </div>
            </div>

            <div className="space-y-3">
                {upgradeData.steps.map((step, index) => (
                    <div key={step.id} className="flex gap-3">
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold">
                            {index + 1}
                        </div>
                        <div className="flex-1 pt-0.5">
                            <div className="font-medium text-sm">{step.label}</div>
                            <div className="text-xs text-muted-foreground mt-0.5">{step.description}</div>
                        </div>
                        {index === upgradeData.steps.length - 1 && (
                            <CheckCircle2 className="w-5 h-5 text-blue-500 flex-shrink-0" />
                        )}
                    </div>
                ))}
            </div>

            {upgradeData.upgradeUrl && (
                <a
                    href={upgradeData.upgradeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-medium transition-colors"
                >
                    有料化プロセスを開始する
                    <ExternalLink className="w-4 h-4" />
                </a>
            )}
        </div>
    );
}
