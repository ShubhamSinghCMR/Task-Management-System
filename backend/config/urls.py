from django.contrib import admin
from django.urls import path, include
from rest_framework.permissions import AllowAny
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView
from users.views import (
    TokenObtainPairView,
    TokenRefreshView,
    RegisterView,
    MeView,
    OrgMemberListView,
)
from organizations.views import OrganizationListView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/schema/', SpectacularAPIView.as_view(permission_classes=[AllowAny]), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema', permission_classes=[AllowAny]), name='swagger-ui'),
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/register/', RegisterView.as_view(), name='register'),
    path('api/me/', MeView.as_view(), name='me'),
    path('api/users/', OrgMemberListView.as_view(), name='org-members'),
    path('api/organizations/', OrganizationListView.as_view(), name='organization-list'),
    path('api/projects/', include('projects.urls')),
    path('api/tasks/', include('tasks.urls')),
]
