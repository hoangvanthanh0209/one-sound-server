import mongoose from 'mongoose'

const accountSchema = new mongoose.Schema({
    username: {
        type: String,
        require: true,
    },
    password: {
        type: String,
        require: true,
    },
    status: {
        type: String,
        default: 'active',
    },
    role: {
        type: String,
        default: 'user',
    },
    userId: {
        type: mongoose.Types.ObjectId,
        ref: 'users',
    },
})

export const accountModel = mongoose.model('account', accountSchema)
