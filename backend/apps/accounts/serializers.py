from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Profile


class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = ['full_name', 'avatar_url', 'role', 'created_at', 'updated_at']


class UserSerializer(serializers.ModelSerializer):
    profile = ProfileSerializer(read_only=True)
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'profile']


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    full_name = serializers.CharField(required=False, write_only=True)
    
    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'full_name']
        
    def create(self, validated_data):
        full_name = validated_data.pop('full_name', '')
        # Split full_name into first and last name if available
        first_name = ''
        last_name = ''
        if full_name:
            parts = full_name.split(' ', 1)
            first_name = parts[0]
            if len(parts) > 1:
                last_name = parts[1]
                
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password'],
            first_name=first_name,
            last_name=last_name
        )
        
        # Profile is created via signals, but update full_name just in case
        if hasattr(user, 'profile') and full_name:
            user.profile.full_name = full_name
            user.profile.save()
            
        return user
