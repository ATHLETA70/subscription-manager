"use server";

import { createClient } from "@/lib/supabase/server";

export interface CustomCategory {
    id: string;
    user_id: string;
    name: string;
    created_at: string;
}

/**
 * Get all custom categories for the current user
 * Extract unique categories from existing subscriptions
 */
export async function getCustomCategories(): Promise<CustomCategory[]> {
    const supabase = await createClient();

    const DEFAULT_CATEGORIES = ["エンタメ", "音楽", "仕事効率化", "ショッピング", "スポーツ", "その他"];

    // Get all subscriptions and extract unique categories
    const { data: subscriptions, error } = await supabase
        .from("subscriptions")
        .select("category")
        .not("category", "is", null);

    if (error) {
        console.error("[Categories] Error fetching categories from subscriptions:", error);
        return [];
    }

    // Extract unique custom categories (not in default list)
    const categories = subscriptions
        ?.map(sub => sub.category)
        .filter((cat): cat is string => cat !== null && !DEFAULT_CATEGORIES.includes(cat))
        .filter((cat, index, self) => self.indexOf(cat) === index) // unique
        .map((name, index) => ({
            id: `custom-${index}`,
            user_id: "",
            name,
            created_at: new Date().toISOString()
        })) || [];

    return categories;
}

/**
 * Create a new custom category
 * Note: For now, we're not storing custom categories in a separate table
 * They are stored directly in the subscription's category field
 */
export async function createCustomCategory(name: string): Promise<{ success: boolean; error?: string }> {
    console.log("[Categories] Creating custom category:", name);

    // Validate name
    if (!name || name.trim().length === 0) {
        console.error("[Categories] Validation failed: empty name");
        return { success: false, error: "カテゴリ名を入力してください" };
    }

    console.log("[Categories] Category name is valid, returning success");
    // Just return success - the category will be stored in the subscription record
    return { success: true };
}

/**
 * Delete a category by updating all subscriptions using it to "その他"
 * Returns the number of subscriptions that were updated
 */
export async function deleteCategoryWithReassignment(categoryName: string): Promise<{
    success: boolean;
    updated: number;
    error?: string;
}> {
    console.log("[Categories] Deleting category with reassignment:", categoryName);
    const supabase = await createClient();

    // Prevent deletion of default categories
    const DEFAULT_CATEGORIES = ["エンタメ", "音楽", "仕事効率化", "ショッピング", "スポーツ", "その他"];
    if (DEFAULT_CATEGORIES.includes(categoryName)) {
        return {
            success: false,
            updated: 0,
            error: "デフォルトカテゴリは削除できません"
        };
    }

    // Get count of subscriptions using this category
    const { count, error: countError } = await supabase
        .from("subscriptions")
        .select("*", { count: "exact", head: true })
        .eq("category", categoryName);

    if (countError) {
        console.error("[Categories] Error counting subscriptions:", countError);
        return { success: false, updated: 0, error: countError.message };
    }

    console.log(`[Categories] Found ${count || 0} subscriptions using category "${categoryName}"`);

    // Update all subscriptions to use "その他"
    const { error: updateError } = await supabase
        .from("subscriptions")
        .update({ category: "その他" })
        .eq("category", categoryName);

    if (updateError) {
        console.error("[Categories] Error updating subscriptions:", updateError);
        return { success: false, updated: 0, error: updateError.message };
    }

    console.log(`[Categories] Successfully updated ${count || 0} subscriptions to "その他"`);
    return { success: true, updated: count || 0 };
}

/**
 * Check if a category is in use by any subscription
 */
export async function isCategoryInUse(categoryName: string): Promise<boolean> {
    const supabase = await createClient();

    const { count, error } = await supabase
        .from("subscriptions")
        .select("*", { count: "exact", head: true })
        .eq("category", categoryName);

    if (error) {
        console.error("[Categories] Error checking category usage:", error);
        return false;
    }

    return (count || 0) > 0;
}

/**
 * Get all categories (default + custom) for the current user
 */
export async function getAllCategories(): Promise<string[]> {
    const DEFAULT_CATEGORIES = ["エンタメ", "音楽", "仕事効率化", "ショッピング", "スポーツ", "その他"];

    const customCategories = await getCustomCategories();
    const customNames = customCategories.map(c => c.name);

    return [...DEFAULT_CATEGORIES, ...customNames];
}
