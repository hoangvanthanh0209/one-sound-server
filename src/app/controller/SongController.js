import moment from 'moment'

import { songModel } from '../models/Song.js'
import { cloudinary } from '../../utils/cloundinary.js'
import { userModel } from '../models/User.js'

export const getSongByPlaylistId = async (req, res) => {
    try {
        let playlistId = req.query.playlistId
        let songList = await songModel.find({ playlistId: playlistId })
        res.status(200).json({ data: songList })
    } catch (err) {
        res.status(500).json({ err })
    }
}

export const addSong = async (req, res) => {
    try {
        let addSong = req.body
        let imagePath = req.files.thumbnail[0].path
        let mp3Path = req.files.mp3[0].path

        let user = await userModel.findById(addSong.userId)

        const imageName = `song-thumbnail-${moment(Date.now()).format('DD-MM-YYYY-HH:mm:ss')}`
        const imageOptions = {
            public_id: `${user.artistNameRef}/song/thumbnail/${imageName}`,
        }

        const mp3Name = `song-mp3-${moment(Date.now()).format('DD-MM-YYYY-HH:mm:ss')}`
        const mp3Options = {
            public_id: `${user.artistNameRef}/song/mp3/${mp3Name}`,
            resource_type: 'video',
        }

        let [resultImage, resultMp3] = await Promise.all([
            cloudinary.uploader.upload(imagePath, imageOptions),
            cloudinary.uploader.upload(mp3Path, mp3Options),
        ])

        let song = new songModel(addSong)
        song.thumbnail = resultImage?.secure_url
        song.thumbnailCloudinaryId = resultImage?.public_id
        song.mp3 = resultMp3?.secure_url
        song.mp3CloudinaryId = resultMp3?.public_id

        await song.save()

        res.status(200).json(song)
    } catch (err) {
        res.status(500).json({ err })
    }
}

export const updateSong = async (req, res) => {
    try {
        let songId = req.query.songId
        let song = await songModel.findById(songId)

        if (song) {
            let updateSong = req.body
            let imagePath = req.files.thumbnail[0].path
            let mp3Path = req.files.mp3[0].path

            let user = await userModel.findById(song.userId)

            await Promise.all([
                cloudinary.uploader.destroy(song.thumbnailCloudinaryId),
                cloudinary.uploader.destroy(song.mp3CloudinaryId, { resource_type: 'video' }),
            ])

            const date = moment(Date.now()).format('DD-MM-YYYY-HH:mm:ss')

            const imageName = `song-thumbnail-${date}`
            const imageOptions = {
                public_id: `${user.artistNameRef}/song/thumbnail/${imageName}`,
            }

            const mp3Name = `song-mp3-${date}`
            const mp3Options = {
                public_id: `${user.artistNameRef}/song/mp3/${mp3Name}`,
                resource_type: 'video',
            }

            let [resultImage, resultMp3] = await Promise.all([
                cloudinary.uploader.upload(imagePath, imageOptions),
                cloudinary.uploader.upload(mp3Path, mp3Options),
            ])

            updateSong.thumbnail = resultImage?.secure_url
            updateSong.avatarCloudinaryId = resultImage?.public_id
            updateSong.mp3 = resultMp3?.secure_url
            updateSong.mp3CloudinaryId = resultMp3?.public_id
            song = await songModel.findByIdAndUpdate({ _id: songId }, updateSong, { new: true })

            res.status(200).json(song)
        }
    } catch (err) {
        res.status(500).json({ err })
    }
}

export const deleteSong = async (req, res) => {
    try {
        let songId = req.query.songId
        let song = await songModel.findById(songId)

        if (song) {
            await Promise.all([
                cloudinary.uploader.destroy(song.thumbnailCloudinaryId),
                cloudinary.uploader.destroy(song.mp3CloudinaryId, { resource_type: 'video' }),
            ])
            await song.remove()
            res.status(200).json(song)
        }
    } catch (err) {
        res.status(500).json({ err })
    }
}
