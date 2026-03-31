const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'locora_uploads', // Folder name in Cloudinary
    allowed_formats: ['jpg', 'png', 'jpeg'],
  },
});

const upload = multer({ storage: storage });

const deleteFromCloudinary = async (url) => {
  const parts = url.split('/');
  const filename = parts[parts.length - 1].split('.')[0];
  const folder = parts[parts.length - 2];
  const publicId = `${folder}/${filename}`;
  await cloudinary.uploader.destroy(publicId);
};

module.exports = { upload, deleteFromCloudinary };