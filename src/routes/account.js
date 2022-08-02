import express from 'express'
import {
    changeRole,
    deleteAccount,
    getAllAccount,
    login,
    register,
    toggleStatus,
    updateAccount,
} from '../app/controller/AccountController.js'

const router = express.Router()

// [api/account]
router.get('/', getAllAccount)
router.get('/login', login)
router.post('/register', register)
router.put('/update', updateAccount)
router.put('/toggle-status', toggleStatus)
router.put('/change-role', changeRole)
router.delete('/delete', deleteAccount)

export default router
