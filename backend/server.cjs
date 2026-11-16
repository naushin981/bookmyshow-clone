require('dotenv').config();

const crypto = require('node:crypto');
const express = require('express');
const mysql = require('mysql2/promise');

const app = express();
const port = Number(process.env.API_PORT || 3000);
const cities = ['Bengaluru', 'Mumbai', 'Delhi', 'Chennai', 'Hyderabad', 'Pune'];
const showTimes = ['10:30 AM', '1:45 PM', '5:15 PM', '8:30 PM'];
const categories = ['Movies', 'Events', 'Plays', 'Sports', 'Activities'];
const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'reel_rush',
  waitForConnections: true,
  connectionLimit: 10,
  dateStrings: true,
});

const listings = [
  [1, 'Interstellar', 'Movies', 'Sci-Fi · Adventure', '9.1', 'English', '/posters/movie1.jpg', 'FAN FAVOURITE', 249, 'PVR Orion Mall'],
  [2, 'Spider-Man: No Way Home', 'Movies', 'Action · Adventure', '8.7', 'English', '/posters/movie2.jpg', 'NOW SHOWING', 199, 'INOX Garuda Mall'],
  [3, 'Dune: Part Two', 'Movies', 'Sci-Fi · Drama', '8.9', 'English', '/posters/movie3.jpg', 'NOW SHOWING', 249, 'Cinepolis Forum'],
  [4, 'Avengers: Endgame', 'Movies', 'Action · Sci-Fi', '8.8', 'English', '/posters/movie4.jpg', 'NOW SHOWING', 199, 'PVR Vega City'],
  [5, 'The Batman', 'Movies', 'Action · Thriller', '8.5', 'English', '/posters/movie5.jpg', 'NOW SHOWING', 249, 'INOX Mantri Square'],
  [6, 'The Grand Budapest Hotel', 'Movies', 'Comedy · Drama', '8.4', 'English', '/posters/movie1.jpg', 'CULT CLASSIC', 199, 'PVR Orion Mall'],
  [7, 'The Martian', 'Movies', 'Sci-Fi · Adventure', '8.6', 'English', '/posters/movie3.jpg', 'NOW SHOWING', 229, 'Cinepolis Forum'],
  [8, 'The Dark Knight', 'Movies', 'Action · Crime', '9.0', 'English', '/posters/movie5.jpg', 'FAN FAVOURITE', 249, 'PVR Vega City'],
  [9, 'Avengers: Infinity War', 'Movies', 'Action · Sci-Fi', '8.7', 'English', '/posters/movie4.jpg', 'NOW SHOWING', 199, 'INOX Garuda Mall'],
  [10, 'Dune', 'Movies', 'Sci-Fi · Adventure', '8.6', 'English', '/posters/movie3.jpg', 'NOW SHOWING', 229, 'PVR Orion Mall'],
  [11, 'Neon Nights Music Festival', 'Events', 'Live music · Festival', '', 'Nov 22 · Bengaluru', '', 'THIS WEEKEND', 799, 'Palace Grounds'],
  [12, 'Laugh Out Loud: Stand-up Special', 'Events', 'Comedy · Live', '', 'Nov 23 · Bengaluru', '', 'SELLING FAST', 499, 'The Comedy Theatre'],
  [13, 'Indie Sounds: Rooftop Sessions', 'Events', 'Indie · Live music', '', 'Nov 29 · Bengaluru', '', 'NEW EVENT', 599, 'Bangalore International Centre'],
  [14, 'The Last Letter', 'Plays', 'Contemporary · English', '', 'Nov 21 · Bengaluru', '', 'CRITICS’ PICK', 650, 'Ranga Shankara'],
  [15, 'A Midsummer Night’s Dream', 'Plays', 'Classic · Theatre', '', 'Nov 24 · Bengaluru', '', 'LIMITED RUN', 450, 'Chowdiah Memorial Hall'],
  [16, 'Stories from the City', 'Plays', 'Drama · Kannada', '', 'Nov 30 · Bengaluru', '', 'NEW PLAY', 350, 'Jagriti Theatre'],
  [17, 'Bengaluru FC vs Kerala Blasters', 'Sports', 'Football · ISL', '', 'Nov 22 · Bengaluru', '', 'MATCH DAY', 299, 'Sree Kanteerava Stadium'],
  [18, 'Pro Kabaddi: Bengaluru Bulls', 'Sports', 'Kabaddi · Live', '', 'Nov 26 · Bengaluru', '', 'HOME GAME', 199, 'Sree Kanteerava Stadium'],
  [19, 'City Run 10K', 'Sports', 'Running · 10K', '', 'Dec 01 · Bengaluru', '', 'EARLY BIRD', 599, 'Cubbon Park'],
  [20, 'Pottery & Chai Workshop', 'Activities', 'Creative · Workshop', '', 'Nov 23 · Bengaluru', '', 'SMALL GROUP', 899, 'Claytopia Studio'],
  [21, 'Sunrise Trek to Nandi Hills', 'Activities', 'Outdoors · Trek', '', 'Nov 24 · Bengaluru', '', 'WEEKEND FAVOURITE', 749, 'Nandi Hills'],
  [22, 'Pasta Making Masterclass', 'Activities', 'Food · Cooking class', '', 'Nov 30 · Bengaluru', '', 'TASTY PLANS', 1099, 'The Culinary Lounge'],
];

