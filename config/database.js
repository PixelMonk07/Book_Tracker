import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();
const { Pool } = pg;

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

export async function initializeDatabase() {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS books (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      author TEXT NOT NULL,
      isbn TEXT UNIQUE,
      rating INTEGER CHECK (rating >= 1 AND rating <= 5),
      notes TEXT,
      date_read DATE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
  try {
    await pool.query(createTableQuery);
    console.log("✅ Books table ensured");
  } catch (err) {
    console.error("❌ Error initializing database:", err);
  }
}

export async function getAllBooks(sortBy = 'date_read') {
  const validSorts = ['date_read', 'rating', 'title', 'author', 'created_at'];
  const sortColumn = validSorts.includes(sortBy) ? sortBy : 'date_read';
  const result = await pool.query(`SELECT * FROM books ORDER BY ${sortColumn} DESC`);
  return result.rows;
}

export async function addBook(book) {
  const { title, author, isbn, rating, notes, date_read } = book;
  const query = `
    INSERT INTO books (title, author, isbn, rating, notes, date_read)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *;
  `;
  const values = [title, author, isbn, rating, notes, date_read];
  const result = await pool.query(query, values);
  return result.rows[0];
}

export async function getBookById(id) {
  const result = await pool.query(`SELECT * FROM books WHERE id = $1`, [id]);
  return result.rows[0];
}

export async function updateBook(id, book) {
  const { title, author, isbn, rating, notes, date_read } = book;
  const query = `
    UPDATE books
    SET title = $1,
        author = $2,
        isbn = $3,
        rating = $4,
        notes = $5,
        date_read = $6,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = $7
    RETURNING *;
  `;
  const values = [title, author, isbn, rating, notes, date_read, id];
  const result = await pool.query(query, values);
  return result.rows[0];
}

export async function deleteBook(id) {
  await pool.query(`DELETE FROM books WHERE id = $1`, [id]);
}

export { pool };
