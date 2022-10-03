import asyncHandler from 'express-async-handler'
import slugify from 'slugify'
import moment from 'moment'
import bcrypt from 'bcrypt'
import dotenv from 'dotenv'
import mongoose from 'mongoose'
import jwt from 'jsonwebtoken'

import { User, Playlist, Song, Category } from '../models/index.js'
import { uploadImage, deleteImage, uploadMp3, deleteMp3 } from '../../utils/cloundinary.js'

dotenv.config()

const unwindUser = 'userData'
const unwindPlaylist = 'playlistData'
const unwindSong = 'songData'
const unwindCategory = 'categoryData'

const lookupSongToUser = {
    from: 'users',
    localField: 'userId',
    foreignField: '_id',
    as: unwindUser,
}
const lookupSongToPlaylist = {
    from: 'playlists',
    localField: 'playlistId',
    foreignField: '_id',
    as: unwindPlaylist,
}
const lookupPlaylistToSong = {
    from: 'songs',
    localField: '_id',
    foreignField: 'playlistId',
    as: unwindSong,
}
const lookupPlaylistToCategory = {
    from: 'categories',
    localField: 'categoryId',
    foreignField: '_id',
    as: unwindCategory,
}
const lookupPlaylistToUser = {
    from: 'users',
    localField: 'userId',
    foreignField: '_id',
    as: unwindUser,
}

const columnSongReturn = {
    _id: 0,
    id: '$_id',
    name: '$name',
    slug: '$slug',
    singer: '$singer',
    year: '$year',
    thumbnail: '$thumbnail',
    mp3: '$mp3',
    likeCount: '$likeCount',
    createdAt: '$createdAt',
    artistName: `$${unwindUser}.artistName`,
    playlistName: `$${unwindPlaylist}.name`,
}
const columnPlaylistReturn = {
    _id: 0,
    id: '$_id',
    name: '$name',
    slug: '$slug',
    categoryId: '$categoryId',
    description: '$description',
    thumbnail: '$thumbnail',
    likeCount: '$likeCount',
    createdAt: '$createdAt',
    countSong: { $size: `$${unwindSong}` },
    categoryName: `$${unwindCategory}.name`,
}

const objectId = mongoose.Types.ObjectId

const slugifyOptions = {
    replacement: '-',
    remove: undefined,
    lower: true,
    strict: false,
    locale: 'vi',
    trim: true,
}

