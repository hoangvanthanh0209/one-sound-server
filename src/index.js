import express from 'express'
import mongoose from 'mongoose'
import * as dotenv from 'dotenv'
import bodyParser from 'body-parser'
import cors from 'cors'

import routes from './routes/index.js'

const app = express()
dotenv.config()

app.use(bodyParser.json({ limit: '30mb' }))
app.use(bodyParser.urlencoded({ extended: true, limit: '30mb' }))
app.use(cors())

mongoose
    .connect(process.env.MONGO_URL, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
        console.log('Database is connected')
        app.listen(process.env.PORT, () => {
            console.log(`Server is running on port ${process.env.PORT}`)
            routes(app)
            console.log('Routes is apply')
        })
    })
    .catch((err) => {
        console.log('[mongoose-connect]', err)
    })
