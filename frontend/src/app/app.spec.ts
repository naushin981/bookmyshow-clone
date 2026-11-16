import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { App } from './app';

describe('App', () => {
  let httpTesting: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should create the app and request the movie catalog', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    httpTesting.expectOne('/api/listings').flush([]);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render the Reel Rush hero', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    httpTesting.expectOne('/api/listings').flush([]);
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('A little more');
  });

  it('should show listings for the selected category', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    httpTesting.expectOne('/api/listings').flush([
      {
        id: 1,
        title: 'Interstellar',
        category: 'Movies',
        genre: 'Sci-Fi',
        rating: '9.1',
        language: 'English',
        poster: '/posters/movie1.jpg',
        status: 'NOW SHOWING',
        price: 249,
        venue: 'PVR Orion Mall',
      },
      {
        id: 11,
        title: 'Neon Nights Music Festival',
        category: 'Events',
        genre: 'Live music',
        rating: '',
        language: 'Nov 22 · Bengaluru',
        poster: '',
        status: 'THIS WEEKEND',
        price: 799,
        venue: 'Palace Grounds',
      },
    ]);
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    const eventsLink = compiled.querySelector('.subnav-links a:nth-child(2)') as HTMLAnchorElement;
    eventsLink.click();
    fixture.detectChanges();

    expect(compiled.querySelector('.section-heading h2')?.textContent).toContain('Events to discover');
    expect(compiled.querySelector('.movie-card h3')?.textContent).toContain('Neon Nights Music Festival');
    expect(compiled.querySelectorAll('.movie-card')).toHaveLength(1);
  });

  it('should reserve the seats selected in the seat map', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    httpTesting.expectOne('/api/listings').flush([
      {
        id: 1,
        title: 'Interstellar',
        category: 'Movies',
        genre: 'Sci-Fi',
        rating: '9.1',
        language: 'English',
        poster: '/posters/movie1.jpg',
        status: 'NOW SHOWING',
        price: 249,
        venue: 'PVR Orion Mall',
      },
    ]);
    await fixture.whenStable();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    (compiled.querySelector('.poster-button') as HTMLButtonElement).click();
    fixture.detectChanges();

    const seatRequest = httpTesting.expectOne((request) =>
      request.url === '/api/listings/1/seats' &&
      request.params.get('city') === 'Bengaluru',
    );
    seatRequest.flush({
      seats: ['A1', 'A2', 'A3'],
      reserved: ['A3'],
    });
    await fixture.whenStable();
    fixture.detectChanges();

    const firstSeat = compiled.querySelector('[aria-label="A1, available"]') as HTMLButtonElement;
    const secondSeat = compiled.querySelector('[aria-label="A2, available"]') as HTMLButtonElement;
    const reservedSeat = compiled.querySelector('[aria-label="A3, booked"]') as HTMLButtonElement;
    expect(firstSeat).toBeTruthy();
    expect(secondSeat).toBeTruthy();
    expect(reservedSeat.disabled).toBe(true);
    firstSeat.click();
    secondSeat.click();
    fixture.detectChanges();
    (compiled.querySelector('.booking-form') as HTMLFormElement).dispatchEvent(
      new Event('submit', { bubbles: true, cancelable: true }),
    );

    const bookingRequest = httpTesting.expectOne('/api/bookings');
    expect(bookingRequest.request.body.seats).toBe(2);
    expect(bookingRequest.request.body.seatCodes).toEqual(['A1', 'A2']);
    bookingRequest.flush({
      reference: 'RR-TEST1234',
      city: 'Bengaluru',
      showDate: '2026-11-12',
      showTime: '1:45 PM',
      seats: 2,
      seatCodes: ['A1', 'A2'],
    });
    fixture.detectChanges();
    expect(compiled.querySelector('.booking-reference')?.textContent).toContain('RR-TEST1234');
  });
});
