from django.shortcuts import render
from rest_framework.decorators import api_view
from rest_framework.response import Response

from api.models import Game
from api.serializers import GameSerializer


@api_view(['GET'])
def game_list(request):
    games = Game.objects.all()
    return Response(GameSerializer(games, many=True).data)


@api_view(['GET'])
def game_detail(request, pk):
    try:
        game = Game.objects.get(pk=pk)
    except Game.DoesNotExist:
        return Response({'detail': 'Not found.'}, status=404)
    return Response(GameSerializer(game).data)