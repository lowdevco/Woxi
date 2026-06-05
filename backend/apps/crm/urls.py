from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    TagViewSet, ContactViewSet, CustomFieldViewSet, ConversationViewSet,
    MessageViewSet, WhatsAppConfigViewSet, MessageTemplateViewSet,
    PipelineViewSet, PipelineStageViewSet, DealViewSet, BroadcastViewSet,
    WhatsAppWebhookView
)

router = DefaultRouter()
router.register(r'tags', TagViewSet, basename='tag')
router.register(r'contacts', ContactViewSet, basename='contact')
router.register(r'custom-fields', CustomFieldViewSet, basename='custom-field')
router.register(r'conversations', ConversationViewSet, basename='conversation')
router.register(r'messages', MessageViewSet, basename='message')
router.register(r'configs', WhatsAppConfigViewSet, basename='config')
router.register(r'templates', MessageTemplateViewSet, basename='template')
router.register(r'pipelines', PipelineViewSet, basename='pipeline')
router.register(r'stages', PipelineStageViewSet, basename='stage')
router.register(r'deals', DealViewSet, basename='deal')
router.register(r'broadcasts', BroadcastViewSet, basename='broadcast')

urlpatterns = [
    # WhatsApp webhook endpoint
    path('whatsapp/webhook/', WhatsAppWebhookView.as_view(),
         name='whatsapp_webhook'),

    # CRM API views
    path('', include(router.urls)),
]
