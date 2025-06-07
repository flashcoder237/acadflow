# ========================================
# SCRIPT DE GÉNÉRATION DE DONNÉES - FACULTÉ DE MÉDECINE UDO
# ========================================

import os
import django
from django.db import transaction
from decimal import Decimal
from datetime import datetime, date, timedelta
import random

# Configuration Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'acadflow_backend.settings')
django.setup()

from core.models import *
from academics.models import *
from users.models import *
from evaluations.models import *

def create_sample_data():
    """Crée un jeu de données complet pour la Faculté de Médecine"""
    
    with transaction.atomic():
        print("🏥 Création des données pour la Faculté de Médecine UDO...")
        
        # 1. ÉTABLISSEMENT ET STRUCTURE DE BASE
        print("📋 1. Création de l'établissement...")
        
        # Type d'établissement
        type_fac = TypeEtablissement.objects.create(
            nom="Faculté",
            code="FAC",
            description="Faculté universitaire",
            actif=True
        )
        
        # Université de tutelle
        udo = Universite.objects.create(
            nom="Université de Douala",
            code="UDO",
            acronyme="UDO",
            ville="Douala",
            pays="Cameroun",
            site_web="https://www.univ-douala.com",
            actif=True
        )
        
        # Établissement - Faculté de Médecine
        fac_medecine = Etablissement.objects.create(
            nom="Faculté de Médecine et des Sciences Pharmaceutiques",
            nom_complet="Faculté de Médecine et des Sciences Pharmaceutiques de l'Université de Douala",
            acronyme="FMSP-UDO",
            type_etablissement=type_fac,
            universite_tutelle=udo,
            adresse="BP 2701 Douala, Campus de Logbaba",
            ville="Douala",
            region="Littoral",
            pays="Cameroun",
            telephone="+237 233 40 72 00",
            email="fmsp@univ-douala.com",
            site_web="https://fmsp.univ-douala.com",
            numero_autorisation="MINESUP/2001/FAC/MED/001",
            date_creation=date(1995, 10, 15),
            date_autorisation=date(1995, 12, 1),
            ministre_tutelle="Ministère de l'Enseignement Supérieur",
            systeme_credits="LMD",
            note_maximale=Decimal('20.00'),
            note_passage=Decimal('10.00'),
            actif=True,
            etablissement_principal=True
        )
        
        # Configuration de l'établissement
        config = ConfigurationEtablissement.objects.create(
            etablissement=fac_medecine,
            duree_semestre_mois=4,
            nombre_semestres_par_annee=2,
            delai_saisie_notes_defaut=14,
            autoriser_modification_notes=False,
            precision_notes=2,
            arrondi_notes='NORMAL',
            credits_minimum_passage=30,
            pourcentage_minimum_validation=Decimal('50.00'),
            langue_principale='fr',
            format_date='DD/MM/YYYY',
            fuseau_horaire='Africa/Douala'
        )
        
        # Campus
        campus_logbaba = Campus.objects.create(
            nom="Campus de Logbaba",
            etablissement=fac_medecine,
            adresse="Route de Logbaba, Douala",
            ville="Douala",
            campus_principal=True,
            actif=True
        )
        
        # 2. DOMAINES ET CYCLES
        print("📚 2. Création des domaines et cycles...")
        
        # Domaine Médecine
        domaine_med = Domaine.objects.create(
            nom="Sciences Médicales",
            code="MED",
            etablissement=fac_medecine,
            description="Formation médicale et sciences de la santé",
            actif=True
        )
        
        # Domaine Pharmacie
        domaine_pharma = Domaine.objects.create(
            nom="Sciences Pharmaceutiques",
            code="PHAR",
            etablissement=fac_medecine,
            description="Formation pharmaceutique et sciences du médicament",
            actif=True
        )
        
        # Cycles LMD
        cycle_licence = Cycle.objects.create(
            nom="Licence",
            code="L",
            etablissement=fac_medecine,
            duree_annees=3,
            actif=True
        )
        
        cycle_master = Cycle.objects.create(
            nom="Master",
            code="M",
            etablissement=fac_medecine,
            duree_annees=2,
            actif=True
        )
        
        cycle_doctorat = Cycle.objects.create(
            nom="Doctorat",
            code="D",
            etablissement=fac_medecine,
            duree_annees=3,
            actif=True
        )
        
        # Types de formation
        licence_pro = TypeFormation.objects.create(
            nom="Licence Professionnelle",
            code="LP",
            cycle=cycle_licence,
            actif=True
        )
        
        master_pro = TypeFormation.objects.create(
            nom="Master Professionnel",
            code="MP",
            cycle=cycle_master,
            actif=True
        )
        
        doctorat_med = TypeFormation.objects.create(
            nom="Doctorat en Médecine",
            code="DM",
            cycle=cycle_doctorat,
            actif=True
        )
        
        doctorat_pharma = TypeFormation.objects.create(
            nom="Doctorat en Pharmacie",
            code="DP",
            cycle=cycle_doctorat,
            actif=True
        )
        
        # 3. FILIÈRES
        print("🎓 3. Création des filières...")
        
        # Filière Médecine Générale
        filiere_med_gen = Filiere.objects.create(
            nom="Médecine Générale",
            code="MEDGEN",
            domaine=domaine_med,
            type_formation=doctorat_med,
            campus=campus_logbaba,
            actif=True
        )
        
        # Filière Pharmacie
        filiere_pharmacie = Filiere.objects.create(
            nom="Pharmacie",
            code="PHAR",
            domaine=domaine_pharma,
            type_formation=doctorat_pharma,
            campus=campus_logbaba,
            actif=True
        )
        
        # Filière Sciences Biomédicales
        filiere_biomed = Filiere.objects.create(
            nom="Sciences Biomédicales",
            code="BIOMED",
            domaine=domaine_med,
            type_formation=licence_pro,
            campus=campus_logbaba,
            actif=True
        )
        
        # Options/Spécialisations
        specialites_medecine = [
            ("Médecine Interne", "MINT"),
            ("Chirurgie Générale", "CHIR"),
            ("Pédiatrie", "PED"),
            ("Gynécologie-Obstétrique", "GYOB"),
            ("Cardiologie", "CARD"),
            ("Neurologie", "NEUR")
        ]
        
        for nom, code in specialites_medecine:
            Option.objects.create(
                nom=nom,
                code=code,
                filiere=filiere_med_gen,
                actif=True
            )
        
        # 4. NIVEAUX
        print("📊 4. Création des niveaux...")
        
        # Niveaux Licence (Sciences Biomédicales)
        l1 = Niveau.objects.create(nom="L1", numero=1, cycle=cycle_licence, credits_requis=60, actif=True)
        l2 = Niveau.objects.create(nom="L2", numero=2, cycle=cycle_licence, credits_requis=60, actif=True)
        l3 = Niveau.objects.create(nom="L3", numero=3, cycle=cycle_licence, credits_requis=60, actif=True)
        
        # Niveaux Doctorat (Médecine/Pharmacie - 7 ans)
        d1 = Niveau.objects.create(nom="D1", numero=1, cycle=cycle_doctorat, credits_requis=60, actif=True)
        d2 = Niveau.objects.create(nom="D2", numero=2, cycle=cycle_doctorat, credits_requis=60, actif=True)
        d3 = Niveau.objects.create(nom="D3", numero=3, cycle=cycle_doctorat, credits_requis=60, actif=True)
        d4 = Niveau.objects.create(nom="D4", numero=4, cycle=cycle_doctorat, credits_requis=60, actif=True)
        d5 = Niveau.objects.create(nom="D5", numero=5, cycle=cycle_doctorat, credits_requis=60, actif=True)
        d6 = Niveau.objects.create(nom="D6", numero=6, cycle=cycle_doctorat, credits_requis=60, actif=True)
        d7 = Niveau.objects.create(nom="D7 (Internat)", numero=7, cycle=cycle_doctorat, credits_requis=60, actif=True)
        
        # 5. ANNÉES ACADÉMIQUES ET SESSIONS
        print("📅 5. Création des années académiques...")
        
        # Année académique actuelle
        annee_actuelle = AnneeAcademique.objects.create(
            libelle="2024-2025",
            date_debut=date(2024, 9, 1),
            date_fin=date(2025, 7, 31),
            active=True,
            delai_saisie_notes=14,
            autoriser_modification_notes=False,
            generation_auto_recaps=True
        )
        
        # Année précédente
        annee_precedente = AnneeAcademique.objects.create(
            libelle="2023-2024",
            date_debut=date(2023, 9, 1),
            date_fin=date(2024, 7, 31),
            active=False,
            delai_saisie_notes=14,
            autoriser_modification_notes=True,
            generation_auto_recaps=True
        )
        
        # Sessions
        session_normale = Session.objects.create(
            nom="Session Normale",
            code="SN",
            ordre=1,
            actif=True,
            date_debut_session=date(2024, 11, 15),
            date_fin_session=date(2024, 12, 20),
            generation_recaps_auto=True
        )
        
        session_rattrapage = Session.objects.create(
            nom="Session de Rattrapage",
            code="SR",
            ordre=2,
            actif=True,
            date_debut_session=date(2025, 1, 10),
            date_fin_session=date(2025, 1, 25),
            generation_recaps_auto=True
        )
        
        # Semestres
        semestre_1 = Semestre.objects.create(
            nom="Semestre 1",
            numero=1,
            date_debut=date(2024, 9, 1),
            date_fin=date(2025, 1, 31)
        )
        
        semestre_2 = Semestre.objects.create(
            nom="Semestre 2",
            numero=2,
            date_debut=date(2025, 2, 1),
            date_fin=date(2025, 7, 31)
        )
        
        # 6. TYPES D'ÉVALUATION
        print("📝 6. Création des types d'évaluation...")
        
        type_cc = TypeEvaluation.objects.create(
            nom="Contrôle Continu",
            code="CC",
            description="Évaluations régulières en cours de semestre",
            actif=True,
            delai_saisie_defaut=7
        )
        
        type_tp = TypeEvaluation.objects.create(
            nom="Travaux Pratiques",
            code="TP",
            description="Évaluations pratiques en laboratoire",
            actif=True,
            delai_saisie_defaut=5
        )
        
        type_partiel = TypeEvaluation.objects.create(
            nom="Examen Partiel",
            code="PART",
            description="Examen de mi-semestre",
            actif=True,
            delai_saisie_defaut=14
        )
        
        type_final = TypeEvaluation.objects.create(
            nom="Examen Final",
            code="FINAL",
            description="Examen de fin de semestre",
            actif=True,
            delai_saisie_defaut=21
        )
        
        # 7. UEs ET ECs - MÉDECINE 1ÈRE ANNÉE
        print("📖 7. Création des UEs et ECs...")
        
        # === UEs Semestre 1 - Médecine 1ère année ===
        
        # UE1: Anatomie Générale
        ue_anatomie = UE.objects.create(
            nom="Anatomie Générale",
            code="UE101",
            credits=8,
            type_ue="obligatoire",
            niveau=d1,
            semestre=semestre_1,
            actif=True,
            volume_horaire_cm=40,
            volume_horaire_td=20,
            volume_horaire_tp=15
        )
        
        # ECs pour Anatomie
        ec_anatomie_desc = EC.objects.create(
            nom="Anatomie Descriptive",
            code="EC101A",
            ue=ue_anatomie,
            poids_ec=Decimal('60.00'),
            actif=True
        )
        
        ec_anatomie_func = EC.objects.create(
            nom="Anatomie Fonctionnelle",
            code="EC101B",
            ue=ue_anatomie,
            poids_ec=Decimal('40.00'),
            actif=True
        )
        
        # UE2: Physiologie
        ue_physiologie = UE.objects.create(
            nom="Physiologie Humaine",
            code="UE102",
            credits=7,
            type_ue="obligatoire",
            niveau=d1,
            semestre=semestre_1,
            actif=True,
            volume_horaire_cm=35,
            volume_horaire_td=20,
            volume_horaire_tp=10
        )
        
        ec_physio_cardio = EC.objects.create(
            nom="Physiologie Cardiovasculaire",
            code="EC102A",
            ue=ue_physiologie,
            poids_ec=Decimal('50.00'),
            actif=True
        )
        
        ec_physio_respir = EC.objects.create(
            nom="Physiologie Respiratoire",
            code="EC102B",
            ue=ue_physiologie,
            poids_ec=Decimal('50.00'),
            actif=True
        )
        
        # UE3: Biochimie
        ue_biochimie = UE.objects.create(
            nom="Biochimie Structurale et Métabolique",
            code="UE103",
            credits=6,
            type_ue="obligatoire",
            niveau=d1,
            semestre=semestre_1,
            actif=True,
            volume_horaire_cm=30,
            volume_horaire_td=15,
            volume_horaire_tp=20
        )
        
        ec_biochim_struct = EC.objects.create(
            nom="Biochimie Structurale",
            code="EC103A",
            ue=ue_biochimie,
            poids_ec=Decimal('60.00'),
            actif=True
        )
        
        ec_biochim_metab = EC.objects.create(
            nom="Biochimie Métabolique",
            code="EC103B",
            ue=ue_biochimie,
            poids_ec=Decimal('40.00'),
            actif=True
        )
        
        # UE4: Histologie-Embryologie
        ue_histo = UE.objects.create(
            nom="Histologie-Embryologie",
            code="UE104",
            credits=5,
            type_ue="obligatoire",
            niveau=d1,
            semestre=semestre_1,
            actif=True,
            volume_horaire_cm=25,
            volume_horaire_td=10,
            volume_horaire_tp=25
        )
        
        ec_histologie = EC.objects.create(
            nom="Histologie Générale",
            code="EC104A",
            ue=ue_histo,
            poids_ec=Decimal('70.00'),
            actif=True
        )
        
        ec_embryologie = EC.objects.create(
            nom="Embryologie",
            code="EC104B",
            ue=ue_histo,
            poids_ec=Decimal('30.00'),
            actif=True
        )
        
        # UE5: Chimie Générale et Organique
        ue_chimie = UE.objects.create(
            nom="Chimie Générale et Organique",
            code="UE105",
            credits=4,
            type_ue="obligatoire",
            niveau=d1,
            semestre=semestre_1,
            actif=True,
            volume_horaire_cm=20,
            volume_horaire_td=15,
            volume_horaire_tp=15
        )
        
        ec_chimie_gen = EC.objects.create(
            nom="Chimie Générale",
            code="EC105A",
            ue=ue_chimie,
            poids_ec=Decimal('50.00'),
            actif=True
        )
        
        ec_chimie_org = EC.objects.create(
            nom="Chimie Organique",
            code="EC105B",
            ue=ue_chimie,
            poids_ec=Decimal('50.00'),
            actif=True
        )
        
        # === UEs Semestre 2 - Médecine 1ère année ===
        
        # UE6: Anatomie Systémique
        ue_anatomie_syst = UE.objects.create(
            nom="Anatomie Systémique",
            code="UE201",
            credits=8,
            type_ue="obligatoire",
            niveau=d1,
            semestre=semestre_2,
            actif=True,
            volume_horaire_cm=40,
            volume_horaire_td=20,
            volume_horaire_tp=15
        )
        
        # UE7: Pharmacologie Générale
        ue_pharmaco = UE.objects.create(
            nom="Pharmacologie Générale",
            code="UE202",
            credits=6,
            type_ue="obligatoire",
            niveau=d1,
            semestre=semestre_2,
            actif=True,
            volume_horaire_cm=30,
            volume_horaire_td=15,
            volume_horaire_tp=10
        )
        
        # UE8: Microbiologie
        ue_microbio = UE.objects.create(
            nom="Microbiologie Médicale",
            code="UE203",
            credits=7,
            type_ue="obligatoire",
            niveau=d1,
            semestre=semestre_2,
            actif=True,
            volume_horaire_cm=35,
            volume_horaire_td=15,
            volume_horaire_tp=20
        )
        
        # UE9: Immunologie
        ue_immuno = UE.objects.create(
            nom="Immunologie Fondamentale",
            code="UE204",
            credits=5,
            type_ue="obligatoire",
            niveau=d1,
            semestre=semestre_2,
            actif=True,
            volume_horaire_cm=25,
            volume_horaire_td=10,
            volume_horaire_tp=15
        )
        
        # UE10: Biophysique
        ue_biophysique = UE.objects.create(
            nom="Biophysique Médicale",
            code="UE205",
            credits=4,
            type_ue="obligatoire",
            niveau=d1,
            semestre=semestre_2,
            actif=True,
            volume_horaire_cm=20,
            volume_horaire_td=15,
            volume_horaire_tp=10
        )
        
        # Configuration des évaluations pour TOUS les ECs
        configurations_eval = [
            # Anatomie Descriptive
            (ec_anatomie_desc, type_cc, Decimal('20.00')),
            (ec_anatomie_desc, type_tp, Decimal('30.00')),
            (ec_anatomie_desc, type_final, Decimal('50.00')),
            
            # Anatomie Fonctionnelle
            (ec_anatomie_func, type_cc, Decimal('25.00')),
            (ec_anatomie_func, type_partiel, Decimal('35.00')),
            (ec_anatomie_func, type_final, Decimal('40.00')),
            
            # Physiologie Cardiovasculaire
            (ec_physio_cardio, type_cc, Decimal('25.00')),
            (ec_physio_cardio, type_partiel, Decimal('35.00')),
            (ec_physio_cardio, type_final, Decimal('40.00')),
            
            # Physiologie Respiratoire
            (ec_physio_respir, type_cc, Decimal('20.00')),
            (ec_physio_respir, type_tp, Decimal('30.00')),
            (ec_physio_respir, type_final, Decimal('50.00')),
            
            # Biochimie Structurale
            (ec_biochim_struct, type_cc, Decimal('20.00')),
            (ec_biochim_struct, type_tp, Decimal('30.00')),
            (ec_biochim_struct, type_final, Decimal('50.00')),
            
            # Biochimie Métabolique
            (ec_biochim_metab, type_cc, Decimal('25.00')),
            (ec_biochim_metab, type_partiel, Decimal('35.00')),
            (ec_biochim_metab, type_final, Decimal('40.00')),
            
            # Histologie Générale
            (ec_histologie, type_cc, Decimal('15.00')),
            (ec_histologie, type_tp, Decimal('35.00')),
            (ec_histologie, type_final, Decimal('50.00')),
            
            # Embryologie
            (ec_embryologie, type_cc, Decimal('30.00')),
            (ec_embryologie, type_partiel, Decimal('30.00')),
            (ec_embryologie, type_final, Decimal('40.00')),
            
            # Chimie Générale
            (ec_chimie_gen, type_cc, Decimal('25.00')),
            (ec_chimie_gen, type_tp, Decimal('25.00')),
            (ec_chimie_gen, type_final, Decimal('50.00')),
            
            # Chimie Organique
            (ec_chimie_org, type_cc, Decimal('20.00')),
            (ec_chimie_org, type_tp, Decimal('30.00')),
            (ec_chimie_org, type_final, Decimal('50.00')),
        ]
        
        for ec, type_eval, pourcentage in configurations_eval:
            ConfigurationEvaluationEC.objects.create(
                ec=ec,
                type_evaluation=type_eval,
                pourcentage=pourcentage
            )
        
        # 8. CLASSES
        print("🏫 8. Création des classes...")
        
        # Classes Médecine 1ère année
        med1_a = Classe.objects.create(
            nom="Médecine D1A",
            code="MED1A",
            filiere=filiere_med_gen,
            niveau=d1,
            annee_academique=annee_actuelle,
            effectif_max=80,
            active=True
        )
        
        med1_b = Classe.objects.create(
            nom="Médecine D1B",
            code="MED1B",
            filiere=filiere_med_gen,
            niveau=d1,
            annee_academique=annee_actuelle,
            effectif_max=80,
            active=True
        )
        
        # Classes Médecine 2ème année
        med2_a = Classe.objects.create(
            nom="Médecine D2A",
            code="MED2A",
            filiere=filiere_med_gen,
            niveau=d2,
            annee_academique=annee_actuelle,
            effectif_max=70,
            active=True
        )
        
        # Classes Pharmacie
        phar1 = Classe.objects.create(
            nom="Pharmacie D1",
            code="PHAR1",
            filiere=filiere_pharmacie,
            niveau=d1,
            annee_academique=annee_actuelle,
            effectif_max=60,
            active=True
        )
        
        # Classe Sciences Biomédicales
        biomed_l1 = Classe.objects.create(
            nom="Sciences Biomédicales L1",
            code="BIOMEDL1",
            filiere=filiere_biomed,
            niveau=l1,
            annee_academique=annee_actuelle,
            effectif_max=50,
            active=True
        )
        
        # 9. UTILISATEURS ET PROFILS
        print("👥 9. Création des utilisateurs...")
        
        # Statuts étudiants
        statut_inscrit = StatutEtudiant.objects.create(
            nom="Inscrit",
            code="INSC",
            description="Étudiant régulièrement inscrit",
            actif=True
        )
        
        statut_redoublant = StatutEtudiant.objects.create(
            nom="Redoublant",
            code="RED",
            description="Étudiant en situation de redoublement",
            actif=True
        )
        
        # Administrateur
        admin_user = User.objects.create_user(
            username="admin_fmsp",
            email="admin@fmsp.univ-douala.com",
            password="AdminFMSP2024!",
            first_name="Administrateur",
            last_name="FMSP",
            type_utilisateur="admin",
            matricule="ADM001",
            telephone="+237 233 40 72 01",
            actif=True
        )
        
        # Responsable Scolarité
        scolarite_user = User.objects.create_user(
            username="scolarite_fmsp",
            email="scolarite@fmsp.univ-douala.com",
            password="ScolariteFMSP2024!",
            first_name="Marie",
            last_name="MBALLA",
            type_utilisateur="scolarite",
            matricule="SCO001",
            telephone="+237 233 40 72 02",
            actif=True
        )
        
        # Enseignants
        enseignants_data = [
            {
                "username": "prof_kamga",
                "first_name": "Pierre",
                "last_name": "KAMGA",
                "email": "p.kamga@fmsp.univ-douala.com",
                "matricule": "ENS001",
                "grade": "professeur",
                "specialite": "Anatomie"
            },
            {
                "username": "dr_njoya",
                "first_name": "Fatima",
                "last_name": "NJOYA",
                "email": "f.njoya@fmsp.univ-douala.com",
                "matricule": "ENS002",
                "grade": "maitre_conference",
                "specialite": "Physiologie"
            },
            {
                "username": "dr_bello",
                "first_name": "André",
                "last_name": "BELLO",
                "email": "a.bello@fmsp.univ-douala.com",
                "matricule": "ENS003",
                "grade": "maitre_assistant",
                "specialite": "Biochimie"
            },
            {
                "username": "prof_dissongo",
                "first_name": "Jacqueline",
                "last_name": "DISSONGO",
                "email": "j.dissongo@fmsp.univ-douala.com",
                "matricule": "ENS004",
                "grade": "professeur",
                "specialite": "Histologie-Embryologie"
            },
            {
                "username": "dr_essomba",
                "first_name": "Martin",
                "last_name": "ESSOMBA",
                "email": "m.essomba@fmsp.univ-douala.com",
                "matricule": "ENS005",
                "grade": "assistant",
                "specialite": "Pharmacologie"
            }
        ]
        
        enseignants = []
        for data in enseignants_data:
            user = User.objects.create_user(
                username=data["username"],
                email=data["email"],
                password="Enseignant2024!",
                first_name=data["first_name"],
                last_name=data["last_name"],
                type_utilisateur="enseignant",
                matricule=data["matricule"],
                telephone=f"+237 6{random.randint(70000000, 99999999)}",
                actif=True
            )
            
            enseignant = Enseignant.objects.create(
                user=user,
                grade=data["grade"],
                specialite=data["specialite"],
                statut="Permanent"
            )
            enseignants.append(enseignant)
        
        # Assigner responsables de classe
        med1_a.responsable_classe = enseignants[0]  # Prof KAMGA
        med1_a.save()
        
        med1_b.responsable_classe = enseignants[1]  # Dr NJOYA
        med1_b.save()
        
        # 10. ÉTUDIANTS
        print("🎓 10. Création des étudiants...")
        
        # Noms camerounais pour les étudiants
        prenoms_masculins = ["Jean", "Pierre", "André", "Paul", "Martin", "Joseph", "François", "Michel", "Antoine", "Gabriel", "Emmanuel", "Daniel", "Samuel", "David", "Thomas", "Nicolas", "Olivier", "Philippe", "Simon", "Marc"]
        prenoms_feminins = ["Marie", "Françoise", "Catherine", "Anne", "Christine", "Monique", "Thérèse", "Jeanne", "Rose", "Marguerite", "Suzanne", "Claudine", "Berthe", "Solange", "Pascaline", "Angeline", "Viviane", "Joséphine", "Henriette", "Agnès"]
        
        noms_famille = ["MBALLA", "KAMGA", "BELLO", "NJOYA", "ESSOMBA", "DISSONGO", "FOUDA", "MANGA", "TCHOUMI", "ABEGA", 
                       "MVONDO", "OLINGA", "ATANGANA", "MBOUDA", "POKAM", "EYENGA", "ONANA", "TSAMA", "NDJODO", "BELLA",
                       "MEKA", "NKOMO", "BILE", "AWA", "OWONO", "NDONGO", "MVENG", "ELOUNDOU", "NOAH", "BEBEY"]
        
        # Générer des étudiants pour chaque classe
        etudiants_crees = []
        compteur_global = 1  # Compteur global pour éviter les doublons
        
        def generer_etudiants_classe(classe, nombre_etudiants):
            """Génère des étudiants pour une classe donnée"""
            nonlocal compteur_global
            etudiants_classe = []
            
            for i in range(nombre_etudiants):
                # Alterner entre masculin et féminin
                est_masculin = i % 2 == 0
                prenom = random.choice(prenoms_masculins if est_masculin else prenoms_feminins)
                nom = random.choice(noms_famille)
                
                # Génération du matricule selon le format de l'établissement
                annee = annee_actuelle.date_debut.year
                code_filiere = classe.filiere.code[:2]  # Réduire à 2 caractères
                numero = f"{compteur_global:04d}"  # Utiliser le compteur global
                matricule = f"{annee}{code_filiere}{numero}"
                
                # Username unique basé sur le compteur global
                username = f"etudiant_{matricule.lower()}"
                
                # Date de naissance (18-25 ans)
                age = random.randint(18, 25)
                date_naissance = date(2024 - age, random.randint(1, 12), random.randint(1, 28))
                
                # Email unique
                email = f"{prenom.lower()}.{nom.lower()}{compteur_global}@etud.fmsp.univ-douala.com"
                
                # Création utilisateur
                user = User.objects.create_user(
                    username=username,
                    email=email,
                    password="Etudiant2024!",
                    first_name=prenom,
                    last_name=nom,
                    type_utilisateur="etudiant",
                    matricule=matricule,
                    telephone=f"+237 6{random.randint(70000000, 99999999)}",
                    date_naissance=date_naissance,
                    lieu_naissance=random.choice(["Douala", "Yaoundé", "Bafoussam", "Bamenda", "Garoua", "Maroua", "Ngaoundéré"]),
                    actif=True
                )
                
                # Profil étudiant
                etudiant = Etudiant.objects.create(
                    user=user,
                    numero_carte=f"CARTE{matricule}",
                    statut_current="inscrit"
                )
                
                # Inscription
                statut = statut_redoublant if random.random() < 0.1 else statut_inscrit  # 10% de redoublants
                redoublements = 1 if statut == statut_redoublant else 0
                
                inscription = Inscription.objects.create(
                    etudiant=etudiant,
                    classe=classe,
                    annee_academique=annee_actuelle,
                    statut=statut,
                    nombre_redoublements=redoublements,
                    active=True
                )
                
                etudiants_classe.append(etudiant)
                compteur_global += 1  # Incrémenter le compteur global
            
            return etudiants_classe
        
        # Créer des étudiants pour chaque classe
        etudiants_med1a = generer_etudiants_classe(med1_a, 75)
        etudiants_med1b = generer_etudiants_classe(med1_b, 72)
        etudiants_med2a = generer_etudiants_classe(med2_a, 68)
        etudiants_phar1 = generer_etudiants_classe(phar1, 55)
        etudiants_biomed = generer_etudiants_classe(biomed_l1, 45)
        
        tous_etudiants = etudiants_med1a + etudiants_med1b + etudiants_med2a + etudiants_phar1 + etudiants_biomed
        
        print(f"   ✅ {len(tous_etudiants)} étudiants créés")
        
        # 11. ENSEIGNEMENTS
        print("📚 11. Création des enseignements...")
        
        # Assignation des enseignements pour la classe MED1A
        enseignements_med1a = [
            (enseignants[0], ec_anatomie_desc),   # Prof KAMGA - Anatomie
            (enseignants[0], ec_anatomie_func),   # Prof KAMGA - Anatomie
            (enseignants[1], ec_physio_cardio),   # Dr NJOYA - Physiologie
            (enseignants[1], ec_physio_respir),   # Dr NJOYA - Physiologie
            (enseignants[2], ec_biochim_struct),  # Dr BELLO - Biochimie
            (enseignants[2], ec_biochim_metab),   # Dr BELLO - Biochimie
            (enseignants[3], ec_histologie),      # Prof DISSONGO - Histologie
            (enseignants[3], ec_embryologie),     # Prof DISSONGO - Embryologie
            (enseignants[4], ec_chimie_gen),      # Dr ESSOMBA - Chimie
            (enseignants[4], ec_chimie_org),      # Dr ESSOMBA - Chimie
        ]
        
        enseignements_crees = []
        for enseignant, ec in enseignements_med1a:
            enseignement = Enseignement.objects.create(
                enseignant=enseignant,
                ec=ec,
                classe=med1_a,
                annee_academique=annee_actuelle,
                actif=True
            )
            enseignements_crees.append(enseignement)
        
        # Répliquer pour MED1B avec les mêmes enseignants
        for enseignant, ec in enseignements_med1a:
            Enseignement.objects.create(
                enseignant=enseignant,
                ec=ec,
                classe=med1_b,
                annee_academique=annee_actuelle,
                actif=True
            )
        
        print(f"   ✅ {len(enseignements_crees) * 2} enseignements créés")
        
        # 12. ÉVALUATIONS ET NOTES
        print("📊 12. Création des évaluations et notes...")
        
        def creer_evaluations_ec(enseignement, ec):
            """Crée les évaluations pour un EC selon sa configuration"""
            evaluations = []
            
            # Récupérer la configuration des évaluations pour cet EC
            configurations = ConfigurationEvaluationEC.objects.filter(ec=ec)
            
            for config in configurations:
                # Date d'évaluation selon le type
                if config.type_evaluation.code == "CC":
                    date_eval = date(2024, 10, random.randint(15, 30))
                elif config.type_evaluation.code == "TP":
                    date_eval = date(2024, 11, random.randint(1, 15))
                elif config.type_evaluation.code == "PART":
                    date_eval = date(2024, 11, random.randint(18, 25))
                else:  # FINAL
                    date_eval = date(2024, 12, random.randint(1, 15))
                
                evaluation = Evaluation.objects.create(
                    nom=f"{config.type_evaluation.nom} - {ec.nom}",
                    enseignement=enseignement,
                    type_evaluation=config.type_evaluation,
                    session=session_normale,
                    date_evaluation=date_eval,
                    note_sur=Decimal('20.00'),
                    saisie_terminee=True,
                    saisie_autorisee=True
                )
                evaluations.append(evaluation)
            
            return evaluations
        
        def generer_notes_realistes(evaluation, etudiants):
            """Génère des notes réalistes pour une évaluation"""
            notes = []
            
            for etudiant in etudiants:
                # Probabilité d'absence (5%)
                absent = random.random() < 0.05
                
                if absent:
                    note = Note.objects.create(
                        etudiant=etudiant,
                        evaluation=evaluation,
                        note_obtenue=Decimal('0.00'),
                        absent=True,
                        justifie=random.choice([True, False])
                    )
                else:
                    # Génération de notes selon une distribution réaliste
                    # 20% excellents (16-20), 30% bons (14-16), 30% moyens (10-14), 20% faibles (0-10)
                    rand = random.random()
                    if rand < 0.20:  # Excellents
                        note_base = random.uniform(16, 20)
                    elif rand < 0.50:  # Bons
                        note_base = random.uniform(14, 16)
                    elif rand < 0.80:  # Moyens
                        note_base = random.uniform(10, 14)
                    else:  # Faibles
                        note_base = random.uniform(4, 10)
                    
                    # Ajuster selon le type d'évaluation
                    if evaluation.type_evaluation.code == "TP":
                        note_base += 1  # Les TP sont généralement mieux notés
                    elif evaluation.type_evaluation.code == "FINAL":
                        note_base -= 0.5  # Les finaux sont plus difficiles
                    
                    # Borner entre 0 et 20
                    note_finale = max(0, min(20, note_base))
                    
                    note = Note.objects.create(
                        etudiant=etudiant,
                        evaluation=evaluation,
                        note_obtenue=Decimal(f'{note_finale:.2f}'),
                        absent=False
                    )
                
                notes.append(note)
            
            return notes
        
        # Créer les évaluations et notes pour TOUS les enseignements
        evaluations_importantes = [
            (enseignements_crees[0], ec_anatomie_desc, etudiants_med1a),   # Anatomie descriptive
            (enseignements_crees[1], ec_anatomie_func, etudiants_med1a),   # Anatomie fonctionnelle
            (enseignements_crees[2], ec_physio_cardio, etudiants_med1a),   # Physiologie cardio
            (enseignements_crees[3], ec_physio_respir, etudiants_med1a),   # Physiologie respir
            (enseignements_crees[4], ec_biochim_struct, etudiants_med1a),  # Biochimie structurale
            (enseignements_crees[5], ec_biochim_metab, etudiants_med1a),   # Biochimie métabolique
            (enseignements_crees[6], ec_histologie, etudiants_med1a),      # Histologie
            (enseignements_crees[7], ec_embryologie, etudiants_med1a),     # Embryologie
            (enseignements_crees[8], ec_chimie_gen, etudiants_med1a),      # Chimie générale
            (enseignements_crees[9], ec_chimie_org, etudiants_med1a),      # Chimie organique
        ]
        
        notes_total = 0
        for enseignement, ec, etudiants in evaluations_importantes:
            evaluations = creer_evaluations_ec(enseignement, ec)
            
            for evaluation in evaluations:
                notes = generer_notes_realistes(evaluation, etudiants)
                notes_total += len(notes)
        
        print(f"   ✅ {notes_total} notes créées")
        
        # 13. CALCUL DES MOYENNES
        print("🧮 13. Calcul des moyennes...")
        
        from core.utils import calculer_moyenne_ec, calculer_moyenne_ue, calculer_moyenne_semestre
        
        moyennes_calculees = 0
        
        # Calculer les moyennes EC pour TOUS les étudiants et TOUS les ECs ayant des évaluations
        for enseignement, ec, etudiants in evaluations_importantes:
            for etudiant in etudiants:
                moyenne_ec = calculer_moyenne_ec(
                    etudiant, ec, session_normale, annee_actuelle
                )
                if moyenne_ec:
                    moyennes_calculees += 1
        
        # Calculer les moyennes UE pour les étudiants de MED1A
        ues_avec_ecs = [ue_anatomie, ue_physiologie, ue_biochimie, ue_histo, ue_chimie]
        for etudiant in etudiants_med1a[:30]:  # Premier tiers de la classe
            for ue in ues_avec_ecs:
                moyenne_ue = calculer_moyenne_ue(
                    etudiant, ue, session_normale, annee_actuelle
                )
                if moyenne_ue:
                    moyennes_calculees += 1
            
            # Moyenne semestrielle
            moyenne_sem = calculer_moyenne_semestre(
                etudiant, med1_a, semestre_1, session_normale, annee_actuelle
            )
            if moyenne_sem:
                moyennes_calculees += 1
        
        print(f"   ✅ {moyennes_calculees} moyennes calculées")
        
        # 14. ASSIGNATION DES ECs AUX CLASSES
        print("🔗 14. Assignation des ECs aux classes...")
        
        # Assigner tous les ECs de 1ère année aux classes MED1A et MED1B
        ecs_premiere_annee = [
            ec_anatomie_desc, ec_anatomie_func, ec_physio_cardio, ec_physio_respir,
            ec_biochim_struct, ec_biochim_metab, ec_histologie, ec_embryologie,
            ec_chimie_gen, ec_chimie_org
        ]
        
        assignations = 0
        for classe in [med1_a, med1_b]:
            for ec in ecs_premiere_annee:
                ECClasse.objects.create(
                    ec=ec,
                    classe=classe,
                    obligatoire=True
                )
                assignations += 1
        
        print(f"   ✅ {assignations} assignations EC-Classe créées")
        
        # 15. DONNÉES ADDITIONNELLES
        print("📋 15. Création de données additionnelles...")
        
        # Paramètres système
        parametres = [
            ("delai_saisie_notes_defaut", "14", "Délai par défaut pour la saisie des notes (en jours)", "int"),
            ("note_passage_defaut", "10.0", "Note de passage par défaut", "float"),
            ("credits_licence", "180", "Nombre total de crédits pour une licence", "int"),
            ("credits_master", "120", "Nombre total de crédits pour un master", "int"),
            ("credits_doctorat", "420", "Nombre total de crédits pour un doctorat (7 ans)", "int"),
            ("taux_presence_minimum", "75.0", "Taux de présence minimum requis (%)", "float"),
            ("email_notifications", "true", "Activer les notifications par email", "bool"),
            ("backup_automatique", "true", "Activer les sauvegardes automatiques", "bool"),
        ]
        
        from academics.models import ParametrageSysteme
        for cle, valeur, description, type_val in parametres:
            ParametrageSysteme.objects.create(
                cle=cle,
                valeur=valeur,
                description=description,
                type_valeur=type_val
            )
        
        # Historique de statuts pour quelques étudiants
        for etudiant in random.sample(tous_etudiants, 10):
            HistoriqueStatut.objects.create(
                etudiant=etudiant,
                statut=statut_inscrit,
                annee_academique=annee_actuelle,
                motif="Inscription initiale"
            )
        
        print("   ✅ Paramètres système et historiques créés")
        
        print("\n🎉 GÉNÉRATION DE DONNÉES TERMINÉE AVEC SUCCÈS!")
        print("=" * 60)
        print("📊 RÉSUMÉ DES DONNÉES CRÉÉES:")
        print(f"   • Établissement: {fac_medecine.acronyme}")
        print(f"   • Domaines: {Domaine.objects.count()}")
        print(f"   • Filières: {Filiere.objects.count()}")
        print(f"   • Niveaux: {Niveau.objects.count()}")
        print(f"   • Classes: {Classe.objects.count()}")
        print(f"   • UEs: {UE.objects.count()}")
        print(f"   • ECs: {EC.objects.count()}")
        print(f"   • Enseignants: {Enseignant.objects.count()}")
        print(f"   • Étudiants: {Etudiant.objects.count()}")
        print(f"   • Inscriptions: {Inscription.objects.count()}")
        print(f"   • Enseignements: {Enseignement.objects.count()}")
        print(f"   • Évaluations: {Evaluation.objects.count()}")
        print(f"   • Notes: {Note.objects.count()}")
        print("=" * 60)
        print("\n🔑 COMPTES DE TEST CRÉÉS:")
        print("   ADMINISTRATEUR:")
        print("   • Username: admin_fmsp")
        print("   • Password: AdminFMSP2024!")
        print("   \n   SCOLARITÉ:")
        print("   • Username: scolarite_fmsp")  
        print("   • Password: ScolariteFMSP2024!")
        print("   \n   ENSEIGNANTS:")
        print("   • Username: prof_kamga (Professeur)")
        print("   • Username: dr_njoya (Maître de Conférences)")
        print("   • Username: dr_bello (Maître Assistant)")
        print("   • Password pour tous: Enseignant2024!")
        print("   \n   ÉTUDIANTS:")
        print("   • Format: etudiant_2024me0001, etudiant_2024ph0075, etc.")
        print("   • Password pour tous: Etudiant2024!")
        print(f"   • Total créés: {len(tous_etudiants)} étudiants")
        print("=" * 60)

