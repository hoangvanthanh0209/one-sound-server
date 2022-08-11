import mongoose from 'mongoose'

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Please add a name value'],
        },
        slug: {
            type: String,
        },
        artistName: {
            type: String,
            required: [true, 'Please add a artist name value'],
        },
        artistNameRef: {
            type: String,
        },
        avatar: {
            type: String,
        },
        avatarCloudinaryId: {
            type: String,
        },
        description: {
            type: String,
        },
        likeCount: {
            type: Number,
            default: 0,
        },
        username: {
            type: String,
            required: [true, 'Please add a user name value'],
        },
        password: {
            type: String,
            required: [true, 'Please add a password value'],
        },
        status: {
            type: String,
            default: 'active',
        },
        role: {
            type: String,
            default: 'user',
        },
    },
    {
        timestamps: true,
    },
)

const User = mongoose.model('User', userSchema)

export default User