app.use(express.json({ limit: '16kb' }));

app.get('/api/health', async (_request, response) => {
  await pool.query('SELECT 1');
  response.json({ status: 'ok', database: 'connected' });
});

app.get('/api/movies', async (request, response) => {
  const query = typeof request.query['q'] === 'string' ? request.query['q'].trim().toLowerCase() : '';
  const pattern = `%${query}%`;
  const [rows] = await pool.execute(`
    SELECT id, title, category, genre, rating, language, poster, status, price, venue
    FROM movies
    WHERE category = 'Movies'
      AND (? = '' OR LOWER(title) LIKE ? OR LOWER(genre) LIKE ?)
    ORDER BY id
  `, [query, pattern, pattern]);
  response.json(rows);
});

app.get('/api/listings', async (request, response) => {
  const category = typeof request.query['category'] === 'string' ? request.query['category'] : '';
  const query = typeof request.query['q'] === 'string' ? request.query['q'].trim().toLowerCase() : '';

  if (category && !categories.includes(category)) {
    response.status(400).json({ error: 'Choose a supported listing category.' });
    return;
  }

  const pattern = `%${query}%`;
  const [rows] = await pool.execute(`
    SELECT id, title, category, genre, rating, language, poster, status, price, venue
    FROM movies
    WHERE (? = '' OR category = ?)
      AND (? = '' OR LOWER(title) LIKE ? OR LOWER(genre) LIKE ? OR LOWER(venue) LIKE ?)
    ORDER BY id
  `, [category, category, query, pattern, pattern, pattern]);
  response.json(rows);
});

app.get('/api/listings/:id/seats', async (request, response) => {
  const listingId = Number(request.params['id']);
  const city = typeof request.query['city'] === 'string' ? request.query['city'].trim() : '';
  const showDate = typeof request.query['showDate'] === 'string' ? request.query['showDate'] : '';
  const showTime = typeof request.query['showTime'] === 'string' ? request.query['showTime'] : '';

  if (!Number.isInteger(listingId)) {
    response.status(400).json({ error: 'Choose a valid listing.' });
    return;
  }
  if (!cities.includes(city) || !isValidDate(showDate) || !showTimes.includes(showTime)) {
    response.status(400).json({ error: 'Choose a valid city, date, and showtime.' });
    return;
  }
  const [matchingListings] = await pool.execute('SELECT id FROM movies WHERE id = ?', [listingId]);
  if (matchingListings.length === 0) {
    response.status(404).json({ error: 'Listing not found.' });
    return;
  }

  const [reservations] = await pool.execute(`
    SELECT seat_code AS seatCode
    FROM booking_seats
    WHERE movie_id = ? AND city = ? AND show_date = ? AND show_time = ?
  `, [listingId, city, showDate, showTime]);
  response.json({
    seats: Array.from({ length: 5 }, (_, row) =>
      Array.from({ length: 8 }, (_, column) => `${String.fromCharCode(65 + row)}${column + 1}`),
    ).flat(),
    reserved: reservations.map((reservation) => reservation.seatCode),
  });
});

