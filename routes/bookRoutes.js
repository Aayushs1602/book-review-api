// routes/bookRoutes.js

const express = require('express');
const router = express.Router();
const {addBook,getBooks,getBookById,addReview,updateReview,deleteReview,searchBooks} = require('../controllers/bookController');
const auth = require('../middleware/authMiddleware');

router.post('/books', auth, addBook); // only logged-in users
router.get('/books', getBooks);       // public route
router.get('/books/:id', getBookById);
router.post('/books/:id/reviews', auth, addReview);
router.put('/reviews/:id', auth, updateReview);
router.delete('/reviews/:id', auth, deleteReview);
router.get('/search', searchBooks);
 // search books by author or genre
module.exports = router;
