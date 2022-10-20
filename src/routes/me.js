import express from 'express'

import upload from '../utils/multer.js'
import auth from '../middleware/authMiddleware.js'
import {
    getPlaylists,
    addPlaylist,
    addSong,
    updatePlaylist,
    updateSong,
    updateMe,
    deletePlaylist,
    deleteSong,
    updatePassword,
    getSongsByPlaylistId,
} from '../controller/meController.js'

const router = express.Router()

const cpUpload = upload.fields([
    { name: 'thumbnail', maxCount: 1 },
    { name: 'mp3', maxCount: 1 },
])

// [api/me]
router.get('/playlist', auth.protectUser, getPlaylists)
router.get('/song', auth.protectUser, getSongsByPlaylistId)
router.post('/playlist', auth.protectUser, upload.single('thumbnail'), addPlaylist)
router.post('/song', auth.protectUser, cpUpload, addSong)
router.put('/playlist/:pId', auth.protectUser, upload.single('thumbnail'), updatePlaylist)
router.put('/song/:sId', auth.protectUser, cpUpload, updateSong)
router.put('/', auth.protectUser, upload.single('avatar'), updateMe)
router.put('/changePassword', auth.protectUser, updatePassword)
router.delete('/playlist/:pId', auth.protectUser, deletePlaylist)
router.delete('/song/:sId', auth.protectUser, deleteSong)

export default router
