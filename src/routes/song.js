import express from 'express'
import {
    getSongList,
    getSongsForPage,
    getSongByName,
    getTopSongFavourite,
    getSongById,
    likeSong,
    getSongByPlaylistId,
    getSongAndPlaylistInfo,
    getPopularSongByUserId,
} from '../app/controller/songController.js'

const router = express.Router()

// [api/songs]
router.get('/', getSongList)
router.get('/query', getSongsForPage)
router.get('/search', getSongByName)
router.get('/top', getTopSongFavourite)
router.get('/getSong', getSongByPlaylistId)
router.get('/getSongAndPlaylistInfo', getSongAndPlaylistInfo)
router.get('/getPopularSongByUserId', getPopularSongByUserId)
router.get('/:id', getSongById)
router.put('/like/:id', likeSong)

export default router
