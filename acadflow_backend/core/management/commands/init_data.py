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


# core/management/commands/export_data.py
from django.core.management.base import BaseCommand
from django.http import HttpResponse
import csv
from io import StringIO
from evaluations.models import MoyenneSemestre, Note
from users.models import Inscription

class Command(BaseCommand):
    help = 'Export data to CSV'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--type',
            choices=['notes', 'moyennes', 'inscriptions'],
            required=True,
            help='Type of data to export',
        )
        parser.add_argument(
            '--output',
            type=str,
            help='Output file path',
        )
        parser.add_argument(
            '--classe-id',
            type=int,
            help='Filter by classe',
        )
        parser.add_argument(
            '--session-id',
            type=int,
            help='Filter by session',
        )
    
    def handle(self, *args, **options):
        output = StringIO()
        
        if options['type'] == 'notes':
            self.export_notes(output, options)
        elif options['type'] == 'moyennes':
            self.export_moyennes(output, options)
        elif options['type'] == 'inscriptions':
            self.export_inscriptions(output, options)
        
        content = output.getvalue()
        
        if options['output']:
            with open(options['output'], 'w', encoding='utf-8') as f:
                f.write(content)
            self.stdout.write(f'Données exportées vers: {options["output"]}')
        else:
            self.stdout.write(content)
    
    def export_notes(self, output, options):
        writer = csv.writer(output)
        writer.writerow([
            'Matricule', 'Nom Complet', 'EC Code', 'EC Nom', 'Évaluation',
            'Type Évaluation', 'Note Obtenue', 'Note Sur', 'Absent', 'Session'
        ])
        
        notes = Note.objects.select_related(
            'etudiant__user', 'evaluation__enseignement__ec',
            'evaluation__type_evaluation', 'evaluation__session'
        )
        
        if options['classe_id']:
            notes = notes.filter(
                evaluation__enseignement__classe_id=options['classe_id']
            )
        
        if options['session_id']:
            notes = notes.filter(evaluation__session_id=options['session_id'])
        
        for note in notes:
            writer.writerow([
                note.etudiant.user.matricule,
                note.etudiant.user.get_full_name(),
                note.evaluation.enseignement.ec.code,
                note.evaluation.enseignement.ec.nom,
                note.evaluation.nom,
                note.evaluation.type_evaluation.nom,
                note.note_obtenue,
                note.evaluation.note_sur,
                'Oui' if note.absent else 'Non',
                note.evaluation.session.nom
            ])
    
    def export_moyennes(self, output, options):
        writer = csv.writer(output)
        writer.writerow([
            'Matricule', 'Nom Complet', 'Classe', 'Semestre',
            'Moyenne Générale', 'Crédits Obtenus', 'Crédits Requis',
            'Session', 'Année Académique'
        ])
        
        moyennes = MoyenneSemestre.objects.select_related(
            'etudiant__user', 'classe', 'semestre', 'session', 'annee_academique'
        )
        
        if options['classe_id']:
            moyennes = moyennes.filter(classe_id=options['classe_id'])
        
        if options['session_id']:
            moyennes = moyennes.filter(session_id=options['session_id'])
        
        for moyenne in moyennes:
            writer.writerow([
                moyenne.etudiant.user.matricule,
                moyenne.etudiant.user.get_full_name(),
                moyenne.classe.nom,
                moyenne.semestre.nom,
                moyenne.moyenne_generale,
                moyenne.credits_obtenus,
                moyenne.credits_requis,
                moyenne.session.nom,
                moyenne.annee_academique.libelle
            ])
    
    def export_inscriptions(self, output, options):
        writer = csv.writer(output)
        writer.writerow([
            'Matricule', 'Nom Complet', 'Email', 'Classe', 'Filière',
            'Niveau', 'Statut', 'Nombre Redoublements', 'Date Inscription',
            'Année Académique'
        ])
        
        inscriptions = Inscription.objects.select_related(
            'etudiant__user', 'classe__filiere', 'classe__niveau',
            'statut', 'annee_academique'
        ).filter(active=True)
        
        if options['classe_id']:
            inscriptions = inscriptions.filter(classe_id=options['classe_id'])
        
        for inscription in inscriptions:
            writer.writerow([
                inscription.etudiant.user.matricule,
                inscription.etudiant.user.get_full_name(),
                inscription.etudiant.user.email,
                inscription.classe.nom,
                inscription.classe.filiere.nom,
                inscription.classe.niveau.nom,
                inscription.statut.nom,
                inscription.nombre_redoublements,
                inscription.date_inscription,
                inscription.annee_academique.libelle
            ])


# core/management/commands/backup_db.py
from django.core.management.base import BaseCommand
from django.core.management import call_command
from django.conf import settings
import os
from datetime import datetime

class Command(BaseCommand):
    help = 'Create database backup'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--output-dir',
            type=str,
            default='backups',
            help='Output directory for backup files',
        )
    
    def handle(self, *args, **options):
        # Créer le répertoire de sauvegarde s'il n'existe pas
        backup_dir = options['output_dir']
        os.makedirs(backup_dir, exist_ok=True)
        
        # Nom du fichier avec timestamp
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        backup_file = os.path.join(backup_dir, f'acadflow_backup_{timestamp}.json')
        
        try:
            with open(backup_file, 'w') as f:
                call_command('dumpdata', stdout=f, indent=2)
            
            self.stdout.write(
                self.style.SUCCESS(f'Sauvegarde créée: {backup_file}')
            )
            
            # Afficher la taille du fichier
            size = os.path.getsize(backup_file)
            self.stdout.write(f'Taille: {size / 1024 / 1024:.2f} MB')
            
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Erreur lors de la sauvegarde: {str(e)}')
            )