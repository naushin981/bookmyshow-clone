# Reel Rush

Reel Rush is a movie-booking demo with a separate Angular frontend and an Express API backed by MySQL.

**Live preview:** [https://naushin981.github.io/bookmyshow-clone/](https://naushin981.github.io/bookmyshow-clone/)

The GitHub Pages preview shows the frontend and sample movie listings. Booking requires the API and MySQL database described below, which are not hosted by GitHub Pages.

## Publish the frontend on GitHub Pages

The deployment workflow builds and publishes the frontend whenever changes are pushed to `main`. In the repository settings, open **Pages** and set the build and deployment source to **GitHub Actions**. After the workflow completes, the live preview link above will be available.

## Requirements

- Node.js 22.13 or newer
- npm
- XAMPP with MySQL (MariaDB) enabled

## Create the database

1. Open the XAMPP Control Panel and start **MySQL**. Start Apache too if you want to use phpMyAdmin.
2. Open `http://localhost/phpmyadmin`.
3. Select the **Import** tab, choose `backend/schema.sql`, and click **Import** (or **Go**).
4. Confirm that the `reel_rush` database contains `movies` and `bookings`.

The SQL script creates the database and tables. The API seeds the 22 demo listings when it starts.

## Connect the API to XAMPP MySQL

From the project root, copy the example config and open it to edit:

```powershell
Copy-Item backend\.env.example backend\.env
notepad backend\.env
```

Set your XAMPP MySQL connection details:

```env
API_PORT=3000
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=reel_rush
```

The default XAMPP MySQL `root` account often has a blank password locally. If you set a password, enter it as `DB_PASSWORD`. If XAMPP uses a port other than `3306`, change `DB_PORT` to match. Keep `backend/.env` private; it is git-ignored.

Install dependencies once:

```powershell
cd backend
npm install
cd ..\frontend
npm install
cd ..
```

## Run frontend and API

Make sure MySQL is running in XAMPP, then run this from the project root:

```powershell
npm run dev
```

The API connects to MySQL at `http://localhost:3000`; Angular starts at `http://localhost:4200` and proxies `/api` requests to it. Press `Ctrl+C` to stop both services. If MySQL credentials or the database name are wrong, the API reports a connection error in the terminal.

To run services in separate terminals instead, use `npm start` in `backend/` and `npm start` in `frontend/`.

## Test with Postman

Start the backend first and create a Postman request to `http://localhost:3000`.

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/api/health` | Check API and MySQL connection |
| `GET` | `/api/listings` | Get all listings |
| `GET` | `/api/listings?category=Events` | Filter by Movies, Events, Plays, Sports, or Activities |
| `GET` | `/api/listings/1/seats?city=Bengaluru&showDate=2026-11-12&showTime=5%3A15%20PM` | Check available seats for a listing/show |
| `GET` | `/api/movies?q=batman` | Search movie listings |
| `POST` | `/api/bookings` | Save a booking to MySQL |
| `GET` | `/api/bookings/RR-XXXXXXXX` | Retrieve a saved booking |

For `POST /api/bookings`, select **Body → raw → JSON** and send:

```json
{
  "movieId": 11,
  "city": "Bengaluru",
  "showDate": "2026-11-12",
  "showTime": "5:15 PM",
  "seats": 2,
  "seatCodes": ["A1", "A2"]
}
```

The booking form loads seats from this availability endpoint. It displays 40 seats (rows A–E, seats 1–8), marks already-booked seats, and lets the customer select up to eight seats. Use the returned `reference` in the GET booking request. Selected seats are stored in `reel_rush.booking_seats`; duplicate seat bookings return HTTP `409`.

## Checks

Run `npm run build` and `npm test` from `frontend/`.
