import mongoose from 'mongoose'

const songSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Please add a name value'],
        },
        slug: {
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
        user: {
            type: mongoose.Types.ObjectId,
            require: true,
            ref: 'User',
        },
        playlist: {
            type: mongoose.Types.ObjectId,
            require: true,
            ref: 'Playlist',
        },
    },
    {
        timestamps: true,
    },
)

const Song = mongoose.model('Song', songSchema)

export default Song
