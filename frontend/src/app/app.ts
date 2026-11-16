import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { afterNextRender, ChangeDetectorRef, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TimeoutError, timeout } from 'rxjs';
import { apiUrl } from './api-config';

type ListingCategory = 'Movies' | 'Events' | 'Plays' | 'Sports' | 'Activities';

interface Listing {
  id: number;
  title: string;
  category: ListingCategory;
  genre: string;
  rating: string;
  language: string;
  poster: string;
  status: string;
  price: number;
  venue: string;
}

interface BookingResponse {
  reference: string;
  city: string;
  showDate: string;
  showTime: string;
  seats: number;
  seatCodes: string[];
}

interface SeatAvailability {
  seats: string[];
  reserved: string[];
}

interface ShowDate {
  value: string;
  day: string;
  number: string;
  month: string;
}

const LISTINGS: Listing[] = [
  { id: 1, title: 'Interstellar', category: 'Movies', genre: 'Sci-Fi · Adventure', rating: '9.1', language: 'English', poster: 'posters/movie1.jpg', status: 'FAN FAVOURITE', price: 249, venue: 'PVR Orion Mall' },
  { id: 2, title: 'Spider-Man: No Way Home', category: 'Movies', genre: 'Action · Adventure', rating: '8.7', language: 'English', poster: 'posters/movie2.jpg', status: 'NOW SHOWING', price: 199, venue: 'INOX Garuda Mall' },
  { id: 3, title: 'Dune: Part Two', category: 'Movies', genre: 'Sci-Fi · Drama', rating: '8.9', language: 'English', poster: 'posters/movie3.jpg', status: 'NOW SHOWING', price: 249, venue: 'Cinepolis Forum' },
  { id: 4, title: 'Avengers: Endgame', category: 'Movies', genre: 'Action · Sci-Fi', rating: '8.8', language: 'English', poster: 'posters/movie4.jpg', status: 'NOW SHOWING', price: 199, venue: 'PVR Vega City' },
  { id: 5, title: 'The Batman', category: 'Movies', genre: 'Action · Thriller', rating: '8.5', language: 'English', poster: 'posters/movie5.jpg', status: 'NOW SHOWING', price: 249, venue: 'INOX Mantri Square' },
];

