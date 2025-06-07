# ========================================
# SCRIPT DE RÉPARATION RAPIDE: fix_acadflow.py
# ========================================

#!/usr/bin/env python
"""
Script de réparation rapide pour AcadFlow
Exécutez avec: python fix_acadflow.py
"""

import os
import sys
import django
from pathlib import Path

# Configuration Django
BASE_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BASE_DIR))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'acadflow_backend.settings')

try:
    django.setup()
    print("✅ Django configuré avec succès")
except Exception as e:
    print(f"❌ Erreur configuration Django: {e}")
    sys.exit(1)

def main():
    """Fonction principale de réparation"""
    print("🔧 AcadFlow - Script de réparation automatique")
    print("=" * 50)
    
    try:
        from django.core.management import call_command
        from django.db import connection
        
        # 1. Vérifier la connexion à la base de données
        print("1. 🔍 Vérification de la connexion à la base de données...")
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            print("   ✅ Connexion à la base de données OK")
        
        # 2. Réparer les problèmes de contrainte
        print("\n2. 🔧 Réparation des contraintes de clé étrangère...")
        call_command('fix_database', '--fix-admin-log')
        
        # 3. Nettoyer les enregistrements orphelins
        print("\n3. 🧹 Nettoyage des enregistrements orphelins...")
        call_command('fix_database', '--clean-orphans')
        
        # 4. Vérifier l'intégrité
        print("\n4. ✅ Vérification de l'intégrité...")
        call_command('check_integrity')
        
        # 5. Créer un superuser si nécessaire
        print("\n5. 👤 Vérification du superuser...")
        from django.contrib.auth import get_user_model
        User = get_user_model()
        
        if not User.objects.filter(is_superuser=True).exists():
            print("   Création du superuser...")
            try:
                User.objects.create_superuser(
                    username='admin',
                    email='admin@acadflow.com',
                    password='admin123',
                    matricule='ADMIN-001',
                    type_utilisateur='admin',
                    first_name='Super',
                    last_name='Admin'
                )
                print("   ✅ Superuser créé: admin/admin123")
            except Exception as e:
                print(f"   ⚠️ Erreur création superuser: {e}")
        else:
            print("   ✅ Superuser déjà présent")
        
        print("\n" + "=" * 50)
        print("🎉 Réparation terminée avec succès!")
        print("\n📱 Vous pouvez maintenant:")
        print("   - Démarrer le serveur: python manage.py runserver")
        print("   - Accéder à l'admin: http://localhost:8000/admin/")
        print("   - Login: admin / admin123")
        
    except Exception as e:
        print(f"\n❌ Erreur lors de la réparation: {e}")
        print("\n🔧 Actions manuelles recommandées:")
        print("   1. python manage.py reset_and_init --confirm")
        print("   2. python manage.py runserver")
        sys.exit(1)

if __name__ == '__main__':
    main()