# academics/management/commands/reset_medical_data.py
import os
import django
from django.core.management.base import BaseCommand
from django.core.management import call_command
from django.db import transaction

# Configuration Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'acadflow_backend.settings')
django.setup()

class Command(BaseCommand):
    help = 'Réinitialise complètement les données de la faculté de médecine'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--confirm',
            action='store_true',
            help='Confirme la réinitialisation complète',
        )
    
    def handle(self, *args, **options):
        if not options['confirm']:
            self.stdout.write(
                self.style.WARNING(
                    '⚠️ Cette commande va supprimer et recréer TOUTES les données!\n'
                    'Utilisez --confirm pour confirmer la réinitialisation complète.'
                )
            )
            return
        
        self.stdout.write('🔄 Réinitialisation complète en cours...\n')
        
        try:
            # 1. Nettoyer les données existantes
            self.stdout.write('🧹 Étape 1: Nettoyage des données existantes...')
            call_command('cleanup_data', '--confirm')
            
            # 2. Recréer les données de base
            self.stdout.write('\n📚 Étape 2: Création des données de base...')
            call_command('init_medical_school_data')
            
            # 3. Créer les évaluations et notes
            self.stdout.write('\n📝 Étape 3: Création des évaluations et notes...')
            call_command('init_evaluations_data')
            
            # 4. Vérifier l'intégrité
            self.stdout.write('\n🔍 Étape 4: Vérification de l\'intégrité...')
            call_command('verify_data')
            
            self.stdout.write(
                self.style.SUCCESS('\n✅ Réinitialisation terminée avec succès!')
            )
            
            # Afficher les informations de connexion
            self.show_login_info()
            
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'\n❌ Erreur lors de la réinitialisation: {e}')
            )
            raise
    
    def show_login_info(self):
        """Affiche les informations de connexion"""
        self.stdout.write('\n' + '='*50)
        self.stdout.write('🔑 INFORMATIONS DE CONNEXION')
        self.stdout.write('='*50)
        
        login_info = [
            ('👤 Administrateur', 'admin', 'admin123', 'admin@faculte-medecine.cm'),
            ('👨‍🏫 Enseignant', 'ens001', 'ens123', 'jc.mballa@faculte-medecine.cm'),
            ('👨‍🏫 Enseignant', 'ens002', 'ens123', 'mc.ngono@faculte-medecine.cm'),
            ('🎓 Étudiant', 'med0001', 'etud123', 'med0001@etudiant.faculte-medecine.cm'),
            ('🎓 Étudiant', 'med0002', 'etud123', 'med0002@etudiant.faculte-medecine.cm'),
        ]
        
        for role, username, password, email in login_info:
            self.stdout.write(f'{role}:')
            self.stdout.write(f'  Username: {username}')
            self.stdout.write(f'  Password: {password}')
            self.stdout.write(f'  Email: {email}')
            self.stdout.write('')
        
        self.stdout.write('📱 ACCÈS:')
        self.stdout.write('  Interface Admin: http://localhost:8000/admin/')
        self.stdout.write('  API: http://localhost:8000/api/')
        self.stdout.write('')
        
        self.stdout.write('🚀 DÉMARRAGE:')
        self.stdout.write('  python manage.py runserver')
        self.stdout.write('='*50)

# Pour exécuter le script
if __name__ == '__main__':
    command = Command()
    # Simuler les arguments de ligne de commande
    import argparse
    parser = argparse.ArgumentParser()
    command.add_arguments(parser)
    args = parser.parse_args(['--confirm'])
    command.handle(confirm=args.confirm)
    print("✅ Réinitialisation terminée !")