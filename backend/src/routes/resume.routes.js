import { Router } from 'express';
const resumeRoutes = Router();

resumeRoutes.post('/upload' , uploadResume);
resumeRoutes.get('/fetchresume' , fetchResume);
