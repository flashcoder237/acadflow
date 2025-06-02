# academics/management/commands/configurer_classes_ec.py
from django.core.management.base import BaseCommand
from django.db import transaction
from academics.models import Classe, EC, UE, ECClasse
from core.services import AutomationService

class Command(BaseCommand):
    help = 'Configure automatiquement les ECs pour toutes les classes'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--annee-id',
            type=int,
            help='ID de l\'année académique (défaut: année active)'
        )
        parser.add_argument(
            '--classe-id',
            type=int,
            help='ID d\'une classe spécifique (optionnel)'
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Simulation sans modification'
        )
    
    def handle(self, *args, **options):
        annee_id = options.get('annee_id')
        classe_id = options.get('classe_id')
        dry_run = options['dry_run']
        
        if dry_run:
            self.stdout.write(self.style.WARNING('MODE SIMULATION'))
        
        # Récupérer l'année académique
        if annee_id:
            from academics.models import AnneeAcademique
            try:
                annee = AnneeAcademique.objects.get(id=annee_id)
            except AnneeAcademique.DoesNotExist:
                self.stdout.write(
                    self.style.ERROR(f'Année académique {annee_id} non trouvée')
                )
                return
        else:
            try:
                from academics.models import AnneeAcademique
                annee = AnneeAcademique.objects.get(active=True)
            except AnneeAcademique.DoesNotExist:
                self.stdout.write(
                    self.style.ERROR('Aucune année académique active')
                )
                return
        
        # Récupérer les classes
        if classe_id:
            classes = Classe.objects.filter(id=classe_id, annee_academique=annee)
        else:
            classes = Classe.objects.filter(annee_academique=annee, active=True)
        
        if not classes.exists():
            self.stdout.write(self.style.WARNING('Aucune classe trouvée'))
            return
        
        self.stdout.write(f'Configuration de {classes.count()} classes pour {annee.libelle}')
        
        total_assignations = 0
        total_inscriptions = 0
        
        for classe in classes:
            self.stdout.write(f'\nTraitement de {classe.nom}...')
            
            # Récupérer tous les ECs du niveau de la classe
            ecs_niveau = EC.objects.filter(
                ue__niveau=classe.niveau,
                actif=True
            ).select_related('ue')
            
            assignations_classe = 0
            
            if not dry_run:
                with transaction.atomic():
                    for ec in ecs_niveau:
                        ec_classe, created = ECClasse.objects.get_or_create(
                            ec=ec,
                            classe=classe,
                            defaults={'obligatoire': True}
                        )
                        
                        if created:
                            assignations_classe += 1
                            self.stdout.write(f'  ✓ {ec.code} - {ec.nom}')
                    
                    # Inscrire automatiquement les étudiants
                    resultat_inscriptions = AutomationService.inscrire_etudiants_ecs_automatique(classe)
                    
                    if resultat_inscriptions['success']:
                        inscriptions_creees = resultat_inscriptions['inscriptions_creees']
                        total_inscriptions += inscriptions_creees
                        self.stdout.write(
                            f'  → {inscriptions_creees} inscriptions étudiants créées'
                        )
            else:
                # Mode simulation
                for ec in ecs_niveau:
                    existe = ECClasse.objects.filter(ec=ec, classe=classe).exists()
                    if not existe:
                        assignations_classe += 1
                        self.stdout.write(f'  [SIMULATION] {ec.code} - {ec.nom}')
            
            total_assignations += assignations_classe
            self.stdout.write(
                f'  {assignations_classe} EC{"s" if assignations_classe > 1 else ""} '
                f'{"assigné" if not dry_run else "à assigner"}{"s" if assignations_classe > 1 else ""}'
            )
        
        # Résumé
        self.stdout.write(self.style.SUCCESS(f'\n=== RÉSUMÉ ==='))
        self.stdout.write(f'Classes traitées: {classes.count()}')
        self.stdout.write(f'ECs assignés: {total_assignations}')
        if not dry_run:
            self.stdout.write(f'Inscriptions créées: {total_inscriptions}')
        else:
            self.stdout.write('Mode simulation - Aucune modification effectuée')