"use client";

import { useEffect, useState } from "react";
import { Sparkles, Search, FileText, CheckCircle2, Loader2, AlertCircle, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export type AIProcessingStatus = "idle" | "processing" | "success" | "error";

interface AIProcessingOverlayProps {
    status: AIProcessingStatus;
    serviceName: string;
}

const STEPS = [
    { icon: Search, text: "AIが最新情報を検索中...", duration: 2000 },
    { icon: FileText, text: "検索結果を解析中...", duration: 2500 },
    { icon: Sparkles, text: "最適な情報を抽出中...", duration: 2000 },
];

export function AIProcessingOverlay({ status, serviceName }: AIProcessingOverlayProps) {
    const [currentStep, setCurrentStep] = useState(0);

    useEffect(() => {
        if (status === "processing") {
            setCurrentStep(0);
            let step = 0;

            const runSteps = async () => {
                for (let i = 0; i < STEPS.length; i++) {
                    // Stop if status changes (e.g. to success/error early)
                    // But we want to show at least some progress usually
                    await new Promise(resolve => setTimeout(resolve, STEPS[i].duration));
                    step++;
                    if (step < STEPS.length) {
                        setCurrentStep(step);
                    }
                }
            };

            runSteps();
        }
    }, [status]);

    if (status === "idle") return null;

    let content;
    let containerClass = "bg-card border shadow-2xl";

    if (status === "success") {
        content = (
            <div className="space-y-6 animate-in zoom-in duration-500">
                <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
                    <div className="absolute inset-0 bg-green-500/20 rounded-full animate-ping duration-1000" />
                    <div className="relative bg-green-100 p-5 rounded-full">
                        <CheckCircle2 className="w-14 h-14 text-green-600 animate-bounce" />
                    </div>
                </div>
                <div className="space-y-2">
                    <h3 className="text-2xl font-bold tracking-tight text-green-700">
                        特定に成功しました！
                    </h3>
                    <p className="text-muted-foreground">
                        最新の解約情報を取得しました。
                    </p>
                </div>
            </div>
        );
        containerClass = "bg-white/90 border-green-200 shadow-[0_0_50px_-12px_rgba(34,197,94,0.5)]";
    } else if (status === "error") {
        content = (
            <div className="space-y-6 animate-in zoom-in duration-500">
                <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
                    <div className="absolute inset-0 bg-gray-500/20 rounded-full" />
                    <div className="relative bg-gray-100 p-5 rounded-full">
                        <HelpCircle className="w-14 h-14 text-gray-500" />
                    </div>
                </div>
                <div className="space-y-2">
                    <h3 className="text-xl font-bold tracking-tight text-gray-700">
                        見つかりませんでした...
                    </h3>
                    <p className="text-muted-foreground text-sm">
                        公式サイトから情報を特定できませんでした。<br />
                        手動での設定をお願いします。
                    </p>
                </div>
            </div>
        );
        containerClass = "bg-white/90 border-gray-200 shadow-xl";
    } else {
        // Processing
        const CurrentIcon = STEPS[currentStep].icon;
        content = (
            <>
                {/* Icon Animation */}
                <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
                    <div className="absolute inset-0 bg-primary/10 rounded-full animate-ping opacity-75 duration-1000" />
                    <div className="relative bg-primary/10 p-4 rounded-full">
                        <CurrentIcon className={cn(
                            "w-10 h-10 text-primary transition-all duration-500",
                            "animate-pulse"
                        )} />
                    </div>
                </div>

                <div className="space-y-2">
                    <h3 className="text-xl font-bold tracking-tight">
                        {serviceName} の情報を収集中
                    </h3>
                    <p className="text-muted-foreground min-h-[1.5rem] transition-all duration-300">
                        {STEPS[currentStep].text}
                    </p>
                </div>

                {/* Progress Indicators */}
                <div className="flex justify-center gap-2 pt-2">
                    {STEPS.map((_, index) => (
                        <div
                            key={index}
                            className={cn(
                                "w-2 h-2 rounded-full transition-all duration-500",
                                index === currentStep ? "bg-primary w-6" :
                                    index < currentStep ? "bg-primary/50" : "bg-muted"
                            )}
                        />
                    ))}
                </div>
            </>
        );
    }

    return (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 transition-all duration-500">
            <div className={cn(
                "rounded-2xl p-8 max-w-md w-full text-center space-y-6 transition-all duration-500",
                containerClass
            )}>
                {content}
            </div>
        </div>
    );
}
