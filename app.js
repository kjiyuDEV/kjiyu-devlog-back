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
console.log(prod, process.env.NODE_ENV === 'production', 'prod check in koyeb');
app.use(hpp());
app.use(helmet({ contentSecurityPolicy: false }));

// CORS 설정
const whitelist = [
  'http://localhost:8080',
  'http://localhost:8081',
  'https://kjiyu-devlog.com',
  'https://www.kjiyu-devlog.com',
  'https://kjiyudev.github.io',
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || whitelist.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not Allowed Origin!')); // CORS 비허용
    }
  },
  credentials: true,
};

if (process.env.NODE_ENV === 'production') {
  app.use(cors(corsOptions)); // CORS 옵션 적용
  app.options('*', cors()); // 모든 경로에 대해 OPTIONS 요청 처리
}

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: false }));
if (process.env.NODE_ENV === 'production') {
  app.use(morgan('combined'));
} else {
  app.use(morgan('dev'));
}

app.get('/', (req, res) => {
  res.json({ message: '서버가 정상적으로 실행중입니다.' });
});

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connecting Success!!'))
  .catch((e) => console.log(e));

// Use routes
if (prod) {
  app.all('*', (req, res, next) => {
    const protocol = req.headers['x-forwarded-proto'] || req.protocol;
    if (protocol !== 'https') {
      res.redirect(`https://${req.hostname}${req.url}`);
    } else {
      next();
    }
  });
}

app.use('/api/post', postRoutes);
app.use('/api/user', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/visitor', visitorRoutes);

if (!prod)
  app.listen(process.env.PORT, () =>
    console.log(`Server running on port ${process.env.PORT}`)
  );

export default app;
