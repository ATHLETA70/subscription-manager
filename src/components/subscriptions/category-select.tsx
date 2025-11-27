"use client";

import { useState, useEffect } from "react";
import * as Select from "@radix-ui/react-select";
import { ChevronDown, X, Plus } from "lucide-react";
import { getCustomCategories, deleteCategoryWithReassignment } from "@/actions/categories";
import { toast } from "sonner";

interface CategorySelectProps {
    value: string;
    onValueChange: (value: string) => void;
    onCustomCategoryMode: (isCustom: boolean) => void;
    defaultValue?: string;
}

const DEFAULT_CATEGORIES = ["エンタメ", "音楽", "仕事効率化", "ショッピング", "スポーツ", "その他"];

export function CategorySelect({ value, onValueChange, onCustomCategoryMode, defaultValue }: CategorySelectProps) {
    const [customCategories, setCustomCategories] = useState<string[]>([]);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);
    const [subscriptionCount, setSubscriptionCount] = useState(0);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        async function fetchCustomCategories() {
            const categories = await getCustomCategories();
            setCustomCategories(categories.map(c => c.name));
        }
        fetchCustomCategories();
    }, []);

    const handleDeleteClick = async (e: React.MouseEvent, categoryName: string) => {
        e.stopPropagation();
        e.preventDefault();

        // Close the dropdown
        setIsOpen(false);

        // Show confirmation dialog
        setCategoryToDelete(categoryName);
        setShowDeleteConfirm(true);

        // Get subscription count (we'll show in the dialog)
        // For now, we'll show it when they confirm
    };

    const confirmDelete = async () => {
        if (!categoryToDelete) return;

        setIsDeleting(true);
        const result = await deleteCategoryWithReassignment(categoryToDelete);

        if (result.success) {
            toast.success(
                result.updated > 0
                    ? `カテゴリを削除し、${result.updated}件のサブスクを「その他」に変更しました`
                    : "カテゴリを削除しました"
            );

            // Refresh category list
            const categories = await getCustomCategories();
            setCustomCategories(categories.map(c => c.name));

            // If the deleted category was selected, reset to empty
            if (value === categoryToDelete) {
                onValueChange("");
            }
        } else {
            toast.error(result.error || "削除に失敗しました");
        }

        setIsDeleting(false);
        setShowDeleteConfirm(false);
        setCategoryToDelete(null);
    };

    const handleSelectCustom = () => {
        onCustomCategoryMode(true);
        onValueChange("");
    };

    return (
        <>
            <Select.Root value={value} onValueChange={onValueChange} defaultValue={defaultValue} open={isOpen} onOpenChange={setIsOpen}>
                <Select.Trigger className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                    <Select.Value placeholder="カテゴリを選択" />
                    <Select.Icon>
                        <ChevronDown className="h-4 w-4 opacity-50" />
                    </Select.Icon>
                </Select.Trigger>

                <Select.Portal>
                    <Select.Content
                        className="relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2"
                        position="popper"
                        sideOffset={5}
                    >
                        <Select.Viewport className="p-1">
                            {/* Default Categories */}
                            <Select.Group>
                                <Select.Label className="py-1.5 pl-8 pr-2 text-sm font-semibold">
                                    デフォルトカテゴリ
                                </Select.Label>
                                {DEFAULT_CATEGORIES.map((category) => (
                                    <Select.Item
                                        key={category}
                                        value={category}
                                        className="relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                                    >
                                        <Select.ItemText>{category}</Select.ItemText>
                                    </Select.Item>
                                ))}
                            </Select.Group>

                            {/* Custom Categories */}
                            {customCategories.length > 0 && (
                                <Select.Group>
                                    <Select.Label className="py-1.5 pl-8 pr-2 text-sm font-semibold">
                                        カスタムカテゴリ
                                    </Select.Label>
                                    {customCategories.map((category) => (
                                        <div
                                            key={category}
                                            className="relative flex w-full cursor-default select-none items-center justify-between rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground group"
                                        >
                                            <Select.Item
                                                value={category}
                                                className="flex-1 outline-none"
                                            >
                                                <Select.ItemText>{category}</Select.ItemText>
                                            </Select.Item>
                                            <button
                                                onClick={(e) => handleDeleteClick(e, category)}
                                                className="opacity-0 group-hover:opacity-100 ml-2 p-1 hover:bg-destructive/10 rounded transition-opacity"
                                                title="削除"
                                            >
                                                <X className="h-3 w-3 text-destructive" />
                                            </button>
                                        </div>
                                    ))}
                                </Select.Group>
                            )}

                            {/* Add Custom Category Option */}
                            <Select.Separator className="my-1 h-px bg-muted" />
                            <button
                                onClick={handleSelectCustom}
                                className="relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground hover:bg-accent hover:text-accent-foreground text-primary"
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                新しいカテゴリを入力...
                            </button>
                        </Select.Viewport>
                    </Select.Content>
                </Select.Portal>
            </Select.Root>

            {/* Delete Confirmation Dialog */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 z-[9999] bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-card border rounded-xl p-6 max-w-md w-full space-y-4 shadow-lg">
                        <h3 className="text-lg font-semibold">カテゴリを削除しますか？</h3>
                        <p className="text-sm text-muted-foreground">
                            「<span className="font-medium text-foreground">{categoryToDelete}</span>」を削除します。
                        </p>
                        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-lg p-3">
                            <p className="text-sm text-amber-900 dark:text-amber-100 leading-relaxed">
                                使用中のサブスクは「その他」に変更されます
                            </p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-3 pt-2">
                            <button
                                onClick={() => {
                                    setShowDeleteConfirm(false);
                                    setCategoryToDelete(null);
                                }}
                                disabled={isDeleting}
                                className="flex-1 inline-flex items-center justify-center rounded-md text-sm font-medium border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4"
                            >
                                キャンセル
                            </button>
                            <button
                                onClick={confirmDelete}
                                disabled={isDeleting}
                                className="flex-1 inline-flex items-center justify-center rounded-md text-sm font-medium bg-destructive text-destructive-foreground hover:bg-destructive/90 h-10 px-4 whitespace-nowrap"
                            >
                                {isDeleting ? "削除中..." : "削除"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
