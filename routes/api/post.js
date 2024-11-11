import express from 'express';

// Model
import Post from '../../models/post.js';
import User from '../../models/user.js';
import Category from '../../models/category.js';
import Comment from '../../models/comment.js';
import auth from '../../middleware/auth.js';
import moment from 'moment';

const router = express.Router();

import multer from 'multer';
import multerS3 from 'multer-s3';
import path from 'path';
import AWS from 'aws-sdk';
import { isNullOrUndefined } from 'util';
import Visitor from '../../models/visitor.js';

const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_KEY,
    secretAccessKey: process.env.AWS_PRIVATE_KEY,
});

const uploadS3 = multer({
    storage: multerS3({
        s3,
        bucket: 'blogjiyu/upload/',
        region: 'ap-northeast-2',
        key(req, file, cb) {
            const ext = path.extname(file.originalname);
            const basename = path.basename(file.originalname, ext);
            cb(null, basename + new Date().valueOf() + ext);
        },
    }),
    limits: { fileSize: 100 * 1024 * 1024 },
});

// * 이미지 업로드
router.post('/image', uploadS3.array('upload', 5), async (req, res, next) => {
    try {
        res.json({ uploaded: true, url: req.files.map((v) => v.location) });
    } catch (e) {
        console.error(e);
        res.json({ uploaded: false, url: null });
    }
});

// * 전체 포스트 조회 또는 카테고리별 포스트 조회
router.get('/list/:id?/view', async (req, res) => {
    try {
        const { id, categoryId } = req.params; // URL 파라미터에서 status와 categoryId 가져오기
        let postsList;

        if (id !== 'all') {
            const category = await Category.findById(id); // ID로 카테고리 조회
            if (!category) {
                return res.id(404).json({ message: '카테고리를 찾을 수 없습니다.ㅠㅠ' });
            }

            postsList = await Post.find({ category: category._id }).sort({ date: -1 });
        } else {
            postsList = await Post.find().sort({ date: -1 });
        }

        const postCount = postsList.length;
        const categoryFindResult = await Category.find();
        const visitorsCount = await Visitor.findOne();

        const result = { postsList, categoryFindResult, postCount, visitorsCount, id };
        res.json(result);
    } catch (e) {
        console.log(e);
        res.status(500).json({ msg: '서버 오류가 발생했습니다.' });
    }
});

export default router;

// * 게시글 업로드
router.post('/', auth, uploadS3.none(), async (req, res, next) => {
    try {
        console.log(req, 'req');
        const { title, contents, previewContents, fileUrl, creator, category } = req.body;
        const newPost = await Post.create({
            title,
            contents,
            previewContents,
            fileUrl,
            creator: req.user.id,
            date: moment().utcOffset('+09:00').format('YYYY-MM-DD HH:mm'),
        });

        const findResult = await Category.findOne({
            categoryName: category,
        });

        if (isNullOrUndefined(findResult)) {
            const newCategory = await Category.create({
                categoryName: category,
            });
            await Post.findByIdAndUpdate(newPost._id, {
                $push: { category: newCategory._id },
            });
            await Category.findByIdAndUpdate(newCategory._id, {
                $push: { posts: newPost._id },
            });
            await User.findByIdAndUpdate(req.user.id, {
                $push: {
                    posts: newPost._id,
                },
            });
        } else {
            await Category.findByIdAndUpdate(findResult._id, {
                $push: { posts: newPost._id },
            });
            await Post.findByIdAndUpdate(newPost._id, {
                category: findResult._id,
            });
            await User.findByIdAndUpdate(req.user.id, {
                $push: {
                    posts: newPost._id,
                },
            });
        }
        return res.redirect(`/api/post/${newPost._id}`);
    } catch (e) {
        console.log(e);
    }
});

/// * 상세 게시글 조회
router.get('/:id/detail', async (req, res, next) => {
    try {
        const post = await Post.findById(req.params.id).populate('creator', 'name').populate({ path: 'category', select: 'categoryName' });
        post.views += 1;
        post.save();
        res.json(post);
    } catch (e) {
        console.error(e);
        next(e);
    }
});

// * 상세 게시글 댓글 조회
router.get('/:id/comments', async (req, res) => {
    try {
        const comment = await Post.findById(req.params.id).populate({
            path: 'comments',
        });
        const result = comment.comments;
        res.json(result);
    } catch (e) {
        console.log(e);
    }
});

// * 상세 게시글 댓글 등록
router.post('/:id/comments', async (req, res, next) => {
    const newComment = await Comment.create({
        contents: req.body.contents,
        creator: req.body.userId,
        creatorName: req.body.userName,
        post: req.body.id,
        date: moment().utcOffset('+09:00').format('YYYY-MM-DD HH:mm'),
    });
    try {
        await Post.findByIdAndUpdate(req.body.id, {
            $push: {
                comments: newComment._id,
            },
        });
        await User.findByIdAndUpdate(req.body.userId, {
            $push: {
                comments: {
                    post_id: req.body.id,
                    comment_id: newComment._id,
                },
            },
        });
        res.json(newComment);
    } catch (e) {
        console.log(e);
        next(e);
    }
});

// * 게시글 삭제
router.delete('/:id', auth, async (req, res) => {
    await Post.deleteMany({ _id: req.params.id });
    await Comment.deleteMany({ post: req.params.id });
    await User.findByIdAndUpdate(req.user.id, {
        $pull: {
            posts: req.params.id,
            comments: { post_id: req.params.id },
        },
    });
    const CategoryUpdateResult = await Category.findOneAndUpdate({ posts: req.params.id }, { $pull: { posts: req.params.id } }, { new: true });

    if (CategoryUpdateResult.posts.length === 0) {
        await Category.deleteMany({ _id: CategoryUpdateResult });
    }
    return res.json({ success: true });
});

// * 게시글 수정
router.post('/:id/edit', async (req, res, next) => {
    console.log(req, 'api/post/:id/edit');
    const {
        body: { title, contents, previewContents, fileUrl, id },
    } = req;

    try {
        const modified_post = await Post.findByIdAndUpdate(
            id,
            {
                title,
                contents,
                previewContents,
                fileUrl,
                date: moment().utcOffset('+09:00').format('YYYY-MM-DD HH:mm'),
            },
            { new: true },
        );
        console.log(modified_post, 'edit modified');
        res.redirect(`/api/post/${modified_post.id}`);
    } catch (e) {
        console.log(e);
        next(e);
    }
});

// * 게시글 좋아요 등록
router.post('/:id/likes', async (req, res, next) => {
    const postId = req.params.id;
    const userId = req.body.body.userId;
    console.log(req.body, '<req');
    console.log(userId, '<userId');
    try {
        const post = await Post.findById(postId);
        var likes = post.likes;
        const likesCount = post.likesCount;
        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }

        const userLikedPost = likes.includes(userId);

        if (userLikedPost) {
            // *이미 좋아요를 누른 경우, 좋아요 취소
            likes = likes.filter((likeId) => likeId.toString() !== userId);
        } else {
            // *좋아요 추가
            likes.push(userId);
        }
        post.likes = likes;
        post.likesCount = likes.length;
        await post.save();
        res.json(post);
    } catch (e) {
        console.error(e);
        next(e);
    }
});
