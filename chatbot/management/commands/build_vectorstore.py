from django.core.management.base import BaseCommand

from chatbot.services.vectorstore import VectorStore


class Command(BaseCommand):

    help = "Construit ou reconstruit le VectorStore FAISS."

    def handle(self, *args, **kwargs):

        self.stdout.write(
            self.style.WARNING(
                "\nConstruction du VectorStore..."
            )
        )

        store = VectorStore()

        store.build()

        self.stdout.write(
            self.style.SUCCESS(
                "\nVectorStore créé avec succès."
            )
        )