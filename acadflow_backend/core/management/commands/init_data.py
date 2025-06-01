# core/management/commands/init_data.py
from django.core.management.base import BaseCommand
from django.db import transaction
from core.models import Domaine, Cycle, TypeFormation, Filiere, Option, Niveau
from academics.models import AnneeAcademique, Session, Semestre, TypeEvaluation
from users.models import StatutEtudiant

class Command(BaseCommand):
    help = 'Initialize basic data for the academic system'
    
    def handle(self, *args, **options):
        self.stdout.write('Initialisation des données de base...')
        
        with transaction.atomic():
            # Domaines
            domaines_data = [
                {'nom': 'Sciences et Technologies', 'code': 'ST'},
                {'nom': 'Sciences Humaines et Sociales', 'code': 'SHS'},
                {'nom': 'Sciences Économiques et de Gestion', 'code': 'SEG'},
                {'nom': 'Sciences de la Santé', 'code': 'SS'},
            ]
            
            for data in domaines_data:
                domaine, created = Domaine.objects.get_or_create(
                    code=data['code'],
                    defaults={'nom': data['nom']}
                )
                if created:
                    self.stdout.write(f'Domaine créé: {domaine.nom}')
            
            # Cycles
            cycles_data = [
                {'nom': 'Licence', 'code': 'L', 'duree_annees': 3},
                {'nom': 'Master', 'code': 'M', 'duree_annees': 2},
                {'nom': 'Doctorat', 'code': 'D', 'duree_annees': 3},
            ]
            
            for data in cycles_data:
                cycle, created = Cycle.objects.get_or_create(
                    code=data['code'],
                    defaults={
                        'nom': data['nom'],
                        'duree_annees': data['duree_annees']
                    }
                )
                if created:
                    self.stdout.write(f'Cycle créé: {cycle.nom}')
            
            # Types de formation
            cycle_licence = Cycle.objects.get(code='L')
            cycle_master = Cycle.objects.get(code='M')
            
            types_formation_data = [
                {'nom': 'Licence Générale', 'code': 'LG', 'cycle': cycle_licence},
                {'nom': 'Licence Professionnelle', 'code': 'LP', 'cycle': cycle_licence},
                {'nom': 'Master Recherche', 'code': 'MR', 'cycle': cycle_master},
                {'nom': 'Master Professionnel', 'code': 'MP', 'cycle': cycle_master},
            ]
            
            for data in types_formation_data:
                type_formation, created = TypeFormation.objects.get_or_create(
                    code=data['code'],
                    cycle=data['cycle'],
                    defaults={'nom': data['nom']}
                )
                if created:
                    self.stdout.write(f'Type de formation créé: {type_formation.nom}')
            
            # Niveaux
            niveaux_data = [
                {'nom': 'L1', 'numero': 1, 'cycle': cycle_licence, 'credits_requis': 60},
                {'nom': 'L2', 'numero': 2, 'cycle': cycle_licence, 'credits_requis': 60},
                {'nom': 'L3', 'numero': 3, 'cycle': cycle_licence, 'credits_requis': 60},
                {'nom': 'M1', 'numero': 1, 'cycle': cycle_master, 'credits_requis': 60},
                {'nom': 'M2', 'numero': 2, 'cycle': cycle_master, 'credits_requis': 60},
            ]
            
            for data in niveaux_data:
                niveau, created = Niveau.objects.get_or_create(
                    nom=data['nom'],
                    cycle=data['cycle'],
                    defaults={
                        'numero': data['numero'],
                        'credits_requis': data['credits_requis']
                    }
                )
                if created:
                    self.stdout.write(f'Niveau créé: {niveau.nom}')
            
            # Sessions
            sessions_data = [
                {'nom': 'Session Normale', 'code': 'SN', 'ordre': 1},
                {'nom': 'Session de Rattrapage', 'code': 'SR', 'ordre': 2},
            ]
            
            for data in sessions_data:
                session, created = Session.objects.get_or_create(
                    code=data['code'],
                    defaults={
                        'nom': data['nom'],
                        'ordre': data['ordre']
                    }
                )
                if created:
                    self.stdout.write(f'Session créée: {session.nom}')
            
            # Semestres
            semestres_data = [
                {'nom': 'Semestre 1', 'numero': 1},
                {'nom': 'Semestre 2', 'numero': 2},
            ]
            
            for data in semestres_data:
                semestre, created = Semestre.objects.get_or_create(
                    numero=data['numero'],
                    defaults={'nom': data['nom']}
                )
                if created:
                    self.stdout.write(f'Semestre créé: {semestre.nom}')
            
            # Types d'évaluation
            types_eval_data = [
                {'nom': 'Contrôle Continu', 'code': 'CC'},
                {'nom': 'Partiel', 'code': 'PART'},
                {'nom': 'Examen Final', 'code': 'EF'},
                {'nom': 'Travaux Pratiques', 'code': 'TP'},
                {'nom': 'Travaux Dirigés', 'code': 'TD'},
                {'nom': 'Projet', 'code': 'PROJ'},
                {'nom': 'Exposé', 'code': 'EXP'},
            ]
            
            for data in types_eval_data:
                type_eval, created = TypeEvaluation.objects.get_or_create(
                    code=data['code'],
                    defaults={'nom': data['nom']}
                )
                if created:
                    self.stdout.write(f'Type d\'évaluation créé: {type_eval.nom}')
            
            # Statuts étudiants
            statuts_data = [
                {'nom': 'Inscrit', 'code': 'INS'},
                {'nom': 'Admis', 'code': 'ADM'},
                {'nom': 'Redoublant', 'code': 'RED'},
                {'nom': 'Exclu', 'code': 'EXC'},
                {'nom': 'Abandonnant', 'code': 'ABA'},
                {'nom': 'Diplômé', 'code': 'DIP'},
            ]
            
            for data in statuts_data:
                statut, created = StatutEtudiant.objects.get_or_create(
                    code=data['code'],
                    defaults={'nom': data['nom']}
                )
                if created:
                    self.stdout.write(f'Statut étudiant créé: {statut.nom}')
        
        self.stdout.write(
            self.style.SUCCESS('Données de base initialisées avec succès!')
        )
