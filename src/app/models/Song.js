import mongoose from 'mongoose'

const songSchema = new mongoose.Schema({
    name: {
        type: String,
    },
    singer: {
        type: String,
    },
    year: {
        type: Date,
    },
    thumbnail: {
        type: String,
    },
    thumbnailCloudinaryId: {
        type: String,
    },
    path: {
        type: String,
    },
    pathCloudinaryId: {
        type: String,
    },
    likeCount: {
        type: Number,
    },
    userId: {
        type: mongoose.Types.ObjectId,
        ref: 'users',
    },
})

export const songModel = mongoose.model('songs', songSchema)
