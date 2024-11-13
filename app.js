import express from 'express';
import mongoose from 'mongoose';
import morgan from 'morgan';
import dotenv from 'dotenv';
import cors from 'cors';
import hpp from 'hpp';
import helmet from 'helmet';

// Routes
import postRoutes from './routes/api/post.js';
import userRoutes from './routes/api/user.js';
import authRoutes from './routes/api/auth.js';
import visitorRoutes from './routes/api/visitor.js';

dotenv.config();

const app = express();

// 환경변수 확인
console.log('환경변수 확인:', {
    MONGO_URI: process.env.MONGO_URI,
    PORT: process.env.PORT,
});
const prod = process.env.NODE_ENV === 'production';
app.use(hpp());
app.use(helmet({ contentSecurityPolicy: false }));
if (prod) {
    app.use(
        cors({
            origin: ['https://kjiyu-devlog.com', /\.kjiyu-devlog\.com$/],
            credentials: true,
        }),
    );
} else {
    app.use(
        cors({
            origin: true,
            credentials: true,
        }),
    );
}
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: false }));
app.use(express.json());
if (process.env.NODE_ENV === 'production') {
    app.use(morgan('combined'));
} else {
    app.use(morgan('dev'));
}

app.get('/', (req, res) => {
    res.json({ message: '서버가 정상적으로 실행중입니다.' });
});

app.use(express.json());

mongoose
    .connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB connecting Success!!'))
    .catch((e) => console.log(e));

// Use routes
if (prod)
    app.all('*', (req, res, next) => {
        console.log('log check this line')
        let protocol = req.headers['x-forward-proto'] || req.protocol;
        if (protocol === 'https') {
            next();
        } else {
            let to = `https://${req.hostname}${req.url}`;
            res.redirect(to);
        }
    });

//
app.use('/api/post', postRoutes);
app.use('/api/user', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/visitor', visitorRoutes);
if (!prod) app.listen(process.env.PORT, () => console.log(`Server running on port ${process.env.PORT}`));

export default app;
