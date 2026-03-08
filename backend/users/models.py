from django.conf import settings
from django.db import models


class UserProfile(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='profile')
    organization = models.ForeignKey('organizations.Organization', on_delete=models.CASCADE, related_name='members')

    def __str__(self):
        return f"{self.user.username} ({self.organization.name})"
