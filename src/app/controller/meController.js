import asyncHandler from 'express-async-handler'
import slugify from 'slugify'
import moment from 'moment'

import { User, Playlist, Song } from '../models/index.js'
import { uploadImage, deleteImage, uploadMp3, deleteMp3 } from '../../utils/cloundinary.js'

const slugifyOptions = {
    replacement: '-',
    remove: undefined,
    lower: true,
    strict: false,
    locale: 'vi',
    trim: true,
}

// @desc    Get user data
// @route   GET /api/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
    const { _id, name, slug, artistName, avatar, description, likeCount } = await User.findById(req.user.id)

    res.status(200).json({
        id: _id,
        name,
        slug,
        artistName,
        avatar,
        description,
        likeCount,
    })
})

// @desc    Get playlists of user
// @route   GET /api/me/playlist
// @access  Private
const getplaylists = asyncHandler(async (req, res) => {
    const playlists = await Playlist.find({ user: req.user.id }).select('-thumbnailCloudinaryId -user')

    if (!playlists) {
        res.status(400)
        throw new Error('Danh sách playlist trống')
    }

    res.status(200).json(playlists)
})

// @desc    Get playlist by id
// @route   GET /api/me/playlist/:pId
// @access  Private
const getplaylistById = asyncHandler(async (req, res) => {
    const playlist = await Playlist.findById(req.params.pId)

    if (!playlist) {
        res.status(400)
        throw new Error('Playlist không tồn tại')
    }

    res.status(200).json(playlist)
})

// @desc    Get songs of playlist
// @route   GET /api/me/playlist/song
// @access  Private
const getSongOfPlaylist = asyncHandler(async (req, res) => {
    const songs = await Song.find({ playlist: req.headers.playlistId }).select(
        '-thumbnailCloudinaryId -mp3CloudinaryId -user -playlist',
    )

    if (!songs) {
        res.status(400)
        throw new Error('Danh sách bài hài trống')
    }

    res.status(200).json(songs)
})

// @desc    Upload playlist
// @route   POST /api/me/playlist
// @access  Private
const addPlaylist = asyncHandler(async (req, res) => {
    const { name, description } = req.body
    let image

    if (!name) {
        res.status(400)
        throw new Error('Vui lòng nhập tên playlist')
    }

    if (req.file) {
        const path = req.file.path
        image = await uploadImage(req.user.artistNameRef, 'playlist', path)
    }

    const playlist = await Playlist.create({
        name,
        slug: slugify(name, slugifyOptions),
        description,
        thumbnail: image?.secure_url || process.env.PLAYLIST_DEFAULT,
        thumbnailCloudinaryId: image?.public_id,
        user: req.user.id,
    })

    res.status(201).json({
        _id,
        name,
        slug,
        description,
        thumbnail: playlist.thumbnail,
    })
})

// @desc    Upload playlist
// @route   POST /api/me/playlist/:pId/song
// @access  Private
const addSong = asyncHandler(async (req, res) => {
    const { name, singer } = req.body
    const playlistId = req.headers.playlistId
    const { thumbnail, mp3 } = req.files

    if (!mp3) {
        res.status(400)
        throw new Error('Vui lòng chọn file âm thanh')
    }

    const { _id: userId, artistNameRef } = req.user
    let resultImage, resultMp3

    if (thumbnail) {
        const path = thumbnail[0].path
        resultImage = await uploadImage(artistNameRef, 'song/thumbnail', path)
    }

    if (mp3) {
        const path = mp3[0].path
        resultMp3 = await uploadMp3(artistNameRef, 'song/mp3', path)
    }

    const song = await Song.create({
        name,
        slug: slugify(name, slugifyOptions),
        singer,
        year: moment().toDate().getFullYear(),
        thumbnail: resultImage?.secure_url || process.env.PLAYLIST_DEFAULT,
        thumbnailCloudinaryId: resultImage?.secure_url,
        mp3: resultMp3?.secure_url,
        mp3CloudinaryId: resultMp3?.public_id,
        playlist: playlistId,
        user: userId,
    })

    res.status(201).json({
        _id: song._id,
        name,
        slug: song.slug,
        singer,
        year: song.year,
        thumbnail: song.thumbnail,
        mp3: song.mp3,
        likeCount: song.likeCount,
    })
})

