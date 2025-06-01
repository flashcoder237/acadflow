# core/management/commands/calculate_averages.py
from django.core.management.base import BaseCommand
from django.db import transaction
from academics.models import AnneeAcademique, Session
from users.models import Inscription
from core.utils import calculer_moyenne_ec, calculer_moyenne_ue, calculer_moyenne_semestre

class Command(BaseCommand):
    help = 'Calculate averages for students'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--classe-id',
            type=int,
            help='Calculate for specific classe only',
        )
        parser.add_argument(
            '--session-id',
            type=int,
            help='Calculate for specific session only',
        )
        parser.add_argument(
            '--type',
            choices=['ec', 'ue', 'semestre', 'all'],
            default='all',
            help='Type of average to calculate',
        )
    
    def handle(self, *args, **options):
        try:
            annee_active = AnneeAcademique.objects.get(active=True)
        except AnneeAcademique.DoesNotExist:
            self.stdout.write(
                self.style.ERROR('Aucune année académique active trouvée')
            )
            return
        
        # Filtrer les sessions
        sessions = Session.objects.filter(actif=True)
        if options['session_id']:
            sessions = sessions.filter(id=options['session_id'])
        
        # Filtrer les inscriptions
        inscriptions = Inscription.objects.filter(
            annee_academique=annee_active,
            active=True
        ).select_related('etudiant', 'classe')
        
        if options['classe_id']:
            inscriptions = inscriptions.filter(classe_id=options['classe_id'])
        
        self.stdout.write(f'Traitement de {inscriptions.count()} inscriptions...')
        
        for session in sessions:
            self.stdout.write(f'\nSession: {session.nom}')
            
            for inscription in inscriptions:
                etudiant = inscription.etudiant
                classe = inscription.classe
                
                if options['type'] in ['ec', 'all']:
                    # Calculer moyennes EC
                    from academics.models import EC
                    ecs = EC.objects.filter(ue__niveau=classe.niveau, actif=True)
                    
                    for ec in ecs:
                        calculer_moyenne_ec(etudiant, ec, session, annee_active)
                
                if options['type'] in ['ue', 'all']:
                    # Calculer moyennes UE
                    from academics.models import UE
                    ues = UE.objects.filter(niveau=classe.niveau, actif=True)
                    
                    for ue in ues:
                        calculer_moyenne_ue(etudiant, ue, session, annee_active)
                
                if options['type'] in ['semestre', 'all']:
                    # Calculer moyennes semestrielles
                    from academics.models import Semestre
                    semestres = Semestre.objects.all()
                    
                    for semestre in semestres:
                        calculer_moyenne_semestre(
                            etudiant, classe, semestre, session, annee_active
                        )
        
        self.stdout.write(
            self.style.SUCCESS('Calcul des moyennes terminé!')
        )