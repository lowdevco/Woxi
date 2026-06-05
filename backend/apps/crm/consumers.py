import json
from channels.generic.websocket import AsyncJsonWebsocketConsumer


class RealtimeCRMConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        self.user = self.scope.get("user")

        # Enforce authentication on WebSocket connections
        if not self.user or self.user.is_anonymous:
            await self.close(code=4003)  # Forbidden code
            return

        self.group_name = f"user_{self.user.id}"

        # Join user-specific notification group
        await self.channel_layer.group_add(
            self.group_name,
            self.channel_name
        )
        await self.accept()

    async def disconnect(self, close_code):
        if hasattr(self, 'group_name'):
            await self.channel_layer.group_discard(
                self.group_name,
                self.channel_name
            )

    async def receive_json(self, content, **kwargs):
        # We can handle custom actions from frontend client if needed (e.g. typing indicators)
        pass

    async def crm_message(self, event):
        """
        Handler triggered when views broadcast a message update.
        """
        await self.send_json({
            "type": "message",
            "conversation_id": event["conversation_id"],
            "message": event["message"],
            "conversation": event["conversation"]
        })
