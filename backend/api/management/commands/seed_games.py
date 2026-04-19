from django.core.management.base import BaseCommand
import requests

from api.models import Game, Genre, SteamReview
from api.summarizer import generate_summary


STEAM_GAMES = [
    570, 730, 440, 4000, 252490, 346110, 271590, 292030, 1091500, 1174180,
    1245620, 374320, 570940, 814380, 367520, 105600, 413150, 620, 550, 546560,
    578080, 1172470, 230410, 238960, 582010, 435150, 1086940, 1145360, 381210,
    945360, 892970, 526870, 427520, 255710, 227300, 1142710, 268500, 289070,
    281990, 394360, 1158310, 916440, 264710, 275850, 242760, 815370, 294100,
    457140, 504230, 268910,
]


class Command(BaseCommand):
    help = 'Seed games from Steam API with AI summaries'

    def handle(self, *args, **options):
        for app_id in STEAM_GAMES:
            self.stdout.write(f'Processing app_id={app_id}...')
            try:
                self._process_game(app_id)
            except KeyboardInterrupt:
                self.stdout.write('\nInterrupted by user. Exiting.')
                break
            except Exception as e:
                self.stdout.write(f'  ERROR: {e} — skipping.')
                continue

    def _process_game(self, app_id):
        detail_resp = requests.get(
            'https://store.steampowered.com/api/appdetails',
            params={'appids': app_id, 'l': 'english', 'cc': 'kz'},
            timeout=15,
        )
        detail_data = detail_resp.json().get(str(app_id), {})
        if not detail_data.get('success'):
            self.stdout.write('  No data from Steam, skipping.')
            return

        info = detail_data['data']
        title = info['name']
        description = info.get('short_description', '')

        price_overview = info.get('price_overview')
        price = round(price_overview['final'] / 100, 2) if price_overview else 0.00

        release_date_str = info.get('release_date', {}).get('date', '')
        release_year = self._parse_year(release_date_str)

        genres = info.get('genres', [])
        genre_name = genres[0]['description'] if genres else 'Other'
        genre, _ = Genre.objects.get_or_create(name=genre_name)

        game, created = Game.objects.get_or_create(
            title=title,
            defaults={
                'description': description,
                'release_year': release_year,
                'price': price,
                'genre': genre,
                'steam_app_id': app_id,
            }
        )
        if not created and not game.steam_app_id:
            game.steam_app_id = app_id
            game.save(update_fields=['steam_app_id'])
        action = 'Created' if created else 'Found'
        self.stdout.write(f'  {action}: {title}')

        review_resp = requests.get(
            f'https://store.steampowered.com/appreviews/{app_id}',
            params={
                'json': 1,
                'language': 'english',
                'num_per_page': 100,
                'filter': 'all',          # не только recent, а все отзывы
                'purchase_type': 'all',   # включая non-Steam покупки
            },
            timeout=15,
        )
        reviews = review_resp.json().get('reviews', [])

        positive_texts = [r['review'] for r in reviews if r['voted_up']]
        negative_texts = [r['review'] for r in reviews if not r['voted_up']]

        # 4. Store Steam reviews in DB (clear old ones first to avoid duplicates on re-seed)
        game.steam_reviews.all().delete()
        SteamReview.objects.bulk_create([
            SteamReview(game=game, text=text, is_positive=True)
            for text in positive_texts
        ] + [
            SteamReview(game=game, text=text, is_positive=False)
            for text in negative_texts
        ])

        game.ai_summary = generate_summary(positive_texts, negative_texts)
        game.save(update_fields=['ai_summary'])

        self.stdout.write(
            f'  Summary generated. ({len(positive_texts)} pos, {len(negative_texts)} neg reviews)'
        )

    def _parse_year(self, date_str):
        # Steam returns dates like "9 Jul, 2013" or "2013" or "Coming soon"
        parts = date_str.replace(',', '').split()
        for part in parts:
            if part.isdigit() and len(part) == 4:
                return int(part)
        return 2000
