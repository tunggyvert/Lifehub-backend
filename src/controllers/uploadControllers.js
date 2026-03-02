const multer = require('multer');
const path = require('path');
const fs = require('fs');

// สร้าง uploads directory ถ้ายังไม่มี
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// ตั้งค่า multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    // สร้างชื่อไฟล์ที่ไม่ซ้ำกัน
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'post-' + uniqueSuffix + ext);
  }
});

// File filter ที่รองรับ image_picker จาก Flutter
const fileFilter = (req, file, cb) => {
  // Debug: ดูประเภทไฟล์จริง
  console.log('File mimetype:', file.mimetype);
  console.log('File originalname:', file.originalname);
  
  const allowedTypes = [
    'image/jpeg', 
    'image/jpg', 
    'image/png', 
    'image/webp', 
    'image/heic', 
    'image/heif',
    'application/octet-stream'  // ← เพิ่มสำหรับ image_picker
  ];
  
  // ตรวจสอบจาก file extension ด้วย (สำหรับกรณี application/octet-stream)
  const ext = path.extname(file.originalname).toLowerCase();
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.heic', '.heif'];
  
  if (allowedTypes.includes(file.mimetype) || allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type: ${file.mimetype}. Only JPEG, PNG, WebP, HEIC, and HEIF are allowed.`), false);
  }
};

// ตั้งค่า multer upload
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  }
});

// Upload endpoint
const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    // สร้าง URL สำหรับเข้าถึงไฟล์
    const imageUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;

    res.json({
      success: true,
      message: 'Image uploaded successfully',
      imageUrl: imageUrl
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  upload,
  uploadImage
};
