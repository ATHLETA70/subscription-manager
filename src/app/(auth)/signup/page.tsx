"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const formData = new FormData(e.currentTarget);
        const email = formData.get("email") as string;
        const password = formData.get("password") as string;
        const confirmPassword = formData.get("confirmPassword") as string;

        if (password !== confirmPassword) {
            setError("パスワードが一致しません");
            setLoading(false);
            return;
        }

        if (password.length < 6) {
            setError("パスワードは6文字以上である必要があります");
            setLoading(false);
            return;
        }

        try {
            const supabase = createClient();
            const { error: signUpError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    emailRedirectTo: `${window.location.origin}/auth/callback`,
                },
            });

            if (signUpError) throw signUpError;

            setSuccess(true);
            // Redirect to login after 2 seconds
            setTimeout(() => {
                router.push("/login");
            }, 2000);
        } catch (err: any) {
            setError(err.message || "登録中にエラーが発生しました");
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
            <div className="w-full max-w-md space-y-8">
                <div className="text-center">
                    <h1 className="text-3xl font-bold tracking-tight">アカウントを作成</h1>
                    <p className="text-muted-foreground mt-2">
                        サブスクリプション管理を始めましょう
                    </p>
                </div>

                {error && (
                    <div className="p-4 rounded-lg bg-destructive/10 text-destructive text-sm">
                        {error}
                    </div>
                )}

                {success ? (
                    <div className="p-6 rounded-xl border bg-card text-center space-y-4">
                        <div className="text-primary text-4xl">✓</div>
                        <div>
                            <h3 className="text-lg font-semibold">登録完了！</h3>
                            <p className="text-sm text-muted-foreground mt-2">
                                確認メールを送信しました。メールを確認してアカウントを有効化してください。
                            </p>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="p-6 rounded-xl border bg-card space-y-4">
                            <div className="space-y-2">
                                <label htmlFor="email" className="text-sm font-medium">
                                    メールアドレス
                                </label>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    required
                                    placeholder="your@email.com"
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                />
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="password" className="text-sm font-medium">
                                    パスワード
                                </label>
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    required
                                    placeholder="••••••••"
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                />
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="confirmPassword" className="text-sm font-medium">
                                    パスワード（確認）
                                </label>
                                <input
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    type="password"
                                    required
                                    placeholder="••••••••"
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-11 px-8"
                        >
                            {loading ? "登録中..." : "アカウントを作成"}
                        </button>

                        <div className="text-center text-sm">
                            <span className="text-muted-foreground">すでにアカウントをお持ちですか？ </span>
                            <Link href="/login" className="text-primary hover:underline">
                                ログイン
                            </Link>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
