const { Schema } = require("mongoose")
const mongoose = require("mongoose")

const BookSchema = new Schema(
  {
    _id: {
      type: String,
      validate: {
        validator: async (value) => {
          const asinExists = await BooksModel.findOne({ _id: value })
          if (asinExists) {
            throw new Error("ASIN already in database")
          }
        },
      },
    },
    title: String,
    author: String,
    description: String,
    year: Number,
    genre: Array,
    price: Number,
  },
  { _id: false }
)

BookSchema.post("validate", function (error, doc, next) {
  if (error) {
    error.httpStatusCode = 400
    next(error)
  } else {
    next()
  }
})

BookSchema.post("save", function (error, doc, next) {
  if (error.name === "MongoError" && error.code === 11000) {
    next(new Error("There was a duplicate key error"))
  } else {
    next()
  }
})

const BooksModel = mongoose.model("Book", BookSchema)
module.exports = BooksModel
