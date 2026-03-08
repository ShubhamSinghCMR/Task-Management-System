from rest_framework import serializers
from .models import Task, Comment


class TaskSerializer(serializers.ModelSerializer):
    assignee_username = serializers.SerializerMethodField()
    project_owner_id = serializers.SerializerMethodField()
    project_name = serializers.SerializerMethodField()

    class Meta:
        model = Task
        fields = [
            'id', 'project', 'project_name', 'title', 'status', 'created_by', 'assignee', 'assignee_username',
            'project_owner_id', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'project_name', 'created_by', 'assignee_username', 'project_owner_id', 'created_at', 'updated_at']

    def get_assignee_username(self, obj):
        return obj.assignee.username if obj.assignee else None

    def get_project_owner_id(self, obj):
        return obj.project.owner_id

    def get_project_name(self, obj):
        return obj.project.name

    def validate_assignee(self, value):
        if value is None:
            return value
        org = self.context['request'].user.profile.organization
        if not hasattr(value, 'profile') or value.profile.organization_id != org.id:
            raise serializers.ValidationError("Assignee must be in the same organization.")
        return value

    def validate(self, attrs):
        user = self.context['request'].user
        org_id = user.profile.organization_id
        if not self.instance and 'project' in attrs:
            if attrs['project'].organization_id != org_id:
                raise serializers.ValidationError({"project": "Project must be in your organization."})
        if self.instance and 'status' in attrs:
            new_status = attrs['status']
            if new_status == 'done':
                if self.instance.assignee_id != user.id and self.instance.project.owner_id != user.id:
                    raise serializers.ValidationError(
                        {"status": "Only the assignee or project owner can mark this task as done."}
                    )
            elif new_status in ('todo', 'in_progress'):
                if self.instance.assignee_id != user.id:
                    raise serializers.ValidationError(
                        {"status": "Only the assignee can change status to todo or in progress."}
                    )
        return attrs


class CommentSerializer(serializers.ModelSerializer):
    author_username = serializers.SerializerMethodField()

    class Meta:
        model = Comment
        fields = ['id', 'task', 'author', 'author_username', 'body', 'created_at']
        read_only_fields = ['id', 'task', 'author', 'author_username', 'created_at']

    def get_author_username(self, obj):
        return obj.author.username
