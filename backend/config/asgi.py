import os
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
from django.urls import path

# Initialize Django ASGI application early to ensure the AppRegistry
# is populated before importing consumer and routing modules.
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django_asgi_app = get_asgi_application()

# Import consumers after django_asgi_app initialization
from apps.crm.consumers import RealtimeCRMConsumer

# Simple query token auth middleware for WebSockets
from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser
from rest_framework_simplejwt.tokens import AccessToken
from django.contrib.auth import get_user_model

User = get_user_model()

@database_sync_to_async
def get_user_from_token(token_string):
    try:
        access_token = AccessToken(token_string)
        user_id = access_token['user_id']
        return User.objects.get(id=user_id)
    except Exception:
        return AnonymousUser()

class JWTAuthMiddleware:
    """
    Custom middleware that authenticates WebSocket connections
    using a JWT token passed in the query string: ws://localhost:8000/ws/realtime/?token=<JWT_TOKEN>
    """
    def __init__(self, inner):
        self.inner = inner

    async def __call__(self, scope, receive, send):
        query_string = scope.get("query_string", b"").decode("utf-8")
        query_params = dict(qp.split("=") for qp in query_string.split("&") if "=" in qp)
        token = query_params.get("token", None)
        
        if token:
            scope["user"] = await get_user_from_token(token)
        else:
            scope["user"] = AnonymousUser()
            
        return await self.inner(scope, receive, send)

websocket_urlpatterns = [
    path('ws/realtime/', RealtimeCRMConsumer.as_asgi()),
]

application = ProtocolTypeRouter({
    "http": django_asgi_app,
    "websocket": JWTAuthMiddleware(
        URLRouter(
            websocket_urlpatterns
        )
    ),
})
