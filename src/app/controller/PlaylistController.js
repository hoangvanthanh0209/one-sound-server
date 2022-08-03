import moment from 'moment'

import { playlistModel } from '../models/Playlist.js'
import { userModel } from '../models/User.js'
import { cloudinary } from '../../utils/cloundinary.js'

export const getAllPlaylist = async (req, res) => {
    try {
        let playlists = await playlistModel.find()
        res.status(200).json({ data: playlists })
    } catch (err) {
        res.status(500).json({ err })
    }
}

export const getPlaylistByUserId = async (req, res) => {
    try {
        let userId = req.query.userId
        let playlist = await playlistModel.find({ userId: userId })
        if (!playlist.length) {
            return res.status(200).json('No playlist')
        }
        return res.status(200).json({ data: playlist })
    } catch (err) {
        res.status(500).json({ err })
    }
}

export const getPlaylistByNameUser = async (req, res) => {
    try {
        let fullname = req.query.fullname
        let playlist = await playlistModel.aggregate([
            {
                $lookup: {
                    from: 'users',
                    localField: 'userId',
                    foreignField: '_id',
                    as: 'user',
                },
            },
        ])
        let newPlaylist = []

        if (fullname) {
            newPlaylist = playlist.filter((item) => item.user[0].fullname.includes(fullname))
        } else {
            newPlaylist = playlist
        }

        res.status(200).json({ data: newPlaylist })
    } catch (err) {
        res.status(500).json({ err })
    }
}

export const getTopPlaylist = async (req, res) => {
    try {
        let topNumber = req.query.top
        let playlist = await playlistModel.find().sort({ likeCount: 'desc' }).limit(topNumber)
        res.status(200).json({ data: playlist })
    } catch (err) {
        res.status(500).json({ err })
    }
}

export const addPlaylist = async (req, res) => {
    try {
        let addPlaylist = req.body
        let imagePath = req.file.path
        let user = await userModel.findById(addPlaylist.userId)

        const imageName = `playlist-${moment(Date.now()).format('DD-MM-YYYY-HH:mm:ss')}`
        const options = {
            public_id: `${user.artistNameRef}/playlist/${imageName}`,
        }
        let result = await cloudinary.uploader.upload(imagePath, options)

        let playlist = new playlistModel(addPlaylist)
        playlist.thumbnail = result?.secure_url
        playlist.thumbnailCloudinaryId = result?.public_id

        await playlist.save()

        res.status(200).json(playlist)
    } catch (err) {
        res.status(500).json({ err })
    }
}

export const updatePlaylist = async (req, res) => {
    try {
        let playlistId = req.query.playlistId

        let playlist = await playlistModel.findById(playlistId)

        if (playlist) {
            let updatePlaylist = req.body
            let imagePath = req.file.path
            let result

            let user = await userModel.findById(playlist.userId)

            await cloudinary.uploader.destroy(playlist.thumbnailCloudinaryId)

            const imageName = `playlist-${moment(Date.now()).format('DD-MM-YYYY-HH:mm:ss')}`
            const options = {
                public_id: `${user.artistNameRef}/playlist/${imageName}`,
            }

            result = await cloudinary.uploader.upload(imagePath, options)

            updatePlaylist.thumbnail = result?.secure_url
            updatePlaylist.thumbnailCloudinaryId = result?.public_id

            let newPlaylist = await playlistModel.findByIdAndUpdate({ _id: playlist._id }, updatePlaylist, {
                new: true,
            })

            res.status(200).json(newPlaylist)
        }
    } catch (err) {
        res.status(500).json({ err })
    }
}

export const deletePlaylist = async (req, res) => {
    try {
        let playlistId = req.query.playlistId
        let playlist = await playlistModel.findById(playlistId)
        if (playlist) {
            await cloudinary.uploader.destroy(playlist.thumbnailCloudinaryId)
            await playlist.remove()
        }
        res.status(200).json(playlist)
    } catch (err) {
        res.status(500).json({ err })
    }
}
