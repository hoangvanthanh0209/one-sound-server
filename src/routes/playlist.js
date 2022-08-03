import express from 'express'
import {
    addPlaylist,
    deletePlaylist,
    getAllPlaylist,
    getPlaylistByNameUser,
    getPlaylistByUserId,
    getTopPlaylist,
    updatePlaylist,
} from '../app/controller/PlaylistController.js'
import { upload } from '../utils/multer.js'

const router = express.Router()

// [api/playlists]
router.get('/', getAllPlaylist)
router.get('/query-user', getPlaylistByUserId)
router.get('/query-name-user', getPlaylistByNameUser)
router.get('/query-top', getTopPlaylist)
router.post('/add', upload.single('thumbnail'), addPlaylist)
router.put('/update', upload.single('thumbnail'), updatePlaylist)
router.delete('/delete', deletePlaylist)

export default router
