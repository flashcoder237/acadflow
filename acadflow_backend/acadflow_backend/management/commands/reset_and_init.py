# ========================================
# FICHIER: acadflow_backend/management/commands/reset_and_init.py
# ========================================

from django.core.management.base import BaseCommand
from django.core.management import call_command
from django.db import transaction
from django.contrib.auth import get_user_model

class Command(BaseCommand):
    help = 'Remet à zéro et initialise complètement la base de données'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--confirm',
            action='store_true',
            help='Confirme la remise à zéro complète',
        )
    
    def handle(self, *args, **options):
        if not options['confirm']:
            self.stdout.write(
                self.style.WARNING(
                    '⚠️ Cette commande va SUPPRIMER toutes les données!\n'
                    'Utilisez --confirm pour confirmer.'
                )
            )
            return
        
        self.stdout.write('🔄 Remise à zéro complète en cours...\n')
        
        try:
            # 1. Supprimer et recréer les migrations
            self.stdout.write('📝 Remise à zéro des migrations...')
            call_command('reset_migrations')
            
            # 2. Créer et appliquer les migrations
            self.stdout.write('📝 Création des nouvelles migrations...')
            call_command('makemigrations')
            call_command('migrate')
            
            # 3. Créer le superuser
            self.stdout.write('👤 Création du superuser...')
            self.create_superuser()
            
            # 4. Initialiser les données de base
            self.stdout.write('📚 Initialisation des données de base...')
            call_command('init_data')
            
            # 5. Vérifier l'intégrité
            self.stdout.write('🔍 Vérification de l\'intégrité...')
            call_command('check_integrity')
            
            self.stdout.write(
                self.style.SUCCESS('\n✅ Remise à zéro et initialisation terminées!')
            )
            
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'\n❌ Erreur: {e}')
            )
            raise
    
    def create_superuser(self):
        """Crée le superuser par défaut"""
        User = get_user_model()
        
        if not User.objects.filter(username='admin').exists():
            try:
                admin_user = User.objects.create_superuser(
                    username='admin',
                    email='admin@acadflow.com',
                    password='admin123',
                    matricule='ADMIN-001',
                    type_utilisateur='admin',
                    first_name='Super',
                    last_name='Admin'
                )
                self.stdout.write('✅ Superuser créé: admin/admin123')
            except Exception as e:
                self.stdout.write(f'❌ Erreur création superuser: {e}')
        else:
            self.stdout.write('ℹ️ Superuser déjà existant')