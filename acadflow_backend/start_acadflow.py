# Script de démarrage - start_acadflow.py
#!/usr/bin/env python
import os
import sys
import django

# Configuration Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'acadflow_backend.settings')
django.setup()

def setup_basic_data():
    from academics.models import AnneeAcademique, Session, Semestre
    from core.models import Cycle, Niveau, Domaine, Filiere
    
    # Créer une année académique de base
    annee, created = AnneeAcademique.objects.get_or_create(
        libelle="2024-2025",
        defaults={
            'date_debut': '2024-09-01',
            'date_fin': '2025-07-31',
            'active': True
        }
    )
    
    # Créer les sessions
    Session.objects.get_or_create(
        code="SN",
        defaults={'nom': "Session Normale", 'ordre': 1}
    )
    Session.objects.get_or_create(
        code="SR",
        defaults={'nom': "Session de Rattrapage", 'ordre': 2}
    )
    
    # Créer les semestres
    Semestre.objects.get_or_create(
        numero=1,
        defaults={'nom': "Semestre 1"}
    )
    Semestre.objects.get_or_create(
        numero=2,
        defaults={'nom': "Semestre 2"}
    )
    
    print("Données de base créées avec succès!")

def run_migrations():
    from django.core.management import execute_from_command_line
    
    print("Exécution des migrations...")
    execute_from_command_line(['manage.py', 'makemigrations'])
    execute_from_command_line(['manage.py', 'migrate'])
    print("Migrations terminées!")

def create_superuser():
    from django.contrib.auth import get_user_model
    
    User = get_user_model()
    
    if not User.objects.filter(username='admin').exists():
        User.objects.create_superuser(
            username='admin',
            email='admin@acadflow.com',
            password='admin123',
            matricule='ADMIN-001',
            type_utilisateur='admin'
        )
        print("Superutilisateur créé: admin/admin123")
    else:
        print("Superutilisateur déjà existant")

if __name__ == '__main__':
    print("=== Configuration AcadFlow ===")
    
    try:
        run_migrations()
        create_superuser()
        setup_basic_data()
        
        print("\\n=== Configuration terminée! ===")
    finally:
        print("\\n=== Erreur Configuration ! ===")
        