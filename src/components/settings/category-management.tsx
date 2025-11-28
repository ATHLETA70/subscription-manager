"use client";

import { useState, useEffect } from "react";
import { Trash2, Pencil, Check, X } from "lucide-react";
import { getCustomCategories, deleteCategoryWithReassignment, updateCategory, isCategoryInUse, CustomCategory } from "@/actions/categories";
import { toast } from "sonner";

export function CategoryManagement() {
    const [categories, setCategories] = useState<CustomCategory[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
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

    function startEditing(category: CustomCategory) {
        setEditingId(category.id);
        setEditName(category.name);
    }

    function cancelEditing() {
        setEditingId(null);
        setEditName("");
    }

    async function handleUpdate(oldName: string) {
        if (!editName.trim()) {
            toast.error("カテゴリ名を入力してください");
            return;
        }

        if (editName === oldName) {
            cancelEditing();
            return;
        }

        setIsSubmitting(true);
        const result = await updateCategory(oldName, editName);

        if (result.success) {
            toast.success("カテゴリ名を更新しました");
            fetchCategories();
            cancelEditing();
        } else {
            toast.error(result.error || "更新に失敗しました");
        }
        setIsSubmitting(false);
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
                    const isEditing = editingId === category.id;

                    return (
                        <div
                            key={category.id}
                            className="flex items-center justify-between p-3 border rounded-lg bg-card"
                        >
                            {isEditing ? (
                                <div className="flex items-center gap-2 flex-1 mr-2">
                                    <input
                                        type="text"
                                        value={editName}
                                        onChange={(e) => setEditName(e.target.value)}
                                        className="flex-1 px-2 py-1 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                                        autoFocus
                                        disabled={isSubmitting}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') handleUpdate(category.name);
                                            if (e.key === 'Escape') cancelEditing();
                                        }}
                                    />
                                    <button
                                        onClick={() => handleUpdate(category.name)}
                                        disabled={isSubmitting}
                                        className="p-1 text-green-600 hover:bg-green-50 rounded-md transition-colors"
                                    >
                                        <Check className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={cancelEditing}
                                        disabled={isSubmitting}
                                        className="p-1 text-muted-foreground hover:bg-muted rounded-md transition-colors"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <span className="font-medium">{category.name}</span>

                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => startEditing(category)}
                                            disabled={isDeleting || deletingId !== null}
                                            className="p-2 text-muted-foreground hover:bg-muted rounded-md transition-colors disabled:opacity-50"
                                        >
                                            <Pencil className="w-4 h-4" />
                                        </button>

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
                                                disabled={isDeleting || deletingId !== null}
                                                className="p-2 text-destructive hover:bg-destructive/10 rounded-md transition-colors disabled:opacity-50"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
