# core/management/commands/calculer_moyennes_masse.py
from django.core.management.base import BaseCommand
from django.db import transaction
from core.utils import calculer_moyenne_ec, calculer_moyenne_ue, calculer_moyenne_semestre

class Command(BaseCommand):
    help = 'Recalcule toutes les moyennes en masse'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--type',
            choices=['ec', 'ue', 'semestre', 'all'],
            default='all',
            help='Type de moyennes à calculer'
        )
        parser.add_argument(
            '--classe-id',
            type=int,
            help='ID d\'une classe spécifique'
        )
        parser.add_argument(
            '--session-id',
            type=int,
            help='ID d\'une session spécifique'
        )
        parser.add_argument(
            '--parallel',
            action='store_true',
            help='Calcul en parallèle (expérimental)'
        )
    
    def handle(self, *args, **options):
        type_calcul = options['type']
        classe_id = options.get('classe_id')
        session_id = options.get('session_id')
        parallel = options['parallel']
        
        from academics.models import Classe, Session, AnneeAcademique
        from users.models import Inscription
        
        # Récupérer l'année active
        try:
            annee_active = AnneeAcademique.objects.get(active=True)
        except AnneeAcademique.DoesNotExist:
            self.stdout.write(self.style.ERROR('Aucune année académique active'))
            return
        
        # Récupérer les classes
        if classe_id:
            classes = Classe.objects.filter(id=classe_id, annee_academique=annee_active)
        else:
            classes = Classe.objects.filter(annee_academique=annee_active, active=True)
        
        # Récupérer les sessions
        if session_id:
            sessions = Session.objects.filter(id=session_id, actif=True)
        else:
            sessions = Session.objects.filter(actif=True)
        
        self.stdout.write(f'Calcul des moyennes pour {classes.count()} classes et {sessions.count()} sessions')
        
        total_calculs = 0
        
        for classe in classes:
            self.stdout.write(f'\nTraitement de {classe.nom}...')
            
            # Récupérer les étudiants de la classe
            inscriptions = Inscription.objects.filter(
                classe=classe,
                active=True
            ).select_related('etudiant')
            
            for session in sessions:
                self.stdout.write(f'  Session {session.nom}...')
                
                if type_calcul in ['ec', 'all']:
                    total_calculs += self._calculer_moyennes_ec(
                        classe, session, inscriptions, parallel
                    )
                
                if type_calcul in ['ue', 'all']:
                    total_calculs += self._calculer_moyennes_ue(
                        classe, session, inscriptions, parallel
                    )
                
                if type_calcul in ['semestre', 'all']:
                    total_calculs += self._calculer_moyennes_semestre(
                        classe, session, inscriptions, parallel
                    )
        
        self.stdout.write(
            self.style.SUCCESS(f'Calcul terminé: {total_calculs} moyennes calculées')
        )
    
    def _calculer_moyennes_ec(self, classe, session, inscriptions, parallel=False):
        """Calcule les moyennes EC"""
        from academics.models import EC
        
        ecs = EC.objects.filter(
            ue__niveau=classe.niveau,
            actif=True
        )
        
        calculs = 0
        
        for inscription in inscriptions:
            for ec in ecs:
                moyenne = calculer_moyenne_ec(
                    inscription.etudiant,
                    ec,
                    session,
                    classe.annee_academique
                )
                if moyenne:
                    calculs += 1
        
        self.stdout.write(f'    {calculs} moyennes EC calculées')
        return calculs
    
    def _calculer_moyennes_ue(self, classe, session, inscriptions, parallel=False):
        """Calcule les moyennes UE"""
        from academics.models import UE
        
        ues = UE.objects.filter(
            niveau=classe.niveau,
            actif=True
        )
        
        calculs = 0
        
        for inscription in inscriptions:
            for ue in ues:
                moyenne = calculer_moyenne_ue(
                    inscription.etudiant,
                    ue,
                    session,
                    classe.annee_academique
                )
                if moyenne:
                    calculs += 1
        
        self.stdout.write(f'    {calculs} moyennes UE calculées')
        return calculs
    
    def _calculer_moyennes_semestre(self, classe, session, inscriptions, parallel=False):
        """Calcule les moyennes semestrielles"""
        from academics.models import Semestre
        
        semestres = Semestre.objects.all()
        calculs = 0
        
        for inscription in inscriptions:
            for semestre in semestres:
                moyenne = calculer_moyenne_semestre(
                    inscription.etudiant,
                    classe,
                    semestre,
                    session,
                    classe.annee_academique
                )
                if moyenne:
                    calculs += 1
        
        self.stdout.write(f'    {calculs} moyennes semestrielles calculées')
        return calculs