from django.contrib.auth import get_user_model
from drf_spectacular.utils import extend_schema, OpenApiExample
from rest_framework import generics, status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework_simplejwt.views import (
    TokenObtainPairView as JWTTokenObtainPairView,
    TokenRefreshView as JWTTokenRefreshView,
)
from .serializers import RegisterSerializer, MeSerializer
from .permissions import HasOrganization

User = get_user_model()


@extend_schema(
    description="Obtain JWT access and refresh tokens. Use the access token in Authorization: Bearer <token> for protected endpoints.\n\n**Request schema:** `{\"username\": \"string\", \"password\": \"string\"}`",
    examples=[
        OpenApiExample("Login", value={"username": "alice", "password": "your_password"}, request_only=True),
    ],
)
class TokenObtainPairView(JWTTokenObtainPairView):
    pass


@extend_schema(
    description="Refresh access token. Send the refresh token from login response.\n\n**Request schema:** `{\"refresh\": \"string\"}`",
    examples=[
        OpenApiExample("Refresh", value={"refresh": "your_refresh_token_here"}, request_only=True),
    ],
)
class TokenRefreshView(JWTTokenRefreshView):
    pass


@extend_schema(
    description="Register a new user. User is linked to the given organization.\n\n**Request schema:** `{\"username\": \"string\", \"password\": \"string\", \"email\": \"string\" (optional), \"organization_id\": integer}`",
    examples=[
        OpenApiExample(
            "Register",
            value={"username": "alice", "password": "testpass123", "email": "alice@example.com", "organization_id": 1},
            request_only=True,
        ),
    ],
)
class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response({"id": user.id, "username": user.username}, status=status.HTTP_201_CREATED)


@extend_schema(description="Current user and their org (id, username, email, organization_id, organization_name).")
class MeView(generics.RetrieveAPIView):
    permission_classes = [HasOrganization]

    def get_object(self):
        return self.request.user.profile

    def get_serializer_class(self):
        return MeSerializer


@extend_schema(description="Users in your org (id, username). For assignee picker.")
class OrgMemberListView(generics.ListAPIView):
    permission_classes = [HasOrganization]

    def get_queryset(self):
        org = self.request.user.profile.organization
        return User.objects.filter(profile__organization=org).order_by('username')

    def list(self, request, *args, **kwargs):
        qs = self.get_queryset()
        data = [{"id": u.id, "username": u.username} for u in qs]
        return Response(data)
