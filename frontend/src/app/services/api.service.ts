import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Game, Genre, Review, AuthTokens, LibraryEntry } from '../models/game.model';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private base = 'http://127.0.0.1:8000/api';

  constructor(private http: HttpClient) {}
  
  login(username: string, password: string): Observable<AuthTokens> {
    return this.http.post<AuthTokens>(`${this.base}/auth/login/`, { username, password });
  }

  register(payload: any): Observable<AuthTokens> {
    return this.http.post<AuthTokens>(`${this.base}/auth/register/`, payload);
  }

  logout(refresh: string): Observable<any> {
    return this.http.post(`${this.base}/auth/logout/`, { refresh });
  }

  getMe(): Observable<any> {
    return this.http.get(`${this.base}/auth/me/`);
  }

  updateProfile(formData: FormData): Observable<any> {
    return this.http.patch(`${this.base}/auth/me/`, formData);
  }

  getGames(): Observable<Game[]> {
    return this.http.get<Game[]>(`${this.base}/games/`);
  }

  getGame(id: number): Observable<Game> {
    return this.http.get<Game>(`${this.base}/games/${id}/`);
  }

  getGenres(): Observable<Genre[]> {
    return this.http.get<Genre[]>(`${this.base}/genres/`);
  }

  getReviews(gameId: number): Observable<Review[]> {
    return this.http.get<Review[]>(`${this.base}/games/${gameId}/reviews/`);
  }

  createReview(gameId: number, text: string, isPositive: boolean): Observable<Review> {
    const payload = { text, is_positive: isPositive };
    return this.http.post<Review>(`${this.base}/games/${gameId}/reviews/`, payload);
  }

  updateReview(gameId: number, reviewId: number, text: string, isPositive: boolean): Observable<Review> {
    const payload = { text, is_positive: isPositive };
    return this.http.patch<Review>(`${this.base}/games/${gameId}/reviews/${reviewId}/`, payload);
  }

  deleteReview(gameId: number, reviewId: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/games/${gameId}/reviews/${reviewId}/`);
  }

  getLibrary(): Observable<LibraryEntry[]> {
    return this.http.get<LibraryEntry[]>(`${this.base}/library/`);
  }

  addToLibrary(gameId: number, status: string = 'planned'): Observable<any> {
    return this.http.post(`${this.base}/library/`, { game_id: gameId, status });
  }

  updateLibraryEntry(id: number, data: { status?: string; is_favorite?: boolean; note?: string }): Observable<any> {
    return this.http.patch(`${this.base}/library/${id}/`, data);
  }

  deleteFromLibrary(id: number): Observable<any> {
    return this.http.delete(`${this.base}/library/${id}/`);
  }
}