def create_additional_sample_data():
    """Crée des données supplémentaires pour enrichir les tests"""
    
    print("\n🔄 Création de données supplémentaires...")
    
    with transaction.atomic():
        # Récupérer les objets existants
        annee_actuelle = AnneeAcademique.objects.get(active=True)
        session_normale = Session.objects.get(code="SN")
        session_rattrapage = Session.objects.get(code="SR")
        
        # Créer quelques évaluations de rattrapage
        evaluations_rattrapage = Evaluation.objects.filter(
            session=session_normale,
            saisie_terminee=True
        )[:3]
        
        for eval_normale in evaluations_rattrapage:
            # Créer une évaluation de rattrapage
            eval_rattrapage = Evaluation.objects.create(
                nom=f"Rattrapage - {eval_normale.nom}",
                enseignement=eval_normale.enseignement,  # Corriger la référence
                type_evaluation=eval_normale.type_evaluation,
                session=session_rattrapage,
                date_evaluation=date(2025, 1, random.randint(15, 25)),
                note_sur=eval_normale.note_sur,
                saisie_terminee=False,
                saisie_autorisee=True
            )
            
            # Ajouter quelques notes pour les étudiants en difficulté
            notes_faibles = Note.objects.filter(
                evaluation=eval_normale,
                note_obtenue__lt=10,
                absent=False
            )[:5]
            
            for note_originale in notes_faibles:
                # Note de rattrapage généralement meilleure
                nouvelle_note = min(20, float(note_originale.note_obtenue) + random.uniform(2, 6))
                
                Note.objects.create(
                    etudiant=note_originale.etudiant,
                    evaluation=eval_rattrapage,
                    note_obtenue=Decimal(f'{nouvelle_note:.2f}'),
                    absent=False,
                    commentaire="Note de rattrapage"
                )
        
        # Créer quelques tâches automatisées
        from evaluations.models import TacheAutomatisee
        
        TacheAutomatisee.objects.create(
            type_tache="recap_semestriel",
            classe=Classe.objects.first(),
            semestre=Semestre.objects.first(),
            session=session_normale,
            annee_academique=annee_actuelle,
            statut="planifiee",
            date_planifiee=datetime.now() + timedelta(days=1)
        )
        
        print("   ✅ Données supplémentaires créées")

