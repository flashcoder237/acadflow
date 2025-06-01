# academics/management/commands/init_evaluations_data.py
import os
import django
from django.core.management.base import BaseCommand
from django.db import transaction
from datetime import date, timedelta
from decimal import Decimal
import random

# Configuration Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'acadflow_backend.settings')
django.setup()

from academics.models import AnneeAcademique, Session, Classe, UE, EC, TypeEvaluation
from evaluations.models import Enseignement, Evaluation, Note
from users.models import Enseignant, Etudiant, Inscription
from core.utils import calculer_moyenne_ec, calculer_moyenne_ue, calculer_moyenne_semestre

class Command(BaseCommand):
    help = 'Initialise les évaluations et notes de test'
    
    def handle(self, *args, **options):
        with transaction.atomic():
            self.stdout.write('📝 Initialisation des évaluations et notes...')
            
            # 1. Créer les enseignements
            self.create_enseignements()
            
            # 2. Créer les évaluations
            self.create_evaluations()
            
            # 3. Générer des notes aléatoires
            self.generate_notes()
            
            # 4. Calculer les moyennes
            self.calculate_moyennes()
            
            self.stdout.write(
                self.style.SUCCESS('✅ Évaluations et notes créées avec succès!')
            )
    
    def create_enseignements(self):
        """Créer les affectations enseignant-EC-classe"""
        self.stdout.write('👨‍🏫 Création des enseignements...')
        
        annee_active = AnneeAcademique.objects.get(active=True)
        enseignants = list(Enseignant.objects.all())
        classes = list(Classe.objects.filter(annee_academique=annee_active))
        
        # Affecter chaque EC de chaque classe à un enseignant
        for classe in classes:
            # Récupérer toutes les UE du niveau de cette classe
            ues = UE.objects.filter(niveau=classe.niveau, actif=True)
            
            for ue in ues:
                # Récupérer tous les EC de cette UE
                ecs = EC.objects.filter(ue=ue, actif=True)
                
                for ec in ecs:
                    # Choisir un enseignant aléatoirement
                    enseignant = random.choice(enseignants)
                    
                    # Créer l'enseignement
                    Enseignement.objects.get_or_create(
                        enseignant=enseignant,
                        ec=ec,
                        classe=classe,
                        annee_academique=annee_active
                    )
    
    def create_evaluations(self):
        """Créer les évaluations pour chaque enseignement"""
        self.stdout.write('📋 Création des évaluations...')
        
        enseignements = Enseignement.objects.filter(actif=True)
        session_normale = Session.objects.get(code='SN')
        types_evaluation = {
            te.code: te for te in TypeEvaluation.objects.filter(actif=True)
        }
        
        # Dates d'évaluation
        date_debut_semestre = date(2024, 9, 15)
        
        for enseignement in enseignements:
            ec = enseignement.ec
            
            # Créer les évaluations selon le type d'EC
            if 'TP' in ec.nom:
                evaluations_data = [
                    ('TP 1 - ' + ec.nom, 'TP', 15),
                    ('TP 2 - ' + ec.nom, 'TP', 30),
                    ('CC - ' + ec.nom, 'CC', 45),
                    ('Examen Final - ' + ec.nom, 'EXAM', 90)
                ]
            else:
                evaluations_data = [
                    ('CC 1 - ' + ec.nom, 'CC', 20),
                    ('CC 2 - ' + ec.nom, 'CC', 35),
                    ('Partiel - ' + ec.nom, 'PART', 60),
                    ('Examen Final - ' + ec.nom, 'EXAM', 100)
                ]
            
            for nom_eval, type_code, jour_offset in evaluations_data:
                if type_code in types_evaluation:
                    date_eval = date_debut_semestre + timedelta(days=jour_offset)
                    
                    Evaluation.objects.get_or_create(
                        nom=nom_eval,
                        enseignement=enseignement,
                        type_evaluation=types_evaluation[type_code],
                        session=session_normale,
                        defaults={
                            'date_evaluation': date_eval,
                            'note_sur': Decimal('20.00'),
                            'coefficient': Decimal('1.0'),
                            'saisie_terminee': True
                        }
                    )
    
    def generate_notes(self):
        """Générer des notes aléatoires pour les étudiants"""
        self.stdout.write('🎯 Génération des notes...')
        
        evaluations = Evaluation.objects.filter(saisie_terminee=True)
        
        for evaluation in evaluations:
            # Récupérer les étudiants de la classe
            inscriptions = Inscription.objects.filter(
                classe=evaluation.enseignement.classe,
                active=True
            )
            
            for inscription in inscriptions:
                etudiant = inscription.etudiant
                
                # Probabilité d'absence : 5%
                absent = random.random() < 0.05
                
                if absent:
                    Note.objects.get_or_create(
                        etudiant=etudiant,
                        evaluation=evaluation,
                        defaults={
                            'note_obtenue': Decimal('0.00'),
                            'absent': True,
                            'justifie': random.choice([True, False])
                        }
                    )
                else:
                    # Générer une note selon une distribution normale
                    # Moyenne entre 10 et 14, écart-type de 3
                    note_moyenne = random.uniform(10, 14)
                    note = max(0, min(20, random.normalvariate(note_moyenne, 3)))
                    
                    Note.objects.get_or_create(
                        etudiant=etudiant,
                        evaluation=evaluation,
                        defaults={
                            'note_obtenue': Decimal(f'{note:.2f}'),
                            'absent': False
                        }
                    )
    
    def calculate_moyennes(self):
        """Calculer toutes les moyennes"""
        self.stdout.write('🧮 Calcul des moyennes...')
        
        annee_active = AnneeAcademique.objects.get(active=True)
        session_normale = Session.objects.get(code='SN')
        
        # Pour chaque classe
        classes = Classe.objects.filter(annee_academique=annee_active)
        
        for classe in classes:
            self.stdout.write(f'   Calcul pour la classe {classe.nom}...')
            
            # Récupérer les inscriptions de la classe
            inscriptions = Inscription.objects.filter(classe=classe, active=True)
            
            # Récupérer les UE du niveau
            ues = UE.objects.filter(niveau=classe.niveau, actif=True)
            
            for inscription in inscriptions:
                etudiant = inscription.etudiant
                
                # Calculer les moyennes EC
                for ue in ues:
                    ecs = EC.objects.filter(ue=ue, actif=True)
                    for ec in ecs:
                        calculer_moyenne_ec(etudiant, ec, session_normale, annee_active)
                
                # Calculer les moyennes UE
                for ue in ues:
                    calculer_moyenne_ue(etudiant, ue, session_normale, annee_active)
                
                # Calculer les moyennes semestrielles
                from academics.models import Semestre
                semestres = Semestre.objects.all()
                for semestre in semestres:
                    calculer_moyenne_semestre(
                        etudiant, classe, semestre, session_normale, annee_active
                    )

