import mongoose from 'mongoose'

const playlistSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Please add a name value'],
        },
        slug: {
            type: String,
        },
        description: {
            type: String,
            default: '',
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
        user: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'User',
        },
    },
    {
        timestamps: true,
    },
)

const Playlist = mongoose.model('Playlist', playlistSchema)

export default Playlist
