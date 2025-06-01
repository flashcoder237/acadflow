# academics/management/commands/init_medical_school_data.py
import os
import django
from django.core.management.base import BaseCommand
from django.db import transaction
from django.contrib.auth import get_user_model
from datetime import date, datetime
from decimal import Decimal
import random

# Configuration Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'acadflow_backend.settings')
django.setup()

from core.models import Domaine, Cycle, TypeFormation, Filiere, Option, Niveau
from academics.models import (
    AnneeAcademique, Session, Semestre, Classe, UE, EC, 
    TypeEvaluation, ConfigurationEvaluationEC
)
from users.models import User, Enseignant, Etudiant, StatutEtudiant, Inscription

class Command(BaseCommand):
    help = 'Initialise les données de test pour une faculté de médecine'
    
    def handle(self, *args, **options):
        with transaction.atomic():
            self.stdout.write('🏥 Initialisation des données pour la Faculté de Médecine...')
            
            # 1. Créer les structures de base
            self.create_basic_structures()
            
            # 2. Créer les domaines et filières
            self.create_domains_and_programs()
            
            # 3. Créer les années académiques
            self.create_academic_years()
            
            # 4. Créer les sessions et semestres
            self.create_sessions_and_semesters()
            
            # 5. Créer les UE et EC
            self.create_ue_and_ec()
            
            # 6. Créer les types d'évaluation
            self.create_evaluation_types()
            
            # 7. Créer les utilisateurs et profils
            self.create_users_and_profiles()
            
            # 8. Créer les classes et inscriptions
            self.create_classes_and_enrollments()
            
            # 9. Configurer les évaluations
            self.configure_evaluations()
            
            self.stdout.write(
                self.style.SUCCESS('✅ Initialisation terminée avec succès!')
            )
    
    def create_basic_structures(self):
        """Créer les cycles et types de formation"""
        self.stdout.write('📚 Création des cycles et types de formation...')
        
        # Cycles
        licence, _ = Cycle.objects.get_or_create(
            nom='Licence',
            code='L',
            duree_annees=3
        )
        
        master, _ = Cycle.objects.get_or_create(
            nom='Master',
            code='M',
            duree_annees=2
        )
        
        doctorat, _ = Cycle.objects.get_or_create(
            nom='Doctorat',
            code='D',
            duree_annees=3
        )
        
        # Types de formation
        TypeFormation.objects.get_or_create(
            nom='Licence Professionnelle',
            code='LP',
            cycle=licence
        )
        
        TypeFormation.objects.get_or_create(
            nom='Master Professionnel',
            code='MP',
            cycle=master
        )
        
        TypeFormation.objects.get_or_create(
            nom='Master Recherche',
            code='MR',
            cycle=master
        )
        
        TypeFormation.objects.get_or_create(
            nom='Doctorat PhD',
            code='PhD',
            cycle=doctorat
        )
        
        # Niveaux
        niveaux_data = [
            ('L1', 1, licence, 60),
            ('L2', 2, licence, 60),
            ('L3', 3, licence, 60),
            ('M1', 1, master, 60),
            ('M2', 2, master, 60),
            ('D1', 1, doctorat, 60),
            ('D2', 2, doctorat, 60),
            ('D3', 3, doctorat, 60),
        ]
        
        for nom, numero, cycle, credits in niveaux_data:
            Niveau.objects.get_or_create(
                nom=nom,
                numero=numero,
                cycle=cycle,
                credits_requis=credits
            )
    
    def create_domains_and_programs(self):
        """Créer les domaines et filières médicales"""
        self.stdout.write('🏥 Création des domaines et filières médicales...')
        
        # Domaine principal
        sciences_sante, _ = Domaine.objects.get_or_create(
            nom='Sciences de la Santé',
            code='SS',
            description='Domaine regroupant toutes les formations médicales et paramédicales'
        )
        
        # Types de formation
        licence_pro = TypeFormation.objects.get(code='LP')
        master_pro = TypeFormation.objects.get(code='MP')
        master_recherche = TypeFormation.objects.get(code='MR')
        
        # Filières médicales
        filieres_data = [
            ('Médecine Générale', 'MG', licence_pro),
            ('Médecine Spécialisée', 'MS', master_pro),
            ('Pharmacie', 'PHAR', licence_pro),
            ('Dentaire', 'DENT', licence_pro),
            ('Kinésithérapie', 'KINE', licence_pro),
            ('Infirmerie', 'INF', licence_pro),
            ('Sage-femme', 'SF', licence_pro),
            ('Laboratoire Médical', 'LAB', licence_pro),
            ('Radiologie', 'RADIO', master_pro),
            ('Recherche Biomédicale', 'BIO', master_recherche),
        ]
        
        for nom, code, type_formation in filieres_data:
            filiere, created = Filiere.objects.get_or_create(
                nom=nom,
                code=code,
                domaine=sciences_sante,
                type_formation=type_formation
            )
            
            # Créer des options/spécialisations
            if nom == 'Médecine Spécialisée':
                options_medecine = [
                    ('Cardiologie', 'CARD'),
                    ('Neurologie', 'NEUR'),
                    ('Pédiatrie', 'PEDI'),
                    ('Gynécologie', 'GYNE'),
                    ('Chirurgie Générale', 'CHIR'),
                    ('Anesthésie-Réanimation', 'ANES'),
                    ('Radiologie', 'RADI'),
                    ('Psychiatrie', 'PSYC'),
                    ('Dermatologie', 'DERM'),
                    ('Ophtalmologie', 'OPHT')
                ]
                for option_nom, option_code in options_medecine:
                    Option.objects.get_or_create(
                        nom=option_nom,
                        code=option_code,
                        filiere=filiere
                    )
            
            elif nom == 'Pharmacie':
                options_pharmacie = [
                    ('Pharmacie Clinique', 'PHAR_CLI'),
                    ('Pharmacie Industrielle', 'PHAR_IND'),
                    ('Pharmacie Communautaire', 'PHAR_COM'),
                    ('Pharmacologie', 'PHARMACO')
                ]
                for option_nom, option_code in options_pharmacie:
                    Option.objects.get_or_create(
                        nom=option_nom,
                        code=option_code,
                        filiere=filiere
                    )
    
    def create_academic_years(self):
        """Créer les années académiques"""
        self.stdout.write('📅 Création des années académiques...')
        
        annees = [
            ('2022-2023', date(2022, 9, 1), date(2023, 7, 31), False),
            ('2023-2024', date(2023, 9, 1), date(2024, 7, 31), False),
            ('2024-2025', date(2024, 9, 1), date(2025, 7, 31), True),  # Année active
        ]
        
        for libelle, debut, fin, active in annees:
            AnneeAcademique.objects.get_or_create(
                libelle=libelle,
                date_debut=debut,
                date_fin=fin,
                active=active
            )
    
    def create_sessions_and_semesters(self):
        """Créer les sessions et semestres"""
        self.stdout.write('📋 Création des sessions et semestres...')
        
        # Sessions
        sessions_data = [
            ('Session Normale', 'SN', 1),
            ('Session de Rattrapage', 'SR', 2),
        ]
        
        for nom, code, ordre in sessions_data:
            Session.objects.get_or_create(
                nom=nom,
                code=code,
                ordre=ordre
            )
        
        # Semestres
        semestres_data = [
            ('Semestre 1', 1),
            ('Semestre 2', 2),
        ]
        
        for nom, numero in semestres_data:
            Semestre.objects.get_or_create(
                nom=nom,
                numero=numero
            )
    
    def create_ue_and_ec(self):
        """Créer les UE et EC pour les programmes médicaux"""
        self.stdout.write('📖 Création des UE et EC...')
        
        # Récupérer les niveaux et semestres
        niveaux = {niveau.nom: niveau for niveau in Niveau.objects.all()}
        semestres = {s.numero: s for s in Semestre.objects.all()}
        
        # UE pour L1 - Semestre 1
        ues_l1_s1 = [
            {
                'nom': 'Anatomie Générale',
                'code': 'ANAT101',
                'credits': 6,
                'coefficient': 2.0,
                'ecs': [
                    ('Anatomie Descriptive', 'ANAT101A', 60),
                    ('Travaux Pratiques Anatomie', 'ANAT101B', 40)
                ]
            },
            {
                'nom': 'Physiologie Humaine',
                'code': 'PHYS101',
                'credits': 5,
                'coefficient': 1.5,
                'ecs': [
                    ('Physiologie Générale', 'PHYS101A', 70),
                    ('TP Physiologie', 'PHYS101B', 30)
                ]
            },
            {
                'nom': 'Biochimie Structurale',
                'code': 'BIOC101',
                'credits': 4,
                'coefficient': 1.5,
                'ecs': [
                    ('Biochimie Fondamentale', 'BIOC101A', 80),
                    ('TP Biochimie', 'BIOC101B', 20)
                ]
            },
            {
                'nom': 'Biophysique',
                'code': 'BIOP101',
                'credits': 3,
                'coefficient': 1.0,
                'ecs': [
                    ('Biophysique Théorique', 'BIOP101A', 100)
                ]
            },
            {
                'nom': 'Histologie',
                'code': 'HIST101',
                'credits': 4,
                'coefficient': 1.5,
                'ecs': [
                    ('Histologie Générale', 'HIST101A', 60),
                    ('TP Histologie', 'HIST101B', 40)
                ]
            }
        ]
        
        self.create_ues_for_level('L1', 1, ues_l1_s1, niveaux, semestres)
        
        # UE pour L1 - Semestre 2
        ues_l1_s2 = [
            {
                'nom': 'Anatomie Systémique',
                'code': 'ANAT102',
                'credits': 6,
                'coefficient': 2.0,
                'ecs': [
                    ('Système Cardiovasculaire', 'ANAT102A', 50),
                    ('Système Respiratoire', 'ANAT102B', 50)
                ]
            },
            {
                'nom': 'Physiologie Spécialisée',
                'code': 'PHYS102',
                'credits': 5,
                'coefficient': 1.5,
                'ecs': [
                    ('Physiologie Cardiovasculaire', 'PHYS102A', 60),
                    ('Physiologie Respiratoire', 'PHYS102B', 40)
                ]
            },
            {
                'nom': 'Microbiologie',
                'code': 'MICR101',
                'credits': 4,
                'coefficient': 1.5,
                'ecs': [
                    ('Microbiologie Générale', 'MICR101A', 70),
                    ('TP Microbiologie', 'MICR101B', 30)
                ]
            },
            {
                'nom': 'Génétique Médicale',
                'code': 'GENE101',
                'credits': 3,
                'coefficient': 1.0,
                'ecs': [
                    ('Génétique Fondamentale', 'GENE101A', 100)
                ]
            },
            {
                'nom': 'Embryologie',
                'code': 'EMBR101',
                'credits': 4,
                'coefficient': 1.5,
                'ecs': [
                    ('Embryologie Générale', 'EMBR101A', 60),
                    ('TP Embryologie', 'EMBR101B', 40)
                ]
            }
        ]
        
        self.create_ues_for_level('L1', 2, ues_l1_s2, niveaux, semestres)
        
        # UE pour L2 - Exemples
        ues_l2_s1 = [
            {
                'nom': 'Pathologie Générale',
                'code': 'PATH201',
                'credits': 6,
                'coefficient': 2.0,
                'ecs': [
                    ('Pathologie Cellulaire', 'PATH201A', 60),
                    ('Anatomie Pathologique', 'PATH201B', 40)
                ]
            },
            {
                'nom': 'Pharmacologie Générale',
                'code': 'PHAR201',
                'credits': 5,
                'coefficient': 1.5,
                'ecs': [
                    ('Pharmacologie Fondamentale', 'PHAR201A', 70),
                    ('Toxicologie', 'PHAR201B', 30)
                ]
            },
            {
                'nom': 'Immunologie',
                'code': 'IMMU201',
                'credits': 4,
                'coefficient': 1.5,
                'ecs': [
                    ('Immunologie Générale', 'IMMU201A', 80),
                    ('TP Immunologie', 'IMMU201B', 20)
                ]
            }
        ]
        
        self.create_ues_for_level('L2', 1, ues_l2_s1, niveaux, semestres)
    
    def create_ues_for_level(self, niveau_nom, semestre_num, ues_data, niveaux, semestres):
        """Créer les UE pour un niveau et semestre donnés"""
        niveau = niveaux[niveau_nom]
        semestre = semestres[semestre_num]
        
        for ue_data in ues_data:
            ue, created = UE.objects.get_or_create(
                nom=ue_data['nom'],
                code=ue_data['code'],
                niveau=niveau,
                semestre=semestre,
                defaults={
                    'credits': ue_data['credits'],
                    'coefficient': ue_data['coefficient'],
                    'type_ue': 'obligatoire'
                }
            )
            
            # Créer les EC pour cette UE
            for ec_nom, ec_code, poids in ue_data['ecs']:
                EC.objects.get_or_create(
                    nom=ec_nom,
                    code=ec_code,
                    ue=ue,
                    defaults={'poids_ec': poids}
                )
    
    def create_evaluation_types(self):
        """Créer les types d'évaluation"""
        self.stdout.write("📝 Création des types d'évaluation...")
        
        types_evaluation = [
            ('Contrôle Continu', 'CC', 'Évaluations régulières pendant le semestre'),
            ('Travaux Dirigés', 'TD', 'Évaluations lors des séances de TD'),
            ('Travaux Pratiques', 'TP', 'Évaluations des travaux pratiques'),
            ('Partiel', 'PART', 'Examen partiel de mi-semestre'),
            ('Examen Final', 'EXAM', 'Examen final de fin de semestre'),
            ('Présentation Orale', 'ORAL', 'Exposés et présentations orales'),
            ('Rapport de Stage', 'STAGE', 'Évaluation des stages cliniques'),
        ]
        
        for nom, code, description in types_evaluation:
            TypeEvaluation.objects.get_or_create(
                nom=nom,
                code=code,
                defaults={'description': description}
            )
    
    def create_users_and_profiles(self):
        """Créer les utilisateurs et profils"""
        self.stdout.write('👥 Création des utilisateurs et profils...')
        
        # Créer l'administrateur
        admin_user, created = User.objects.get_or_create(
            username='admin',
            defaults={
                'first_name': 'Administrateur',
                'last_name': 'Système',
                'email': 'admin@faculte-medecine.cm',
                'type_utilisateur': 'admin',
                'matricule': 'ADM001',
                'is_staff': True,
                'is_superuser': True
            }
        )
        if created:
            admin_user.set_password('admin123')
            admin_user.save()
        
        # Créer des enseignants
        enseignants_data = [
            {
                'prenom': 'Jean-Claude', 'nom': 'MBALLA',
                'email': 'jc.mballa@faculte-medecine.cm',
                'matricule': 'ENS001', 'grade': 'professeur',
                'specialite': 'Anatomie et Cytologie Pathologiques'
            },
            {
                'prenom': 'Marie-Claire', 'nom': 'NGONO',
                'email': 'mc.ngono@faculte-medecine.cm',
                'matricule': 'ENS002', 'grade': 'maitre_conference',
                'specialite': 'Physiologie Humaine'
            },
            {
                'prenom': 'Paul', 'nom': 'FOUDA',
                'email': 'p.fouda@faculte-medecine.cm',
                'matricule': 'ENS003', 'grade': 'maitre_assistant',
                'specialite': 'Biochimie Médicale'
            },
            {
                'prenom': 'Françoise', 'nom': 'TALLA',
                'email': 'f.talla@faculte-medecine.cm',
                'matricule': 'ENS004', 'grade': 'maitre_conference',
                'specialite': 'Microbiologie et Immunologie'
            },
            {
                'prenom': 'Bernard', 'nom': 'ATEBA',
                'email': 'b.ateba@faculte-medecine.cm',
                'matricule': 'ENS005', 'grade': 'professeur',
                'specialite': 'Pharmacologie et Toxicologie'
            },
        ]
        
        for data in enseignants_data:
            user, created = User.objects.get_or_create(
                username=data['matricule'].lower(),
                defaults={
                    'first_name': data['prenom'],
                    'last_name': data['nom'],
                    'email': data['email'],
                    'type_utilisateur': 'enseignant',
                    'matricule': data['matricule']
                }
            )
            if created:
                user.set_password('ens123')
                user.save()
            
            Enseignant.objects.get_or_create(
                user=user,
                defaults={
                    'grade': data['grade'],
                    'specialite': data['specialite'],
                    'statut': 'Permanent'
                }
            )
        
        # Créer des statuts étudiants
        statuts_data = [
            ('Inscrit', 'INS', 'Étudiant régulièrement inscrit'),
            ('Redoublant', 'RED', 'Étudiant en redoublement'),
            ('Transféré', 'TRA', 'Étudiant transféré d\'un autre établissement'),
            ('Suspendu', 'SUS', 'Étudiant temporairement suspendu'),
        ]
        
        for nom, code, description in statuts_data:
            StatutEtudiant.objects.get_or_create(
                nom=nom,
                code=code,
                defaults={'description': description}
            )
        
        # Créer des étudiants
        self.create_students()
    
    def create_students(self):
        """Créer des étudiants de test"""
        self.stdout.write('🎓 Création des étudiants...')
        
        prenoms_masculins = [
            'Jean', 'Paul', 'Pierre', 'André', 'Bernard', 'Michel', 'Alain',
            'François', 'Claude', 'Daniel', 'Marcel', 'Roger', 'Henri',
            'Patrick', 'Philippe', 'Jacques', 'Robert', 'Louis', 'Éric'
        ]
        
        prenoms_feminins = [
            'Marie', 'Françoise', 'Monique', 'Sylvie', 'Catherine', 'Martine',
            'Christine', 'Brigitte', 'Nicole', 'Denise', 'Chantal', 'Isabelle',
            'Nathalie', 'Valérie', 'Corinne', 'Véronique', 'Laurence', 'Sandrine'
        ]
        
        noms_famille = [
            'ABANDA', 'MBALLA', 'NGONO', 'FOUDA', 'TALLA', 'ATEBA', 'NJOYA',
            'KAMGA', 'TCHOUA', 'MBARGA', 'ESSOMBA', 'OLINGA', 'MBOUP', 'NDAM',
            'BELINGA', 'ONANA', 'OMBOLO', 'MVOGO', 'EBANGA', 'FEUDJIO'
        ]
        
        # Créer 50 étudiants
        for i in range(1, 51):
            # Alterner entre masculin et féminin
            if i % 2 == 0:
                prenom = random.choice(prenoms_feminins)
            else:
                prenom = random.choice(prenoms_masculins)
            
            nom = random.choice(noms_famille)
            matricule = f'MED{i:04d}'
            
            user, created = User.objects.get_or_create(
                username=matricule.lower(),
                defaults={
                    'first_name': prenom,
                    'last_name': nom,
                    'email': f'{matricule.lower()}@etudiant.faculte-medecine.cm',
                    'type_utilisateur': 'etudiant',
                    'matricule': matricule,
                    'date_naissance': date(1998 + random.randint(0, 5), 
                                         random.randint(1, 12), 
                                         random.randint(1, 28))
                }
            )
            if created:
                user.set_password('etud123')
                user.save()
            
            Etudiant.objects.get_or_create(
                user=user,
                defaults={
                    'numero_carte': f'CARTE{i:04d}',
                    'statut_current': 'inscrit'
                }
            )
    
    def create_classes_and_enrollments(self):
        """Créer les classes et inscriptions"""
        self.stdout.write('🏫 Création des classes et inscriptions...')
        
        # Récupérer les objets nécessaires
        annee_active = AnneeAcademique.objects.get(active=True)
        filiere_medecine = Filiere.objects.get(code='MG')
        niveaux = {niveau.nom: niveau for niveau in Niveau.objects.all()}
        statut_inscrit = StatutEtudiant.objects.get(code='INS')
        
        # Créer les classes
        classes_data = [
            ('MED L1 A', 'MEDL1A', 'L1'),
            ('MED L1 B', 'MEDL1B', 'L1'),
            ('MED L2 A', 'MEDL2A', 'L2'),
            ('MED L2 B', 'MEDL2B', 'L2'),
        ]
        
        etudiants = list(Etudiant.objects.all())
        etudiant_index = 0
        
        for nom_classe, code_classe, niveau_nom in classes_data:
            classe, created = Classe.objects.get_or_create(
                nom=nom_classe,
                code=code_classe,
                filiere=filiere_medecine,
                niveau=niveaux[niveau_nom],
                annee_academique=annee_active,
                defaults={'effectif_max': 25}
            )
            
            # Inscrire des étudiants dans cette classe
            nb_etudiants = min(12, len(etudiants) - etudiant_index)
            for i in range(nb_etudiants):
                if etudiant_index < len(etudiants):
                    etudiant = etudiants[etudiant_index]
                    Inscription.objects.get_or_create(
                        etudiant=etudiant,
                        classe=classe,
                        annee_academique=annee_active,
                        defaults={
                            'statut': statut_inscrit,
                            'nombre_redoublements': random.choice([0, 0, 0, 1])  # 25% de redoublants
                        }
                    )
                    etudiant_index += 1
    
    def configure_evaluations(self):
        """Configurer les évaluations pour les EC"""
        self.stdout.write('⚙️ Configuration des évaluations...')
        
        # Récupérer les types d'évaluation
        cc = TypeEvaluation.objects.get(code='CC')
        td = TypeEvaluation.objects.get(code='TD')
        tp = TypeEvaluation.objects.get(code='TP')
        partiel = TypeEvaluation.objects.get(code='PART')
        examen = TypeEvaluation.objects.get(code='EXAM')
        
        # Configurer les évaluations pour tous les EC
        for ec in EC.objects.all():
            # Configuration de base : CC + Partiel + Examen
            if 'TP' in ec.nom:
                # Pour les TP : TP (40%) + CC (30%) + Examen (30%)
                ConfigurationEvaluationEC.objects.get_or_create(
                    ec=ec, type_evaluation=tp,
                    defaults={'pourcentage': Decimal('40.00')}
                )
                ConfigurationEvaluationEC.objects.get_or_create(
                    ec=ec, type_evaluation=cc,
                    defaults={'pourcentage': Decimal('30.00')}
                )
                ConfigurationEvaluationEC.objects.get_or_create(
                    ec=ec, type_evaluation=examen,
                    defaults={'pourcentage': Decimal('30.00')}
                )
            else:
                # Pour les cours théoriques : CC (30%) + Partiel (30%) + Examen (40%)
                ConfigurationEvaluationEC.objects.get_or_create(
                    ec=ec, type_evaluation=cc,
                    defaults={'pourcentage': Decimal('30.00')}
                )
                ConfigurationEvaluationEC.objects.get_or_create(
                    ec=ec, type_evaluation=partiel,
                    defaults={'pourcentage': Decimal('30.00')}
                )
                ConfigurationEvaluationEC.objects.get_or_create(
                    ec=ec, type_evaluation=examen,
                    defaults={'pourcentage': Decimal('40.00')}
                )

# Pour exécuter le script
if __name__ == '__main__':
    command = Command()
    command.handle()
    print("✅ Données de test créées avec succès !")