app.post('/api/bookings', async (request, response) => {
  const body = request.body;
  const movieId = body?.movieId;
  const city = typeof body?.city === 'string' ? body.city.trim() : '';
  const showDate = typeof body?.showDate === 'string' ? body.showDate : '';
  const showTime = typeof body?.showTime === 'string' ? body.showTime : '';
  const seats = body?.seats;
  const seatCodes = body?.seatCodes;

  if (!Number.isInteger(movieId)) {
    response.status(400).json({ error: 'Choose an item from the current listings.' });
    return;
  }
  const [matchingListings] = await pool.execute('SELECT id FROM movies WHERE id = ?', [movieId]);
  if (matchingListings.length === 0) {
    response.status(400).json({ error: 'Choose an item from the current listings.' });
    return;
  }
  if (!cities.includes(city)) {
    response.status(400).json({ error: 'Choose a supported city.' });
    return;
  }
  if (!isValidDate(showDate)) {
    response.status(400).json({ error: 'Choose a valid show date.' });
    return;
  }
  if (!showTimes.includes(showTime)) {
    response.status(400).json({ error: 'Choose one of the available showtimes.' });
    return;
  }
  if (!Number.isInteger(seats) || seats < 1 || seats > 8) {
    response.status(400).json({ error: 'Choose between 1 and 8 tickets.' });
    return;
  }
  if (
    !Array.isArray(seatCodes) ||
    seatCodes.length !== seats ||
    new Set(seatCodes).size !== seatCodes.length ||
    !seatCodes.every((seatCode) => typeof seatCode === 'string' && /^[A-E][1-8]$/.test(seatCode))
  ) {
    response.status(400).json({ error: 'Select a unique seat for each ticket.' });
    return;
  }

  const reference = `RR-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
  const createdAt = new Date();
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await connection.execute(`
      INSERT INTO bookings (reference, movie_id, city, show_date, show_time, seats, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [reference, movieId, city, showDate, showTime, seats, createdAt]);
    for (const seatCode of seatCodes) {
      await connection.execute(`
        INSERT INTO booking_seats (movie_id, city, show_date, show_time, seat_code, booking_reference)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [movieId, city, showDate, showTime, seatCode, reference]);
    }
    await connection.commit();
    response.status(201).json({
      reference,
      movieId,
      city,
      showDate,
      showTime,
      seats,
      seatCodes,
      createdAt: createdAt.toISOString(),
    });
  } catch (error) {
    await connection.rollback();
    if (error.code === 'ER_DUP_ENTRY') {
      response.status(409).json({ error: 'One or more selected seats have just been booked. Choose different seats.' });
      return;
    }
    throw error;
  } finally {
    connection.release();
  }
});

app.get('/api/bookings/:reference', async (request, response) => {
  const [rows] = await pool.execute(`
    SELECT bookings.reference, bookings.city, bookings.show_date AS showDate,
      bookings.show_time AS showTime, bookings.seats, bookings.created_at AS createdAt,
      movies.title AS movieTitle,
      GROUP_CONCAT(booking_seats.seat_code ORDER BY booking_seats.seat_code) AS seatCodes
    FROM bookings JOIN movies ON movies.id = bookings.movie_id
    LEFT JOIN booking_seats ON booking_seats.booking_reference = bookings.reference
    WHERE bookings.reference = ?
    GROUP BY bookings.reference, bookings.city, bookings.show_date, bookings.show_time,
      bookings.seats, bookings.created_at, movies.title
  `, [request.params['reference']]);

  if (rows.length === 0) {
    response.status(404).json({ error: 'Booking not found.' });
    return;
  }
  const booking = rows[0];
  response.json({
    ...booking,
    seatCodes: booking.seatCodes ? booking.seatCodes.split(',') : [],
  });
});

app.use((error, _request, response, _next) => {
  console.error('API request failed:', error);
  response.status(500).json({ error: 'The request could not be completed.' });
});

function isValidDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

async function initializeDatabase() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS movies (
      id INT PRIMARY KEY,
      title VARCHAR(180) NOT NULL UNIQUE,
      category VARCHAR(32) NOT NULL DEFAULT 'Movies',
      genre VARCHAR(120) NOT NULL,
      rating VARCHAR(8) NOT NULL DEFAULT '',
      language VARCHAR(80) NOT NULL DEFAULT '',
      poster VARCHAR(255) NOT NULL DEFAULT '',
      status VARCHAR(60) NOT NULL,
      price INT UNSIGNED NOT NULL DEFAULT 0,
      venue VARCHAR(180) NOT NULL DEFAULT '',
      INDEX idx_movies_category (category)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS bookings (
      reference VARCHAR(16) PRIMARY KEY,
      movie_id INT NOT NULL,
      city VARCHAR(60) NOT NULL,
      show_date DATE NOT NULL,
      show_time VARCHAR(20) NOT NULL,
      seats TINYINT UNSIGNED NOT NULL,
      created_at DATETIME NOT NULL,
      CONSTRAINT fk_bookings_movie FOREIGN KEY (movie_id) REFERENCES movies(id),
      CONSTRAINT chk_bookings_seats CHECK (seats BETWEEN 1 AND 8)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS booking_seats (
      movie_id INT NOT NULL,
      city VARCHAR(60) NOT NULL,
      show_date DATE NOT NULL,
      show_time VARCHAR(20) NOT NULL,
      seat_code CHAR(2) NOT NULL,
      booking_reference VARCHAR(16) NOT NULL,
      PRIMARY KEY (movie_id, city, show_date, show_time, seat_code),
      INDEX idx_booking_seats_reference (booking_reference),
      CONSTRAINT fk_booking_seats_listing FOREIGN KEY (movie_id) REFERENCES movies(id),
      CONSTRAINT fk_booking_seats_booking FOREIGN KEY (booking_reference) REFERENCES bookings(reference)
        ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  const seedSql = `
    INSERT INTO movies (id, title, category, genre, rating, language, poster, status, price, venue)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      title = VALUES(title),
      category = VALUES(category),
      genre = VALUES(genre),
      rating = VALUES(rating),
      language = VALUES(language),
      poster = VALUES(poster),
      status = VALUES(status),
      price = VALUES(price),
      venue = VALUES(venue)
  `;
  for (const listing of listings) {
    await pool.execute(seedSql, listing);
  }
}

async function start() {
  try {
    await initializeDatabase();
    app.listen(port, () => {
      console.log(`Reel Rush API listening at http://localhost:${port}`);
      console.log(`Connected to MySQL database "${process.env.DB_NAME || 'reel_rush'}" at ${process.env.DB_HOST || '127.0.0.1'}:${process.env.DB_PORT || '3306'}`);
    });
  } catch (error) {
    console.error('Could not connect to MySQL or initialize the database.');
    console.error(error);
    await pool.end();
    process.exitCode = 1;
  }
}

start();
