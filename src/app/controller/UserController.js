import moment from 'moment'

import { userModel } from '../models/User.js'
import { cloudinary } from '../../utils/cloundinary.js'

export const getAllUser = async (req, res) => {
    try {
        let userList = await userModel.find()

        res.status(200).json({ data: userList })
    } catch (err) {
        res.status(500).json({ err })
    }
}

export const addUser = async (req, res) => {
    try {
        let addUser = req.body
        let artistNameRef = addUser.artistName
        let imagePath = req.file.path

        const imageName = `avatar-${moment(Date.now()).format('DD-MM-YYYY-HH:mm:ss')}`
        const options = {
            public_id: `${artistNameRef}/avatar/${imageName}`,
        }
        let result = await cloudinary.uploader.upload(imagePath, options)

        let user = new userModel(addUser)
        user.artistNameRef = artistNameRef
        user.avatar = result?.secure_url
        user.avatarCloudinaryId = result?.public_id

        await user.save()

        res.status(200).json(user)
    } catch (err) {
        res.status(500).json({ err })
    }
}

export const updateUser = async (req, res) => {
    try {
        let updateUser = req.body
        let userId = req.query.userId
        let result

        let user = await userModel.findById(userId)
        if (user) {
            let imagePath = req.file.path

            await cloudinary.uploader.destroy(user.avatarCloudinaryId)

            const imageName = `avatar-${moment(Date.now()).format('DD-MM-YYYY-HH:mm:ss')}`
            const options = {
                public_id: `${user.artistNameRef}/avatar/${imageName}`,
            }

            result = await cloudinary.uploader.upload(imagePath, options)

            updateUser.avatar = result?.secure_url
            updateUser.avatarCloudinaryId = result?.public_id
            user = await userModel.findByIdAndUpdate({ _id: userId }, updateUser, { new: true })
        }

        res.status(200).json(user)
    } catch (err) {
        res.status(500).json({ err })
    }
}

export const deleteUser = async (req, res) => {
    try {
        const userId = req.query.userId
        const user = await userModel.findById(userId)

        if (user) {
            await cloudinary.uploader.destroy(user.avatarCloudinaryId)
            await cloudinary.api.delete_folder(user.artistNameRef)
            await user.remove()
        }

        res.status(200).json(user)
    } catch (err) {
        res.status(500).json({ err })
    }
}
