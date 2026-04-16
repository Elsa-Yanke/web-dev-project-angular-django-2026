export interface Review {
  id: number;
  game: number;
  user: string;
  text: string;
  is_positive: boolean;
  created_at: string;
}