const slugifyOptionsSearch = {
    replacement: ' ',
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
const getPlaylists = asyncHandler(async (req, res) => {
    const playlists = await Playlist.aggregate()
        .lookup(lookupPlaylistToSong)
        .lookup(lookupPlaylistToCategory)
        .match({ userId: new objectId(req.user.id) })
        .unwind(unwindCategory)
        .project(columnPlaylistReturn)

    res.status(200).json(playlists)
})

// @desc    Get playlist by id
// @route   GET /api/me/playlist/:pId
// @access  Private
const getPlaylistById = asyncHandler(async (req, res) => {
    let playlist
    await Playlist.aggregate()
        .lookup(lookupPlaylistToSong)
        .match({ _id: new objectId(req.params.pId), userId: new objectId(req.user.id) })
        .project(columnPlaylistReturn)
        .exec()
        .then((data) => {
            playlist = data[0]
        })
        .catch((e) => {
            console.log(e)
            res.status(400)
            throw new Error('Playlist không tồn tại')
        })

    res.status(200).json(playlist)
})

// @desc    Get songs of playlist
// @route   GET /api/me/playlist/getInfoAndSong?playlistId=x
// @access  Private
const getInfoAndSong = asyncHandler(async (req, res) => {
    let playlist
    let songs = []
    const playlistId = req.query.playlistId
    await Playlist.aggregate()
        .lookup(lookupPlaylistToSong)
        .match({ _id: new objectId(playlistId), userId: new objectId(req.user.id) })
        .project(columnPlaylistReturn)
        .exec()
        .then((data) => {
            playlist = data[0]
        })
        .catch((e) => {
            console.log(e)
            res.status(400)
            throw new Error('Playlist không tồn tại')
        })

    await Song.aggregate()
        .lookup(lookupSongToUser)
        .lookup(lookupSongToPlaylist)
        .match({ playlistId: new objectId(playlistId) })
        .unwind(unwindUser)
        .unwind(unwindPlaylist)
        .project(columnSongReturn)
        .exec()
        .then((data) => {
            songs = data
        })
        .catch((error) => {
            console.log(error)
            res.status(400)
            throw new Error('Playlist không tồn tại')
        })

    const dataReturn = {
        playlist,
        songs,
    }

    res.status(200).json(dataReturn)
})

// @desc    Get playlist of me
// @route   GET /api/me/playlist/ofMe
// @access  Private
const getPlaylistOfMe = asyncHandler(async (req, res) => {
    const playlists = await Playlist.aggregate()
        .lookup(lookupPlaylistToCategory)
        .lookup(lookupPlaylistToSong)
        .lookup(lookupPlaylistToUser)
        .unwind(unwindCategory)
        .unwind(unwindUser)
        .match({ userId: new objectId(req.user.id) })
        .group({
            _id: `$${unwindCategory}`,
            data: {
                $push: {
                    id: '$_id',
                    name: '$name',
                    slug: '$slug',
                    categoryId: '$categoryId',
                    description: '$description',
                    thumbnail: '$thumbnail',
                    likeCount: '$likeCount',
                    createdAt: '$createdAt',
                    countSong: { $size: `$${unwindSong}` },
                    userId: '$userId',
                    artistName: `$${unwindUser}.artistName`,
                },
            },
        })
        .project({
            _id: 0,
            categoryId: '$_id._id',
            categoryName: '$_id.name',
            count: { $size: '$data' },
            data: '$data',
        })
        .sort({ categoryName: 'asc' })

    res.status(200).json(playlists)
})

// @desc    Upload playlist
// @route   POST /api/me/playlist
// @access  Private
const addPlaylist = asyncHandler(async (req, res) => {
    const { name, categoryId, description } = req.body
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
        thumbnail: image?.secure_url,
        thumbnailCloudinaryId: image?.public_id,
        search: slugify(name, slugifyOptionsSearch),
        userId: req.user.id,
        categoryId: categoryId,
    })

    const category = await Category.findOne({ _id: playlist.categoryId })

    res.status(201).json({
        id: playlist._id,
        name,
        slug: playlist.slug,
        categoryId: playlist.categoryId,
        description,
        thumbnail: playlist.thumbnail,
        likeCount: playlist.likeCount,
        createdAt: playlist.createdAt,
        countSong: 0,
        categoryName: category.name,
    })
})

// @desc    Upload playlist
// @route   POST /api/me/playlist/song
// @access  Private
const addSong = asyncHandler(async (req, res) => {
    const { name } = req.body
    const playlistId = req.headers.playlist
    const { thumbnail, mp3 } = req.files

    if (!mp3) {
        res.status(400)
        throw new Error('Vui lòng chọn file âm thanh')
    }

    if (!name) {
        res.status(400)
        throw new Error('Vui lòng nhập tên bài hát')
    }

    const { _id: userId, artistName, artistNameRef } = req.user
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
        singer: artistName,
        year: moment().toDate().getFullYear(),
        thumbnail: resultImage?.secure_url,
        thumbnailCloudinaryId: resultImage?.secure_url,
        mp3: resultMp3?.secure_url,
        mp3CloudinaryId: resultMp3?.public_id,
        search: slugify(name, slugifyOptionsSearch),
        playlistId: playlistId,
        userId: userId,
    })

    let createdSong
    await Song.aggregate()
        .lookup(lookupSongToUser)
        .lookup(lookupSongToPlaylist)
        .match({ _id: new objectId(song._id) })
        .unwind(unwindUser)
        .unwind(unwindPlaylist)
        .project(columnSongReturn)
        .exec()
        .then((data) => {
            createdSong = data[0]
        })
        .catch((error) => {
            console.log(error)
        })

    res.status(201).json(createdSong)
})

