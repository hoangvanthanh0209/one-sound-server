import mongoose from 'mongoose'

const userSchema = new mongoose.Schema({
    fullname: {
        type: String,
    },
    artistName: {
        type: String,
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
})

export const userModel = mongoose.model('users', userSchema)
