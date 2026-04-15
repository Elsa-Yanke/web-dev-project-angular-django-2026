from django.db import models
from django.contrib.auth.models import AbstractUser


class User(AbstractUser):
    bio = models.TextField(blank=True)
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True)


class Genre(models.Model):
    name = models.CharField(max_length=100)

    def __str__(self):
        return self.name


class Game(models.Model):
    title = models.CharField(max_length=255)
    description = models.TextField()
    release_year = models.IntegerField()
    price = models.DecimalField(max_digits=10, decimal_places=2)
    genre = models.ForeignKey(Genre, on_delete=models.PROTECT, related_name='games')
    ai_summary = models.TextField(blank=True, default='')

    def __str__(self):
        return self.title


class Review(models.Model):
    game = models.ForeignKey(Game, on_delete=models.CASCADE, related_name='reviews')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reviews')
    text = models.TextField()
    is_positive = models.BooleanField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Review by {self.user.username} for {self.game.title}"


class SteamReview(models.Model):
    game = models.ForeignKey(Game, on_delete=models.CASCADE, related_name='steam_reviews')
    text = models.TextField()
    is_positive = models.BooleanField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        sentiment = 'positive' if self.is_positive else 'negative'
        return f"Steam {sentiment} review for {self.game.title}"


class UserGame(models.Model):
    STATUS_CHOICES = [
        ('playing', 'Playing'),
        ('finished', 'Finished'),
        ('planned', 'Planned'),
        ('dropped', 'Dropped'),
    ]
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='user_games')
    game = models.ForeignKey(Game, on_delete=models.CASCADE, related_name='user_games')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES)
    added_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'game')

    def __str__(self):
        return f"{self.user.username} — {self.game.title} ({self.status})"
