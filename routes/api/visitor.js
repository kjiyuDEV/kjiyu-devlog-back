import express from 'express';
import Visitor from '../../models/visitor.js';

const router = express.Router();

// * 방문자
router.get('/visit', async (req, res, next) => {
    try {
        const visit = await Visitor.findOne();
        visit.views += 1;
        visit.save();
        res.json(visit);
    } catch (e) {
        console.error(e);
        next(e);
    }
});

export default router;