// @desc    update playlist
// @route   PUT /api/me/playlist/:pId
// @access  Private
const updatePlaylist = asyncHandler(async (req, res) => {
    const { name, categoryId, description } = req.body
    const playlistId = req.params.pId

    const playlist = await Playlist.findById(playlistId)

    playlist.name = name
    name && (playlist.slug = slugify(name, slugifyOptions))
    name && (playlist.search = slugify(name, slugifyOptionsSearch))
    playlist.description = description
    playlist.categoryId = new objectId(categoryId)

    if (req.file) {
        playlist.thumbnailCloudinaryId && (await deleteImage(playlist.thumbnailCloudinaryId))

        const imagePath = req.file.path

        const result = await uploadImage(req.user.artistNameRef, 'playlist', imagePath)

        playlist.thumbnail = result?.secure_url
        playlist.thumbnailCloudinaryId = result?.public_id
    }

    const newPlaylist = await Playlist.findByIdAndUpdate(playlistId, playlist, { new: true })

    let updatedPlaylist = {}
    await Playlist.aggregate()
        .lookup(lookupPlaylistToSong)
        .match({ _id: new objectId(newPlaylist._id) })
        .project(columnPlaylistReturn)
        .exec()
        .then((data) => {
            updatedPlaylist = data[0]
        })
        .catch((error) => {
            console.log(error)
        })

    res.status(200).json(updatedPlaylist)
})

// @desc    update song
// @route   PUT /api/me/playlist/song/:sId
// @access  Private
const updateSong = asyncHandler(async (req, res) => {
    const { name } = req.body
    const { artistNameRef } = req.user
    const songId = req.params.sId
    const { thumbnail, mp3 } = req.files
    let resultImage, resultMp3

    const song = await Song.findById(songId)

    if (!song) {
        res.status(401)
        throw new Error('Bài hát không tồn tại')
    }

    song.name = name
    name && (song.slug = slugify(name, slugifyOptions))
    name && (song.search = slugify(name, slugifyOptionsSearch))

    // check update thumbnail
    if (thumbnail) {
        song.thumbnailCloudinaryId && (await deleteImage(song.thumbnailCloudinaryId))

        const path = thumbnail[0].path

        resultImage = await uploadImage(artistNameRef, 'song/thumbnail', path)

        song.thumbnail = resultImage?.secure_url
        song.thumbnailCloudinaryId = resultImage?.public_id
    }

    // check update mp3
    if (mp3) {
        song.mp3CloudinaryId && (await deleteMp3(song.mp3CloudinaryId))
        const path = mp3[0].path

        resultMp3 = await uploadMp3(artistNameRef, 'song/mp3', path)

        song.mp3 = resultMp3?.secure_url
        song.mp3CloudinaryId = resultMp3?.public_id
    }

    const newSong = await Song.findByIdAndUpdate(songId, song, { new: true })

    let updatedSong
    await Song.aggregate()
        .lookup(lookupSongToUser)
        .lookup(lookupSongToPlaylist)
        .match({ _id: new objectId(newSong._id) })
        .unwind(unwindUser)
        .unwind(unwindPlaylist)
        .project(columnSongReturn)
        .exec()
        .then((data) => {
            updatedSong = data[0]
        })
        .catch((error) => {
            console.log(error)
        })

    res.status(201).json(updatedSong)
})

