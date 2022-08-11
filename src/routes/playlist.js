import express from 'express'

import {
    getPlaylists,
    getPlaylistsForPage,
    getPlaylistsByName,
    getTopPlaylistsFavourite,
    getPlaylistById,
    likePlaylist,
} from '../app/controller/PlaylistController.js'

const router = express.Router()

// [api/playlists]
router.get('/', getPlaylists)
router.get('/query', getPlaylistsForPage)
router.get('/search', getPlaylistsByName)
router.get('/top', getTopPlaylistsFavourite)
router.get('/:id', getPlaylistById)
router.put('/like/:id', likePlaylist)

export default router
