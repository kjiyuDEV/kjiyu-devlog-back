import moment from 'moment';
import mongoose from 'mongoose';

const CommentSchema = new mongoose.Schema({
    contents: {
        type: String,
        required: true,
    },
    date: {
        type: String,
        default: moment().format('YYYY-MM-DD HH:mm'),
    },
    post: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'post',
    },
    creator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
    },
    creatorName: {
        type: String,
        required: true,
    },
});

const Comment = mongoose.model('comment', CommentSchema);

export default Comment;
