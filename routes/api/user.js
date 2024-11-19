import express from 'express';
import bcrypt from 'bcryptjs';

import jwt from 'jsonwebtoken';
import config from '../../config/index.js';
const { JWT_SECRET } = config;

// Model
import User from '../../models/user.js';

const router = express.Router();

// * 회원가입
router.post('/signup', (req, res) => {
    console.log(req);
    const { name, userId, password, nickname } = req.body;

    // Simple validation
    if (!name || !userId || !password) {
        return res.status(400).json({ msg: '모든 필드를 채워주세요' });
    }
    // Check for existing user
    User.findOne({ userId }).then((user) => {
        // unique key로 체크함
        if (user)
            return res.status(400).json({
                msg: '이미 가입된 유저가 존재합니다',
            });
        const newUser = new User({
            name,
            userId,
            password,
            nickname,
        });

        //해시값을 쉽게바꿔준다.
        bcrypt.genSalt(10, (err, salt) => {
            bcrypt.hash(newUser.password, salt, (err, hash) => {
                if (err) throw err;
                newUser.password = hash;
                newUser.save().then((user) => {
                    jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: 3600 }, (err, token) => {
                        if (err) throw err;
                        res.json({
                            token,
                            user: {
                                id: user.id,
                                name: user.name,
                                userId: user.userId,
                                nickname: user.nickname || user.name,
                            },
                        });
                    });
                });
            });
        });
    });
});

export default router;
