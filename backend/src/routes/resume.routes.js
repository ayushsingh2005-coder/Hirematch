import { Router } from 'express';
import {resumeUpload} from '../controllers/resume.controller.js';
import upload from '../config/multer.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
const resumeRoutes = Router();

resumeRoutes.post('/resume-upload' ,authMiddleware, upload.single("resume") ,  resumeUpload);
// resumeRoutes.get('/fetchresume' , fetchResume);

export default resumeRoutes;
