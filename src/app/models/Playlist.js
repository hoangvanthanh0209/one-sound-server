import mongoose from 'mongoose'

const playlistSchema = new mongoose.Schema({
    name: {
        type: String,
        require: true,
    },
    description: {
        type: String,
    },
    thumbnail: {
        type: String,
    },
    thumbnailCloudinaryId: {
        type: String,
    },
    likeCount: {
        type: Number,
        default: 0,
    },
    userId: {
        type: mongoose.Types.ObjectId,
        ref: 'users',
    },
})

export const playlistModel = mongoose.model('playlists', playlistSchema)
