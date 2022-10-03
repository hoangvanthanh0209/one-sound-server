import mongoose from 'mongoose'
// import pkg from 'mongoose'
// const { Schema } = pkg

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
        search: {
            type: String,
        },
        userId: {
            type: mongoose.Types.ObjectId,
            require: true,
            ref: 'User',
        },
        playlistId: {
            type: mongoose.Types.ObjectId,
            require: true,
            ref: 'Playlist',
        },
    },
    {
        timestamps: true,
    },
)

// Duplicate the ID field.
songSchema.virtual('id').get(function () {
    return this._id.toHexString()
})

// Ensure virtual fields are serialised.
songSchema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform: function (doc, ret) {
        delete ret._id
    },
})

const Song = mongoose.model('Song', songSchema)

export default Song
