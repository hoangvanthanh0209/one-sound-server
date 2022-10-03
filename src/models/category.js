import mongoose from 'mongoose'

const categorySchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Please add a name value'],
        },
    },
    {
        timestamps: true,
    },
)

// Duplicate the ID field.
categorySchema.virtual('id').get(function () {
    return this._id.toHexString()
})

// Ensure virtual fields are serialised.
categorySchema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform: function (doc, ret) {
        delete ret._id
    },
})

const Category = mongoose.model('Category', categorySchema)

export default Category
