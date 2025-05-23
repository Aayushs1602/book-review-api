// controllers/bookController.js

const Book = require('../models/Book');

// POST /books
exports.addBook = async (req, res) => {
  try {
    const { title, author, genre, description } = req.body;

    const book = await Book.create({
      title,
      author,
      genre,
      description,
      createdBy: req.user._id
    });

    res.status(201).json(book);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /books
exports.getBooks = async (req, res) => {
  try {
    const { author, genre, page = 1, limit = 10 } = req.query;
    const filter = {};

    if (author) filter.author = new RegExp(author, 'i');
    if (genre) filter.genre = new RegExp(genre, 'i');

    const books = await Book.find(filter)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json(books);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// controllers/bookController.js
const Review = require('../models/Review');

// GET /books/:id
exports.getBookById = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 5 } = req.query;

    const book = await Book.findById(id).lean();
    if (!book) return res.status(404).json({ message: "Book not found" });

    // Get all reviews for this book
    const reviews = await Review.find({ book: id })
      .populate('user', 'name')
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const avgResult = await Review.aggregate([
      { $match: { book: book._id } },
      { $group: { _id: null, avgRating: { $avg: "$rating" } } }
    ]);

    const averageRating = avgResult.length > 0 ? avgResult[0].avgRating : 0;

    res.json({ ...book, averageRating, reviews });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /books/:id/reviews
exports.addReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const bookId = req.params.id;
    const userId = req.user._id;

    const existingReview = await Review.findOne({ book: bookId, user: userId });
    if (existingReview) {
      return res.status(400).json({ message: "You have already reviewed this book." });
    }

    const review = await Review.create({
      book: bookId,
      user: userId,
      rating,
      comment
    });

    res.status(201).json(review);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /reviews/:id
exports.updateReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const reviewId = req.params.id;
    const userId = req.user._id;

    const review = await Review.findById(reviewId);
    if (!review) return res.status(404).json({ message: "Review not found" });
    if (!review.user.equals(userId)) return res.status(403).json({ message: "Not authorized" });

    review.rating = rating ?? review.rating;
    review.comment = comment ?? review.comment;
    await review.save();

    res.json(review);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /reviews/:id
exports.deleteReview = async (req, res) => {
  try {
    const reviewId = req.params.id;
    const userId = req.user._id;

    const review = await Review.findById(reviewId);
    if (!review) return res.status(404).json({ message: "Review not found" });
    if (!review.user.equals(userId)) return res.status(403).json({ message: "Not authorized" });

    await review.deleteOne();

    res.json({ message: "Review deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.searchBooks = async (req, res) => {
  const { query, page = 1, limit = 10 } = req.query;

  if (!query) return res.status(400).json({ message: "Search query is required" });

  try {
    const regex = new RegExp(query, 'i'); // case-insensitive regex
    const results = await Book.find({
      $or: [{ title: regex }, { author: regex }]
    })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

    res.json(results);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
