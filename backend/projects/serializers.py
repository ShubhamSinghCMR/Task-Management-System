from rest_framework import serializers
from .models import Project


class ProjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Project
        fields = ['id', 'organization', 'owner', 'name', 'created_at', 'updated_at']
        read_only_fields = ['id', 'organization', 'owner', 'created_at', 'updated_at']
