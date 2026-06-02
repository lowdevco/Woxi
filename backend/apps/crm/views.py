from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import (
    Tag, Contact, CustomField, ContactCustomValue, ContactNote,
    Conversation, Message, WhatsAppConfig, MessageTemplate,
    Pipeline, PipelineStage, Deal, Broadcast, BroadcastRecipient
)
from .serializers import (
    TagSerializer, ContactSerializer, CustomFieldSerializer,
    ContactCustomValueSerializer, ContactNoteSerializer,
    ConversationSerializer, MessageSerializer, WhatsAppConfigSerializer,
    MessageTemplateSerializer, PipelineSerializer, PipelineStageSerializer,
    DealSerializer, BroadcastSerializer, BroadcastRecipientSerializer
)


class UserOwnedModelViewSet(viewsets.ModelViewSet):
    """
    Base viewset that isolates querysets to only objects owned by the active user.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Assumes the model has a foreign key to auth.User named 'user'
        return self.queryset.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class TagViewSet(UserOwnedModelViewSet):
    queryset = Tag.objects.all()
    serializer_class = TagSerializer


class ContactViewSet(UserOwnedModelViewSet):
    queryset = Contact.objects.all()
    serializer_class = ContactSerializer

    @action(detail=True, methods=['post'])
    def add_note(self, request, pk=None):
        contact = self.get_object()
        serializer = ContactNoteSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(contact=contact, user=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def set_custom_value(self, request, pk=None):
        contact = self.get_object()
        field_id = request.data.get('custom_field')
        value = request.data.get('value')
        
        try:
            field = CustomField.objects.get(id=field_id, user=request.user)
        except CustomField.DoesNotExist:
            return Response({'error': 'Custom field not found'}, status=status.HTTP_404_NOT_FOUND)
            
        custom_val, created = ContactCustomValue.objects.update_or_create(
            contact=contact,
            custom_field=field,
            defaults={'value': value}
        )
        serializer = ContactCustomValueSerializer(custom_val)
        return Response(serializer.data)


class CustomFieldViewSet(UserOwnedModelViewSet):
    queryset = CustomField.objects.all()
    serializer_class = CustomFieldSerializer


class ConversationViewSet(UserOwnedModelViewSet):
    queryset = Conversation.objects.all()
    serializer_class = ConversationSerializer

    @action(detail=True, methods=['post'])
    def add_message(self, request, pk=None):
        conversation = self.get_object()
        serializer = MessageSerializer(data=request.data)
        if serializer.is_valid():
            message = serializer.save(conversation=conversation)
            
            # Update conversation metadata
            conversation.last_message_text = message.content_text
            conversation.last_message_at = message.created_at
            if message.sender_type == 'customer':
                conversation.unread_count += 1
            conversation.save()
            
            # Trigger WebSocket notifications via Channel Layer
            self.notify_realtime(conversation, message)
            
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def notify_realtime(self, conversation, message):
        from asgiref.sync import async_to_sync
        from channels.layers import get_channel_layer
        
        channel_layer = get_channel_layer()
        if channel_layer:
            async_to_sync(channel_layer.group_send)(
                f"user_{conversation.user.id}",
                {
                    "type": "crm_message",
                    "conversation_id": str(conversation.id),
                    "message": MessageSerializer(message).data,
                    "conversation": ConversationSerializer(conversation).data
                }
            )


class MessageViewSet(viewsets.ModelViewSet):
    queryset = Message.objects.all()
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Restrict to messages belonging to the user's conversations
        return self.queryset.filter(conversation__user=self.request.user)

    @action(detail=False, methods=['get'])
    def by_conversation(self, request):
        conversation_id = request.query_params.get('conversation_id')
        if not conversation_id:
            return Response({'error': 'conversation_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        messages = self.get_queryset().filter(conversation_id=conversation_id).order_by('created_at')
        serializer = self.get_serializer(messages, many=True)
        return Response(serializer.data)


class WhatsAppConfigViewSet(viewsets.ModelViewSet):
    queryset = WhatsAppConfig.objects.all()
    serializer_class = WhatsAppConfigSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return self.queryset.filter(user=self.request.user)

    def perform_create(self, serializer):
        # Ensure only one config exists per user
        WhatsAppConfig.objects.filter(user=self.request.user).delete()
        serializer.save(user=self.request.user)


class MessageTemplateViewSet(UserOwnedModelViewSet):
    queryset = MessageTemplate.objects.all()
    serializer_class = MessageTemplateSerializer


class PipelineViewSet(UserOwnedModelViewSet):
    queryset = Pipeline.objects.all()
    serializer_class = PipelineSerializer

    @action(detail=True, methods=['post'])
    def add_stage(self, request, pk=None):
        pipeline = self.get_object()
        serializer = PipelineStageSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(pipeline=pipeline)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class PipelineStageViewSet(viewsets.ModelViewSet):
    queryset = PipelineStage.objects.all()
    serializer_class = PipelineStageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return self.queryset.filter(pipeline__user=self.request.user)


class DealViewSet(UserOwnedModelViewSet):
    queryset = Deal.objects.all()
    serializer_class = DealSerializer


class BroadcastViewSet(UserOwnedModelViewSet):
    queryset = Broadcast.objects.all()
    serializer_class = BroadcastSerializer


from rest_framework.views import APIView
from django.conf import settings
from django.utils import timezone
from .serializers import ConversationSerializer, MessageSerializer

class WhatsAppWebhookView(APIView):
    """
    Public endpoint for Meta's WhatsApp Business API webhook integrations.
    Supports GET (verification challenge) and POST (incoming messaging payloads).
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        mode = request.query_params.get('hub.mode')
        token = request.query_params.get('hub.verify_token')
        challenge = request.query_params.get('hub.challenge')
        
        if mode == 'subscribe' and token == getattr(settings, 'WHATSAPP_VERIFY_TOKEN', ''):
            return Response(int(challenge), status=status.HTTP_200_OK)
        return Response({'error': 'Verification failed'}, status=status.HTTP_403_FORBIDDEN)

    def post(self, request):
        payload = request.data
        
        # Core WhatsApp parsing logic:
        # Check if it's a message event
        entry = payload.get('entry', [])
        if not entry:
            return Response({'status': 'no_entry'}, status=status.HTTP_200_OK)
            
        changes = entry[0].get('changes', [])
        if not changes:
            return Response({'status': 'no_changes'}, status=status.HTTP_200_OK)
            
        value = changes[0].get('value', {})
        metadata = value.get('metadata', {})
        phone_number_id = metadata.get('phone_number_id')
        
        # Locate corresponding CRM User by WhatsApp config mapping
        try:
            config = WhatsAppConfig.objects.get(phone_number_id=phone_number_id)
            user = config.user
        except WhatsAppConfig.DoesNotExist:
            return Response({'error': 'Config not found for phone_number_id'}, status=status.HTTP_200_OK)
            
        contacts = value.get('contacts', [])
        messages = value.get('messages', [])
        
        if not messages:
            return Response({'status': 'no_new_messages'}, status=status.HTTP_200_OK)
            
        msg_data = messages[0]
        from_phone = msg_data.get('from')
        sender_name = contacts[0].get('profile', {}).get('name', 'WhatsApp Customer') if contacts else 'WhatsApp Customer'
        
        # 1. Fetch or create Contact
        contact, _ = Contact.objects.get_or_create(
            user=user,
            phone=from_phone,
            defaults={'name': sender_name}
        )
        
        # 2. Fetch or create active Conversation
        conversation, _ = Conversation.objects.get_or_create(
            user=user,
            contact=contact,
            defaults={'status': 'open'}
        )
        
        # 3. Create inbound Message
        msg_type = msg_data.get('type', 'text')
        content_text = ""
        if msg_type == 'text':
            content_text = msg_data.get('text', {}).get('body', '')
        else:
            content_text = f"[{msg_type.upper()} Media]"
            
        message = Message.objects.create(
            conversation=conversation,
            sender_type='customer',
            content_type=msg_type if msg_type in ['text', 'image', 'document', 'audio', 'video', 'location', 'template'] else 'text',
            content_text=content_text,
            message_id=msg_data.get('id'),
            status='delivered'
        )
        
        # 4. Update conversation status metadata
        conversation.last_message_text = content_text
        conversation.last_message_at = timezone.now()
        conversation.unread_count += 1
        conversation.save()
        
        # 5. Broadcast in real-time over WebSocket Channels Group
        from asgiref.sync import async_to_sync
        from channels.layers import get_channel_layer
        channel_layer = get_channel_layer()
        if channel_layer:
            async_to_sync(channel_layer.group_send)(
                f"user_{user.id}",
                {
                    "type": "crm_message",
                    "conversation_id": str(conversation.id),
                    "message": MessageSerializer(message).data,
                    "conversation": ConversationSerializer(conversation).data
                }
            )
            
        return Response({'status': 'success'}, status=status.HTTP_200_OK)

