const express = require("express")

const booksRouter = express.Router()

booksRouter.get("/", async (req, res, next) => {})

booksRouter.get("/:id", async (req, res, next) => {})

booksRouter.post("/", async (req, res, next) => {})

booksRouter.put("/:id", async (req, res, next) => {})

booksRouter.delete("/:id", async (req, res, next) => {})

module.exports = booksRouter
