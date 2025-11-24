/**
 * Upload image to Supabase Storage
 */
export async function uploadImage(file: File, userId: string): Promise<string | null> {
    try {
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();

        // Create unique filename
        const fileExt = file.name.split('.').pop();
        const fileName = `${userId}/${Date.now()}.${fileExt}`;

        // Upload to Supabase Storage
        const { error } = await supabase.storage
            .from('subscription-logos')
            .upload(fileName, file, {
                cacheControl: '3600',
                upsert: false
            });

        if (error) {
            console.error('Upload error:', error);
            return null;
        }

        // Get public URL
        const { data: urlData } = supabase.storage
            .from('subscription-logos')
            .getPublicUrl(fileName);

        return urlData.publicUrl;
    } catch (error) {
        console.error('Error uploading image:', error);
        return null;
    }
}
