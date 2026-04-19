import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { Game, Review, LibraryEntry } from '../../models/game.model';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-game-detail',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './game-detail.component.html',
  styleUrl: './game-detail.component.css'
})
export class GameDetailComponent implements OnInit {
  game = signal<Game | null>(null);
  reviews = signal<Review[]>([]);
  libraryEntry = signal<LibraryEntry | null>(null);

  reviewText = signal('');
  isPositive = signal(true);

  noteText = signal('');
  noteEditing = signal(false);
  noteSaving = signal(false);

  constructor(
    private route: ActivatedRoute,
    private api: ApiService,
    public auth: AuthService
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (id) {
      this.loadGameData(id);
    }
    if (this.auth.isLoggedIn()) {
      this.api.getLibrary().subscribe(entries => {
        const id = Number(this.route.snapshot.paramMap.get('id'));
        const entry = entries.find(e => e.game.id === id) || null;
        this.libraryEntry.set(entry);
        if (entry) this.noteText.set(entry.note || '');
      });
    }
  }

  loadGameData(id: number): void {
    this.api.getGame(id).subscribe(data => this.game.set(data));
    this.api.getReviews(id).subscribe(data => this.reviews.set(data));
  }

  coverSrc(game: Game): string {
    return game.cover_image ? `covers/${game.cover_image}` : '';
  }

  toggleFavorite(): void {
    const entry = this.libraryEntry();
    if (!entry) return;
    const newVal = !entry.is_favorite;
    this.api.updateLibraryEntry(entry.id, { is_favorite: newVal }).subscribe(updated => {
      this.libraryEntry.set(updated);
    });
  }

  saveNote(): void {
    const entry = this.libraryEntry();
    if (!entry) return;
    this.noteSaving.set(true);
    this.api.updateLibraryEntry(entry.id, { note: this.noteText() }).subscribe(updated => {
      this.libraryEntry.set(updated);
      this.noteEditing.set(false);
      this.noteSaving.set(false);
    });
  }

  cancelNote(): void {
    this.noteEditing.set(false);
    this.noteText.set(this.libraryEntry()?.note || '');
  }

  sendReview(): void {
    const g = this.game();
    if (!this.reviewText().trim() || !g) return;
    this.api.createReview(g.id, this.reviewText(), this.isPositive()).subscribe({
      next: (newReview) => {
        this.reviews.update(list => [newReview, ...list]);
        this.reviewText.set('');
        this.loadGameData(g.id);
      },
      error: () => alert('Are you logged in?')
    });
  }
}
