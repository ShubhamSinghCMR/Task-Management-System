from django.db.models import Q
from drf_spectacular.utils import extend_schema, extend_schema_view, OpenApiExample
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response
from .models import Task, Comment
from .serializers import TaskSerializer, CommentSerializer
from .permissions import CanSetTaskDone
from users.permissions import HasOrganization


class TaskPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100


@extend_schema_view(
    list=extend_schema(
        description="List tasks you created, are assigned to, or own the project for (org-scoped). Query params: 'project' (id), 'status' (todo|in_progress|done).",
    ),
    create=extend_schema(
        description="Create a task. Project must be in your org. Assignee must be in same org.\n\n**Request schema:** `{\"project\": integer, \"title\": \"string\", \"status\": \"todo\"|\"in_progress\"|\"done\", \"assignee\": integer|null}`",
        request=TaskSerializer,
        examples=[
            OpenApiExample(
                "Create task",
                value={"project": 1, "title": "Implement feature X", "status": "todo", "assignee": None},
                request_only=True,
            ),
        ],
    ),
    retrieve=extend_schema(description="Get a task by id (must be in your org)."),
    update=extend_schema(
        description="Update a task. Only assignee or project owner can set status to 'done'.\n\n**Request schema:** `{\"project\": integer, \"title\": \"string\", \"status\": \"todo\"|\"in_progress\"|\"done\", \"assignee\": integer|null}`",
        request=TaskSerializer,
        examples=[
            OpenApiExample(
                "Update task",
                value={"title": "Updated title", "status": "in_progress", "assignee": 2},
                request_only=True,
            ),
        ],
    ),
    partial_update=extend_schema(
        description="Partially update a task.\n\n**Request schema:** `{\"project\": integer?, \"title\": \"string?\", \"status\": \"string?\", \"assignee\": integer|null?}` (all optional).",
        request=TaskSerializer,
    ),
    destroy=extend_schema(
        description="Delete a task. Cannot delete a task that is in progress; change status first.",
    ),
)
class TaskViewSet(viewsets.ModelViewSet):
    serializer_class = TaskSerializer
    permission_classes = [HasOrganization, CanSetTaskDone]
    pagination_class = TaskPagination

    def get_queryset(self):
        user = self.request.user
        org = user.profile.organization
        qs = Task.objects.filter(project__organization=org).filter(
            Q(assignee=user) | Q(created_by=user) | Q(project__owner=user)
        )
        project_id = self.request.query_params.get('project')
        if project_id:
            qs = qs.filter(project_id=project_id)
        status_filter = self.request.query_params.get('status')
        if status_filter and status_filter in ('todo', 'in_progress', 'done'):
            qs = qs.filter(status=status_filter)
        return qs

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    def destroy(self, request, *args, **kwargs):
        task = self.get_object()
        if task.status == 'in_progress':
            return Response(
                {'detail': 'Cannot delete a task that is in progress. Change its status first.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return super().destroy(request, *args, **kwargs)

    @extend_schema(
        description="List comments for this task, or create a new comment (author = current user).\n\n**Request schema (POST):** `{\"body\": \"string\"}`",
        request=CommentSerializer,
        examples=[
            OpenApiExample(
                "Add comment",
                value={"body": "This looks good."},
                request_only=True,
            ),
        ],
    )
    @action(detail=True, methods=['get', 'post'])
    def comments(self, request, pk=None):
        task = self.get_object()
        if request.method == 'GET':
            comments = task.comments.all()
            serializer = CommentSerializer(comments, many=True)
            return Response(serializer.data)
        serializer = CommentSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        serializer.save(task=task, author=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
