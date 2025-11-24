"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, CreditCard, Settings, Bell, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { userPlan } from "@/lib/mock-data";

const navItems = [
    { name: "ダッシュボード", href: "/dashboard", icon: Home },
    { name: "サブスク一覧", href: "/subscriptions", icon: CreditCard },
    { name: "カレンダー", href: "/calendar", icon: Calendar },
    { name: "通知", href: "/notifications", icon: Bell },
    { name: "設定", href: "/settings", icon: Settings },
];

export function Sidebar() {
    const pathname = usePathname();

    return (
        <div className="hidden lg:flex h-screen w-64 flex-col border-r bg-card text-card-foreground fixed left-0 top-0 z-40">
            <div className="p-6">
                <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-400">
                    SubManager
                </h1>
            </div>

            <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                                isActive
                                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                                    : "hover:bg-accent hover:text-accent-foreground text-muted-foreground"
                            )}
                        >
                            <Icon className={cn("w-5 h-5", isActive ? "text-primary-foreground" : "group-hover:text-accent-foreground")} />
                            <span className="font-medium">{item.name}</span>
                        </Link>
                    );
                })}

                {userPlan.type === 'free' && (
                    <div className="mt-4 p-4 rounded-xl bg-gradient-to-br from-primary/20 to-blue-600/10 border border-primary/20">
                        <h4 className="font-semibold text-sm mb-1">Premium Plan</h4>
                        <p className="text-xs text-muted-foreground mb-3">
                            無制限の登録と高度な分析機能
                        </p>
                        <button className="w-full py-2 rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-colors">
                            アップグレード (¥200/月)
                        </button>
                    </div>
                )}
            </nav>

            <div className="p-4 border-t border-border">
                <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary to-blue-400 flex items-center justify-center text-primary-foreground font-bold text-xs shrink-0">
                        YK
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">Yuta Kobayashi</div>
                        <div className="text-xs text-muted-foreground truncate">
                            {userPlan.type === 'premium' ? 'Premium Plan' : 'Free Plan'}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