@Component({
  imports: [FormsModule],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {
  private readonly http = inject(HttpClient);
  private readonly changeDetector = inject(ChangeDetectorRef);

  protected readonly cities = ['Bengaluru', 'Mumbai', 'Delhi', 'Chennai', 'Hyderabad', 'Pune'];
  protected readonly categories: ListingCategory[] = ['Movies', 'Events', 'Plays', 'Sports', 'Activities'];
  protected readonly showTimes = ['10:30 AM', '1:45 PM', '5:15 PM', '8:30 PM'];
  protected readonly seatRows = ['A', 'B', 'C', 'D', 'E'];
  protected readonly seatsPerRow = Array.from({ length: 8 }, (_, index) => index + 1);
  protected readonly showDates = this.createShowDates();
  protected listings = LISTINGS;
  protected activeCategory: ListingCategory = 'Movies';
  protected currentCity = 'Bengaluru';
  protected bookingCity = 'Bengaluru';
  protected searchTerm = '';
  protected selectedListing: Listing | null = null;
  protected selectedDate = this.showDates[0].value;
  protected selectedTime = this.showTimes[1];
  protected selectedSeats: string[] = [];
  protected availableSeats: string[] = [];
  protected reservedSeats: string[] = [];
  protected seatsLoading = false;
  protected seatLoadError = '';
  protected isBooking = false;
  protected apiError = false;
  protected bookingError = '';
  protected bookingComplete: BookingResponse | null = null;
  protected showSignIn = false;
  private seatRequestId = 0;

  constructor() {
    afterNextRender(() => this.loadListings());
  }

  protected get filteredListings(): Listing[] {
    const query = this.searchTerm.trim().toLocaleLowerCase();
    return this.listings.filter((listing) =>
      listing.category === this.activeCategory &&
      `${listing.title} ${listing.genre} ${listing.language} ${listing.venue}`.toLocaleLowerCase().includes(query),
    );
  }

  protected selectCategory(category: ListingCategory): void {
    this.activeCategory = category;
    this.searchTerm = '';
  }

  protected categoryIcon(category: ListingCategory): string {
    switch (category) {
      case 'Events': return '♫';
      case 'Plays': return '✦';
      case 'Sports': return '◉';
      case 'Activities': return '✳';
      case 'Movies': return '▶';
    }
  }

  protected openBooking(listing: Listing): void {
    this.selectedListing = listing;
    this.bookingCity = this.currentCity;
    this.selectedDate = this.showDates[0].value;
    this.selectedTime = this.showTimes[1];
    this.selectedSeats = [];
    this.loadSeatAvailability();
    this.bookingComplete = null;
    this.bookingError = '';
  }

  protected closeBooking(): void {
    this.selectedListing = null;
    this.seatRequestId++;
    this.seatsLoading = false;
    this.bookingComplete = null;
    this.bookingError = '';
  }

  protected get totalPrice(): number {
    return (this.selectedListing?.price ?? 0) * this.selectedSeats.length;
  }

  protected selectShowDate(date: string): void {
    this.selectedDate = date;
    this.loadSeatAvailability();
  }

  protected selectShowTime(time: string): void {
    this.selectedTime = time;
    this.loadSeatAvailability();
  }

  protected refreshSeatAvailability(): void {
    this.loadSeatAvailability();
  }

  protected toggleSeat(seatCode: string): void {
    if (this.seatsLoading || this.reservedSeats.includes(seatCode) || !this.availableSeats.includes(seatCode)) {
      return;
    }

    if (this.selectedSeats.includes(seatCode)) {
      this.selectedSeats = this.selectedSeats.filter((seat) => seat !== seatCode);
      this.bookingError = '';
      return;
    }

    if (this.selectedSeats.length >= 8) {
      this.bookingError = 'You can select up to 8 seats per booking.';
      return;
    }

    this.selectedSeats = [...this.selectedSeats, seatCode];
    this.bookingError = '';
  }

  protected openSignIn(): void {
    this.showSignIn = true;
  }

  protected submitBooking(): void {
    if (!this.selectedListing || this.isBooking || this.seatsLoading || this.seatLoadError) {
      return;
    }
    if (this.selectedSeats.length === 0) {
      this.bookingError = 'Select at least one available seat to continue.';
      return;
    }

    this.isBooking = true;
    this.bookingError = '';
    this.http.post<BookingResponse>(apiUrl('/api/bookings'), {
      movieId: this.selectedListing.id,
      city: this.bookingCity,
      showDate: this.selectedDate,
      showTime: this.selectedTime,
      seats: this.selectedSeats.length,
      seatCodes: this.selectedSeats,
    }).pipe(timeout({ first: 10000 })).subscribe({
      next: (booking) => {
        this.bookingComplete = booking;
        this.isBooking = false;
        this.changeDetector.markForCheck();
      },
      error: (error: unknown) => {
        this.isBooking = false;
        if (error instanceof HttpErrorResponse && error.status === 409) {
          this.loadSeatAvailability();
          this.bookingError = 'A seat was just booked by someone else. Choose another available seat.';
        } else if (error instanceof HttpErrorResponse && typeof error.error?.error === 'string') {
          this.bookingError = error.error.error;
        } else if (error instanceof TimeoutError) {
          this.bookingError = 'Booking took too long to respond. Please try again.';
        } else {
          this.bookingError = 'We could not complete your booking. Please check the API and database connection.';
        }
        this.changeDetector.markForCheck();
      },
    });
  }

  private loadSeatAvailability(): void {
    const listing = this.selectedListing;
    if (!listing) {
      return;
    }

    const requestId = ++this.seatRequestId;
    this.seatsLoading = true;
    this.seatLoadError = '';
    this.bookingError = '';
    this.selectedSeats = [];
    const params = new HttpParams()
      .set('city', this.bookingCity)
      .set('showDate', this.selectedDate)
      .set('showTime', this.selectedTime);

    this.http.get<SeatAvailability>(apiUrl(`/api/listings/${listing.id}/seats`), { params }).subscribe({
      next: (availability) => {
        if (requestId !== this.seatRequestId) {
          return;
        }
        this.availableSeats = availability.seats;
        this.reservedSeats = availability.reserved;
        this.seatsLoading = false;
        this.changeDetector.markForCheck();
      },
      error: () => {
        if (requestId !== this.seatRequestId) {
          return;
        }
        this.availableSeats = [];
        this.reservedSeats = [];
        this.seatsLoading = false;
        this.seatLoadError = 'Could not load seats. Check that the backend and MySQL are running, then retry.';
        this.changeDetector.markForCheck();
      },
    });
  }

  private loadListings(): void {
    this.http.get<Listing[]>(apiUrl('/api/listings')).subscribe({
      next: (listings) => {
        this.listings = listings;
        this.apiError = false;
        this.changeDetector.markForCheck();
      },
      error: () => {
        this.apiError = true;
        this.changeDetector.markForCheck();
      },
    });
  }

  private createShowDates(): ShowDate[] {
    return Array.from({ length: 5 }, (_, offset) => {
      const date = new Date();
      date.setDate(date.getDate() + offset);
      return {
        value: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`,
        day: new Intl.DateTimeFormat('en', { weekday: 'short' }).format(date),
        number: String(date.getDate()),
        month: new Intl.DateTimeFormat('en', { month: 'short' }).format(date),
      };
    });
  }
}
