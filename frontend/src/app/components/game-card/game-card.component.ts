import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Game } from '../../models/game.model';

@Component({
  selector: 'app-game-card',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './game-card.component.html',
  styleUrl: './game-card.component.css',
})
export class GameCardComponent {
  @Input() game!: Game;
  @Input() inLibrary = false;

  @Output() add = new EventEmitter<{ gameId: number; status: string }>();
  @Output() remove = new EventEmitter<number>();

  onAdd(): void {
    this.add.emit({ gameId: this.game.id, status: 'planned' });
  }

  onRemove(): void {
    this.remove.emit(this.game.id);
  }

  onImgError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.style.display = 'none';
  }

  get coverSrc(): string {
    if (this.game.cover_image) {
      return `covers/${this.game.cover_image}`;
    }
    return 'placeholder.png';
  }

  get displayPrice(): string {
    return Number(this.game.price) === 0 ? 'Free' : `${this.game.price} ₸`;
  }

  get isFree(): boolean {
    return Number(this.game.price) === 0;
  }
}
