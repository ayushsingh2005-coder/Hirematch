import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';
import cloudinary from './cloudinary.js';

const storage = new CloudinaryStorage({
    cloudinary : cloudinary,
    params : {
        folder : 'hirematch/resumes',
        allowed_formats : ['pdf'],
        resource_type : 'raw',
    },
});

// file size validation
const fileFilter = (req , file ,cb) =>{
    if(file.mimetype === 'application/pdf'){
        cb(null , true)
    }
    else{
        cb(new Error('Only PDF files are allowed'), false);
    }
};

const upload = multer({
    storage : storage,
    limits : {
        fileSize: 5 * 1024 * 1024,
    },
    fileFilter : fileFilter,
});

export default upload;







