# academics/management/commands/generer_rapport_automatisations.py
from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from evaluations.models import TacheAutomatisee
from academics.models import RecapitulatifSemestriel
import json

class Command(BaseCommand):
    help = 'Génère un rapport des automatisations'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--periode',
            type=int,
            default=7,
            help='Période en jours pour le rapport (défaut: 7)'
        )
        parser.add_argument(
            '--format',
            choices=['text', 'json'],
            default='text',
            help='Format de sortie du rapport'
        )
    
    def handle(self, *args, **options):
        periode = options['periode']
        format_sortie = options['format']
        
        date_debut = timezone.now() - timedelta(days=periode)
        
        # Récupérer les données
        taches = TacheAutomatisee.objects.filter(
            created_at__gte=date_debut
        ).order_by('-created_at')
        
        recaps = RecapitulatifSemestriel.objects.filter(
            date_generation__gte=date_debut
        )
        
        # Statistiques
        stats = {
            'periode': f'{periode} derniers jours',
            'date_debut': date_debut.isoformat(),
            'date_fin': timezone.now().isoformat(),
            'taches': {
                'total': taches.count(),
                'planifiees': taches.filter(statut='planifiee').count(),
                'en_cours': taches.filter(statut='en_cours').count(),
                'terminees': taches.filter(statut='terminee').count(),
                'erreurs': taches.filter(statut='erreur').count()
            },
            'recapitulatifs': {
                'total': recaps.count(),
                'termines': recaps.filter(statut='termine').count(),
                'en_cours': recaps.filter(statut='en_cours').count(),
                'erreurs': recaps.filter(statut='erreur').count()
            },
            'par_type': {}
        }
        
        # Statistiques par type de tâche
        for type_tache, _ in TacheAutomatisee.TYPE_TACHES:
            count = taches.filter(type_tache=type_tache).count()
            if count > 0:
                stats['par_type'][type_tache] = count
        
        # Tâches en erreur
        taches_erreur = taches.filter(statut='erreur')
        erreurs_details = []
        
        for tache in taches_erreur:
            erreurs_details.append({
                'id': tache.id,
                'type': tache.type_tache,
                'classe': tache.classe.nom if tache.classe else None,
                'date': tache.date_execution.isoformat() if tache.date_execution else None,
                'erreur': tache.erreurs
            })
        
        stats['erreurs_details'] = erreurs_details
        
        # Affichage selon le format
        if format_sortie == 'json':
            self.stdout.write(json.dumps(stats, indent=2, default=str))
        else:
            self._afficher_rapport_texte(stats)
    
    def _afficher_rapport_texte(self, stats):
        """Affiche le rapport en format texte"""
        self.stdout.write(self.style.SUCCESS('=== RAPPORT DES AUTOMATISATIONS ==='))
        self.stdout.write(f'Période: {stats["periode"]}')
        self.stdout.write(f'Du {stats["date_debut"]} au {stats["date_fin"]}')
        self.stdout.write('')
        
        # Tâches
        self.stdout.write(self.style.SUCCESS('TÂCHES AUTOMATISÉES:'))
        taches = stats['taches']
        self.stdout.write(f'  Total: {taches["total"]}')
        self.stdout.write(f'  Terminées: {taches["terminees"]} ✓')
        self.stdout.write(f'  En cours: {taches["en_cours"]} ⏳')
        self.stdout.write(f'  Planifiées: {taches["planifiees"]} 📅')
        self.stdout.write(f'  Erreurs: {taches["erreurs"]} ❌')
        self.stdout.write('')
        
        # Récapitulatifs
        self.stdout.write(self.style.SUCCESS('RÉCAPITULATIFS SEMESTRIELS:'))
        recaps = stats['recapitulatifs']
        self.stdout.write(f'  Total: {recaps["total"]}')
        self.stdout.write(f'  Terminés: {recaps["termines"]} ✓')
        self.stdout.write(f'  En cours: {recaps["en_cours"]} ⏳')
        self.stdout.write(f'  Erreurs: {recaps["erreurs"]} ❌')
        self.stdout.write('')
        
        # Par type
        if stats['par_type']:
            self.stdout.write(self.style.SUCCESS('RÉPARTITION PAR TYPE:'))
            for type_tache, count in stats['par_type'].items():
                self.stdout.write(f'  {type_tache}: {count}')
            self.stdout.write('')
        
        # Erreurs
        if stats['erreurs_details']:
            self.stdout.write(self.style.ERROR('ERREURS DÉTAILLÉES:'))
            for erreur in stats['erreurs_details']:
                self.stdout.write(f'  #{erreur["id"]} - {erreur["type"]}')
                if erreur['classe']:
                    self.stdout.write(f'    Classe: {erreur["classe"]}')
                self.stdout.write(f'    Erreur: {erreur["erreur"]}')
                self.stdout.write('')