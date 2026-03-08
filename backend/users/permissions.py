from rest_framework import permissions


class HasOrganization(permissions.BasePermission):
    """Must be logged in and have a profile with an org."""
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return hasattr(request.user, 'profile') and request.user.profile is not None
