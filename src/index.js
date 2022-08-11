import express from 'express'
import * as dotenv from 'dotenv'
import bodyParser from 'body-parser'
import cors from 'cors'

import routes from './routes/index.js'
import { connectDB } from './config/db.js'
import errorHandler from './middleware/errorMiddleware.js'

const app = express()
dotenv.config()

app.use(bodyParser.json({ limit: '30mb' }))
app.use(bodyParser.urlencoded({ extended: true, limit: '30mb' }))
app.use(cors())

// routes init
routes(app)

// connect db
connectDB()

// error middleware
app.use(errorHandler)

app.listen(process.env.PORT, () => {
    console.log(`Server is running on port ${process.env.PORT}`)
})
