# academics/management/commands/cleanup_data.py
import os
import django
from django.core.management.base import BaseCommand
from django.db import transaction

# Configuration Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'acadflow_backend.settings')
django.setup()

from core.models import Domaine, Cycle, TypeFormation, Filiere, Option, Niveau
from academics.models import (
    AnneeAcademique, Session, Semestre, Classe, UE, EC, 
    TypeEvaluation, ConfigurationEvaluationEC
)
from users.models import User, Enseignant, Etudiant, StatutEtudiant, Inscription, HistoriqueStatut
from evaluations.models import (
    Enseignement, Evaluation, Note, MoyenneEC, MoyenneUE, MoyenneSemestre
)

class Command(BaseCommand):
    help = 'Nettoie toutes les données de test'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--confirm',
            action='store_true',
            help='Confirme la suppression des données',
        )
    
    def handle(self, *args, **options):
        if not options['confirm']:
            self.stdout.write(
                self.style.WARNING(
                    '⚠️ Cette commande va supprimer TOUTES les données!\n'
                    'Utilisez --confirm pour confirmer la suppression.'
                )
            )
            return
        
        self.stdout.write('🧹 Nettoyage des données en cours...')
        
        with transaction.atomic():
            # Supprimer dans l'ordre des dépendances (du plus dépendant au moins dépendant)
            
            # 1. Moyennes et notes
            self.delete_model_data(MoyenneSemestre, 'Moyennes Semestre')
            self.delete_model_data(MoyenneUE, 'Moyennes UE')
            self.delete_model_data(MoyenneEC, 'Moyennes EC')
            self.delete_model_data(Note, 'Notes')
            
            # 2. Évaluations et enseignements
            self.delete_model_data(Evaluation, 'Évaluations')
            self.delete_model_data(Enseignement, 'Enseignements')
            
            # 3. Configurations et évaluations
            self.delete_model_data(ConfigurationEvaluationEC, 'Configurations Évaluation EC')
            self.delete_model_data(TypeEvaluation, 'Types Évaluation')
            
            # 4. Inscriptions et historiques
            self.delete_model_data(HistoriqueStatut, 'Historique Statuts')
            self.delete_model_data(Inscription, 'Inscriptions')
            
            # 5. Utilisateurs (sauf superuser)
            self.delete_users()
            
            # 6. Structure académique
            self.delete_model_data(Classe, 'Classes')
            self.delete_model_data(EC, 'Éléments Constitutifs')
            self.delete_model_data(UE, 'Unités d\'Enseignement')
            self.delete_model_data(AnneeAcademique, 'Années Académiques')
            self.delete_model_data(Semestre, 'Semestres')
            self.delete_model_data(Session, 'Sessions')
            
            # 7. Structure de base
            self.delete_model_data(Option, 'Options')
            self.delete_model_data(Filiere, 'Filières')
            self.delete_model_data(TypeFormation, 'Types Formation')
            self.delete_model_data(Niveau, 'Niveaux')
            self.delete_model_data(Cycle, 'Cycles')
            self.delete_model_data(Domaine, 'Domaines')
            
            # 8. Statuts étudiants
            self.delete_model_data(StatutEtudiant, 'Statuts Étudiant')
        
        self.stdout.write(
            self.style.SUCCESS('✅ Nettoyage terminé avec succès!')
        )
    
    def delete_model_data(self, model, name):
        """Supprime toutes les données d'un modèle"""
        count = model.objects.count()
        if count > 0:
            model.objects.all().delete()
            self.stdout.write(f'   🗑️ {name}: {count} éléments supprimés')
        else:
            self.stdout.write(f'   ✅ {name}: aucun élément à supprimer')
    
    def delete_users(self):
        """Supprime les utilisateurs (sauf superusers)"""
        # Supprimer d'abord les profils
        self.delete_model_data(Etudiant, 'Profils Étudiant')
        self.delete_model_data(Enseignant, 'Profils Enseignant')
        
        # Supprimer les utilisateurs non-superuser
        users_to_delete = User.objects.filter(is_superuser=False)
        count = users_to_delete.count()
        if count > 0:
            users_to_delete.delete()
            self.stdout.write(f'   🗑️ Utilisateurs: {count} éléments supprimés')
        else:
            self.stdout.write('   ✅ Utilisateurs: aucun élément à supprimer')

# Pour exécuter le script
if __name__ == '__main__':
    command = Command()
    # Simuler les arguments de ligne de commande
    import argparse
    parser = argparse.ArgumentParser()
    command.add_arguments(parser)
    args = parser.parse_args(['--confirm'])
    command.handle(confirm=args.confirm)
    print("✅ Nettoyage terminé !")