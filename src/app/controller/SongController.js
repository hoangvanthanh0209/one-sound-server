import asyncHandler from 'express-async-handler'
import mongoose from 'mongoose'

import { Song } from '../models/index.js'

// define column return
const columnSongReturn = {
    name: 1,
    slug: 1,
    singer: 1,
    year: 1,
    thumbnail: 1,
    mp3: 1,
    likeCount: 1,
    userName: '$users.name',
    artistName: '$users.artistName',
    playlistName: '$playlists.name',
}

// for lookup(): like forgein key MySQL
const fromUser = {
    from: 'users',
    localField: 'user',
    foreignField: '_id',
    as: 'users',
}

// for lookup(): like forgein key MySQL
const fromPlaylist = {
    from: 'playlists',
    localField: 'playlist',
    foreignField: '_id',
    as: 'playlists',
}

// @desc    Get song list
// @route   GET /api/songs
// @access  Public
const getSongList = asyncHandler(async (req, res) => {
    const songs = await Song.aggregate()
        .lookup(fromUser)
        .lookup(fromPlaylist)
        .unwind('users')
        .unwind('playlists')
        .project(columnSongReturn)

    if (!songs) {
        res.status(400)
        throw new Error('Danh sách bài hát trống')
    }

    res.status(200).json(songs)
})

// @desc    Get song for nav
// @route   GET /api/songs/query
// @access  Public
const getSongsForPage = asyncHandler(async (req, res) => {
    const { page = 1, limit = 8 } = req.query

    const songCount = await Song.aggregate().count('count')
    const count = songCount[0].count

    const start = (+page - 1) * +limit
    const end = +page * +limit > count ? count : +page * +limit

    const songs = await Song.aggregate()
        .lookup(fromUser)
        .lookup(fromPlaylist)
        .unwind('users')
        .unwind('playlists')
        .project(columnSongReturn)
        .skip(start)
        .limit(end)

    if (!songs) {
        res.status(400)
        throw new Error('Danh sách bài hát trống')
    }

    res.status(200).json(songs)
})

// @desc    Get song by name
// @route   GET /api/songs/search
// @access  Public
const getSongByName = asyncHandler(async (req, res) => {
    const songs = await Song.aggregate()
        .lookup(fromUser)
        .lookup(fromPlaylist)
        .unwind('users')
        .unwind('playlists')
        .match({ name: { $regex: req.query.name, $options: 'i' } })
        .project(columnSongReturn)

    if (!songs) {
        res.status(400)
        throw new Error('Danh sách bài hát trống')
    }

    res.status(200).json(songs)
})

// @desc    Get top song
// @route   GET /api/songs/top
// @access  Public
const getTopSongFavourite = asyncHandler(async (req, res) => {
    const top = req.query.top || process.env.TOP_SONG

    const songs = await Song.aggregate()
        .lookup(fromUser)
        .lookup(fromPlaylist)
        .unwind('users')
        .unwind('playlists')
        .project(columnSongReturn)
        .sort({ likeCount: 'desc' })
        .limit(+top)

    if (!songs) {
        res.status(400)
        throw new Error('Danh sách bài hát trống')
    }

    res.status(200).json(songs)
})

// @desc    Get song by id
// @route   GET /api/songs/:id
// @access  Public
const getSongById = asyncHandler(async (req, res) => {
    // .match() need same type column
    const objectId = mongoose.Types.ObjectId

    const songs = await Song.aggregate()
        .lookup(fromUser)
        .lookup(fromPlaylist)
        .unwind('users')
        .unwind('playlists')
        .match({ _id: new objectId(req.params.id) })
        .project(columnSongReturn)

    // aggregate return array
    const song = songs[0]

    if (!song) {
        res.status(400)
        throw new Error('Thông tin không hợp lệ')
    }

    res.status(200).json(song)
})

// @desc    Like song
// @route   PUT /api/songs/like/:id
// @access  Public
const likeSong = asyncHandler(async (req, res) => {
    const song = await Song.findById(req.params.id)

    if (song) {
        song.likeCount = song.likeCount + 1
        await song.save()
        res.status(200).json(song)
    } else {
        res.status(400)
        throw new Error('Thông tin không hợp lệ')
    }
})

export { getSongList, getSongsForPage, getSongByName, getTopSongFavourite, getSongById, likeSong }
