import express from 'express';
import morgan from 'morgan';
import authRoute from './routes/auth.user.js';

const app = express();

app.use(express.json());
app.use(morgan('dev'));

//user auth routes
app.use('/api/auth' , authRoute);

//resume routes
app.use('/api/resume' ,resumeRoutes );


export default app;