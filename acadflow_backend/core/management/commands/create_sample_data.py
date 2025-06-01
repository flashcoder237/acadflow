# core/management/commands/create_sample_data.py
from django.core.management.base import BaseCommand
from django.db import transaction
from django.contrib.auth import get_user_model
from core.models import Domaine, Cycle, TypeFormation, Filiere, Option, Niveau
from academics.models import AnneeAcademique, Classe, UE, EC, ConfigurationEvaluationEC, TypeEvaluation
from users.models import Enseignant, Etudiant, StatutEtudiant, Inscription
import random
from datetime import date

User = get_user_model()

class Command(BaseCommand):
    help = 'Create sample data for testing'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--students',
            type=int,
            default=50,
            help='Number of students to create',
        )
        parser.add_argument(
            '--teachers',
            type=int,
            default=10,
            help='Number of teachers to create',
        )
    
    def handle(self, *args, **options):
        self.stdout.write('Création des données d\'exemple...')
        
        with transaction.atomic():
            # Créer l'année académique active
            annee, created = AnneeAcademique.objects.get_or_create(
                libelle='2024-2025',
                defaults={
                    'date_debut': date(2024, 9, 1),
                    'date_fin': date(2025, 7, 31),
                    'active': True
                }
            )
            if created:
                self.stdout.write(f'Année académique créée: {annee.libelle}')
            
            # Créer quelques filières
            domaine_st = Domaine.objects.get(code='ST')
            cycle_licence = Cycle.objects.get(code='L')
            type_lg = TypeFormation.objects.get(code='LG')
            
            filieres_data = [
                {'nom': 'Informatique', 'code': 'INFO'},
                {'nom': 'Génie Électrique', 'code': 'GELEC'},
                {'nom': 'Mathématiques', 'code': 'MATH'},
                {'nom': 'Physique', 'code': 'PHYS'},
            ]
            
            filieres = []
            for data in filieres_data:
                filiere, created = Filiere.objects.get_or_create(
                    code=data['code'],
                    type_formation=type_lg,
                    defaults={
                        'nom': data['nom'],
                        'domaine': domaine_st
                    }
                )
                filieres.append(filiere)
                if created:
                    self.stdout.write(f'Filière créée: {filiere.nom}')
            
            # Créer des options
            filiere_info = Filiere.objects.get(code='INFO')
            options_data = [
                {'nom': 'Génie Logiciel', 'code': 'GL'},
                {'nom': 'Réseaux et Sécurité', 'code': 'RS'},
                {'nom': 'Intelligence Artificielle', 'code': 'IA'},
            ]
            
            for data in options_data:
                option, created = Option.objects.get_or_create(
                    code=data['code'],
                    filiere=filiere_info,
                    defaults={'nom': data['nom']}
                )
                if created:
                    self.stdout.write(f'Option créée: {option.nom}')
            
            # Créer des classes
            niveaux = Niveau.objects.filter(cycle=cycle_licence)
            classes = []
            
            for filiere in filieres:
                for niveau in niveaux:
                    classe, created = Classe.objects.get_or_create(
                        code=f"{filiere.code}_{niveau.nom}_{annee.libelle.replace('-', '_')}",
                        annee_academique=annee,
                        defaults={
                            'nom': f"{filiere.nom} {niveau.nom}",
                            'filiere': filiere,
                            'niveau': niveau,
                            'effectif_max': 40
                        }
                    )
                    classes.append(classe)
                    if created:
                        self.stdout.write(f'Classe créée: {classe.nom}')
            
            # Créer des UEs et ECs
            from academics.models import Semestre
            semestres = Semestre.objects.all()
            
            for niveau in niveaux:
                for semestre in semestres:
                    # UEs par niveau et semestre
                    ues_data = [
                        {'nom': 'Mathématiques', 'code': f'MAT{niveau.numero}{semestre.numero}', 'credits': 6},
                        {'nom': 'Informatique', 'code': f'INF{niveau.numero}{semestre.numero}', 'credits': 6},
                        {'nom': 'Physique', 'code': f'PHY{niveau.numero}{semestre.numero}', 'credits': 4},
                        {'nom': 'Anglais', 'code': f'ANG{niveau.numero}{semestre.numero}', 'credits': 2},
                    ]
                    
                    for ue_data in ues_data:
                        ue, created = UE.objects.get_or_create(
                            code=ue_data['code'],
                            niveau=niveau,
                            semestre=semestre,
                            defaults={
                                'nom': ue_data['nom'],
                                'credits': ue_data['credits'],
                                'coefficient': 1.0
                            }
                        )
                        
                        if created:
                            self.stdout.write(f'UE créée: {ue.code}')
                            
                            # Créer des ECs pour chaque UE
                            ecs_data = [
                                {'nom': f'{ue.nom} - Cours', 'code': f'{ue.code}_CM', 'poids': 60.0},
                                {'nom': f'{ue.nom} - TD', 'code': f'{ue.code}_TD', 'poids': 40.0},
                            ]
                            
                            for ec_data in ecs_data:
                                ec, created = EC.objects.get_or_create(
                                    code=ec_data['code'],
                                    ue=ue,
                                    defaults={
                                        'nom': ec_data['nom'],
                                        'poids_ec': ec_data['poids']
                                    }
                                )
                                
                                if created:
                                    # Configurer les évaluations pour chaque EC
                                    type_cc = TypeEvaluation.objects.get(code='CC')
                                    type_ef = TypeEvaluation.objects.get(code='EF')
                                    
                                    ConfigurationEvaluationEC.objects.create(
                                        ec=ec,
                                        type_evaluation=type_cc,
                                        pourcentage=40.0
                                    )
                                    
                                    ConfigurationEvaluationEC.objects.create(
                                        ec=ec,
                                        type_evaluation=type_ef,
                                        pourcentage=60.0
                                    )
            
            # Créer des enseignants
            grades = ['assistant', 'maitre_assistant', 'maitre_conference', 'professeur']
            specialites = ['Informatique', 'Mathématiques', 'Physique', 'Électronique', 'Anglais']
            
            for i in range(options['teachers']):
                user = User.objects.create_user(
                    username=f'ens{i+1:03d}',
                    password='password123',
                    first_name=f'Enseignant{i+1}',
                    last_name=f'Test{i+1}',
                    email=f'enseignant{i+1}@example.com',
                    type_utilisateur='enseignant',
                    matricule=f'ENS{2024}{i+1:03d}'
                )
                
                Enseignant.objects.create(
                    user=user,
                    grade=random.choice(grades),
                    specialite=random.choice(specialites),
                    statut='Permanent'
                )
                
                if (i + 1) % 5 == 0:
                    self.stdout.write(f'{i+1} enseignants créés...')
            
            # Créer des étudiants
            statut_inscrit = StatutEtudiant.objects.get(code='INS')
            
            for i in range(options['students']):
                user = User.objects.create_user(
                    username=f'etu{i+1:05d}',
                    password='password123',
                    first_name=f'Étudiant{i+1}',
                    last_name=f'Test{i+1}',
                    email=f'etudiant{i+1}@example.com',
                    type_utilisateur='etudiant',
                    matricule=f'ETU{2024}{i+1:05d}'
                )
                
                etudiant = Etudiant.objects.create(
                    user=user,
                    numero_carte=f'CARTE{2024}{i+1:05d}',
                    statut_current='inscrit'
                )
                
                # Inscrire l'étudiant dans une classe aléatoire
                classe = random.choice(classes)
                Inscription.objects.create(
                    etudiant=etudiant,
                    classe=classe,
                    annee_academique=annee,
                    statut=statut_inscrit,
                    nombre_redoublements=random.choice([0, 0, 0, 1]) # 75% sans redoublement
                )
                
                if (i + 1) % 10 == 0:
                    self.stdout.write(f'{i+1} étudiants créés...')
            
            # Créer quelques enseignements
            from evaluations.models import Enseignement
            enseignants = Enseignant.objects.all()
            
            for classe in classes[:5]:  # Seulement les 5 premières classes
                ecs = EC.objects.filter(ue__niveau=classe.niveau)
                for ec in ecs[:3]:  # 3 ECs par classe
                    enseignant = random.choice(enseignants)
                    
                    Enseignement.objects.get_or_create(
                        enseignant=enseignant,
                        ec=ec,
                        classe=classe,
                        annee_academique=annee,
                        defaults={'actif': True}
                    )
            
            # Créer un superuser si nécessaire
            if not User.objects.filter(is_superuser=True).exists():
                User.objects.create_superuser(
                    username='admin',
                    email='admin@example.com',
                    password='admin123',
                    matricule='ADMIN001',
                    type_utilisateur='admin'
                )
                self.stdout.write('Superuser créé: admin/admin123')
        
        self.stdout.write(
            self.style.SUCCESS(
                f'Données d\'exemple créées avec succès!\n'
                f'- {options["students"]} étudiants\n'
                f'- {options["teachers"]} enseignants\n'
                f'- {len(classes)} classes\n'
                f'- Superuser: admin/admin123'
            )
        )
