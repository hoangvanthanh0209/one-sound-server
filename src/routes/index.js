import userRoute from './user.js'
import playlistRoute from './playlist.js'
import songRoute from './song.js'
import meRoute from './me.js'

const routes = (app) => {
    app.use('/api/users', userRoute)
    app.use('/api/playlists', playlistRoute)
    app.use('/api/songs', songRoute)
    app.use('/api/me', meRoute)
}

export default routes
