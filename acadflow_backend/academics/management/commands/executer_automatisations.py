# academics/management/commands/executer_automatisations.py
from django.core.management.base import BaseCommand
from django.utils import timezone
from core.services import AutomationService
import logging

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = 'Exécute les tâches d\'automatisation planifiées'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--type',
            choices=['recaps', 'delais', 'inscriptions', 'all'],
            default='all',
            help='Type de tâches à exécuter'
        )
        parser.add_argument(
            '--force',
            action='store_true',
            help='Force l\'exécution même si les conditions ne sont pas remplies'
        )
    
    def handle(self, *args, **options):
        type_taches = options['type']
        force = options['force']
        
        self.stdout.write(f'Début de l\'exécution des automatisations: {type_taches}')
        
        if type_taches in ['recaps', 'all']:
            self._executer_recapitulatifs(force)
        
        if type_taches in ['delais', 'all']:
            self._verifier_delais()
        
        if type_taches in ['inscriptions', 'all']:
            self._executer_inscriptions_ec()
        
        # Exécuter toutes les tâches planifiées
        resultats = AutomationService.executer_taches_planifiees()
        
        self.stdout.write(
            self.style.SUCCESS(
                f'Automatisations terminées: '
                f'{resultats["taches_executees"]} réussies, '
                f'{resultats["taches_echouees"]} échouées'
            )
        )
    
    def _executer_recapitulatifs(self, force=False):
        """Exécute la génération des récapitulatifs semestriels"""
        self.stdout.write('Planification des récapitulatifs semestriels...')
        
        resultats = AutomationService.planifier_recapitulatifs_automatiques()
        
        if resultats.get('success'):
            self.stdout.write(
                self.style.SUCCESS(
                    f'{resultats.get("taches_planifiees", 0)} récapitulatifs planifiés'
                )
            )
        else:
            self.stdout.write(
                self.style.WARNING(f'Erreur planification: {resultats.get("error")}')
            )
    
    def _verifier_delais(self):
        """Vérifie les délais de saisie des notes"""
        self.stdout.write('Vérification des délais de saisie...')
        
        resultats = AutomationService.verifier_delais_saisie_notes()
        
        self.stdout.write(
            self.style.SUCCESS(
                f'Délais vérifiés: {resultats["notifications_envoyees"]} notifications envoyées, '
                f'{resultats["evaluations_urgentes"]} évaluations urgentes, '
                f'{resultats["evaluations_depassees"]} évaluations dépassées'
            )
        )
    
    def _executer_inscriptions_ec(self):
        """Exécute les inscriptions automatiques aux ECs"""
        from academics.models import Classe, AnneeAcademique
        
        self.stdout.write('Inscription automatique aux ECs...')
        
        try:
            annee_active = AnneeAcademique.objects.get(active=True)
            classes = Classe.objects.filter(
                annee_academique=annee_active,
                active=True
            )
            
            inscriptions_total = 0
            
            for classe in classes:
                resultat = AutomationService.inscrire_etudiants_ecs_automatique(classe)
                if resultat['success']:
                    inscriptions_total += resultat['inscriptions_creees']
            
            self.stdout.write(
                self.style.SUCCESS(f'{inscriptions_total} inscriptions EC créées')
            )
            
        except AnneeAcademique.DoesNotExist:
            self.stdout.write(
                self.style.WARNING('Aucune année académique active trouvée')
            )