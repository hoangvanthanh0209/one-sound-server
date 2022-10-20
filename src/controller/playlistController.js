import asyncHandler from 'express-async-handler'
import mongoose from 'mongoose'

import { Playlist, Category } from '../models/index.js'

const objectId = mongoose.Types.ObjectId

const unwindCategory = 'categoryData'
const unwindSong = 'songData'
const unwindUser = 'userData'

// for lookup(): like forgein key MySQL
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
const projectPlaylist = {
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

// @desc    Get playlists
// @route   GET /api/playlists
// @access  Public
const getPlaylists = asyncHandler(async (req, res) => {
    let playlists

    const group = {
        _id: `$${unwindCategory}`,
        data: {
            $push: {
                $cond: [
                    { $gt: [{ $size: `$${unwindSong}` }, 0] },
                    {
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
                    '$$REMOVE',
                ],
            },
        },
    }

    const project = {
        _id: 0,
        categoryId: '$_id._id',
        categoryName: '$_id.name',
        categorySlug: '$_id.slug',
        count: { $size: '$data' },
        data: '$data',
    }

    const sort = {
        categoryName: 'desc',
    }

    await Playlist.aggregate()
        .lookup(lookupPlaylistToCategory)
        .lookup(lookupPlaylistToSong)
        .lookup(lookupPlaylistToUser)
        .unwind(unwindCategory)
        .unwind(unwindUser)
        .group(group)
        .project(project)
        .sort(sort)
        .exec()
        .then((data) => {
            playlists = data
        })
        .catch((error) => {
            console.log(error)
            res.status(401)
            throw new Error(error)
        })

    res.status(200).json(playlists)
})

// @desc    Get playlists for page
// @route   GET /api/playlists/get?page=x&limit=x&name=x
// @access  Public
const getPlaylistsForPage = asyncHandler(async (req, res) => {
    const { page, limit, name = '' } = req.query
    const pageNumber = +page,
        limitNumber = +limit

    let playlists
    let match

    if (name) {
        match = {
            search: { $regex: name, $options: 'i' },
            $expr: { $gt: [{ $size: `$${unwindSong}` }, 0] },
        }
    } else {
        match = {
            $expr: { $gt: [{ $size: `$${unwindSong}` }, 0] },
        }
    }

    const sort = {
        likeCount: 'desc',
    }

    if (limitNumber) {
        const start = limitNumber ? (pageNumber - 1) * limitNumber : 1

        await Playlist.aggregate()
            .lookup(lookupPlaylistToSong)
            .lookup(lookupPlaylistToUser)
            .unwind(unwindUser)
            .match(match)
            .project(projectPlaylist)
            .sort(sort)
            .skip(start)
            .limit(limitNumber)
            .exec()
            .then((data) => {
                playlists = data
            })
            .catch((e) => {
                console.log(e)
                res.status(400)
                throw new Error('Playlist không tồn tại')
            })
    } else {
        await Playlist.aggregate()
            .lookup(lookupPlaylistToSong)
            .lookup(lookupPlaylistToUser)
            .unwind(unwindUser)
            .match(match)
            .project(projectPlaylist)
            .sort(sort)
            .exec()
            .then((data) => {
                playlists = data
            })
            .catch((e) => {
                console.log(e)
                res.status(400)
                throw new Error('Playlist không tồn tại')
            })
    }

    res.status(200).json(playlists)
})

// @desc    Get playlists by name
// @route   GET /api/playlists/search
// @access  Public
// const getPlaylistsByName = asyncHandler(async (req, res) => {
// const playlists = await Playlist.aggregate()
//     .lookup(lookupPlaylistToSong)
//     .lookup(lookupPlaylistToUser)
//     .unwind(unwindUser)
//     .match({ search: { $regex: req.query.name, $options: 'i' } })
//     .project(columnPlaylistReturn)
// res.status(200).json(playlists)
// })

// @desc    Get top playlists
// @route   GET /api/playlists/top
// @access  Public
// const getTopPlaylistsFavourite = asyncHandler(async (req, res) => {
// const top = req.query.top || process.env.TOP_PLAYLIST
// const top = Number.parseInt(req.query.top) || null
// const playlists = await Playlist.aggregate()
//     .lookup(lookupPlaylistToUser)
//     .lookup(lookupPlaylistToSong)
//     .unwind(unwindUser)
//     .match({ $expr: { $gt: [{ $size: `$${unwindSong}` }, 0] } })
//     .project(columnPlaylistReturn)
//     .sort({ likeCount: 'desc' })
//     .limit(top)
// res.status(200).json(playlists)
// })

// @desc    Get playlists by userId
// @route   GET /api/playlists/getPlaylistsByUserId?userId=x
// @access  Public
const getByUserId = asyncHandler(async (req, res) => {
    const userId = req.query.userId
    let playlists

    const match = {
        userId: new objectId(userId),
        $expr: { $gt: [{ $size: `$${unwindSong}` }, 0] },
    }

    const sort = {
        likeCount: 'desc',
        createdAt: 'desc',
    }

    await Playlist.aggregate()
        .lookup(lookupPlaylistToSong)
        .lookup(lookupPlaylistToUser)
        .unwind(unwindUser)
        .match(match)
        .project(projectPlaylist)
        .sort(sort)
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
    const { categoryId, page, limit, name = '' } = req.query
    const pageNumber = +page,
        limitNumber = +limit

    let category = {}
    let playlists = []
    let pagination = {}

    let dataReturn

    let match
    if (name) {
        match = {
            categoryId: new objectId(categoryId),
            $expr: { $gt: [{ $size: `$${unwindSong}` }, 0] },
            search: { $regex: name, $options: 'i' },
        }
    } else {
        match = {
            categoryId: new objectId(categoryId),
            $expr: { $gt: [{ $size: `$${unwindSong}` }, 0] },
        }
    }

    const project = {
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
        userId: '$userId',
        artistName: `$${unwindUser}.artistName`,
    }

    category = await Category.findById(categoryId).select('name')

    let count = 0
    await Playlist.aggregate()
        .lookup(lookupPlaylistToSong)
        .lookup(lookupPlaylistToUser)
        .unwind(unwindUser)
        .match(match)
        .count('count')
        .exec()
        .then((data) => {
            count = data[0].count
        })
        .catch((error) => {
            console.log(error)
            count = 0
        })

    let start, newLimit

    if (!pageNumber && limitNumber) {
        start = 0
        newLimit = limitNumber
    } else if (pageNumber && limitNumber) {
        start = (pageNumber - 1) * limitNumber
        newLimit = limitNumber
    } else {
        start = 0
        newLimit = count
    }

    // if (!pageNumber && !limitNumber) {
    //     start = 0
    //     newLimit = count
    // } else if (pageNumber && !limitNumber) {
    //     start = 0
    //     newLimit = count
    // } else if (!pageNumber && limitNumber) {
    //     start = 0
    //     newLimit = limitNumber
    // } else if (pageNumber && limitNumber) {
    //     start = (pageNumber - 1) * limitNumber
    //     newLimit = limitNumber
    // }

    let countWithLimit
    await Playlist.aggregate()
        .lookup(lookupPlaylistToSong)
        .lookup(lookupPlaylistToUser)
        .unwind(unwindUser)
        .skip(start)
        .limit(newLimit)
        .match(match)
        .count('count')
        .exec()
        .then((data) => {
            countWithLimit = data[0].count
        })
        .catch((error) => {
            console.log(error)
            countWithLimit = 0
        })

    if (count === 0 || countWithLimit === 0) {
        playlists = []
        pagination = {
            page: 1,
            limit: limitNumber,
            totalRows: count,
        }
        dataReturn = {
            category,
            playlists,
            pagination,
        }
        return res.status(200).json(dataReturn)
    }

    if (limitNumber && countWithLimit !== 0) {
        await Playlist.aggregate()
            .lookup(lookupPlaylistToSong)
            .lookup(lookupPlaylistToUser)
            .unwind(unwindUser)
            .match(match)
            .project(project)
            .skip(start)
            .limit(newLimit)
            .exec()
            .then((data) => {
                playlists = data
            })
            .catch((error) => {
                console.log(error)
                res.status(400)
                throw new Error('Có lỗi xảy ra')
            })

        pagination = {
            page: pageNumber,
            limit: limitNumber,
            totalRows: count,
        }

        dataReturn = {
            category,
            playlists,
            pagination,
        }
        return res.status(200).json(dataReturn)
    }

    await Playlist.aggregate()
        .lookup(lookupPlaylistToSong)
        .lookup(lookupPlaylistToUser)
        .unwind(unwindUser)
        .match(match)
        .project(project)
        .exec()
        .then((data) => {
            playlists = data
        })
        .catch((error) => {
            console.log(error)
            res.status(400)
            throw new Error('Có lỗi xảy ra')
        })

    pagination = {
        page: 1,
        limit: limitNumber,
        totalRows: count,
    }

    dataReturn = {
        category,
        playlists,
        pagination,
    }

    return res.status(200).json(dataReturn)

    // const group = {
    //     _id: `$${unwindCategory}`,
    //     data: {
    //         $push: {
    //             $cond: [
    //                 { $gt: [{ $size: `$${unwindSong}` }, 0] },
    //                 {
    //                     id: '$_id',
    //                     name: '$name',
    //                     slug: '$slug',
    //                     categoryId: '$categoryId',
    //                     description: '$description',
    //                     thumbnail: '$thumbnail',
    //                     likeCount: '$likeCount',
    //                     createdAt: '$createdAt',
    //                     countSong: { $size: `$${unwindSong}` },
    //                     userId: '$userId',
    //                     artistName: `$${unwindUser}.artistName`,
    //                 },
    //                 '$$REMOVE',
    //             ],
    //         },
    //     },
    // }

    // const project = {
    //     _id: 0,
    //     categoryId: '$_id._id',
    //     categoryName: '$_id.name',
    //     categorySlug: '$_id.slug',
    //     count: { $size: '$data' },
    //     data: '$data',
    // }
})

// @desc    Get playlist by id
// @route   GET /api/playlists/:id
// @access  Public
const getPlaylistById = asyncHandler(async (req, res) => {
    const playlistId = req.params.id
    let playlist

    const match = {
        _id: new objectId(playlistId),
    }

    await Playlist.aggregate()
        .lookup(lookupPlaylistToSong)
        .lookup(lookupPlaylistToUser)
        .unwind(unwindUser)
        .match(match)
        .project(projectPlaylist)
        .exec()
        .then((data) => {
            playlist = data[0]
        })
        .catch((error) => {
            console.log(error)
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

export { getPlaylists, getPlaylistsForPage, getByUserId, getPlaylistsByCategoryId, getPlaylistById, likePlaylist }
