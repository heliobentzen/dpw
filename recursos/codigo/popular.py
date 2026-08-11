"""
Comando de gestão que popula o banco com dados de volume — apoio do M05.

Instale em: acervo/management/commands/popular.py
(crie também os arquivos __init__.py em management/ e management/commands/)

Uso:
    python manage.py popular --obras 300 --associados 100
    python manage.py popular --limpar          # apaga antes de popular

Sem volume de dados, problemas de desempenho (N+1, falta de índice, paginação
ausente) ficam invisíveis. Este comando existe para torná-los visíveis.
"""

import random
from datetime import timedelta

from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from acervo.models import (
    Associado,
    Autor,
    Categoria,
    Editora,
    Emprestimo,
    Exemplar,
    Obra,
)

NOMES = ["Ana", "Bruno", "Carla", "Diego", "Elisa", "Fábio", "Gabi", "Hugo",
         "Iara", "João", "Kelly", "Lucas", "Marina", "Nélson", "Olívia", "Paulo"]
SOBRENOMES = ["Silva", "Souza", "Costa", "Lima", "Alves", "Rocha", "Dias",
              "Melo", "Ferreira", "Barbosa", "Pinto", "Cardoso"]
PALAVRAS_TITULO = ["Memórias", "O Cortiço", "Sertão", "Cidade", "Vento", "Rio",
                   "Casa", "Noite", "Caminho", "Ausência", "Retrato", "Fronteira"]
CIDADES = ["São Paulo", "Rio de Janeiro", "Belo Horizonte", "Porto Alegre", "Recife"]
CATEGORIAS = ["Romance", "Conto", "Poesia", "Infantil", "Técnico", "História",
              "Biografia", "Ciências"]


class Command(BaseCommand):
    help = "Popula o banco com dados de exemplo para os exercícios de ORM."

    def add_arguments(self, parser):
        parser.add_argument("--obras", type=int, default=200,
                           help="Quantidade de obras a criar (padrão: 200)")
        parser.add_argument("--associados", type=int, default=80,
                           help="Quantidade de associados a criar (padrão: 80)")
        parser.add_argument("--limpar", action="store_true",
                           help="Apaga os dados existentes antes de popular")

    @transaction.atomic
    def handle(self, *args, **opts):
        if opts["limpar"]:
            self.stdout.write("Limpando dados existentes...")
            Emprestimo.objects.all().delete()
            Exemplar.objects.all().delete()
            Obra.objects.all().delete()
            Associado.objects.all().delete()
            Autor.objects.all().delete()
            Editora.objects.all().delete()
            Categoria.objects.all().delete()

        random.seed(42)  # reprodutível: todos na turma geram os mesmos dados

        autores = [
            Autor.objects.create(nome=f"{n} {s}")
            for n in NOMES for s in SOBRENOMES[:3]
        ]
        editoras = [
            Editora.objects.create(nome=f"Editora {i}", cidade=random.choice(CIDADES))
            for i in range(1, 7)
        ]
        categorias = [
            Categoria.objects.create(nome=c, slug=c.lower().replace(" ", "-"))
            for c in CATEGORIAS
        ]

        obras = []
        for i in range(opts["obras"]):
            obra = Obra.objects.create(
                titulo=f"{random.choice(PALAVRAS_TITULO)} {i}",
                autor=random.choice(autores),
                editora=random.choice(editoras),
                ano_publicacao=random.randint(1880, 2025),
                isbn=str(random.randint(10**12, 10**13 - 1)) if random.random() < 0.7 else "",
            )
            obra.categorias.set(random.sample(categorias, k=random.randint(1, 3)))
            obras.append(obra)

        exemplares = []
        for obra in obras:
            for j in range(random.randint(1, 4)):
                exemplares.append(
                    Exemplar.objects.create(obra=obra, tombo=f"{obra.pk:05d}-{j}")
                )

        associados = [
            Associado.objects.create(
                nome=f"{random.choice(NOMES)} {random.choice(SOBRENOMES)}",
                email=f"associado{i}@exemplo.org",
                ativo=random.random() < 0.92,
            )
            for i in range(opts["associados"])
        ]

        hoje = timezone.localdate()
        emprestimos = 0
        # um terço do acervo passou por empréstimo; 70% já foi devolvido
        for exemplar in random.sample(exemplares, k=len(exemplares) // 3):
            inicio = hoje - timedelta(days=random.randint(0, 180))
            emprestimo = Emprestimo.objects.create(
                exemplar=exemplar,
                associado=random.choice(associados),
                emprestado_em=inicio,
                previsao_devolucao=inicio + timedelta(days=14),
            )
            if random.random() < 0.7:
                emprestimo.devolvido_em = inicio + timedelta(days=random.randint(1, 40))
                emprestimo.save(update_fields=["devolvido_em"])
            emprestimos += 1

        self.stdout.write(self.style.SUCCESS(
            f"Criados: {len(autores)} autores, {len(editoras)} editoras, "
            f"{len(categorias)} categorias, {len(obras)} obras, "
            f"{len(exemplares)} exemplares, {len(associados)} associados, "
            f"{emprestimos} empréstimos."
        ))
        self.stdout.write(
            "Dica: rode as consultas do M05 e meça o número de queries com "
            "CaptureQueriesContext ou com o Django Debug Toolbar."
        )
