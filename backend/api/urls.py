from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenBlacklistView

from .auth_views import register_view
from .views import game_list, game_detail

urlpatterns = [
    path('auth/register/', register_view, name='auth-register'),
    path('auth/login/', TokenObtainPairView.as_view(), name='auth-login'),
    path('auth/logout/', TokenBlacklistView.as_view(), name='auth-logout'),
    path('games/', game_list, name='game-list'),
    path('games/<int:pk>/', game_detail, name='game-detail'),
]