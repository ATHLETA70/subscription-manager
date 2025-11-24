import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Lock, ArrowRight, CreditCard } from "lucide-react";

export default function RegisterPage() {
    return (
        <div className="bg-card border rounded-2xl shadow-lg p-8 space-y-6">
            <div className="text-center space-y-2">
                <div className="flex justify-center mb-4">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-primary/10 rounded-xl">
                            <CreditCard className="w-6 h-6 text-primary" />
                        </div>
                        <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-400">
                            SubManager
                        </span>
                    </div>
                </div>
                <h1 className="text-2xl font-bold tracking-tight">アカウント作成</h1>
                <p className="text-sm text-muted-foreground">
                    サブスクリプション管理を始めましょう
                </p>
            </div>

            <form className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="email">メールアドレス</Label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                            id="email"
                            placeholder="name@example.com"
                            type="email"
                            className="pl-10"
                            required
                        />
                    </div>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="password">パスワード</Label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                            id="password"
                            placeholder="••••••••"
                            type="password"
                            className="pl-10"
                            required
                        />
                    </div>
                </div>
                <Button type="submit" className="w-full">
                    アカウントを作成
                    <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
            </form>

            <div className="text-center text-sm text-muted-foreground">
                すでにアカウントをお持ちですか？{" "}
                <Link href="/login" className="font-medium text-primary hover:underline">
                    ログイン
                </Link>
            </div>
        </div>
    );
}
