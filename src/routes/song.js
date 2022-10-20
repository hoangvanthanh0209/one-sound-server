import express from 'express'
import {
    getSongList,
    getSongById,
    likeSong,
    getSongAndPlaylistInfo,
    getPopularSongByUserId,
    getSongs,
    getSongsByPlaylistId,
} from '../controller/songController.js'

const router = express.Router()

// [api/songs]
router.get('/', getSongList)
router.get('/get', getSongs)
router.get('/getSongsByPlaylistId', getSongsByPlaylistId)
router.get('/getSongAndPlaylistInfo', getSongAndPlaylistInfo)
router.get('/getPopularSongByUserId', getPopularSongByUserId)
router.get('/:songId', getSongById)
router.put('/like', likeSong)

export default router
