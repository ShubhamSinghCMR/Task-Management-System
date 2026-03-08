from drf_spectacular.utils import extend_schema
from rest_framework.permissions import AllowAny
from rest_framework import generics
from .models import Organization
from .serializers import OrganizationSerializer


@extend_schema(description="All orgs (id, name). Public, used on signup.")
class OrganizationListView(generics.ListAPIView):
    queryset = Organization.objects.all()
    serializer_class = OrganizationSerializer
    permission_classes = [AllowAny]
