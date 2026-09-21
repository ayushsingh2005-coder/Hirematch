import express from 'express';
import morgan from 'morgan';
import authRoute from './routes/auth.user.js';

const app = express();

app.use(express.json());
app.use(morgan('dev'));

app.use('/api/auth' , authRoute);

export default app;