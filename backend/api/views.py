from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status
from django.shortcuts import get_object_or_404

from .models import Game, Genre, Review, UserGame
from .serializers import (
    GameSerializer, GenreSerializer, ReviewSerializer,
    UserGameReadSerializer, UserGameWriteSerializer,
)


@api_view(['GET'])
@permission_classes([AllowAny])
def game_list(request):
    games = Game.objects.select_related('genre').all()
    search = request.query_params.get('search', '').strip()
    genre = request.query_params.get('genre', '').strip()
    if search:
        games = games.filter(title__icontains=search)
    if genre:
        games = games.filter(genre__name__iexact=genre)
    serializer = GameSerializer(games, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([AllowAny])
def game_detail(request, pk):
    game = get_object_or_404(Game, pk=pk)
    return Response(GameSerializer(game).data)


@api_view(['GET'])
@permission_classes([AllowAny])
def genre_list(request):
    genres = Genre.objects.all()
    serializer = GenreSerializer(genres, many=True)
    return Response(serializer.data)


class ReviewListCreateView(APIView):
    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAuthenticated()]
        return [AllowAny()]

    def get(self, request, game_pk):
        reviews = Review.objects.filter(game_id=game_pk).select_related('user')
        serializer = ReviewSerializer(reviews, many=True)
        return Response(serializer.data)

    def post(self, request, game_pk):
        serializer = ReviewSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(user=request.user, game_id=game_pk)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ReviewDetailView(APIView):
    def get_permissions(self):
        if self.request.method in ['DELETE', 'PATCH']:
            return [IsAuthenticated()]
        return [AllowAny()]

    def get_object(self, game_pk, pk):
        return get_object_or_404(Review, pk=pk, game_id=game_pk)

    def get(self, request, game_pk, pk):
        review = self.get_object(game_pk, pk)
        return Response(ReviewSerializer(review).data)
    
    def patch(self, request, game_pk, pk):
        review = self.get_object(game_pk, pk)
        if review.user != request.user:
            return Response(
                {'detail': 'You can change only your own reviews.'},
                status=status.HTTP_403_FORBIDDEN,
            )
        serializer = ReviewSerializer(review, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, game_pk, pk):
        review = self.get_object(game_pk, pk)
        if review.user != request.user:
            return Response(
                {'detail': 'You can only delete your own reviews.'},
                status=status.HTTP_403_FORBIDDEN,
            )
        review.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class LibraryListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        entries = UserGame.objects.filter(user=request.user).select_related('game__genre')
        serializer = UserGameReadSerializer(entries, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = UserGameWriteSerializer(data=request.data)
        if serializer.is_valid():
            game_id = serializer.validated_data['game_id']
            if UserGame.objects.filter(user=request.user, game_id=game_id).exists():
                return Response(
                    {'detail': 'Game already in library.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            serializer.save(user=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LibraryDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get_object(self, request, pk):
        return get_object_or_404(UserGame, pk=pk, user=request.user)

    def put(self, request, pk):
        entry = self.get_object(request, pk)
        serializer = UserGameWriteSerializer(entry, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, pk):
        return self.put(request, pk)

    def delete(self, request, pk):
        entry = self.get_object(request, pk)
        entry.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
