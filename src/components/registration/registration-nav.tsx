"use client";

import { useState } from "react";
import { ExternalLink, Edit, Sparkles, Gift } from "lucide-react";

interface RegistrationNavProps {
    serviceName: string;
    registrationUrl: string;
    hasFreeTrial?: boolean;
    trialPeriod?: string;
    notes?: string;
    onUpdateUrl?: (newUrl: string) => void;
}

export function RegistrationNav({
    serviceName,
    registrationUrl,
    hasFreeTrial,
    trialPeriod,
    notes,
    onUpdateUrl,
}: RegistrationNavProps) {
    const [isEditingUrl, setIsEditingUrl] = useState(false);
    const [customUrl, setCustomUrl] = useState(registrationUrl);

    const handleSaveUrl = () => {
        if (onUpdateUrl && customUrl.trim()) {
            onUpdateUrl(customUrl.trim());
            setIsEditingUrl(false);
        }
    };

    return (
        <div className="rounded-2xl border bg-card p-6 space-y-5">
            <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-green-100 text-green-600">
                    <Sparkles className="w-5 h-5" />
                </div>
                <div className="flex-1">
                    <h3 className="font-semibold text-base">AI再登録アシスタント</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                        {serviceName} の登録ページを特定しました。
                    </p>
                </div>
            </div>

            {isEditingUrl ? (
                <div className="space-y-4 pl-11">
                    <div className="space-y-2">
                        <label htmlFor="custom-reg-url" className="text-sm font-medium text-muted-foreground">
                            登録ページのURL:
                        </label>
                        <input
                            id="custom-reg-url"
                            type="url"
                            value={customUrl}
                            onChange={(e) => setCustomUrl(e.target.value)}
                            placeholder="https://example.com/signup"
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            autoFocus
                        />
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={handleSaveUrl}
                            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
                        >
                            保存
                        </button>
                        <button
                            onClick={() => {
                                setIsEditingUrl(false);
                                setCustomUrl(registrationUrl);
                            }}
                            className="px-4 py-2 rounded-lg border text-sm font-medium hover:bg-accent transition-colors"
                        >
                            キャンセル
                        </button>
                    </div>
                </div>
            ) : (
                <div className="pl-11 space-y-4">
                    {/* Trial Badge (if applicable) */}
                    {hasFreeTrial && (
                        <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                            <Gift className="w-4 h-4 text-green-600" />
                            <span className="text-sm font-medium text-green-700">
                                {trialPeriod ? `${trialPeriod}の無料トライアルあり` : "無料トライアルあり"}
                            </span>
                        </div>
                    )}

                    {/* Notes (if any) */}
                    {notes && (
                        <div className="p-3 bg-muted rounded-lg">
                            <p className="text-sm text-muted-foreground">{notes}</p>
                        </div>
                    )}

                    {/* Registration Button */}
                    {registrationUrl ? (
                        <a
                            href={registrationUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors shadow-sm"
                        >
                            登録ページを開く
                            <ExternalLink className="w-4 h-4" />
                        </a>
                    ) : (
                        <div className="space-y-3">
                            <div className="flex items-center gap-3 p-4 bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl">
                                <div className="w-8 h-8 rounded-full bg-white dark:bg-slate-700 flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-600 shadow-sm">
                                    <span className="text-slate-500 dark:text-slate-400 font-bold">?</span>
                                </div>
                                <p className="text-sm text-slate-700 dark:text-slate-300 font-medium">
                                    該当のURLは見つかりませんでした
                                </p>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                公開情報から登録ページのURLを特定できませんでした。お手数ですが、下のボタンから手動でURLを設定してください。
                            </p>
                        </div>
                    )}

                    <div className="flex justify-end">
                        <button
                            onClick={() => setIsEditingUrl(true)}
                            className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors"
                        >
                            <Edit className="w-3 h-3" />
                            URLを修正する
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
