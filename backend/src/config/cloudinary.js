const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure Multer Storage for Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    let folder = 'gate_prep/images';
    let allowedFormats = ['jpg', 'png', 'jpeg', 'webp'];
    let resource_type = 'image';

    if (file.mimetype === 'application/pdf') {
      folder = 'gate_prep/pdfs';
      allowedFormats = ['pdf'];
      resource_type = 'raw';
    }

    return {
      folder: folder,
      allowed_formats: allowedFormats,
      resource_type: resource_type,
      public_id: `${Date.now()}-${file.originalname.replace(/\.[^/.]+$/, "")}` // append timestamp
    };
  },
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

module.exports = { cloudinary, upload };
