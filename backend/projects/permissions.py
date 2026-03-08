from rest_framework import permissions


class IsProjectOwner(permissions.BasePermission):
    """Only owner can update/delete the project."""
    def has_object_permission(self, request, view, obj):
        if request.method in ('GET', 'HEAD', 'OPTIONS'):
            return True
        if request.method in ('PUT', 'PATCH', 'DELETE'):
            return obj.owner_id == request.user.id
        return True
