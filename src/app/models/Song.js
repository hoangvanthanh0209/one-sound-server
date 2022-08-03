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
    mp3: {
        type: String,
    },
    mp3CloudinaryId: {
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
    playlistId: {
        type: mongoose.Types.ObjectId,
        ref: 'playlists',
    },
})

export const songModel = mongoose.model('songs', songSchema)
