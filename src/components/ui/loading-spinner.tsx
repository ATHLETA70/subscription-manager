import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
    className?: string;
    size?: number;
    text?: string;
}

export function LoadingSpinner({ className, size = 24, text = "読み込み中..." }: LoadingSpinnerProps) {
    return (
        <div className="flex flex-col items-center justify-center gap-3 p-8 text-muted-foreground">
            <Loader2 className={cn("animate-spin", className)} size={size} />
            {text && <p className="text-sm font-medium animate-pulse">{text}</p>}
        </div>
    );
}
