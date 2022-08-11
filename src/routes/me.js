import express from 'express'

import upload from '../utils/multer.js'
import auth from '../middleware/authMiddleware.js'
import {
    getMe,
    getplaylists,
    getplaylistById,
    getSongOfPlaylist,
    addPlaylist,
    addSong,
    updatePlaylist,
    updateSong,
    updateMe,
    deletePlaylist,
    deleteSong,
} from '../app/controller/meController.js'

const router = express.Router()

const cpUpload = upload.fields([
    { name: 'thumbnail', maxCount: 1 },
    { name: 'mp3', maxCount: 1 },
])

// [api/me]
router.get('/', auth.protectUser, getMe)
router.get('/playlist', auth.protectUser, getplaylists)
router.get('/playlist/:pId', auth.protectUser, getplaylistById)
router.get('/playlist/song', auth.protectUser, getSongOfPlaylist)
router.post('/playlist', auth.protectUser, upload.single('thumbnail'), addPlaylist)
router.post('/playlist/song', auth.protectUser, cpUpload, addSong)
router.put('/playlist/:pId', auth.protectUser, upload.single('thumbnail'), updatePlaylist)
router.put('/playlist/song/:sId', auth.protectUser, cpUpload, updateSong)
router.put('/s', auth.protectUser, upload.single('avatar'), updateMe)
router.delete('/playlist/:pId', deletePlaylist)
router.delete('/playlist/song/:sId', deleteSong)

export default router
