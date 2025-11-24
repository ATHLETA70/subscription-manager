"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, CreditCard, Settings, Bell, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
    { name: "ホーム", href: "/dashboard", icon: Home },
    { name: "一覧", href: "/subscriptions", icon: CreditCard },
    { name: "カレンダー", href: "/calendar", icon: Calendar },
    { name: "設定", href: "/settings", icon: Settings },
];

export function BottomNav() {
    const pathname = usePathname();

    return (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-card/80 backdrop-blur-lg border-t border-border z-50 pb-safe">
            <nav className="flex justify-around items-center h-16">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex flex-col items-center justify-center w-full h-full gap-1 transition-colors",
                                isActive
                                    ? "text-primary"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <Icon className={cn("w-5 h-5", isActive && "fill-current")} />
                            <span className="text-[10px] font-medium">{item.name}</span>
                        </Link>
                    );
                })}
            </nav>
        </div>
    );
}
