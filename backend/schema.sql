CREATE DATABASE IF NOT EXISTS reel_rush
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE reel_rush;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
