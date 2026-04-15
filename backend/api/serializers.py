from rest_framework import serializers
from django.contrib.auth import get_user_model

from .models import Game, Genre, Review

User = get_user_model()


class GenreSerializer(serializers.ModelSerializer):
    class Meta:
        model = Genre
        fields = ['id', 'name']


class GameSerializer(serializers.ModelSerializer):
    genre = GenreSerializer(read_only=True)
    genre_id = serializers.PrimaryKeyRelatedField(
        queryset=Genre.objects.all(), source='genre', write_only=True
    )

    class Meta:
        model = Game
        fields = ['id', 'title', 'description', 'release_year', 'price', 'genre', 'genre_id', 'ai_summary']
        read_only_fields = ['ai_summary']


class ReviewSerializer(serializers.ModelSerializer):
    user = serializers.StringRelatedField(read_only=True)

    class Meta:
        model = Review
        fields = ['id', 'game', 'user', 'text', 'is_positive', 'created_at']
        read_only_fields = ['user', 'created_at']

class RegisterSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=8)
    password2 = serializers.CharField(write_only=True)
    bio = serializers.CharField(required=False, allow_blank=True)
    avatar = serializers.ImageField(required=False, allow_null=True)
    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError('Username already taken.')
        return value

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError('Email already registered.')
        return value
    def validate(self, data):
        if data['password'] != data['password2']:
            raise serializers.ValidationError({'password2': 'Passwords do not match.'})
        return data

    def create(self, validated_data):
        validated_data.pop('password2')
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user