# SCRIPT PRINCIPAL
if __name__ == "__main__":
    print("🚀 DÉMARRAGE DE LA GÉNÉRATION DE DONNÉES")
    print("=" * 60)
    
    try:
        # Supprimer les données existantes si nécessaire
        response = input("Voulez-vous supprimer toutes les données existantes? (y/N): ")
        if response.lower() == 'y':
            print("🗑️ Suppression des données existantes...")
            
            # Supprimer dans l'ordre inverse des dépendances
            from evaluations.models import TacheAutomatisee
            from academics.models import ParametrageSysteme
            
            print("   → Suppression des évaluations et notes...")
            Note.objects.all().delete()
            Evaluation.objects.all().delete()
            TacheAutomatisee.objects.all().delete()
            
            print("   → Suppression des enseignements et inscriptions...")
            Enseignement.objects.all().delete()
            Inscription.objects.all().delete()
            HistoriqueStatut.objects.all().delete()
            
            print("   → Suppression des utilisateurs...")
            Etudiant.objects.all().delete()
            Enseignant.objects.all().delete()
            User.objects.filter(is_superuser=False).delete()
            
            print("   → Suppression de la structure académique...")
            ECClasse.objects.all().delete()
            ConfigurationEvaluationEC.objects.all().delete()
            EC.objects.all().delete()
            UE.objects.all().delete()
            TypeEvaluation.objects.all().delete()
            
            Classe.objects.all().delete()
            Session.objects.all().delete()
            Semestre.objects.all().delete()
            AnneeAcademique.objects.all().delete()
            
            Option.objects.all().delete()
            Filiere.objects.all().delete()
            TypeFormation.objects.all().delete()
            Niveau.objects.all().delete()
            Cycle.objects.all().delete()
            Domaine.objects.all().delete()
            
            Campus.objects.all().delete()
            ConfigurationEtablissement.objects.all().delete()
            Etablissement.objects.all().delete()
            Universite.objects.all().delete()
            TypeEtablissement.objects.all().delete()
            StatutEtudiant.objects.all().delete()
            ParametrageSysteme.objects.all().delete()
            
            print("   ✅ Données supprimées")
        
        # Créer les nouvelles données
        create_sample_data()
        
        # Créer des données supplémentaires
        create_additional_sample_data()
        
        print("\n✅ GÉNÉRATION TERMINÉE AVEC SUCCÈS!")
        print("\n📝 PROCHAINES ÉTAPES:")
        print("1. Connectez-vous avec un compte administrateur")
        print("2. Testez les fonctionnalités de saisie de notes")
        print("3. Générez des récapitulatifs semestriels")
        print("4. Explorez les statistiques et rapports")
        
    except Exception as e:
        print(f"\n❌ ERREUR: {str(e)}")
        import traceback
        traceback.print_exc()
        print("\n🔧 Vérifiez la configuration Django et les modèles")