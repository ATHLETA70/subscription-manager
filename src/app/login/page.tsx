"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
    const supabase = createClient();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            setError(error.message);
            setLoading(false);
        } else {
            // 完全リロードしてセッションを確実に反映
            window.location.href = "/dashboard";
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-background">
            <div className="w-full max-w-md p-8 space-y-6 bg-card rounded-xl border shadow-sm">
                <div className="space-y-2 text-center">
                    <h1 className="text-2xl font-bold">ログイン</h1>
                    <p className="text-muted-foreground">アカウントにサインインしてください</p>
                </div>
                <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                        <label htmlFor="email" className="text-sm font-medium">メールアドレス</label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-3 py-2 border rounded-md bg-background"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <label htmlFor="password" className="text-sm font-medium">パスワード</label>
                            <Link href="/reset-password" className="text-xs text-primary hover:underline">
                                パスワードを忘れた場合
                            </Link>
                        </div>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-3 py-2 border rounded-md bg-background"
                            required
                        />
                    </div>
                    {error && <p className="text-sm text-red-500">{error}</p>}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-2 text-white bg-primary rounded-md hover:bg-primary/90 disabled:opacity-50"
                    >
                        {loading ? "ログイン中..." : "ログイン"}
                    </button>
                </form>
                <div className="text-center text-sm">
                    <span className="text-muted-foreground">アカウントをお持ちでない場合は </span>
                    <Link href="/signup" className="text-primary hover:underline">
                        新規登録
                    </Link>
                </div>
            </div>
        </div>
    );
}
