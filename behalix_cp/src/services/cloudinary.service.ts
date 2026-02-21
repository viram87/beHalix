import cloudinary from '../config/cloudinary';
import { Readable } from 'stream';

export const uploadImage = async (fileBuffer: Buffer): Promise<any> => {
  if (process.env.NODE_ENV === 'test') {
    return {
      url: 'https://example.com/test-image.jpg',
      publicId: 'test_public_id',
      uploadedAt: new Date(),
    };
  }

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: 'events' },
      (error, result) => {
        if (error) {
          console.error('Cloudinary upload error:', error);
          const isAuth = error?.http_code === 401 || /signature|unauthorized/i.test(String(error?.message || ''));
          return reject(new Error(isAuth ? 'Cloudinary credentials invalid. Check CLOUDINARY_API_SECRET in .env' : 'Image upload failed'));
        }
        resolve({
          url: result?.secure_url,
          publicId: result?.public_id,
          uploadedAt: new Date(result?.created_at || Date.now()),
        });
      }
    );

    Readable.from(fileBuffer).pipe(uploadStream);
  });
};
