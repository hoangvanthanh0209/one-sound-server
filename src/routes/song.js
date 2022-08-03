import express from 'express'
import { addSong, deleteSong, getSongByPlaylistId, updateSong } from '../app/controller/SongController.js'
import { upload } from '../utils/multer.js'

const router = express.Router()

const cpUpload = upload.fields([
    { name: 'thumbnail', maxCount: 1 },
    { name: 'mp3', maxCount: 1 },
])

// [api/songs]
router.get('/query-playlist', getSongByPlaylistId)
router.post('/add', cpUpload, addSong)
router.put('/update', cpUpload, updateSong)
router.delete('delete', deleteSong)

export default router
