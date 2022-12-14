import asyncHandler from 'express-async-handler'
import slugify from 'slugify'
import moment from 'moment'
import bcrypt from 'bcrypt'
import dotenv from 'dotenv'
import mongoose from 'mongoose'
import jwt from 'jsonwebtoken'

import { User, Playlist, Song, Category } from '../models/index.js'
import { uploadImage, deleteImage, uploadMp3, deleteMp3 } from '../utils/cloundinary.js'

dotenv.config()

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

const projectSong = {
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
const projectPlaylist = {
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

// @desc    Get playlists of user
// @route   GET /api/me/playlist?page=x&limit=x&name=x
// @access  Private
const getPlaylists = asyncHandler(async (req, res) => {
    const { page, limit, name = '' } = req.query
    const pageNumber = +page,
        limitNumber = +limit
    let playlists
    let pagination

    let match
    if (name) {
        match = { userId: new objectId(req.user.id), search: { $regex: name, $options: 'i' } }
    } else {
        match = { userId: new objectId(req.user.id) }
    }

    const count = await Playlist.find(match).count()

    if (limitNumber) {
        const start = pageNumber ? (pageNumber - 1) * limitNumber : 0

        await Playlist.aggregate()
            .lookup(lookupPlaylistToSong)
            .lookup(lookupPlaylistToCategory)
            .unwind(unwindCategory)
            .match(match)
            .project(projectPlaylist)
            .skip(start)
            .limit(limitNumber)
            .exec()
            .then((data) => {
                playlists = data
            })
            .catch((error) => {
                console.log(error)
                res.status(400)
                throw new Error('C?? l???i x???y ra')
            })

        pagination = {
            page: pageNumber || 1,
            limit: limitNumber,
            count: playlists.length,
            totalRows: playlists.length ? count : 0,
        }
    } else {
        await Playlist.aggregate()
            .lookup(lookupPlaylistToSong)
            .lookup(lookupPlaylistToCategory)
            .unwind(unwindCategory)
            .match(match)
            .project(projectPlaylist)
            .exec()
            .then((data) => {
                playlists = data
            })
            .catch((error) => {
                console.log(error)
                res.status(400)
                throw new Error('C?? l???i x???y ra')
            })

        pagination = {
            page: 1,
            limit: playlists.length,
            count: playlists.length,
            totalRows: playlists.length,
        }
    }

    const dataReturn = {
        data: playlists,
        pagination,
    }

    res.status(200).json(dataReturn)
})

// @desc    Get playlists of user for page
// @route   GET /api/me/playlist/get?page=x&limit=x
// @access  Private
const getSongsByPlaylistId = asyncHandler(async (req, res) => {
    const { playlistId, page, limit, name = '' } = req.query
    const pageNumber = +page,
        limitNumber = +limit

    let playlist = {}
    let songs = []
    let pagination = {}

    let match
    if (name) {
        match = {
            search: { $regex: name, $options: 'i' },
            playlistId: new objectId(playlistId),
        }
    } else {
        match = {
            playlistId: new objectId(playlistId),
        }
    }

    const project = {
        _id: 0,
        id: '$_id',
        name: '$name',
        slug: '$slug',
        singer: '$singer',
        year: '$year',
        thumbnail: '$thumbnail',
        mp3: '$mp3',
        likeCount: '$likeCount',
        userId: '$userId',
        playlistId: '$playlistId',
        createdAt: '$createdAt',
        playlistName: `$${unwindPlaylist}.name`,
        artistName: `$${unwindUser}.artistName`,
        artistSlug: `$${unwindUser}.slug`,
    }

    // const group = {
    //     _id: `$${unwindPlaylist}`,
    //     songs: {
    //         $push: {
    //             id: '$_id',
    //             name: '$name',
    //             slug: '$slug',
    //             singer: '$singer',
    //             year: '$year',
    //             thumbnail: '$thumbnail',
    //             mp3: '$mp3',
    //             likeCount: '$likeCount',
    //             userId: '$userId',
    //             playlistId: '$playlistId',
    //             createdAt: '$createdAt',
    //             playlistName: `$${unwindPlaylist}.name`,
    //             artistName: `$${unwindUser}.artistName`,
    //             artistSlug: `$${unwindUser}.slug`,
    //         },
    //     },
    // }
    // const project = {
    //     _id: 0,
    //     playlist: {
    //         id: '$_id._id',
    //         name: '$_id.name',
    //         slug: '$_id.slug',
    //         thumbnail: '$_id.thumbnail',
    //         likeCount: '$_id.likeCount',
    //     },
    //     songs: '$songs',
    // }

    const count = await Song.find(match).count()

    playlist = await Playlist.findById(playlistId).select('name slug thumbnail likeCount')

    if (count === 0) {
        songs = []
        pagination = {
            page: 1,
            limit: limitNumber,
            totalRows: count,
        }
    } else if (count === 1) {
        await Song.aggregate()
            .lookup(lookupSongToUser)
            .lookup(lookupSongToPlaylist)
            .unwind(unwindUser)
            .unwind(unwindPlaylist)
            .match(match)
            .project(project)
            .exec()
            .then((data) => {
                songs = data
            })
            .catch((error) => {
                console.log(error)
                res.status(400)
                throw new Error('C?? l???i x???y ra')
            })

        pagination = {
            page: 1,
            limit: limitNumber,
            totalRows: count,
        }
    } else {
        if (limitNumber) {
            const project = {
                _id: 0,
                id: '$_id',
                name: '$name',
                slug: '$slug',
                singer: '$singer',
                year: '$year',
                thumbnail: '$thumbnail',
                mp3: '$mp3',
                likeCount: '$likeCount',
                userId: '$userId',
                playlistId: '$playlistId',
                createdAt: '$createdAt',
                playlistName: `$${unwindPlaylist}.name`,
                artistName: `$${unwindUser}.artistName`,
                artistSlug: `$${unwindUser}.slug`,
            }

            let countAfterGroup

            const start = pageNumber ? (pageNumber - 1) * limitNumber : 0

            await Song.aggregate()
                .lookup(lookupSongToUser)
                .lookup(lookupSongToPlaylist)
                .unwind(unwindUser)
                .unwind(unwindPlaylist)
                .match(match)
                .skip(start)
                .limit(limitNumber)
                .count('count')
                .exec()
                .then((data) => {
                    countAfterGroup = data[0].count
                })
                .catch((error) => {
                    console.log(error)
                    countAfterGroup = 0
                })

            if (countAfterGroup === 0) {
                songs = []
                pagination = {
                    page: 1,
                    limit: limitNumber,
                    totalRows: count,
                }
            } else if (countAfterGroup === 1) {
                await Song.aggregate()
                    .lookup(lookupSongToUser)
                    .lookup(lookupSongToPlaylist)
                    .unwind(unwindUser)
                    .unwind(unwindPlaylist)
                    .match(match)
                    .project(project)
                    .skip(start)
                    .limit(limitNumber)
                    .exec()
                    .then((data) => {
                        songs = data
                    })
                    .catch((error) => {
                        console.log(error)
                        res.status(400)
                        throw new Error('C?? l???i x???y ra')
                    })

                pagination = {
                    page: pageNumber,
                    limit: limitNumber,
                    totalRows: count,
                }
            } else {
                await Song.aggregate()
                    .lookup(lookupSongToUser)
                    .lookup(lookupSongToPlaylist)
                    .unwind(unwindUser)
                    .unwind(unwindPlaylist)
                    .match(match)
                    .project(project)
                    .skip(start)
                    .limit(limitNumber)
                    .exec()
                    .then((data) => {
                        songs = data
                    })
                    .catch((error) => {
                        console.log(error)
                        res.status(400)
                        throw new Error('C?? l???i x???y ra')
                    })

                pagination = {
                    page: pageNumber,
                    limit: limitNumber,
                    totalRows: count,
                }
            }
        } else {
            const project = {
                _id: 0,
                id: '$_id',
                name: '$name',
                slug: '$slug',
                singer: '$singer',
                year: '$year',
                thumbnail: '$thumbnail',
                mp3: '$mp3',
                likeCount: '$likeCount',
                userId: '$userId',
                playlistId: '$playlistId',
                createdAt: '$createdAt',
                playlistName: `$${unwindPlaylist}.name`,
                artistName: `$${unwindUser}.artistName`,
                artistSlug: `$${unwindUser}.slug`,
            }

            await Song.aggregate()
                .lookup(lookupSongToUser)
                .lookup(lookupSongToPlaylist)
                .unwind(unwindUser)
                .unwind(unwindPlaylist)
                .match(match)
                .project(project)
                .exec()
                .then((data) => {
                    songs = data
                })
                .catch((error) => {
                    console.log(error)
                    res.status(400)
                    throw new Error('C?? l???i x???y ra')
                })

            pagination = {
                page: 1,
                limit: count,
                totalRows: count,
            }
        }
    }

    const dataReturn = {
        playlist,
        songs,
        pagination,
    }

    res.status(200).json(dataReturn)
})

// @desc    Get playlists of user for page
// @route   GET /api/me/playlist/get?page=x&limit=x
// @access  Private
// const getPlaylistsForPage = asyncHandler(async (req, res) => {
//     const { page, limit } = req.query
//     let playlists

//     if (limit) {
//         const start = (+page - 1) * +limit
//         const count = await Playlist.find({ userId: new objectId(req.user.id) }).count()
//         await Playlist.aggregate()
//             .lookup(lookupPlaylistToSong)
//             .lookup(lookupPlaylistToCategory)
//             .match({ userId: new objectId(req.user.id) })
//             .unwind(unwindCategory)
//             .project(columnPlaylistReturn)
//             .sort({ likeCount: 'desc', name: 'asc' })
//             .skip(start)
//             .limit(+limit)
//             .exec()
//             .then((data) => {
//                 playlists = data
//             })
//             .catch((error) => {
//                 console.log(error)
//                 res.status(400)
//                 throw new Error(error)
//             })

//         const dataReturn = {
//             data: playlists,
//             pagination: {
//                 page: +page,
//                 limit: +limit,
//                 totalRows: count,
//                 // totalPages: Math.ceil(count / limit),
//             },
//         }

//         res.status(200).json(dataReturn)
//     } else {
//         await Playlist.aggregate()
//             .lookup(lookupPlaylistToSong)
//             .lookup(lookupPlaylistToCategory)
//             .match({ userId: new objectId(req.user.id) })
//             .unwind(unwindCategory)
//             .project(columnPlaylistReturn)
//             .sort({ likeCount: 'desc', name: 'asc' })
//             .exec()
//             .then((data) => {
//                 playlists = data
//             })
//             .catch((error) => {
//                 console.log(error)
//                 res.status(400)
//                 throw new Error(error)
//             })

//         res.status(200).json(playlists)
//     }
// })

// @desc    Get playlist by id
// @route   GET /api/me/playlist/:pId
// @access  Private
// const getPlaylistById = asyncHandler(async (req, res) => {
//     let playlist
//     await Playlist.aggregate()
//         .lookup(lookupPlaylistToSong)
//         .match({ _id: new objectId(req.params.pId), userId: new objectId(req.user.id) })
//         .project(columnPlaylistReturn)
//         .exec()
//         .then((data) => {
//             playlist = data[0]
//         })
//         .catch((e) => {
//             console.log(e)
//             res.status(400)
//             throw new Error('Playlist kh??ng t???n t???i')
//         })

//     res.status(200).json(playlist)
// })

// @desc    Get songs of playlist
// @route   GET /api/me/playlist/getInfoAndSong?playlistId=x
// @access  Private
// const getInfoAndSong = asyncHandler(async (req, res) => {
//     let playlist
//     let songs = []
//     const playlistId = req.query.playlistId
//     await Playlist.aggregate()
//         .lookup(lookupPlaylistToSong)
//         .match({ _id: new objectId(playlistId), userId: new objectId(req.user.id) })
//         .project(columnPlaylistReturn)
//         .exec()
//         .then((data) => {
//             playlist = data[0]
//         })
//         .catch((e) => {
//             console.log(e)
//             res.status(400)
//             throw new Error('Playlist kh??ng t???n t???i')
//         })

//     await Song.aggregate()
//         .lookup(lookupSongToUser)
//         .lookup(lookupSongToPlaylist)
//         .match({ playlistId: new objectId(playlistId) })
//         .unwind(unwindUser)
//         .unwind(unwindPlaylist)
//         .project(columnSongReturn)
//         .exec()
//         .then((data) => {
//             songs = data
//         })
//         .catch((error) => {
//             console.log(error)
//             res.status(400)
//             throw new Error('Playlist kh??ng t???n t???i')
//         })

//     const dataReturn = {
//         playlist,
//         songs,
//     }

//     res.status(200).json(dataReturn)
// })

// @desc    Get playlist of me
// @route   GET /api/me/playlist/ofMe
// @access  Private
// const getPlaylistOfMe = asyncHandler(async (req, res) => {
//     const playlists = await Playlist.aggregate()
//         .lookup(lookupPlaylistToCategory)
//         .lookup(lookupPlaylistToSong)
//         .lookup(lookupPlaylistToUser)
//         .unwind(unwindCategory)
//         .unwind(unwindUser)
//         .match({ userId: new objectId(req.user.id) })
//         .group({
//             _id: `$${unwindCategory}`,
//             data: {
//                 $push: {
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
//             },
//         })
//         .project({
//             _id: 0,
//             categoryId: '$_id._id',
//             categoryName: '$_id.name',
//             count: { $size: '$data' },
//             data: '$data',
//         })
//         .sort({ categoryName: 'asc' })

//     res.status(200).json(playlists)
// })

// @desc    Upload playlist
// @route   POST /api/me/playlist
// @access  Private
const addPlaylist = asyncHandler(async (req, res) => {
    const { name, categoryId, description } = req.body
    let image

    if (!name) {
        res.status(400)
        throw new Error('Vui l??ng nh???p t??n playlist')
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
        throw new Error('Vui l??ng ch???n file ??m thanh')
    }

    if (!name) {
        res.status(400)
        throw new Error('Vui l??ng nh???p t??n b??i h??t')
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
        .project(projectSong)
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
        .project(projectPlaylist)
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
        throw new Error('B??i h??t kh??ng t???n t???i')
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
        .project(projectSong)
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
        throw new Error('T??i kho???n kh??ng t???n t???i')
    }

    if (!oldPassword) {
        listErr[0] = 'Vui l??ng nh???p m???t kh???u hi???n t???i'
    } else if (!(await bcrypt.compare(oldPassword, user.password))) {
        listErr[0]('M???t kh???u hi???n t???i kh??ng ????ng')
    }

    if (!password) {
        listErr[1] = 'Vui l??ng nh???p m???t kh???u m???i'
    } else if (password.length < 6) {
        listErr[1] = 'M???t kh???u m???i ph???i c?? ??t nh???t 6 k?? t???'
    } else if (await bcrypt.compare(password, user.password)) {
        listErr[1] = 'M???t kh???u m???i kh??ng ???????c gi???ng m???t kh???u hi???n t???i'
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

    res.status(201).json('Thay ?????i m???t kh???u th??nh c??ng')
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
        throw new Error('Playlist kh??ng t???n t???i')
    }

    if (countSong > 0) {
        res.status(400)
        throw new Error('Playlist ??ang c?? b??i h??t, kh??ng th??? x??a')
    }

    if (playlist.userId.toString() !== req.user.id) {
        res.status(401)
        throw new Error('Ng?????i d??ng kh??ng ???????c ???y quy???n')
    }

    playlist.thumbnailCloudinaryId && (await deleteImage(playlist.thumbnailCloudinaryId))

    await playlist.remove()

    res.status(200).json({ id: playlist._id })
})

// @desc    Delete song
// @route   PUT /api/me/song/:sId
// @access  Private
const deleteSong = asyncHandler(async (req, res) => {
    const songId = req.params.sId
    const song = await Song.findById(songId)

    if (!song) {
        res.status(400)
        throw new Error('B??i h??t kh??ng t???n t???i')
    }

    if (song.userId.toString() !== req.user.id) {
        res.status(401)
        throw new Error('Ng?????i d??ng kh??ng ???????c ???y quy???n')
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
    getPlaylists,
    getSongsByPlaylistId,
    addPlaylist,
    addSong,
    updatePlaylist,
    updateSong,
    updatePassword,
    updateMe,
    deletePlaylist,
    deleteSong,
}
