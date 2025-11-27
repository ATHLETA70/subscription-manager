"use client";

import { useState, useEffect } from "react";
import { Trash2 } from "lucide-react";
import { getCustomCategories, deleteCategoryWithReassignment, isCategoryInUse, CustomCategory } from "@/actions/categories";
import { toast } from "sonner";

export function CategoryManagement() {
    const [categories, setCategories] = useState<CustomCategory[]>([]);
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [categoryUsage, setCategoryUsage] = useState<Record<string, boolean>>({});

    useEffect(() => {
        fetchCategories();
    }, []);

    async function fetchCategories() {
        setLoading(true);
        const cats = await getCustomCategories();
        setCategories(cats);

        // Check usage for each category
        const usage: Record<string, boolean> = {};
        for (const cat of cats) {
            usage[cat.id] = await isCategoryInUse(cat.name);
        }
        setCategoryUsage(usage);
        setLoading(false);
    }

    async function handleDelete(id: string, name: string) {
        setDeletingId(id);
        const result = await deleteCategoryWithReassignment(name);

        if (result.success) {
            if (result.updated > 0) {
                toast.success(`カテゴリを削除し、${result.updated}件のサブスクを「その他」に変更しました`);
            } else {
                toast.success("カテゴリを削除しました");
            }
            fetchCategories();
        } else {
            toast.error(result.error || "削除に失敗しました");
        }
        setDeletingId(null);
    }

    if (loading) {
        return (
            <div className="space-y-4">
                <h3 className="text-lg font-semibold">カスタムカテゴリ</h3>
                <p className="text-sm text-muted-foreground">読み込み中...</p>
            </div>
        );
    }

    if (categories.length === 0) {
        return (
            <div className="space-y-4">
                <h3 className="text-lg font-semibold">カスタムカテゴリ</h3>
                <p className="text-sm text-muted-foreground">
                    カスタムカテゴリはまだありません。サブスクリプションの登録・編集画面から新しいカテゴリを作成できます。
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div>
                <h3 className="text-lg font-semibold">カスタムカテゴリ</h3>
                <p className="text-sm text-muted-foreground">
                    作成したカテゴリを管理できます
                </p>
            </div>

            <div className="space-y-2">
                {categories.map(category => {
                    const isInUse = categoryUsage[category.id];
                    const isDeleting = deletingId === category.id;

                    return (
                        <div
                            key={category.id}
                            className="flex items-center justify-between p-3 border rounded-lg bg-card"
                        >
                            <span className="font-medium">{category.name}</span>

                            {isInUse ? (
                                <div className="group relative">
                                    <button
                                        disabled
                                        className="p-2 text-muted-foreground opacity-50 cursor-not-allowed rounded-md"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                    <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block w-64 p-2 bg-popover border rounded-md shadow-md text-xs z-10">
                                        <p className="text-popover-foreground">
                                            他のサブスクで使われているため削除できません
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <button
                                    onClick={() => handleDelete(category.id, category.name)}
                                    disabled={isDeleting}
                                    className="p-2 text-destructive hover:bg-destructive/10 rounded-md transition-colors disabled:opacity-50"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