// @desc    Update user data
// @route   PUT /api/me/:id
// @access  Private
const updatePassword = asyncHandler(async (req, res) => {
    const { oldPassword, password } = req.body
    let listErr = ['', '']

    // get user
    const user = await User.findById(req.user.id)

    if (!user) {
        res.status(400)
        throw new Error('Tài khoản không tồn tại')
    }

    if (!oldPassword) {
        listErr[0] = 'Vui lòng nhập mật khẩu hiện tại'
    } else if (!(await bcrypt.compare(oldPassword, user.password))) {
        listErr[0]('Mật khẩu hiện tại không đúng')
    }

    if (!password) {
        listErr[1] = 'Vui lòng nhập mật khẩu mới'
    } else if (password.length < 6) {
        listErr[1] = 'Mật khẩu mới phải có ít nhất 6 ký tự'
    } else if (await bcrypt.compare(password, user.password)) {
        listErr[1] = 'Mật khẩu mới không được giống mật khẩu hiện tại'
    }

    if (listErr.length) {
        res.status(400)
        const arrayError = ['listError', ...listErr]
        throw new Error(arrayError)
    }

    // hash password
    const salt = await bcrypt.genSalt(10)
    const hash = await bcrypt.hash(password, salt)

    user.password = hash

    await User.findByIdAndUpdate(user._id, user)

    res.status(201).json('Thay đổi mật khẩu thành công')
})

// @desc    Update user data
// @route   PUT /api/me/:id
// @access  Private
const updateMe = asyncHandler(async (req, res) => {
    const { name, artistName, description } = req.body
    const user = await User.findById(req.user.id)

    if (req.file) {
        user.avatarCloudinaryId && (await deleteImage(user.avatarCloudinaryId))
        const path = req.file.path
        const image = await uploadImage(user.artistNameRef, 'avatar', path)

        user.avatar = image?.secure_url
        user.avatarCloudinaryId = image?.public_id
    }

    user.name = name
    name && (user.slug = slugify(name, slugifyOptions))
    name && (user.search = slugify(name, slugifyOptionsSearch))
    user.artistName = artistName
    user.description = description

    const updatedUser = await User.findByIdAndUpdate(req.user.id, user, { new: true }).select(process.env.USER_INFO)

    res.status(200).json({
        id: updatedUser._id,
        name: updatedUser.name,
        slug: updatedUser.slug,
        artistName: updatedUser.artistName,
        avatar: updatedUser.avatar,
        description: updatedUser.description,
        likeCount: updatedUser.likeCount,
        token: generateToken(updatedUser._id),
    })
})

// @desc    Delete playlist
// @route   PUT /api/me/playlist/:pId
// @access  Private
const deletePlaylist = asyncHandler(async (req, res) => {
    const playlist = await Playlist.findById(req.params.pId)
    const countSong = await Song.find({ playlistId: req.params.pId }).count()
    if (!playlist) {
        res.status(400)
        throw new Error('Playlist không tồn tại')
    }

    if (countSong > 0) {
        res.status(400)
        throw new Error('Playlist đang có bài hát, không thể xóa')
    }

    if (playlist.userId.toString() !== req.user.id) {
        res.status(401)
        throw new Error('Người dùng không được ủy quyền')
    }

    playlist.thumbnailCloudinaryId && (await deleteImage(playlist.thumbnailCloudinaryId))

    await playlist.remove()

    res.status(200).json({ id: playlist._id })
})

// @desc    Delete song
// @route   PUT /api/me/playlist/song/:sId
// @access  Private
const deleteSong = asyncHandler(async (req, res) => {
    const songId = req.params.sId
    const song = await Song.findById(songId)

    if (!song) {
        res.status(400)
        throw new Error('Bài hát không tồn tại')
    }

    if (song.userId.toString() !== req.user.id) {
        res.status(401)
        throw new Error('Người dùng không được ủy quyền')
    }

    song.thumbnailCloudinaryId && (await deleteImage(song.thumbnailCloudinaryId))

    song.mp3CloudinaryId && (await deleteImage(song.mp3CloudinaryId))

    await song.remove()

    res.status(200).json({ id: songId })
})

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' })
}

export {
    getMe,
    getPlaylists,
    getPlaylistById,
    getInfoAndSong,
    getPlaylistOfMe,
    addPlaylist,
    addSong,
    updatePlaylist,
    updateSong,
    updatePassword,
    updateMe,
    deletePlaylist,
    deleteSong,
}
