import express from 'express'
import { getCategories } from '../controller/categoryController.js'

const router = express.Router()

// [api/categories]
router.get('/', getCategories)

export default router
