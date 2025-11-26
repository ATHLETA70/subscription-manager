
"use client";

import { useState } from "react";
import { ExternalLink, FileText, Edit, ArrowRight, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface Step {
    id: number;
    label: string;
    description?: string;
}

interface CancellationNavProps {
    serviceName: string;
    cancelUrl: string;
    steps: Step[]; // Kept for interface compatibility but not used
    requiredInfo?: { label: string; value: string }[];
    onUpdateUrl?: (newUrl: string) => void;
}

export function CancellationNav({
    serviceName,
    cancelUrl,
    requiredInfo,
    onUpdateUrl,
}: CancellationNavProps) {
    const [isEditingUrl, setIsEditingUrl] = useState(false);
    const [customUrl, setCustomUrl] = useState(cancelUrl);

    const handleSaveUrl = () => {
        if (onUpdateUrl && customUrl.trim()) {
            onUpdateUrl(customUrl.trim());
            setIsEditingUrl(false);
        }
    };

    return (
        <div className="rounded-2xl border bg-card p-6 space-y-5">
            <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-purple-100 text-purple-600">
                    <Sparkles className="w-5 h-5" />
                </div>
                <div className="flex-1">
                    <h3 className="font-semibold text-base">AI解約アシスタント</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                        {serviceName} の解約ページを特定しました。
                    </p>
                </div>
            </div>

            {isEditingUrl ? (
                <div className="space-y-4 pl-11">
                    <div className="space-y-2">
                        <label htmlFor="custom-url" className="text-sm font-medium text-muted-foreground">
                            解約ページのURL:
                        </label>
                        <input
                            id="custom-url"
                            type="url"
                            value={customUrl}
                            onChange={(e) => setCustomUrl(e.target.value)}
                            placeholder="https://example.com/cancel"
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
                                setCustomUrl(cancelUrl);
                            }}
                            className="px-4 py-2 rounded-lg border text-sm font-medium hover:bg-accent transition-colors"
                        >
                            キャンセル
                        </button>
                    </div>
                </div>
            ) : (
                <div className="pl-11 space-y-4">
                    {cancelUrl ? (
                        <a
                            href={cancelUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-primary text-primary-foreground rounded-xl font-medium hover:opacity-90 transition-opacity shadow-sm"
                        >
                            解約ページを開く
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
                                公開情報から解約ページのURLを特定できませんでした。お手数ですが、下のボタンから手動でURLを設定してください。
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

