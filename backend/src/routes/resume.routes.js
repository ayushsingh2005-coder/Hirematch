import { Router } from 'express';
import { uploadResume } from '../controllers/resume.controller.js';
import upload from '../config/multer.js';
const resumeRoutes = Router();

resumeRoutes.post('/upload' , upload.single("file") ,  uploadResume);
// resumeRoutes.get('/fetchresume' , fetchResume);

export default resumeRoutes;
