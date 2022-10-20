import express from 'express'

import {
    getPlaylists,
    getPlaylistsForPage,
    getPlaylistById,
    likePlaylist,
    getByUserId,
    getPlaylistsByCategoryId,
} from '../controller/playlistController.js'

const router = express.Router()

// [api/playlists]
router.get('/', getPlaylists)
router.get('/get', getPlaylistsForPage)
router.get('/getPlaylistsByUserId', getByUserId)
router.get('/getByCategory', getPlaylistsByCategoryId)
router.get('/:id', getPlaylistById)
router.put('/like/:id', likePlaylist)

export default router
