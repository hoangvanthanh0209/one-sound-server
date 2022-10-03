import asyncHandler from 'express-async-handler'
import { Category } from '../models/index.js'

// @desc    Get categoriescategories
// @route   GET /api/categories
// @access  Public
const getCategories = asyncHandler(async (req, res) => {
    const categories = await Category.find().sort({ name: 'asc' })

    res.status(200).json(categories)
})

export { getCategories }