# Fonction utilitaire pour créer des données d'enseignement complètes
def create_complete_teaching_assignments():
    """Créer des affectations d'enseignement plus réalistes"""
    
    # Spécialités des enseignants et EC correspondants
    specialites_mapping = {
        'Anatomie et Cytologie Pathologiques': ['ANAT101A', 'ANAT101B', 'ANAT102A', 'ANAT102B', 'PATH201A', 'PATH201B'],
        'Physiologie Humaine': ['PHYS101A', 'PHYS101B', 'PHYS102A', 'PHYS102B'],
        'Biochimie Médicale': ['BIOC101A', 'BIOC101B'],
        'Microbiologie et Immunologie': ['MICR101A', 'MICR101B', 'IMMU201A', 'IMMU201B'],
        'Pharmacologie et Toxicologie': ['PHAR201A', 'PHAR201B']
    }
    
    annee_active = AnneeAcademique.objects.get(active=True)
    classes = Classe.objects.filter(annee_academique=annee_active)
    
    for enseignant in Enseignant.objects.all():
        specialite = enseignant.specialite
        
        if specialite in specialites_mapping:
            codes_ec = specialites_mapping[specialite]
            
            # Affecter cet enseignant aux EC de sa spécialité
            for code_ec in codes_ec:
                try:
                    ec = EC.objects.get(code=code_ec)
                    
                    # L'affecter à toutes les classes qui ont ce niveau
                    for classe in classes:
                        if UE.objects.filter(
                            niveau=classe.niveau, 
                            elements_constitutifs=ec,
                            actif=True
                        ).exists():
                            Enseignement.objects.get_or_create(
                                enseignant=enseignant,
                                ec=ec,
                                classe=classe,
                                annee_academique=annee_active
                            )
                except EC.DoesNotExist:
                    continue

# Pour exécuter le script
if __name__ == '__main__':
    command = Command()
    command.handle()
    print("✅ Évaluations et notes créées avec succès !")