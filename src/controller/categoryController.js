import asyncHandler from 'express-async-handler'
import { Category } from '../models/index.js'

// @desc    Get categoriescategories
// @route   GET /api/categories
// @access  Public
const getCategories = asyncHandler(async (req, res) => {
    const categories = await Category.find().sort({ name: 'asc' })

    res.status(200).json(categories)
})

// @desc    Get category by id
// @route   GET /api/categories/getById?categoryId=x
// @access  Public
const getCategoryById = asyncHandler(async (req, res) => {
    const categoryId = req.query.categoryId
    const category = await Category.findOne({ _id: categoryId })

    res.status(200).json(category)
})

export { getCategories, getCategoryById }
