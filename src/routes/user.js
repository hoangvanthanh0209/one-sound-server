import express from 'express'
import {
    getUserList,
    getUsers,
    getUserById,
    resgiter,
    login,
    resetPassword,
    toggleRole,
    toggleStatus,
    likeUser,
    deleteUser,
} from '../controller/userController.js'
import upload from '../utils/multer.js'
import auth from '../middleware/authMiddleware.js'

const router = express.Router()

// [api/users]
router.get('/', auth.protectAdmin, getUserList)
router.get('/get', getUsers) // get?page=x&limit=x&name=x&typeSort=x
router.get('/:userId', getUserById)
router.post('/', upload.single('avatar'), resgiter)
router.post('/login', login)
router.put('/reset', auth.protectAdmin, resetPassword)
router.put('/toggleRole', auth.protectAdmin, toggleRole)
router.put('/toggleStatus', auth.protectAdmin, toggleStatus)
router.put('/like/:id', likeUser)
router.delete('/:userId', auth.protectAdmin, deleteUser)

export default router
