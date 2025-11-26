"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function AuthListener() {
    const router = useRouter();
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState(false);

    useEffect(() => {
        const handleAuth = async () => {
            // ハッシュにaccess_tokenが含まれているかチェック
            if (typeof window !== 'undefined' && window.location.hash.includes('access_token')) {
                console.log('[AuthListener] Access token detected in URL');
                setIsProcessing(true);

                // 10秒のタイムアウト
                const timeout = setTimeout(() => {
                    console.error('[AuthListener] Timeout: リダイレクトに失敗しました');
                    setError(true);
                }, 10000);

                const supabase = createClient();

                // Supabaseがハッシュを処理するまで少し待機
                await new Promise(resolve => setTimeout(resolve, 500));

                // セッションチェック
                console.log('[AuthListener] Checking session...');
                const { data: { session }, error: sessionError } = await supabase.auth.getSession();

                if (sessionError) {
                    console.error('[AuthListener] Session error:', sessionError);
                    clearTimeout(timeout);
                    setError(true);
                    return;
                }

                if (session) {
                    console.log('[AuthListener] Session found, redirecting to dashboard');
                    clearTimeout(timeout);
                    router.replace("/dashboard");
                } else {
                    console.warn('[AuthListener] No session found after hash processing');
                    // セッションがない場合も監視を継続
                    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
                        console.log('[AuthListener] Auth state changed:', event, session ? 'Session exists' : 'No session');
                        if (event === 'SIGNED_IN' || session) {
                            clearTimeout(timeout);
                            router.replace("/dashboard");
                        }
                    });

                    // クリーンアップ関数を設定
                    return () => {
                        clearTimeout(timeout);
                        subscription.unsubscribe();
                    };
                }
            }
        };

        handleAuth();
    }, [router]);

    if (error) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-sm">
                <div className="text-center max-w-md p-6">
                    <p className="text-lg font-medium text-destructive mb-4">認証に失敗しました</p>
                    <p className="text-sm text-muted-foreground mb-6">
                        自動リダイレクトに失敗しました。手動でダッシュボードに移動してください。
                    </p>
                    <a
                        href="/dashboard"
                        className="px-6 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity inline-block"
                    >
                        ダッシュボードへ
                    </a>
                    <p className="text-xs text-muted-foreground mt-4">
                        それでも問題が解決しない場合は、もう一度ログインしてください。
                    </p>
                </div>
            </div>
        );
    }

    if (isProcessing) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-sm">
                <div className="text-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
                    <p className="text-lg font-medium">認証中...</p>
                    <p className="text-sm text-muted-foreground">ダッシュボードへ移動しています...</p>
                </div>
            </div>
        );
    }

    return null;
}
