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
        search: {
            type: String,
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'User',
        },
        categoryId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'Category',
        },
    },
    {
        timestamps: true,
    },
)

// Duplicate the ID field.
playlistSchema.virtual('id').get(function () {
    return this._id.toHexString()
})

// Ensure virtual fields are serialised.
playlistSchema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform: function (doc, ret) {
        delete ret._id
    },
})

const Playlist = mongoose.model('Playlist', playlistSchema)

export default Playlist
