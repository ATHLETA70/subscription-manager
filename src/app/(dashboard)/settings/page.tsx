"use client";

import { User, CreditCard, Check, Zap, Palette } from "lucide-react";
import { ThemeSelector } from "@/components/settings/theme-selector";
import { createClient } from "@/lib/supabase/client";
import { userPlan } from "@/lib/mock-data";
import { useEffect, useState } from "react";

export default function SettingsPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUser() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    }
    fetchUser();
  }, []);

  if (loading) {
    return <div className="p-8 text-center">読み込み中...</div>;
  }

  return (
    <div className="space-y-8 pb-20">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">設定</h1>
        <p className="text-muted-foreground">
          アカウント設定とプランの管理
        </p>
      </div>

      {/* Profile Section */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">プロフィール</h2>
        <div className="p-6 rounded-xl border bg-card flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center">
            <User className="w-8 h-8 text-muted-foreground" />
          </div>
          <div>
            <div className="font-semibold text-lg">ユーザー</div>
            <div className="text-muted-foreground">{user?.email || "guest@example.com"}</div>
          </div>
        </div>
      </section>

      {/* Appearance Section */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Palette className="w-5 h-5" />
          外観
        </h2>
        <div className="p-6 rounded-xl border bg-card">
          <ThemeSelector />
        </div>
      </section>

      {/* Plan Section */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">現在のプラン</h2>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Current Plan Card */}
          <div className="p-6 rounded-xl border bg-card space-y-4 relative overflow-hidden">
            <div className="flex items-center justify-between relative z-10">
              <div>
                <div className="text-sm text-muted-foreground font-medium mb-1">現在利用中</div>
                <div className="text-2xl font-bold">
                  {userPlan.type === 'premium' ? 'プレミアムプラン' : 'フリープラン'}
                </div>
              </div>
              <div className="p-2 rounded-full bg-secondary">
                <User className="w-6 h-6" />
              </div>
            </div>
            <div className="space-y-2 relative z-10">
              <div className="flex items-center gap-2 text-sm">
                <Check className="w-4 h-4 text-green-500" />
                {userPlan.type === 'premium'
                  ? 'サブスク管理 (無制限)'
                  : `サブスク管理 (最大${userPlan.limit}つ)`}
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Check className="w-4 h-4 text-green-500" /> 基本的な解約サポート
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Check className="w-4 h-4 text-muted-foreground" /> 高度な分析機能
              </div>
            </div>
          </div>

          {/* Upgrade Card */}
          <div className="p-6 rounded-xl border border-primary/50 bg-primary/5 space-y-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Zap className="w-32 h-32" />
            </div>

            <div className="flex items-center justify-between relative z-10">
              <div>
                <div className="text-sm text-primary font-medium mb-1">おすすめ</div>
                <div className="text-2xl font-bold">プレミアムプラン</div>
              </div>
              <div className="p-2 rounded-full bg-primary text-primary-foreground">
                <Zap className="w-6 h-6" />
              </div>
            </div>

            <div className="space-y-2 relative z-10">
              <div className="flex items-center gap-2 text-sm">
                <Check className="w-4 h-4 text-primary" /> 無制限のサブスク登録
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Check className="w-4 h-4 text-primary" /> 優先サポート
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Check className="w-4 h-4 text-primary" /> 広告非表示
              </div>
            </div>

            <button className="w-full py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors relative z-10">
              プランを変更する (¥200/月)
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
