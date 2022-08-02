import express from 'express'
import { addUser, deleteUser, getAllUser, updateUser } from '../app/controller/UserController.js'
import { upload } from '../utils/multer.js'

const router = express.Router()

// [api/users]
router.get('/', getAllUser)
router.post('/add', upload.single('avatar'), addUser)
router.put('/update', upload.single('avatar'), updateUser)
router.delete('/delete', deleteUser)

export default router
