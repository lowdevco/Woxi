from rest_framework import serializers
from .models import (
    Tag, Contact, CustomField, ContactCustomValue, ContactNote,
    Conversation, Message, WhatsAppConfig, MessageTemplate,
    Pipeline, PipelineStage, Deal, Broadcast, BroadcastRecipient
)


class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ['id', 'name', 'color', 'created_at']
        read_only_fields = ['id', 'created_at']


class ContactNoteSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    
    class Meta:
        model = ContactNote
        fields = ['id', 'note_text', 'username', 'created_at']
        read_only_fields = ['id', 'username', 'created_at']


class CustomFieldSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomField
        fields = ['id', 'field_name', 'field_type', 'field_options', 'created_at']
        read_only_fields = ['id', 'created_at']


class ContactCustomValueSerializer(serializers.ModelSerializer):
    field_name = serializers.CharField(source='custom_field.field_name', read_only=True)
    field_type = serializers.CharField(source='custom_field.field_type', read_only=True)
    
    class Meta:
        model = ContactCustomValue
        fields = ['id', 'custom_field', 'field_name', 'field_type', 'value', 'created_at']
        read_only_fields = ['id', 'field_name', 'field_type', 'created_at']


class ContactSerializer(serializers.ModelSerializer):
    tags_detail = TagSerializer(source='tags', many=True, read_only=True)
    tags = serializers.PrimaryKeyRelatedField(queryset=Tag.objects.all(), many=True, write_only=True, required=False)
    custom_values = ContactCustomValueSerializer(many=True, read_only=True)
    notes = ContactNoteSerializer(many=True, read_only=True)

    class Meta:
        model = Contact
        fields = ['id', 'phone', 'name', 'email', 'company', 'avatar_url', 'tags_detail', 'tags', 'custom_values', 'notes', 'created_at', 'updated_at']
        read_only_fields = ['id', 'tags_detail', 'custom_values', 'notes', 'created_at', 'updated_at']

    def create(self, validated_data):
        tags = validated_data.pop('tags', [])
        contact = Contact.objects.create(**validated_data)
        if tags:
            contact.tags.set(tags)
        return contact

    def update(self, instance, validated_data):
        tags = validated_data.pop('tags', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if tags is not None:
            instance.tags.set(tags)
        return instance


class MessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.CharField(source='sender.username', read_only=True)
    
    class Meta:
        model = Message
        fields = [
            'id', 'conversation', 'sender_type', 'sender', 'sender_name',
            'content_type', 'content_text', 'media_url', 'template_name',
            'message_id', 'status', 'created_at'
        ]
        read_only_fields = ['id', 'sender_name', 'created_at']


class ConversationSerializer(serializers.ModelSerializer):
    contact_detail = ContactSerializer(source='contact', read_only=True)
    assigned_agent_name = serializers.CharField(source='assigned_agent.username', read_only=True)
    
    class Meta:
        model = Conversation
        fields = [
            'id', 'contact', 'contact_detail', 'status', 'assigned_agent',
            'assigned_agent_name', 'last_message_text', 'last_message_at',
            'unread_count', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'contact_detail', 'assigned_agent_name', 'last_message_text', 'last_message_at', 'unread_count', 'created_at', 'updated_at']


class WhatsAppConfigSerializer(serializers.ModelSerializer):
    class Meta:
        model = WhatsAppConfig
        fields = ['id', 'phone_number_id', 'waba_id', 'access_token', 'verify_token', 'status', 'connected_at']
        read_only_fields = ['id', 'status', 'connected_at']


class MessageTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = MessageTemplate
        fields = [
            'id', 'name', 'category', 'language', 'header_type',
            'header_content', 'body_text', 'footer_text', 'buttons',
            'status', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class PipelineStageSerializer(serializers.ModelSerializer):
    class Meta:
        model = PipelineStage
        fields = ['id', 'pipeline', 'name', 'position', 'color', 'created_at']
        read_only_fields = ['id', 'created_at']


class DealSerializer(serializers.ModelSerializer):
    contact_detail = ContactSerializer(source='contact', read_only=True)
    stage_name = serializers.CharField(source='stage.name', read_only=True)
    
    class Meta:
        model = Deal
        fields = [
            'id', 'pipeline', 'stage', 'stage_name', 'contact', 'contact_detail',
            'conversation', 'title', 'value', 'currency', 'notes',
            'expected_close_date', 'status', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'contact_detail', 'stage_name', 'created_at', 'updated_at']


class PipelineSerializer(serializers.ModelSerializer):
    stages = PipelineStageSerializer(many=True, read_only=True)
    deals = DealSerializer(many=True, read_only=True)
    
    class Meta:
        model = Pipeline
        fields = ['id', 'name', 'stages', 'deals', 'created_at']
        read_only_fields = ['id', 'stages', 'deals', 'created_at']


class BroadcastRecipientSerializer(serializers.ModelSerializer):
    contact_name = serializers.CharField(source='contact.name', read_only=True)
    contact_phone = serializers.CharField(source='contact.phone', read_only=True)
    
    class Meta:
        model = BroadcastRecipient
        fields = [
            'id', 'contact', 'contact_name', 'contact_phone', 'status',
            'sent_at', 'delivered_at', 'read_at', 'replied_at',
            'error_message', 'created_at'
        ]
        read_only_fields = ['id', 'contact_name', 'contact_phone', 'created_at']


class BroadcastSerializer(serializers.ModelSerializer):
    recipients = BroadcastRecipientSerializer(many=True, read_only=True)
    
    class Meta:
        model = Broadcast
        fields = [
            'id', 'name', 'template_name', 'template_language', 'template_variables',
            'audience_filter', 'scheduled_at', 'status', 'total_recipients',
            'sent_count', 'delivered_count', 'read_count', 'replied_count',
            'failed_count', 'recipients', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'status', 'total_recipients', 'sent_count', 'delivered_count',
            'read_count', 'replied_count', 'failed_count', 'recipients',
            'created_at', 'updated_at'
        ]
