from rest_framework import permissions


class CanSetTaskDone(permissions.BasePermission):
    """Assignee or project owner can set status to done."""
    def has_object_permission(self, request, view, obj):
        if request.method not in ('PUT', 'PATCH', 'POST'):
            return True
        new_status = request.data.get('status') if hasattr(request, 'data') else None
        if new_status != 'done':
            return True
        return obj.assignee_id == request.user.id or obj.project.owner_id == request.user.id
