import uuid
from django.db import models
from django.contrib.auth.models import User


class Tag(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='tags')
    name = models.CharField(max_length=100)
    color = models.CharField(max_length=7, default='#3b82f6')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class Contact(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='contacts')
    phone = models.CharField(max_length=50)
    name = models.CharField(max_length=255, blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    company = models.CharField(max_length=255, blank=True, null=True)
    avatar_url = models.URLField(max_length=1024, blank=True, null=True)
    tags = models.ManyToManyField(Tag, through='ContactTag', related_name='contacts')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name or self.phone


class ContactTag(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    contact = models.ForeignKey(Contact, on_delete=models.CASCADE)
    tag = models.ForeignKey(Tag, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('contact', 'tag')


class CustomField(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='custom_fields')
    field_name = models.CharField(max_length=100)
    field_type = models.CharField(max_length=50, default='text')  # text, number, date, select
    field_options = models.JSONField(blank=True, null=True)  # JSON field for choice arrays
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.field_name


class ContactCustomValue(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    contact = models.ForeignKey(Contact, on_delete=models.CASCADE, related_name='custom_values')
    custom_field = models.ForeignKey(CustomField, on_delete=models.CASCADE)
    value = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('contact', 'custom_field')


class ContactNote(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    contact = models.ForeignKey(Contact, on_delete=models.CASCADE, related_name='notes')
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    note_text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Note on {self.contact} by {self.user.username}"


class Conversation(models.Model):
    STATUS_CHOICES = [
        ('open', 'Open'),
        ('pending', 'Pending'),
        ('closed', 'Closed'),
    ]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='conversations')
    contact = models.ForeignKey(Contact, on_delete=models.CASCADE, related_name='conversations')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='open')
    assigned_agent = models.ForeignKey(User, on_delete=models.SET_NULL, blank=True, null=True, related_name='assigned_conversations')
    last_message_text = models.TextField(blank=True, null=True)
    last_message_at = models.DateTimeField(blank=True, null=True)
    unread_count = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Conversation with {self.contact}"


class Message(models.Model):
    SENDER_CHOICES = [
        ('customer', 'Customer'),
        ('agent', 'Agent'),
        ('bot', 'Bot'),
    ]
    CONTENT_CHOICES = [
        ('text', 'Text'),
        ('image', 'Image'),
        ('document', 'Document'),
        ('audio', 'Audio'),
        ('video', 'Video'),
        ('location', 'Location'),
        ('template', 'Template'),
    ]
    STATUS_CHOICES = [
        ('sending', 'Sending'),
        ('sent', 'Sent'),
        ('delivered', 'Delivered'),
        ('read', 'Read'),
        ('failed', 'Failed'),
    ]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name='messages')
    sender_type = models.CharField(max_length=20, choices=SENDER_CHOICES)
    sender = models.ForeignKey(User, on_delete=models.SET_NULL, blank=True, null=True)
    content_type = models.CharField(max_length=20, choices=CONTENT_CHOICES, default='text')
    content_text = models.TextField(blank=True, null=True)
    media_url = models.URLField(max_length=1024, blank=True, null=True)
    template_name = models.CharField(max_length=255, blank=True, null=True)
    message_id = models.CharField(max_length=255, blank=True, null=True)  # WhatsApp Meta Message ID
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='sent')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Message {self.id} - {self.sender_type}"


class WhatsAppConfig(models.Model):
    STATUS_CHOICES = [
        ('connected', 'Connected'),
        ('disconnected', 'Disconnected'),
    ]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='whatsapp_config')
    phone_number_id = models.CharField(max_length=255)
    waba_id = models.CharField(max_length=255, blank=True, null=True)
    access_token = models.TextField()
    verify_token = models.CharField(max_length=255, blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='disconnected')
    connected_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"WA Config for {self.user.username}"


class MessageTemplate(models.Model):
    CATEGORY_CHOICES = [
        ('Marketing', 'Marketing'),
        ('Utility', 'Utility'),
        ('Authentication', 'Authentication'),
    ]
    HEADER_CHOICES = [
        ('text', 'Text'),
        ('image', 'Image'),
        ('video', 'Video'),
        ('document', 'Document'),
    ]
    STATUS_CHOICES = [
        ('Draft', 'Draft'),
        ('Pending', 'Pending'),
        ('Approved', 'Approved'),
        ('Rejected', 'Rejected'),
    ]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='message_templates')
    name = models.CharField(max_length=255)
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES, default='Marketing')
    language = models.CharField(max_length=10, default='en_US')
    header_type = models.CharField(max_length=20, choices=HEADER_CHOICES, blank=True, null=True)
    header_content = models.TextField(blank=True, null=True)
    body_text = models.TextField()
    footer_text = models.CharField(max_length=255, blank=True, null=True)
    buttons = models.JSONField(blank=True, null=True)  # Array of button definitions
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Draft')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name


class Pipeline(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='pipelines')
    name = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class PipelineStage(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    pipeline = models.ForeignKey(Pipeline, on_delete=models.CASCADE, related_name='stages')
    name = models.CharField(max_length=255)
    position = models.IntegerField(default=0)
    color = models.CharField(max_length=7, default='#3b82f6')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.pipeline.name} - {self.name}"


class Deal(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='deals')
    pipeline = models.ForeignKey(Pipeline, on_delete=models.CASCADE, related_name='deals')
    stage = models.ForeignKey(PipelineStage, on_delete=models.CASCADE, related_name='deals')
    contact = models.ForeignKey(Contact, on_delete=models.CASCADE, related_name='deals')
    conversation = models.ForeignKey(Conversation, on_delete=models.SET_NULL, blank=True, null=True, related_name='deals')
    title = models.CharField(max_length=255)
    value = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    currency = models.CharField(max_length=10, default='USD')
    notes = models.TextField(blank=True, null=True)
    expected_close_date = models.DateField(blank=True, null=True)
    status = models.CharField(max_length=50, default='active')  # active, won, lost
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title


class Broadcast(models.Model):
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('scheduled', 'Scheduled'),
        ('sending', 'Sending'),
        ('sent', 'Sent'),
        ('failed', 'Failed'),
    ]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='broadcasts')
    name = models.CharField(max_length=255)
    template_name = models.CharField(max_length=255)
    template_language = models.CharField(max_length=10, default='en_US')
    template_variables = models.JSONField(blank=True, null=True)
    audience_filter = models.JSONField(blank=True, null=True)
    scheduled_at = models.DateTimeField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    total_recipients = models.IntegerField(default=0)
    sent_count = models.IntegerField(default=0)
    delivered_count = models.IntegerField(default=0)
    read_count = models.IntegerField(default=0)
    replied_count = models.IntegerField(default=0)
    failed_count = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name


class BroadcastRecipient(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('sent', 'Sent'),
        ('delivered', 'Delivered'),
        ('read', 'Read'),
        ('replied', 'Replied'),
        ('failed', 'Failed'),
    ]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    broadcast = models.ForeignKey(Broadcast, on_delete=models.CASCADE, related_name='recipients')
    contact = models.ForeignKey(Contact, on_delete=models.CASCADE)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    sent_at = models.DateTimeField(blank=True, null=True)
    delivered_at = models.DateTimeField(blank=True, null=True)
    read_at = models.DateTimeField(blank=True, null=True)
    replied_at = models.DateTimeField(blank=True, null=True)
    error_message = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Recipient {self.contact.phone} for Broadcast {self.broadcast.name}"
