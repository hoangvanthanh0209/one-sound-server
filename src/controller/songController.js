import asyncHandler from 'express-async-handler'
import mongoose from 'mongoose'

import { Song, Playlist } from '../models/index.js'

const objectId = mongoose.Types.ObjectId

const userUnwindPath = 'userData'
const playlistUnwindPath = 'playlistData'

const unwindUser = {
    $unwind: `$${userUnwindPath}`,
}
const unwindPlaylist = {
    $unwind: `$${playlistUnwindPath}`,
}

// for lookup(): like forgein key MySQL
const lookupSongToUser = {
    $lookup: {
        from: 'users',
        localField: 'userId',
        foreignField: '_id',
        as: userUnwindPath,
    },
}

// for lookup(): like forgein key MySQL
const loopkupSongToPlaylist = {
    $lookup: {
        from: 'playlists',
        localField: 'playlistId',
        foreignField: '_id',
        as: playlistUnwindPath,
    },
}

// define column return
const projectSong = {
    $project: {
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
        userSlug: `$${userUnwindPath}.slug`,
        playlistSlug: `$${playlistUnwindPath}.slug`,
        artistName: `$${userUnwindPath}.artistName`,
        playlistName: `$${playlistUnwindPath}.name`,
    },
}

// define column return
const projectPlaylist = {
    $project: {
        _id: 0,
        id: '$_id',
        name: '$name',
        slug: '$slug',
        description: '$description',
        thumbnail: '$thumbnail',
        likeCount: '$likeCount',
        userId: '$userId',
        artistName: `$${userUnwindPath}.artistName`,
        userSluf: `$${playlistUnwindPath}.slug`,
    },
}

// @desc    Get song list
// @route   GET /api/songs
// @access  Public
const getSongList = asyncHandler(async (req, res) => {
    let songs
    await Song.aggregate([lookupSongToUser, loopkupSongToPlaylist, unwindUser, unwindPlaylist, projectSong])
        .exec()
        .then((data) => {
            songs = data
        })
        .catch((error) => {
            console.log(error)
            res.status(400)
            throw new Error('Có lỗi xảy ra')
        })

    res.status(200).json(songs)
})

// @desc    Get top song
// @route   GET /api/songs/get?page=x&limit=x&name=x&typeSort=x
// @access  Public
const getSongs = asyncHandler(async (req, res) => {
    const { page, limit, typeSort } = req.query
    const pageNum = +page,
        limitNum = +limit
    let songs = []
    let pagination

    let sort
    if (typeSort) {
        sort = {
            $sort: {
                likeCount: typeSort === 'asc' ? 1 : -1,
                name: 1,
            },
        }
    } else {
        sort = {
            $sort: {
                name: 1,
            },
        }
    }

    if (limitNum) {
        const start = (pageNum - 1) * limitNum

        const skip = {
            $skip: start,
        }
        const limitCond = {
            $limit: limitNum,
        }

        const count = await Song.find().select(process.env.USER_INFO).count()

        await Song.aggregate([
            lookupSongToUser,
            loopkupSongToPlaylist,
            unwindUser,
            unwindPlaylist,
            projectSong,
            skip,
            limitCond,
            sort,
        ])
            .exec()
            .then((data) => {
                songs = data
            })
            .catch((error) => {
                console.log(error)
                res.status(400)
                throw new Error('Có lỗi xảy ra')
            })

        pagination = {
            page: pageNum || 1,
            limit: limitNum,
            totalRows: songs.length ? count : 0,
        }
    } else {
        await Song.aggregate([lookupSongToUser, loopkupSongToPlaylist, unwindUser, unwindPlaylist, projectSong, sort])
            .exec()
            .then((data) => {
                songs = data
            })
            .catch((error) => {
                console.log(error)
                res.status(400)
                throw new Error('Có lỗi xảy ra')
            })

        pagination = {
            page: 1,
            limit: songs.length,
            totalRows: songs.length,
        }
    }

    const dataReturn = {
        data: songs,
        pagination,
    }

    res.status(200).json(dataReturn)
})

