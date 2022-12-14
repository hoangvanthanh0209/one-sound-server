import userRoute from './user.js'
import playlistRoute from './playlist.js'
import songRoute from './song.js'
import meRoute from './me.js'
import categoryRoute from './category.js'

const routes = (app) => {
    app.use('/api/users', userRoute)
    app.use('/api/playlists', playlistRoute)
    app.use('/api/songs', songRoute)
    app.use('/api/me', meRoute)
    app.use('/api/categories', categoryRoute)
}

export default routes
