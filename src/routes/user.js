import express from 'express'
import {
    getUserList,
    getUsers,
    getUserByName,
    getTopUsersFavourite,
    getUserById,
    resgiter,
    login,
    resetPassword,
    toggleRole,
    toggleStatus,
    likeUser,
    deleteUser,
} from '../app/controller/userController.js'
import upload from '../utils/multer.js'
import auth from '../middleware/authMiddleware.js'

const router = express.Router()

// [api/users]
router.get('/', auth.protectAdmin, getUserList)
router.get('/query', getUsers)
router.get('/search', getUserByName)
router.get('/top', getTopUsersFavourite)
router.get('/:id', getUserById)
router.post('/', upload.single('avatar'), resgiter)
router.post('/login', login)
router.put('/reset/:id', auth.protectAdmin, resetPassword)
router.put('/toggleRole/:id', auth.protectAdmin, toggleRole)
router.put('/toggleStatus/:id', auth.protectAdmin, toggleStatus)
router.put('/like/:id', auth.protectUser, likeUser)
router.delete('/:id', auth.protectAdmin, deleteUser)

export default router
