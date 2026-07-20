from chatbot.models import Conversation, Message


class DatabaseMemory:

    def get_or_create_conversation(self, user):

        conversation = Conversation.objects.filter(
            user=user
        ).order_by("-updated_at").first()

        if conversation is None:

            conversation = Conversation.objects.create(
                user=user,
                title="Nouvelle conversation"
            )

        return conversation

    def add_message(
        self,
        conversation,
        role,
        content
    ):

        Message.objects.create(
            conversation=conversation,
            role=role,
            content=content
        )

    def get_history(
        self,
        conversation,
        limit=10
    ):

        messages = conversation.messages.all()[:limit]

        history = []

        for message in messages:

            history.append(
                {
                    "role": message.role,
                    "content": message.content
                }
            )

        return history