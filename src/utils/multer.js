import multer from 'multer'
import path from 'path'

export const upload = multer({
    storage: multer.diskStorage({}),
    fileFilter: (req, file, cb) => {
        let ext = path.extname(file.originalname)
        if (ext !== '.png' && ext !== '.jpg' && ext !== '.jpeg' && ext !== '.mp3') {
            cb(new Error('File type is not supported'), false)
            return
        }
        cb(null, true)
    },
})
