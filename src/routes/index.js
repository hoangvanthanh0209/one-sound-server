import userRoute from './user.js'
import accountRoute from './account.js'
import playlistRoute from './playlist.js'
import songRoute from './song.js'

const routes = (app) => {
    app.use('/api/users', userRoute)
    app.use('/api/account', accountRoute)
    app.use('/api/playlists', playlistRoute)
    app.use('/api/songs', songRoute)
}

export default routes
