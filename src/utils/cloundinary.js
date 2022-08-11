import { v2 as cloudinary } from 'cloudinary'
import moment from 'moment'
import dotenv from 'dotenv'

dotenv.config()

cloudinary.config({
    cloud_name: process.env.CLOUND_NAME,
    api_key: process.env.CLOUND_API_KEY,
    api_secret: process.env.CLOUND_API_SECRET,
})

const uploadImage = async (userFolder, folder, path) => {
    const time = moment(Date.now()).format('DD-MM-YYYY-HH:mm:ss')
    const name = `${folder.replace('/', '-')}-${time}`
    const options = {
        public_id: `one-sound/${userFolder}/${folder}/${name}`,
    }
    return await cloudinary.uploader.upload(path, options)
}

const deleteImage = async (cloudinaryId) => {
    await cloudinary.uploader.destroy(cloudinaryId)
}

const uploadMp3 = async (userFolder, folder, path) => {
    const time = moment(Date.now()).format('DD-MM-YYYY-HH:mm:ss')
    const name = `${folder.replace('/', '-')}-${time}`
    const options = {
        public_id: `one-sound/${userFolder}/${folder}/${name}`,
        resource_type: 'video',
    }
    return await cloudinary.uploader.upload(path, options)
}

const deleteMp3 = async (cloudinaryId) => {
    await cloudinary.uploader.destroy(cloudinaryId, { resource_type: 'video' })
}

export { uploadImage, deleteImage, uploadMp3, deleteMp3 }

export default cloudinary
