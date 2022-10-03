import dotenv from 'dotenv'

dotenv.config()

// const errorHandler = (err, req, res, next) => {
//     const statusCode = res.statusCode ? res.statusCode : 500

//     res.status(statusCode)

//     res.json({
//         message: err.message,
//         stack: process.env.NODE_ENV === 'production' ? null : err.stack,
//     })
// }

const errorHandler = (err, req, res, next) => {
    const statusCode = res.statusCode ? res.statusCode : 500
    let typeError = 'string'

    let currentListError = err.message.toString().split(',')
    let listError
    if (currentListError.includes('listError')) {
        typeError = 'array'
        currentListError.shift()
        listError = currentListError
    }

    const valueError = typeError === 'string' ? err.message : ''
    const valueArrayError = typeError === 'array' ? listError : []

    res.status(statusCode)

    res.json({
        typeError,
        message: valueError,
        listError: valueArrayError,
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    })
}

export default errorHandler