// @desc    Get songs
// @route   GET /api/songs/getSong?playlistId=x
// @access  Public
const getSongsByPlaylistId = asyncHandler(async (req, res) => {
    const playlistId = req.query.playlistId

    const playlist = await Playlist.findById(playlistId)

    if (!Object.keys(playlist).length) {
        res.status(400)
        throw new Error('Playlist không tồn tại')
    }

    const match = {
        $match: {
            playlistId: new objectId(playlistId),
        },
    }

    let songs = []
    await Song.aggregate([lookupSongToUser, loopkupSongToPlaylist, unwindUser, unwindPlaylist, match, projectSong])
        .exec()
        .then((data) => {
            songs = data
        })
        .catch((error) => {
            console.log(error)
            res.status(400)
            throw new Error('Có lỗi xảy ra')
        })

    res.status(200).json(songs)
})

// @desc    Get song and playlist info
// @route   GET /api/songs/getSongAndPlaylistInfo?playlistId=x
// @access  Public
const getSongAndPlaylistInfo = asyncHandler(async (req, res) => {
    const playlistId = req.query.playlistId

    const match = {
        $match: {
            playlistId: new objectId(playlistId),
        },
    }

    const group = {
        $group: {
            _id: `$${playlistUnwindPath}`,
            data: {
                $push: {
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
                    userSlug: `$${userUnwindPath}.slug`,
                    playlistSlug: `$${playlistUnwindPath}.slug`,
                    artistName: `$${userUnwindPath}.artistName`,
                    playlistName: `$${playlistUnwindPath}.name`,
                },
            },
        },
    }

    const project = {
        $project: {
            _id: 0,
            playlist: {
                id: '$_id._id',
                name: '$_id.name',
                description: '$_id.description',
                thumbnail: '$_id.thumbnail',
                userId: '$_id.userId',
            },
            songs: '$data',
        },
    }

    const sort = {
        $sort: { name: 1 },
    }

    let songs
    await Song.aggregate([
        lookupSongToUser,
        loopkupSongToPlaylist,
        unwindUser,
        unwindPlaylist,
        match,
        group,
        project,
        sort,
    ])
        .exec()
        .then((data) => {
            songs = data[0]
        })
        .catch((error) => {
            console.log(error)
            res.status(400)
            throw new Error('Có lỗi xảy ra')
        })

    res.status(200).json(songs)
})

// @desc    Get song of user
// @route   GET /api/songs/getPopularSongByUserId?userId=x
// @access  Public
const getPopularSongByUserId = asyncHandler(async (req, res) => {
    const userId = req.query.userId
    const limitCount = 10

    const match = {
        $match: {
            userId: new objectId(userId),
        },
    }

    const sort = {
        $sort: {
            likeCount: -1,
            createdAt: -1,
            name: -1,
        },
    }

    const limit = {
        $limit: limitCount,
    }

    let songs = []
    await Song.aggregate([loopkupSongToPlaylist, unwindPlaylist, match, projectSong, sort, limit])
        .exec()
        .then((data) => {
            songs = data
        })
        .catch((error) => {
            console.log(error)
            res.status(400)
            throw new Error('Có lỗi xảy ra')
        })

    res.status(200).json(songs)
})

// @desc    Get song by id
// @route   GET /api/songs/:songId
// @access  Public
const getSongById = asyncHandler(async (req, res) => {
    const songId = req.params.songId
    const match = {
        $match: {
            _id: new objectId(songId),
        },
    }
    let song = {}
    await Song.aggregate([lookupSongToUser, loopkupSongToPlaylist, unwindUser, unwindPlaylist, match, projectSong])
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

// @desc    Like song/:id?songId=x
// @access  Public
const likeSong = asyncHandler(async (req, res) => {
    const songId = req.params.id
    const song = await Song.findById(songId)

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
    getSongs,
    getSongsByPlaylistId,
    getSongAndPlaylistInfo,
    getPopularSongByUserId,
    getSongById,
    likeSong,
}
