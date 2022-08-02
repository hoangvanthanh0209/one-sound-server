import userRoute from './user.js'
import accountRoute from './account.js'

const routes = (app) => {
    app.use('/api/users', userRoute)
    app.use('/api/account', accountRoute)
}

export default routes
