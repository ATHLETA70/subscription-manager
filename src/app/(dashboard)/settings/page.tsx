"use client";

import { User, CreditCard, Check, Zap, Palette, Bell, LogOut, Settings } from "lucide-react";
import { ThemeSelector } from "@/components/settings/theme-selector";
import { createClient } from "@/lib/supabase/client";
import { useUserPlan } from "@/hooks/use-user-plan";
import { UpgradeButton } from "@/components/subscriptions/upgrade-button";
import { useEffect, useState } from "react";
import { getNotificationPreferences, updateNotificationPreferences } from "@/actions/notifications";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { CategoryManagement } from "@/components/settings/category-management";

import { LoadingSpinner } from "@/components/ui/loading-spinner";

export default function SettingsPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [daysBeforeBilling, setDaysBeforeBilling] = useState(7);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [savingNotifications, setSavingNotifications] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const router = useRouter();
  const { plan, loading: planLoading, error } = useUserPlan();

  useEffect(() => {
    async function fetchUser() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      // Fetch notification preferences
      const preferences = await getNotificationPreferences();
      if (preferences) {
        setDaysBeforeBilling(preferences.days_before_billing);
        setPushNotifications(preferences.push_notifications);
      }

      setLoading(false);
    }
    fetchUser();
  }, []);

  const handleSaveNotificationSettings = async () => {
    setSavingNotifications(true);
    const result = await updateNotificationPreferences(daysBeforeBilling, false, pushNotifications);

    if (result.success) {
      toast.success("通知設定を保存しました");
    } else {
      toast.error(result.error || "保存に失敗しました");
    }

    setSavingNotifications(false);
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    toast.success("ログアウトしました");
    window.location.href = "/login";
  };

  if (loading) {
    return <div className="p-8 text-center">読み込み中...</div>;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-4 md:space-y-8 pb-20">
      <div className="flex items-center gap-3 md:gap-4">
        <div className="p-2 md:p-3 bg-primary/10 rounded-full">
          <Settings className="w-5 h-5 md:w-6 md:h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight">設定</h1>
          <p className="text-xs md:text-sm text-muted-foreground">
            アカウント設定とプランの管理
          </p>
        </div>
      </div>

      <div className="space-y-4 md:space-y-8">
        {/* Profile Section */}
        <section className="space-y-2 md:space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <User className="w-4 h-4" />
            プロフィール
          </h2>
          <div className="p-3 md:p-6 rounded-xl border bg-card shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-4">
            <div className="flex items-center gap-3 md:gap-4">
              <div className="w-10 h-10 md:w-14 md:h-14 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <User className="w-5 h-5 md:w-7 md:h-7 text-primary" />
              </div>
              <div className="min-w-0">
                <div className="font-semibold text-sm md:text-lg truncate">ユーザー</div>
                <div className="text-xs md:text-sm text-muted-foreground truncate">{user?.email || "guest@example.com"}</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleLogout}
                disabled={loggingOut}
                className="inline-flex items-center justify-center gap-2 rounded-md text-xs md:text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 md:h-9 px-4 py-2 text-destructive hover:text-destructive"
              >
                <LogOut className="w-3.5 h-3.5 md:w-4 md:h-4" />
                {loggingOut ? "ログアウト中..." : "ログアウト"}
              </button>
            </div>
          </div>
        </section>

        {/* Plan Section */}
        <section className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Zap className="w-4 h-4" />
            プラン
          </h2>

          <div className="grid md:grid-cols-2 gap-3 md:gap-4">
            {/* Current Plan Card */}
            <div className="p-3 md:p-6 rounded-xl border bg-card shadow-sm space-y-3 md:space-y-4 relative overflow-hidden">
              <div className="flex items-center justify-between relative z-10">
                <div>
                  <div className="text-xs text-muted-foreground font-medium mb-1">現在利用中</div>
                  <div className="text-lg md:text-2xl font-bold">
                    {plan?.type === 'premium' ? 'プレミアムプラン' : 'フリープラン'}
                  </div>
                </div>
                <div className="p-1.5 md:p-2 rounded-full bg-secondary">
                  <User className="w-4 h-4 md:w-5 md:h-5" />
                </div>
              </div>
              <div className="space-y-1.5 md:space-y-2 relative z-10">
                <div className="flex items-center gap-2 text-xs md:text-sm">
                  <Check className="w-3.5 h-3.5 md:w-4 md:h-4 text-green-500" />
                  {plan?.type === 'premium'
                    ? 'サブスク管理 (無制限)'
                    : `サブスク管理 (最大${plan?.limit || 5}つ)`}
                </div>
                <div className="flex items-center gap-2 text-xs md:text-sm">
                  <Check className="w-3.5 h-3.5 md:w-4 md:h-4 text-green-500" /> 基本的な解約サポート
                </div>
                <div className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground">
                  <Check className="w-3.5 h-3.5 md:w-4 md:h-4 text-muted-foreground" /> 高度な分析機能
                </div>

                {plan?.type === 'premium' && (
                  <button
                    onClick={async () => {
                      try {
                        toast.loading('管理画面へ移動中...');
                        const res = await fetch('/api/stripe/portal', {
                          method: 'POST',
                        });
                        if (!res.ok) throw new Error('Failed to create portal session');
                        const { url } = await res.json();
                        window.location.href = url;
                      } catch (error) {
                        console.error(error);
                        toast.dismiss();
                        toast.error('管理画面への移動に失敗しました');
                      }
                    }}
                    className="mt-4 w-full inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2 transition-colors"
                  >
                    <CreditCard className="w-4 h-4" />
                    サブスクリプションの管理（解約・変更）
                  </button>
                )}
              </div>
            </div>

            {/* Upgrade Card */}
            {plan?.type !== 'premium' && (
              <div className="p-3 md:p-6 rounded-xl border border-primary/50 bg-primary/5 shadow-sm space-y-3 md:space-y-4 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-2 md:p-4 opacity-10">
                  <Zap className="w-16 h-16 md:w-24 md:h-24" />
                </div>

                <div className="flex items-center justify-between relative z-10">
                  <div>
                    <div className="text-xs text-primary font-medium mb-1">おすすめ</div>
                    <div className="text-lg md:text-2xl font-bold">プレミアムプラン</div>
                  </div>
                  <div className="p-1.5 md:p-2 rounded-full bg-primary text-primary-foreground">
                    <Zap className="w-4 h-4 md:w-5 md:h-5" />
                  </div>
                </div>

                <div className="space-y-1.5 md:space-y-2 relative z-10">
                  <div className="flex items-center gap-2 text-xs md:text-sm">
                    <Check className="w-3.5 h-3.5 md:w-4 md:h-4 text-primary" /> 無制限のサブスク登録
                  </div>
                  <div className="flex items-center gap-2 text-xs md:text-sm">
                    <Check className="w-3.5 h-3.5 md:w-4 md:h-4 text-primary" /> 優先サポート
                  </div>
                  <div className="flex items-center gap-2 text-xs md:text-sm">
                    <Check className="w-3.5 h-3.5 md:w-4 md:h-4 text-primary" /> 広告非表示
                  </div>
                </div>

                <UpgradeButton />
              </div>
            )}
          </div>
        </section>

        {/* Appearance Section */}
        <section className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Palette className="w-4 h-4" />
            外観
          </h2>
          <div className="p-3 md:p-6 rounded-xl border bg-card shadow-sm">
            <ThemeSelector />
          </div>
        </section>

        {/* Notification Settings Section */}
        <section className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Bell className="w-4 h-4" />
            通知設定
          </h2>
          <div className="p-3 md:p-6 rounded-xl border bg-card shadow-sm space-y-4 md:space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label htmlFor="daysBeforeBilling" className="text-sm font-medium">
                  請求日の何日前に通知しますか？
                </label>
                <p className="text-xs text-muted-foreground">
                  設定した日数前になると、通知ページに表示されます。
                </p>
                <select
                  id="daysBeforeBilling"
                  value={daysBeforeBilling}
                  onChange={(e) => setDaysBeforeBilling(parseInt(e.target.value))}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="3">3日前</option>
                  <option value="7">7日前</option>
                  <option value="14">14日前</option>
                  <option value="30">30日前</option>
                </select>
              </div>

              <div className="flex items-center justify-between space-x-2 border p-3 rounded-lg">
                <div className="space-y-0.5">
                  <label htmlFor="pushNotifications" className="text-sm font-medium">
                    プッシュ通知
                  </label>
                  <p className="text-xs text-muted-foreground">
                    アプリ版でのみ利用可能です
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={pushNotifications}
                    onClick={() => setPushNotifications(!pushNotifications)}
                    className={`
                      relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
                      ${pushNotifications ? 'bg-primary' : 'bg-muted'}
                    `}
                  >
                    <span
                      aria-hidden="true"
                      className={`
                        pointer-events-none inline-block h-5 w-5 transform rounded-full bg-background shadow ring-0 transition duration-200 ease-in-out
                        ${pushNotifications ? 'translate-x-5' : 'translate-x-0'}
                      `}
                    />
                  </button>
                  <span className="text-sm text-muted-foreground w-8 text-right">
                    {pushNotifications ? "ON" : "OFF"}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleSaveNotificationSettings}
                disabled={savingNotifications}
                className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-6 py-2"
              >
                {savingNotifications ? "保存中..." : "設定を保存"}
              </button>
            </div>
          </div>
        </section>

        {/* Category Management Section */}
        <section className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Check className="w-4 h-4" />
            カテゴリ管理
          </h2>
          <div className="p-4 md:p-6 rounded-xl border bg-card shadow-sm">
            <CategoryManagement />
          </div>
        </section>
      </div >
    </div >
  );
}
