# ========================================
# SCRIPT: fix_users_migration.py
# ========================================
#!/usr/bin/env python
"""
Script pour résoudre le problème de table 'users' manquante
"""

import os
import sys
import django
from pathlib import Path
import shutil

# Configuration Django
BASE_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BASE_DIR))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'acadflow_backend.settings')

def reset_migrations():
    """Supprime toutes les migrations existantes"""
    print("🗑️ Suppression des migrations existantes...")
    
    apps = ['users', 'core', 'academics', 'evaluations']
    
    for app in apps:
        migrations_dir = BASE_DIR / app / 'migrations'
        if migrations_dir.exists():
            # Supprimer tous les fichiers sauf __init__.py
            for file in migrations_dir.glob('*.py'):
                if file.name != '__init__.py':
                    file.unlink()
                    print(f"   Supprimé: {app}/migrations/{file.name}")
            
            # Supprimer __pycache__
            pycache_dir = migrations_dir / '__pycache__'
            if pycache_dir.exists():
                shutil.rmtree(pycache_dir)
                print(f"   Supprimé: {app}/migrations/__pycache__")

def delete_database():
    """Supprime la base de données SQLite"""
    db_path = BASE_DIR / 'db.sqlite3'
    if db_path.exists():
        db_path.unlink()
        print("🗑️ Base de données SQLite supprimée")

def create_fresh_env():
    """Crée un fichier .env propre pour SQLite"""
    env_content = """# AcadFlow - Configuration SQLite
SECRET_KEY=acadflow-dev-secret-key-123456789
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Base de données SQLite (par défaut - ne pas modifier)
# DB_NAME=
# DB_USER=
# DB_PASSWORD=
# DB_HOST=
# DB_PORT=

# Email
EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend
"""
    
    env_path = BASE_DIR / '.env'
    with open(env_path, 'w', encoding='utf-8') as f:
        f.write(env_content)
    
    print("✅ Fichier .env créé pour SQLite")

def fix_settings():
    """Corrige le fichier settings.py pour forcer SQLite"""
    settings_path = BASE_DIR / 'acadflow_backend' / 'settings.py'
    
    if not settings_path.exists():
        print("❌ Fichier settings.py non trouvé")
        return False
    
    # Configuration SQLite forcée
    sqlite_config = '''
# Configuration forcée SQLite pour éviter les problèmes PostgreSQL
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

# Remplacer la configuration PostgreSQL problématique
if False:  # Désactivé temporairement
    DB_NAME = config('DB_NAME', default=None)
    if DB_NAME:
        DATABASES = {
            'default': {
                'ENGINE': 'django.db.backends.postgresql',
                'NAME': DB_NAME,
                'USER': config('DB_USER', default='postgres'),
                'PASSWORD': config('DB_PASSWORD', default=''),
                'HOST': config('DB_HOST', default='localhost'),
                'PORT': config('DB_PORT', default='5432'),
                'OPTIONS': {
                    'client_encoding': 'UTF8',
                },
            }
        }
'''
    
    # Lire le fichier actuel
    with open(settings_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Rechercher et remplacer la section DATABASES
    import re
    
    # Pattern pour trouver la configuration DATABASES
    db_pattern = r'DATABASES\s*=\s*{[^}]*}(?:\s*\n\s*DB_NAME[^}]*})?'
    
    if re.search(db_pattern, content, re.DOTALL):
        content = re.sub(db_pattern, sqlite_config, content, flags=re.DOTALL)
        print("✅ Configuration DATABASES remplacée par SQLite")
    else:
        # Ajouter la configuration à la fin
        content += '\n' + sqlite_config
        print("✅ Configuration SQLite ajoutée")
    
    # Sauvegarder
    with open(settings_path, 'w', encoding='utf-8') as f:
        f.write(content)
    
    return True

def run_fresh_migrations():
    """Crée et applique de nouvelles migrations"""
    try:
        django.setup()
        from django.core.management import call_command
        
        print("📝 Création des nouvelles migrations...")
        
        # Créer les migrations dans l'ordre correct
        call_command('makemigrations', 'users', verbosity=2)
        call_command('makemigrations', 'core', verbosity=2) 
        call_command('makemigrations', 'academics', verbosity=2)
        call_command('makemigrations', 'evaluations', verbosity=2)
        
        print("📝 Application des migrations...")
        call_command('migrate', verbosity=2)
        
        print("✅ Migrations créées et appliquées avec succès")
        return True
        
    except Exception as e:
        print(f"❌ Erreur lors des migrations: {e}")
        return False

def create_superuser():
    """Crée un superuser par défaut"""
    try:
        from django.contrib.auth import get_user_model
        
        User = get_user_model()
        
        if not User.objects.filter(username='admin').exists():
            User.objects.create_superuser(
                username='admin',
                email='admin@acadflow.com',
                password='admin123',
                matricule='ADMIN001',
                type_utilisateur='admin',
                first_name='Super',
                last_name='Admin'
            )
            print("✅ Superuser créé: admin/admin123")
        else:
            print("ℹ️ Superuser déjà existant")
        
        return True
    except Exception as e:
        print(f"❌ Erreur création superuser: {e}")
        return False

def test_database():
    """Teste que la base de données fonctionne"""
    try:
        from django.db import connection
        
        with connection.cursor() as cursor:
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
            tables = [row[0] for row in cursor.fetchall()]
            
            if 'users' in tables:
                print("✅ Table 'users' créée avec succès")
            else:
                print("❌ Table 'users' toujours manquante")
                return False
            
            # Vérifier d'autres tables importantes
            expected_tables = ['users', 'domaines', 'cycles', 'classes', 'ues']
            found_tables = [t for t in expected_tables if t in tables]
            print(f"✅ Tables trouvées: {found_tables}")
            
        return True
    except Exception as e:
        print(f"❌ Erreur test base de données: {e}")
        return False

def main():
    """Fonction principale de réparation"""
    print("🚨 AcadFlow - Réparation Table Users Manquante")
    print("=" * 60)
    
    try:
        # 1. Nettoyer l'environnement
        print("\n1️⃣ Nettoyage de l'environnement...")
        reset_migrations()
        delete_database()
        create_fresh_env()
        
        # 2. Corriger settings.py
        print("\n2️⃣ Correction de settings.py...")
        if not fix_settings():
            return False
        
        # 3. Créer nouvelles migrations
        print("\n3️⃣ Création des migrations...")
        if not run_fresh_migrations():
            return False
        
        # 4. Créer superuser
        print("\n4️⃣ Création du superuser...")
        create_superuser()
        
        # 5. Tester la base de données
        print("\n5️⃣ Test de la base de données...")
        if test_database():
            print("\n🎉 RÉPARATION TERMINÉE AVEC SUCCÈS!")
            print("\n📋 Prochaines étapes:")
            print("   python manage.py runserver")
            print("   Accédez à: http://localhost:8000/admin/")
            print("   Login: admin / admin123")
            return True
        else:
            print("\n❌ La réparation a échoué")
            return False
            
    except Exception as e:
        print(f"\n💥 Erreur critique: {e}")
        return False

if __name__ == '__main__':
    success = main()
    if not success:
        print("\n🆘 SOLUTIONS ALTERNATIVES:")
        print("   1. Supprimer le dossier acadflow_backend/")
        print("   2. Relancer: django-admin startproject acadflow_backend")
        print("   3. Recréer les apps: python manage.py startapp users")
    
    sys.exit(0 if success else 1)