# academics/management/commands/nettoyer_donnees.py
from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from evaluations.models import TacheAutomatisee
from academics.models import ParametrageSysteme

class Command(BaseCommand):
    help = 'Nettoie les anciennes données selon les paramètres de rétention'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Simulation sans suppression réelle'
        )
        parser.add_argument(
            '--force',
            action='store_true',
            help='Force le nettoyage sans confirmation'
        )
    
    def handle(self, *args, **options):
        dry_run = options['dry_run']
        force = options['force']
        
        # Récupérer les paramètres de rétention
        try:
            retention_param = ParametrageSysteme.objects.get(cle='retention_logs')
            retention_jours = retention_param.get_valeur()
        except ParametrageSysteme.DoesNotExist:
            retention_jours = 90  # Valeur par défaut
        
        date_limite = timezone.now() - timedelta(days=retention_jours)
        
        self.stdout.write(f'Nettoyage des données antérieures au {date_limite.date()}')
        
        if dry_run:
            self.stdout.write(self.style.WARNING('MODE SIMULATION - Aucune suppression'))
        
        # Nettoyer les tâches automatisées anciennes
        taches_anciennes = TacheAutomatisee.objects.filter(
            created_at__lt=date_limite,
            statut__in=['terminee', 'erreur']
        )
        
        nb_taches = taches_anciennes.count()
        
        if nb_taches > 0:
            if not force and not dry_run:
                confirmation = input(f'Supprimer {nb_taches} tâches anciennes? (oui/non): ')
                if confirmation.lower() not in ['oui', 'o', 'yes', 'y']:
                    self.stdout.write('Nettoyage annulé')
                    return
            
            if not dry_run:
                taches_anciennes.delete()
                self.stdout.write(
                    self.style.SUCCESS(f'{nb_taches} tâches automatisées supprimées')
                )
            else:
                self.stdout.write(f'[SIMULATION] {nb_taches} tâches seraient supprimées')
        
        # Nettoyer les fichiers de récapitulatifs anciens
        from academics.models import RecapitulatifSemestriel
        import os
        
        recaps_anciens = RecapitulatifSemestriel.objects.filter(
            date_generation__lt=date_limite - timedelta(days=365)  # Garder 1 an de plus
        )
        
        fichiers_supprimes = 0
        
        for recap in recaps_anciens:
            if recap.fichier_pdf and os.path.exists(recap.fichier_pdf.path):
                if not dry_run:
                    os.remove(recap.fichier_pdf.path)
                fichiers_supprimes += 1
            
            if recap.fichier_excel and os.path.exists(recap.fichier_excel.path):
                if not dry_run:
                    os.remove(recap.fichier_excel.path)
                fichiers_supprimes += 1
        
        if fichiers_supprimes > 0:
            if dry_run:
                self.stdout.write(f'[SIMULATION] {fichiers_supprimes} fichiers seraient supprimés')
            else:
                self.stdout.write(
                    self.style.SUCCESS(f'{fichiers_supprimes} fichiers supprimés')
                )
        
        self.stdout.write(self.style.SUCCESS('Nettoyage terminé'))