from django.contrib.auth import get_user_model
from rest_framework import serializers
from organizations.models import Organization
from .models import UserProfile

User = get_user_model()


class RegisterSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True, min_length=8)
    email = serializers.EmailField(required=False, allow_blank=True)
    organization_id = serializers.PrimaryKeyRelatedField(queryset=Organization.objects.all())

    def create(self, validated_data):
        org = validated_data.pop('organization_id')
        user = User.objects.create_user(
            username=validated_data['username'],
            password=validated_data['password'],
            email=validated_data.get('email', ''),
        )
        UserProfile.objects.create(user=user, organization=org)
        return user


class MeSerializer(serializers.Serializer):
    id = serializers.IntegerField(source='user.id')
    username = serializers.CharField(source='user.username')
    email = serializers.EmailField(source='user.email')
    organization_id = serializers.IntegerField(source='organization.id')
    organization_name = serializers.CharField(source='organization.name')
