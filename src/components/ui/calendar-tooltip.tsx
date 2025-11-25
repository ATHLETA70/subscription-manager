"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";

import { Subscription } from "@/types/subscription";

interface CalendarTooltipProps {
    children: React.ReactNode;
    subscriptions: Subscription[];
}

export function CalendarTooltip({ children, subscriptions }: CalendarTooltipProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [position, setPosition] = useState({ top: 0, left: 0 });
    const triggerRef = useRef<HTMLDivElement>(null);
    const longPressTimer = useRef<NodeJS.Timeout | null>(null);
    const isLongPress = useRef(false);

    // Calculate position
    const updatePosition = () => {
        if (triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            // Position above the trigger by default
            setPosition({
                top: rect.top + window.scrollY - 10, // 10px offset
                left: rect.left + window.scrollX + rect.width / 2,
            });
        }
    };

    // Desktop: Hover
    const handleMouseEnter = () => {
        // Only trigger on hover if not a touch device (or if we can detect it)
        // But for simplicity, we allow hover on desktop.
        // On mobile, touch events will handle it.
        if (!isLongPress.current) {
            updatePosition();
            setIsOpen(true);
        }
    };

    const handleMouseLeave = () => {
        setIsOpen(false);
    };

    // Mobile: Long Press
    const handleTouchStart = (e: React.TouchEvent) => {
        isLongPress.current = false;
        longPressTimer.current = setTimeout(() => {
            isLongPress.current = true;
            updatePosition();
            setIsOpen(true);
            // Vibrate if available
            if (navigator.vibrate) {
                navigator.vibrate(50);
            }
        }, 500); // 500ms for long press
    };

    const handleTouchEnd = () => {
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
        }
        // If it was a long press, we might want to keep it open until clicked outside
        // But for now, let's close it on release to mimic a "peek" or toggle behavior.
        // Actually, user said "long press", usually implies holding.
        // If they want to "see" it, holding is fine.
        // Let's try: Hold to see, release to hide.
        // Or: Long press to toggle.
        // Let's go with: Hold to see (release hides) for now, as it's simpler.
        // Wait, "long press... tooltip" usually means it appears.
        // If I release, does it disappear?
        // Let's make it disappear on release for now.
        if (isLongPress.current) {
            setIsOpen(false);
        }
    };

    const handleTouchMove = () => {
        // Cancel if moved too much
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
        }
    };

    // Close on scroll or resize
    useEffect(() => {
        const handleScroll = () => setIsOpen(false);
        window.addEventListener("scroll", handleScroll);
        window.addEventListener("resize", handleScroll);
        return () => {
            window.removeEventListener("scroll", handleScroll);
            window.removeEventListener("resize", handleScroll);
        };
    }, []);

    return (
        <>
            <div
                ref={triggerRef}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
                onTouchMove={handleTouchMove}
                className="inline-block"
            >
                {children}
            </div>
            {isOpen && createPortal(
                <div
                    className="fixed z-50 px-3 py-2 text-xs font-medium text-white bg-black/90 rounded-md shadow-lg pointer-events-none transform -translate-x-1/2 -translate-y-full animate-in fade-in zoom-in-95 duration-200"
                    style={{ top: position.top, left: position.left }}
                >
                    <div className="space-y-1">
                        {subscriptions.map((sub) => (
                            <div key={sub.id} className="flex items-center gap-2 whitespace-nowrap">
                                <span>{sub.name}</span>
                                <span className="opacity-70">¥{sub.amount.toLocaleString()}</span>
                            </div>
                        ))}
                    </div>
                    {/* Arrow */}
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2 bg-black/90"></div>
                </div>,
                document.body
            )}
        </>
    );
}
