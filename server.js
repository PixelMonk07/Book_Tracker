// server.js
import express from 'express';
import path from 'path';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import axios from 'axios';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

import {
  initializeDatabase,
  getAllBooks,
  addBook,
  getBookById,
  updateBook,
  deleteBook
} from './config/database.js';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Body parser
app.use(bodyParser.urlencoded({ extended: true }));

// Home route (sorted listing)
app.get('/', async (req, res, next) => {
  try {
    const sort = req.query.sort || 'date_read';
    const books = await getAllBooks(sort);
    res.render('index', { books, sort });
  } catch (err) {
    next(err);
  }
});

// Add book form
app.get('/add', (req, res) => {
  res.render('add');
});

// Add book submission
app.post('/add', async (req, res, next) => {
  try {
    const { title, author, isbn, rating, notes, date_read } = req.body;
    if (!title || !author) throw new Error("Title and author are required.");
    if (rating && (rating < 1 || rating > 5)) throw new Error("Rating must be 1-5.");
    await addBook({ title, author, isbn, rating, notes, date_read });
    res.redirect('/');
  } catch (err) {
    next(err);
  }
});

// Edit book form
app.get('/edit/:id', async (req, res, next) => {
  try {
    const book = await getBookById(req.params.id);
    if (!book) throw new Error("Book not found");
    res.render('edit', { book });
  } catch (err) {
    next(err);
  }
});

// Edit book submission
app.post('/edit/:id', async (req, res, next) => {
  try {
    const { title, author, isbn, rating, notes, date_read } = req.body;
    await updateBook(req.params.id, { title, author, isbn, rating, notes, date_read });
    res.redirect('/');
  } catch (err) {
    next(err);
  }
});

// Delete book
app.post('/delete/:id', async (req, res, next) => {
  try {
    await deleteBook(req.params.id);
    res.redirect('/');
  } catch (err) {
    next(err);
  }
});

// External API: Get book info from Open Library
app.get('/api/book-info/:isbn', async (req, res) => {
  const { isbn } = req.params;
  try {
    const url = `https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=data`;
    const response = await axios.get(url);
    const bookData = response.data[`ISBN:${isbn}`];

    if (!bookData) {
      return res.json({ success: false, error: "Book not found" });
    }

    res.json({
      success: true,
      book: {
        title: bookData.title,
        authors: bookData.authors.map((a) => a.name),
        publish_date: bookData.publish_date,
        pages: bookData.number_of_pages,
        cover: bookData.cover?.medium,
      },
    });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('error', {
    title: 'Error',
    currentPage: 'error',
    message: err.message });
});

// Initialize DB and start server
initializeDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
});
