import { supabase } from "@/integrations/supabase/client";

export interface ImageUploadResult {
  url: string;
  error?: string;
}

export const uploadQuestionImage = async (
  file: File,
  questionId: string,
  type: 'question' | 'option_a' | 'option_b' | 'option_c' | 'option_d' | 'explanation'
): Promise<ImageUploadResult> => {
  try {
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return { url: '', error: 'Image size must be less than 5MB' };
    }

    // Validate file type
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return { url: '', error: 'Only PNG, JPG, and WebP images are allowed' };
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `question-${questionId}-${type}-${Date.now()}.${fileExt}`;
    
    const { error: uploadError } = await supabase.storage
      .from('questions-images')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('questions-images')
      .getPublicUrl(fileName);

    return { url: publicUrl };
  } catch (error: any) {
    console.error('Image upload error:', error);
    return { url: '', error: error.message || 'Failed to upload image' };
  }
};

export const extractImagesFromClipboard = async (
  clipboardData: DataTransfer
): Promise<{ text: string; images: File[] }> => {
  let text = '';
  const images: File[] = [];

  const items = clipboardData.items;
  
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    
    if (item.type.indexOf('text/plain') !== -1) {
      text = await new Promise<string>((resolve) => {
        item.getAsString(resolve);
      });
    } else if (item.type.indexOf('text/html') !== -1) {
      const html = await new Promise<string>((resolve) => {
        item.getAsString(resolve);
      });
      // Extract text from HTML
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = html;
      text = tempDiv.textContent || tempDiv.innerText || '';
    } else if (item.type.indexOf('image') !== -1) {
      const blob = item.getAsFile();
      if (blob) {
        images.push(blob);
      }
    }
  }

  return { text, images };
};

export const deleteQuestionImage = async (imageUrl: string): Promise<boolean> => {
  try {
    // Extract file path from URL
    const urlParts = imageUrl.split('/');
    const fileName = urlParts[urlParts.length - 1];

    const { error } = await supabase.storage
      .from('questions-images')
      .remove([fileName]);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting image:', error);
    return false;
  }
};
