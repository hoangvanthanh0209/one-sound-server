import asyncHandler from 'express-async-handler'
import mongoose from 'mongoose'

import { Song, Playlist } from '../models/index.js'

const unwindUser = 'userData'
const unwindPlaylist = 'playlistData'
const objectId = mongoose.Types.ObjectId

// for lookup(): like forgein key MySQL
const lookupUser = {
    from: 'users',
    localField: 'userId',
    foreignField: '_id',
    as: unwindUser,
}

// for lookup(): like forgein key MySQL
const loopkupPlaylist = {
    from: 'playlists',
    localField: 'playlistId',
    foreignField: '_id',
    as: unwindPlaylist,
}

// define column return
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
    userId: '$userId',
    playlistId: '$playlistId',
    userSlug: `$${unwindUser}.slug`,
    playlistSlug: `$${unwindPlaylist}.slug`,
    artistName: `$${unwindUser}.artistName`,
    playlistName: `$${unwindPlaylist}.name`,
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
    userSluf: `$${unwindUser}.slug`,
}

// @desc    Get song list
// @route   GET /api/songs
// @access  Public
const getSongList = asyncHandler(async (req, res) => {
    const songs = await Song.aggregate()
        .lookup(lookupUser)
        .lookup(loopkupPlaylist)
        .unwind(unwindUser)
        .unwind(unwindPlaylist)
        .project(columnSongReturn)

    res.status(200).json(songs)
})

// @desc    Get song for nav
// @route   GET /api/songs/query
// @access  Public
const getSongsForPage = asyncHandler(async (req, res) => {
    const { page = 1, limit = 8 } = req.query

    const count = await Song.find().count()

    const start = (+page - 1) * +limit
    const end = +page * +limit > count ? count : +page * +limit

    const songs = await Song.aggregate()
        .lookup(lookupUser)
        .lookup(loopkupPlaylist)
        .unwind(unwindUser)
        .unwind(unwindPlaylist)
        .project(columnSongReturn)
        .skip(start)
        .limit(end)

    res.status(200).json(songs)
})

// @desc    Get song by name
// @route   GET /api/songs/search
// @access  Public
const getSongByName = asyncHandler(async (req, res) => {
    const songs = await Song.aggregate()
        .lookup(lookupUser)
        .lookup(loopkupPlaylist)
        .unwind(unwindUser)
        .unwind(unwindPlaylist)
        .match({ name: { $regex: req.query.name, $options: 'i' } })
        .project(columnSongReturn)

    res.status(200).json(songs)
})

// @desc    Get top song
// @route   GET /api/songs/top
// @access  Public
const getTopSongFavourite = asyncHandler(async (req, res) => {
    const top = req.query.top || process.env.TOP_SONG

    const songs = await Song.aggregate()
        .lookup(lookupUser)
        .lookup(loopkupPlaylist)
        .unwind(unwindUser)
        .unwind(unwindPlaylist)
        .project(columnSongReturn)
        .sort({ likeCount: 'desc' })
        .limit(+top)

    res.status(200).json(songs)
})

// @desc    Get songs
// @route   GET /api/songs/getSong?playlistId=x
// @access  Public
const getSongByPlaylistId = asyncHandler(async (req, res) => {
    const playlistId = req.query.playlistId

    let playlist = {}
    await Playlist.aggregate()
        .lookup(lookupUser)
        .unwind(unwindUser)
        .match({ _id: new objectId(playlistId) })
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

    let songs = []
    await Song.aggregate()
        .lookup(loopkupPlaylist)
        .lookup(lookupUser)
        .unwind(unwindPlaylist)
        .unwind(unwindUser)
        .match({ playlistId: new objectId(playlistId) })
        .project(columnSongReturn)
        .exec()
        .then((data) => {
            songs = data
        })
        .catch((e) => {
            console.log(e)
        })

    res.status(200).json(songs)
})

// @desc    Get song and playlist info
// @route   GET /api/songs/getSongAndPlaylistInfo?playlistId=x
// @access  Public
const getSongAndPlaylistInfo = asyncHandler(async (req, res) => {
    const playlistId = req.query.playlistId

    let playlist = {}
    await Playlist.aggregate()
        .lookup(lookupUser)
        .unwind(unwindUser)
        .match({ _id: new objectId(playlistId) })
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

    let songs = []
    await Song.aggregate()
        .lookup(loopkupPlaylist)
        .unwind(unwindPlaylist)
        .match({ playlistId: new objectId(playlistId) })
        .project(columnSongReturn)
        .exec()
        .then((data) => {
            songs = data
        })
        .catch((e) => {
            console.log(e)
        })

    const dataReturn = {
        playlist,
        songs,
    }

    res.status(200).json(dataReturn)
})

// @desc    Get song of user
// @route   GET /api/songs/getPopularSongByUserId?userId=x
// @access  Public
const getPopularSongByUserId = asyncHandler(async (req, res) => {
    const userId = req.query.userId
    const limit = 10

    let songs = []
    await Song.aggregate()
        .lookup(loopkupPlaylist)
        .unwind(unwindPlaylist)
        .match({ userId: new objectId(userId) })
        .project(columnSongReturn)
        .sort({ likeCount: 'desc', createdAt: 'desc', name: 'desc' })
        .limit(limit)
        .exec()
        .then((data) => {
            songs = data
        })
        .catch((e) => {
            console.log(e)
        })

    res.status(200).json(songs)
})

// @desc    Get song by id
// @route   GET /api/songs/:id
// @access  Public
const getSongById = asyncHandler(async (req, res) => {
    let song = {}
    await Song.aggregate()
        .lookup(lookupUser)
        .lookup(loopkupPlaylist)
        .unwind(unwindUser)
        .unwind(unwindPlaylist)
        .match({ _id: new objectId(req.params.id) })
        .project(columnSongReturn)
        .exec()
        .then((data) => {
            song = data[0]
        })
        .catch((e) => {
            console.log(e)
            res.status(400)
            throw new Error('Bài hát không tồn tại')
        })

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
        res.status(200).json({ id: song._id, likeCount: song.likeCount })
    } else {
        res.status(400)
        throw new Error('Thông tin không hợp lệ')
    }
})

export {
    getSongList,
    getSongsForPage,
    getSongByName,
    getTopSongFavourite,
    getSongByPlaylistId,
    getSongAndPlaylistInfo,
    getPopularSongByUserId,
    getSongById,
    likeSong,
}
