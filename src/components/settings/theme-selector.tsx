"use client"

import * as React from "react"
import { Moon, Sun, Laptop } from "lucide-react"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"

export function ThemeSelector() {
    const { setTheme, theme } = useTheme()
    const [mounted, setMounted] = React.useState(false)

    React.useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) {
        return <div className="h-24 w-full animate-pulse rounded-xl bg-muted" />
    }

    return (
        <div className="grid grid-cols-3 gap-4">
            <button
                onClick={() => setTheme("light")}
                className={cn(
                    "flex flex-col items-center justify-center gap-2 rounded-xl border-2 p-4 hover:bg-accent hover:text-accent-foreground transition-all",
                    theme === "light" ? "border-primary bg-primary/5" : "border-transparent bg-card"
                )}
            >
                <Sun className="h-6 w-6" />
                <span className="text-sm font-medium">ライト</span>
            </button>
            <button
                onClick={() => setTheme("dark")}
                className={cn(
                    "flex flex-col items-center justify-center gap-2 rounded-xl border-2 p-4 hover:bg-accent hover:text-accent-foreground transition-all",
                    theme === "dark" ? "border-primary bg-primary/5" : "border-transparent bg-card"
                )}
            >
                <Moon className="h-6 w-6" />
                <span className="text-sm font-medium">ダーク</span>
            </button>
            <button
                onClick={() => setTheme("system")}
                className={cn(
                    "flex flex-col items-center justify-center gap-2 rounded-xl border-2 p-4 hover:bg-accent hover:text-accent-foreground transition-all",
                    theme === "system" ? "border-primary bg-primary/5" : "border-transparent bg-card"
                )}
            >
                <Laptop className="h-6 w-6" />
                <span className="text-sm font-medium">システム</span>
            </button>
        </div>
    )
}
