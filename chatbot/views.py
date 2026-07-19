from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from chatbot.services.rag import ask_rag


@api_view(["POST"])
@permission_classes([AllowAny])
def chat(request):

    question = request.data.get("message")

    if not question:
        return Response(
            {"error": "Aucun message fourni"},
            status=400
        )

    response = ask_rag(question)

    return Response({
        "response": response
    })