// @desc    update playlist
// @route   PUT /api/me/playlist/:pId
// @access  Private
const updatePlaylist = asyncHandler(async (req, res) => {
    const { name, description } = req.body
    const playlistId = req.params.pId

    const playlist = await Playlist.findById(playlistId)

    playlist.name = name
    playlist.description = description

    if (req.file) {
        await deleteImage(playlist.thumbnailCloudinaryId)

        const imagePath = req.file.path

        const result = await uploadImage(req.user.artistNameRef, 'playlist', imagePath)

        playlist.thumbnail = result?.secure_url
        playlist.thumbnailCloudinaryId = result?.public_id
    }

    const updatedPlaylist = await Playlist.findByIdAndUpdate(playlistId, playlist, { new: true })

    res.status(200).json(updatedPlaylist)
})

// @desc    update song
// @route   PUT /api/me/playlist/song/:sId
// @access  Private
const updateSong = asyncHandler(async (req, res) => {
    const { name, singer } = req.body
    const { artistNameRef } = req.user
    const songId = req.params.sId
    const { thumbnail, mp3 } = req.files
    let resultImage, resultMp3

    const song = await Song.findById(songId)

    if (!song) {
        res.status(401)
        throw new Error('Song not found')
    }

    song.name = name
    song.slug = name ? slugify(name, slugifyOptions) : song.slug
    song.singer = singer

    // check update thumbnail
    if (thumbnail) {
        const path = thumbnail[0].path

        await deleteImage(song.thumbnailCloudinaryId)

        resultImage = await uploadImage(artistNameRef, 'song/thumbnail', path)

        song.thumbnail = resultImage?.secure_url
        song.thumbnailCloudinaryId = resultImage?.public_id
    }

    // check update mp3
    if (mp3) {
        const path = mp3[0].path

        await deleteMp3(song.mp3CloudinaryId)

        resultMp3 = await uploadMp3(artistNameRef, 'song/mp3', path)

        song.mp3 = resultMp3?.secure_url
        song.mp3CloudinaryId = resultMp3?.public_id
    }

    const updatedSong = await Song.findByIdAndUpdate(songId, song, { new: true }).select(
        '_id name slug singer year thumbnail mp3 likeCount',
    )

    res.status(200).json(updatedSong)
})

// @desc    Update user data
// @route   PUT /api/me/:id
// @access  Private
const updateMe = asyncHandler(async (req, res) => {
    const { name, artistName, description } = req.body
    const user = await User.findById(req.user.id)

    if (req.file) {
        await deleteImage(user.avatarCloudinaryId)
        const path = req.file.path
        const image = await uploadImage(user.artistNameRef, 'avatar', path)

        user.avatar = image?.secure_url
        user.avatarCloudinaryId = image?.public_id
    }

    user.name = name
    name && (user.slug = slugify(name, slugifyOptions))
    user.artistName = artistName
    user.description = description

    const updatedUser = await User.findByIdAndUpdate(req.user.id, user, { new: true }).select(process.env.USER_INFO)

    res.status(200).json(updatedUser)
})

// @desc    Delete playlist
// @route   PUT /api/me/playlist/:pId
// @access  Private
const deletePlaylist = asyncHandler(async (req, res) => {
    const playlist = await Playlist.findById(req.params.pId)

    if (!playlist) {
        res.status(400)
        throw new Error('Playlist không tồn tại')
    }

    if (playlist.user.toString() !== req.user.id) {
        res.status(401)
        throw new Error('Người dùng không được ủy quyền')
    }

    await deleteImage(playlist.thumbnailCloudinaryId)

    await playlist.remove()

    res.status(200).json({ id: req.params.pId })
})

// @desc    Delete song
// @route   PUT /api/me/playlist/song/:sId
// @access  Private
const deleteSong = asyncHandler(async (req, res) => {
    const songId = req.params.sId
    const song = await Song.findById(songId)

    if (!song) {
        res.status(400)
        throw new Error('Song không tồn tại')
    }

    if (song.user.toString() !== req.user.id) {
        res.status(401)
        throw new Error('Người dùng không được ủy quyền')
    }

    await Promise.all([deleteImage(song.thumbnailCloudinaryId), deleteMp3(song.mp3CloudinaryId)])

    await song.remove()

    res.status(200).json({ id: songId })
})

export {
    getMe,
    getplaylists,
    getplaylistById,
    getSongOfPlaylist,
    addPlaylist,
    addSong,
    updatePlaylist,
    updateSong,
    updateMe,
    deletePlaylist,
    deleteSong,
}
