import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
  secure: true,
});

/**
 * Uploads a base64 image or file path to Cloudinary
 * Returns the secure URL of the uploaded image
 */
export async function uploadToCloudinary(fileStr: string, folder: string = 'gold_trading'): Promise<string | null> {
  try {
    if (!fileStr) return null;
    
    console.log(`[Cloudinary] Starting upload to folder: ${folder}...`);
    const uploadResponse = await cloudinary.uploader.upload(fileStr, {
      folder: folder,
      resource_type: 'auto',
    });
    
    console.log(`[Cloudinary] Upload success! Link: ${uploadResponse.secure_url}`);
    return uploadResponse.secure_url;
  } catch (error) {
    console.error('[Cloudinary] Upload error:', error);
    return null;
  }
}

export default cloudinary;
