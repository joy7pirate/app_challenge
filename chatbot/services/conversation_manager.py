from collections import defaultdict, deque


class ConversationManager:

    def __init__(self, max_messages=10):

        self.max_messages = max_messages

        self.sessions = defaultdict(
            lambda: deque(maxlen=max_messages)
        )

    def add_message(
        self,
        user_id,
        role,
        content
    ):

        self.sessions[user_id].append(
            {
                "role": role,
                "content": content
            }
        )

    def get_history(
        self,
        user_id
    ):

        return list(
            self.sessions[user_id]
        )

    def clear(
        self,
        user_id
    ):

        self.sessions[user_id].clear()


conversation_manager = ConversationManager()