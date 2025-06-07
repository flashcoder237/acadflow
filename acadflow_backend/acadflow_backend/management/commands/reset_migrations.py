# ========================================
# FICHIER: acadflow_backend/management/commands/reset_migrations.py
# ========================================

import os
import shutil
from django.core.management.base import BaseCommand
from django.conf import settings

class Command(BaseCommand):
    help = 'Supprime tous les fichiers de migration (sauf __init__.py)'
    
    def handle(self, *args, **options):
        self.stdout.write('🗑️ Suppression des fichiers de migration...')
        
        apps_to_reset = ['core', 'academics', 'users', 'evaluations']
        
        for app_name in apps_to_reset:
            migrations_dir = os.path.join(settings.BASE_DIR, app_name, 'migrations')
            
            if os.path.exists(migrations_dir):
                # Supprimer tous les fichiers sauf __init__.py
                for filename in os.listdir(migrations_dir):
                    if filename.endswith('.py') and filename != '__init__.py':
                        file_path = os.path.join(migrations_dir, filename)
                        os.remove(file_path)
                        self.stdout.write(f'Supprimé: {app_name}/migrations/{filename}')
                
                # Supprimer le dossier __pycache__ s'il existe
                pycache_dir = os.path.join(migrations_dir, '__pycache__')
                if os.path.exists(pycache_dir):
                    shutil.rmtree(pycache_dir)
        
        self.stdout.write(
            self.style.SUCCESS('✅ Fichiers de migration supprimés!')
        )