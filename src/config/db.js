import mongoose from 'mongoose'
import dotenv from 'dotenv'

dotenv.config()

const connectDB = async () => {
    try {
        const connectDB = await mongoose.connect(process.env.MONGO_URI)
        console.log(`MongoDB connect: ${connectDB.connection.host}`)
    } catch (err) {
        console.log(err)
        process.exit(1)
    }
}

export { connectDB }
