import jwt from 'jsonwebtoken';
import config from '../config/index.js';
const { JWT_SECRET } = config;

const auth = (req, res, next) => {
    const token = req.header('x-auth-token');

    if (!token) {
        return res.status(401).json({
            msg: '삐빅. 토큰 없음. 인증이 거부되었음!',
        });
    }
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (e) {
        console.log(e);
        res.status(400).json({
            msg: '토큰이 유효하지 않아요',
        });
    }
};

export default auth;
