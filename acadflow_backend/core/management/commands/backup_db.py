# core/management/commands/backup_db.py
from django.core.management.base import BaseCommand
from django.core.management import call_command
from django.conf import settings
import os
from datetime import datetime

class Command(BaseCommand):
    help = 'Create database backup'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--output-dir',
            type=str,
            default='backups',
            help='Output directory for backup files',
        )
    
    def handle(self, *args, **options):
        # Créer le répertoire de sauvegarde s'il n'existe pas
        backup_dir = options['output_dir']
        os.makedirs(backup_dir, exist_ok=True)
        
        # Nom du fichier avec timestamp
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        backup_file = os.path.join(backup_dir, f'acadflow_backup_{timestamp}.json')
        
        try:
            with open(backup_file, 'w') as f:
                call_command('dumpdata', stdout=f, indent=2)
            
            self.stdout.write(
                self.style.SUCCESS(f'Sauvegarde créée: {backup_file}')
            )
            
            # Afficher la taille du fichier
            size = os.path.getsize(backup_file)
            self.stdout.write(f'Taille: {size / 1024 / 1024:.2f} MB')
            
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Erreur lors de la sauvegarde: {str(e)}')
            )