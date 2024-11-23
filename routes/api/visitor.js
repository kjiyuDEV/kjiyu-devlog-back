import express from 'express';
import Visitor from '../../models/visitor.js';

const router = express.Router();

// * 방문자
router.post('/visit', async (req, res, next) => {
    try {
        const visit = await Visitor.findOne();
        if (req.body.type === 'up') {
            visit.views += 1;
            visit.save();
        }

        res.json(visit);
    } catch (e) {
        console.error(e);
        next(e);
    }
});

export default router;
