from drf_spectacular.utils import extend_schema, extend_schema_view, OpenApiExample
from rest_framework import viewsets, status
from rest_framework.response import Response
from .models import Project
from .serializers import ProjectSerializer
from .permissions import IsProjectOwner
from users.permissions import HasOrganization


@extend_schema_view(
    list=extend_schema(
        description="List all projects in your organization. Only org members see these.",
    ),
    create=extend_schema(
        description="Create a project. Owner is set to the current user.\n\n**Request schema:** `{\"name\": \"string\"}`",
        request=ProjectSerializer,
        examples=[
            OpenApiExample(
                "Create project",
                value={"name": "My Project"},
                request_only=True,
            ),
        ],
    ),
    retrieve=extend_schema(description="Get a project by id (must be in your org)."),
    update=extend_schema(
        description="Update a project. Only the project owner can update.\n\n**Request schema:** `{\"name\": \"string\"}`",
        request=ProjectSerializer,
        examples=[
            OpenApiExample(
                "Update project",
                value={"name": "Updated Project Name"},
                request_only=True,
            ),
        ],
    ),
    partial_update=extend_schema(
        description="Partially update a project. Only the project owner.\n\n**Request schema:** `{\"name\": \"string\"}` (optional).",
        request=ProjectSerializer,
    ),
    destroy=extend_schema(
        description="Delete a project. Only the project owner can delete. Fails if the project has any task with status in_progress.",
    ),
)
class ProjectViewSet(viewsets.ModelViewSet):
    serializer_class = ProjectSerializer
    permission_classes = [HasOrganization, IsProjectOwner]

    def get_queryset(self):
        return Project.objects.filter(organization=self.request.user.profile.organization)

    def perform_create(self, serializer):
        serializer.save(
            organization=self.request.user.profile.organization,
            owner=self.request.user,
        )

    def destroy(self, request, *args, **kwargs):
        project = self.get_object()
        if project.tasks.filter(status='in_progress').exists():
            return Response(
                {'detail': 'Cannot delete project: it has tasks in progress. Move or complete them first.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return super().destroy(request, *args, **kwargs)
