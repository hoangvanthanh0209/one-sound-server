import asyncHandler from 'express-async-handler'
import mongoose from 'mongoose'

import { Playlist } from '../models/index.js'

const unwindCategory = 'categoryData'
const unwindSong = 'songData'
const unwindUser = 'userData'

// for lookup(): like forgein key MySQL
const lookupUser = {
    from: 'users',
    localField: 'userId',
    foreignField: '_id',
    as: unwindUser,
}
const lookupPlaylistToCategory = {
    from: 'categories',
    localField: 'categoryId',
    foreignField: '_id',
    as: unwindCategory,
}
const lookupPlaylistToSong = {
    from: 'songs',
    localField: '_id',
    foreignField: 'playlistId',
    as: unwindSong,
}
const lookupPlaylistToUser = {
    from: 'users',
    localField: 'userId',
    foreignField: '_id',
    as: unwindUser,
}

// define column return
const columnPlaylistReturn = {
    _id: 0,
    id: '$_id',
    name: '$name',
    slug: '$slug',
    description: '$description',
    thumbnail: '$thumbnail',
    likeCount: '$likeCount',
    userId: '$userId',
    artistName: `$${unwindUser}.artistName`,
    userSlug: `$${unwindUser}.slug`,
    countSong: { $size: `$${unwindSong}` },
}

const objectId = mongoose.Types.ObjectId

// @desc    Get playlists
// @route   GET /api/playlists
// @access  Public
const getPlaylists = asyncHandler(async (req, res) => {
    // const playlists = await Playlist.aggregate().lookup(lookupUser).unwind(unwindUser).project(columnPlaylistReturn)
    const playlists = await Playlist.aggregate()
        .lookup(lookupPlaylistToCategory)
        .lookup(lookupPlaylistToSong)
        .lookup(lookupPlaylistToUser)
        .unwind(unwindCategory)
        .unwind(unwindUser)
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

// @desc    Get playlists for page
// @route   GET /api/playlists/query
// @access  Public
const getPlaylistsForPage = asyncHandler(async (req, res) => {
    const { page = 1, limit = 8 } = req.query

    const count = await Playlist.find().count()

    const start = (+page - 1) * +limit
    const end = +page * +limit > count ? count : +page * +limit

    const playlists = await Playlist.aggregate()
        .lookup(lookupUser)
        .unwind(unwindUser)
        .project(columnPlaylistReturn)
        .skip(start)
        .limit(end)

    res.status(200).json(playlists)
})

// @desc    Get playlists by name
// @route   GET /api/playlists/search
// @access  Public
const getPlaylistsByName = asyncHandler(async (req, res) => {
    const playlists = await Playlist.aggregate()
        .lookup(lookupPlaylistToSong)
        .lookup(lookupPlaylistToUser)
        .unwind(unwindUser)
        .match({ search: { $regex: req.query.name, $options: 'i' } })
        .project(columnPlaylistReturn)

    res.status(200).json(playlists)
})

// @desc    Get top playlists
// @route   GET /api/playlists/top
// @access  Public
const getTopPlaylistsFavourite = asyncHandler(async (req, res) => {
    // const top = req.query.top || process.env.TOP_PLAYLIST
    const top = Number.parseInt(req.query.top) || null

    const playlists = await Playlist.aggregate()
        .lookup(lookupPlaylistToUser)
        .lookup(lookupPlaylistToSong)
        .unwind(unwindUser)
        .project(columnPlaylistReturn)
        .sort({ likeCount: 'desc' })
        .limit(top)

    res.status(200).json(playlists)
})

// @desc    Get playlists by userId
// @route   GET /api/playlists/getByUser?userId=x
// @access  Public
const getByUserId = asyncHandler(async (req, res) => {
    let playlists
    await Playlist.aggregate()
        .lookup(lookupPlaylistToUser)
        .lookup(lookupPlaylistToSong)
        .unwind(unwindUser)
        .match({ userId: new objectId(req.query.userId) })
        .sort({ likeCount: 'desc', createdAt: 'desc' })
        .project(columnPlaylistReturn)
        .exec()
        .then((data) => {
            playlists = data
        })
        .catch((e) => {
            console.log(e)
            res.status(400)
            throw new Error('Playlist không tồn tại')
        })

    res.status(200).json(playlists)
})

// @desc    Get playlists
// @route   GET /api/playlists/getByCategory?categoryId=x&page=x&limit=x
// @access  Public
const getPlaylistsByCategoryId = asyncHandler(async (req, res) => {
    const { categoryId, page = 1, limit = 16 } = req.query

    const count = await Playlist.find().count()

    const start = (+page - 1) * +limit
    const end = +page * +limit > count ? count : +page * +limit

    let playlists
    await Playlist.aggregate()
        .lookup(lookupPlaylistToCategory)
        .lookup(lookupPlaylistToSong)
        .lookup(lookupPlaylistToUser)
        .unwind(unwindCategory)
        .unwind(unwindUser)
        .match({ categoryId: new objectId(categoryId) })
        .skip(start)
        .limit(end)
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
            categorySlug: '$_id.slug',
            count: { $size: '$data' },
            data: '$data',
        })
        .sort({ categoryName: 'asc' })
        .exec()
        .then((data) => {
            playlists = data[0]
        })
        .catch((error) => {
            console.log(error)
            throw new Error('Thể loại này không tồn tại')
        })

    res.status(200).json(playlists)
})

// @desc    Get playlist by id
// @route   GET /api/playlists/:id
// @access  Public
const getPlaylistById = asyncHandler(async (req, res) => {
    let playlist
    await Playlist.aggregate()
        .lookup(lookupPlaylistToUser)
        .lookup(lookupPlaylistToSong)
        .unwind(unwindUser)
        .match({ _id: new objectId(req.params.id) })
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

// @desc    Like playlist
// @route   PUT /api/playlists/like/:id
// @access  Public
const likePlaylist = asyncHandler(async (req, res) => {
    const playlist = await Playlist.findById(req.params.id)

    if (playlist) {
        playlist.likeCount = playlist.likeCount + 1
        await playlist.save()
        res.status(200).json({ categoryId: playlist.categoryId, id: playlist._id, likeCount: playlist.likeCount })
    } else {
        res.status(400)
        throw new Error('Thông tin không hợp lệ')
    }
})

export {
    getPlaylists,
    getPlaylistsForPage,
    getPlaylistsByName,
    getTopPlaylistsFavourite,
    getByUserId,
    getPlaylistsByCategoryId,
    getPlaylistById,
    likePlaylist,
}
