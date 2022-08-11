import asyncHandler from 'express-async-handler'
import mongoose from 'mongoose'

import { Playlist } from '../models/index.js'

// define column return
const columnPlaylistReturn = {
    _id: 1,
    name: 1,
    description: 1,
    thumbnail: 1,
    likeCount: 1,
    userName: '$users.name',
    artistName: '$users.artistName',
}

// for lookup(): like forgein key MySQL
const fromUser = {
    from: 'users',
    localField: 'user',
    foreignField: '_id',
    as: 'users',
}

// @desc    Get playlists
// @route   GET /api/playlists
// @access  Public
const getPlaylists = asyncHandler(async (req, res) => {
    const playlists = await Playlist.aggregate().lookup(fromUser).unwind('users').project(columnPlaylistReturn)

    if (!playlists) {
        res.status(400)
        throw new Error('Danh sách playlist trống')
    }

    res.status(200).json(playlists)
})

// @desc    Get playlists for page
// @route   GET /api/playlists/query
// @access  Public
const getPlaylistsForPage = asyncHandler(async (req, res) => {
    const { page = 1, limit = 8 } = req.query

    const playlistCount = await Playlist.aggregate().count('count')
    const count = playlistCount[0].count

    const start = (+page - 1) * +limit
    const end = +page * +limit > count ? count : +page * +limit

    const playlists = await Playlist.aggregate()
        .lookup(fromUser)
        .unwind('users')
        .project(columnPlaylistReturn)
        .skip(start)
        .limit(end)

    if (!playlists) {
        res.status(400)
        throw new Error('Danh sách playlist trống')
    }

    res.status(200).json(playlists)
})

// @desc    Get playlists by name
// @route   GET /api/playlists/search
// @access  Public
const getPlaylistsByName = asyncHandler(async (req, res) => {
    const playlists = await Playlist.aggregate()
        .lookup(fromUser)
        .unwind('users')
        .match({ name: { $regex: req.query.name, $options: 'i' } })
        .project(columnPlaylistReturn)

    if (!playlists) {
        res.status(400)
        throw new Error('Danh sách playlist trống')
    }

    res.status(200).json(playlists)
})

// @desc    Get top playlists
// @route   GET /api/playlists/top
// @access  Public
const getTopPlaylistsFavourite = asyncHandler(async (req, res) => {
    const top = req.query.top || process.env.TOP_PLAYLIST

    const playlists = await Playlist.aggregate()
        .lookup(fromUser)
        .unwind('users')
        .project(columnPlaylistReturn)
        .sort({ likeCount: 'desc' })
        .limit(+top)

    if (!playlists) {
        res.status(400)
        throw new Error('Danh sách playlist trống')
    }

    res.status(200).json(playlists)
})

// @desc    Get playlist by id
// @route   GET /api/playlists/:id
// @access  Public
const getPlaylistById = asyncHandler(async (req, res) => {
    // .match() need same type column
    const objectId = mongoose.Types.ObjectId

    const playlists = await Playlist.aggregate()
        .lookup(fromUser)
        .unwind('users')
        .match({ _id: new objectId(req.params.id) })
        .project(columnPlaylistReturn)

    // aggregate return array
    const playlist = playlists[0]

    if (!playlist) {
        res.status(400)
        throw new Error('Thông tin không hợp lệ')
    }

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
        res.status(200).json(playlist)
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
    getPlaylistById,
    likePlaylist,
}
