import mongoose from 'mongoose';

// Create Schema
const VisitorSchema = new mongoose.Schema({
    views: {
        type: Number,
        default: 0,
    },
});

const Visitor = mongoose.model('visitor', VisitorSchema);

export default Visitor;
