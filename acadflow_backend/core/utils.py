# core/utils.py - Mise à jour avec nouvelles fonctionnalités
from decimal import Decimal
from django.db import transaction
from django.utils import timezone
from academics.models import UE, EC, ConfigurationEvaluationEC
from evaluations.models import Note, MoyenneEC, MoyenneUE, MoyenneSemestre
import logging

logger = logging.getLogger(__name__)

def calculer_moyenne_ec(etudiant, ec, session, annee_academique):
    """Calcule la moyenne d'un EC pour un étudiant"""
    try:
        with transaction.atomic():
            configurations = ConfigurationEvaluationEC.objects.filter(ec=ec)
            
            if not configurations.exists():
                logger.warning(f"Aucune configuration d'évaluation pour EC {ec.code}")
                return None
            
            moyenne_ponderee = Decimal('0.00')
            total_pourcentage = Decimal('0.00')
            
            for config in configurations:
                notes = Note.objects.filter(
                    etudiant=etudiant,
                    evaluation__enseignement__ec=ec,
                    evaluation__type_evaluation=config.type_evaluation,
                    evaluation__session=session,
                    evaluation__enseignement__annee_academique=annee_academique
                ).exclude(absent=True)
                
                if notes.exists():
                    # Moyenne des notes pour ce type d'évaluation
                    moyenne_type = sum(note.note_obtenue for note in notes) / len(notes)
                    
                    # Pondération
                    moyenne_ponderee += moyenne_type * (config.pourcentage / 100)
                    total_pourcentage += config.pourcentage
            
            if total_pourcentage > 0:
                # Ajuster si le total des pourcentages n'est pas 100%
                moyenne_finale = moyenne_ponderee * (100 / total_pourcentage)
                
                # Sauvegarder la moyenne
                moyenne_ec, created = MoyenneEC.objects.update_or_create(
                    etudiant=etudiant,
                    ec=ec,
                    session=session,
                    annee_academique=annee_academique,
                    defaults={
                        'moyenne': round(moyenne_finale, 2),
                        'validee': moyenne_finale >= 10
                    }
                )
                
                logger.info(f"Moyenne EC calculée: {etudiant.user.matricule} - {ec.code}: {moyenne_finale}")
                return moyenne_ec
            
            return None
    
    except Exception as e:
        logger.error(f"Erreur calcul moyenne EC {ec.code} pour {etudiant.user.matricule}: {e}")
        return None

def calculer_moyenne_ue(etudiant, ue, session, annee_academique):
    """Calcule la moyenne d'une UE pour un étudiant - SANS coefficient, juste crédits"""
    try:
        with transaction.atomic():
            ecs = EC.objects.filter(ue=ue, actif=True)
            
            if not ecs.exists():
                logger.warning(f"Aucun EC actif pour UE {ue.code}")
                return None
            
            moyenne_ponderee = Decimal('0.00')
            total_poids = Decimal('0.00')
            
            for ec in ecs:
                moyenne_ec_obj = MoyenneEC.objects.filter(
                    etudiant=etudiant,
                    ec=ec,
                    session=session,
                    annee_academique=annee_academique
                ).first()
                
                if not moyenne_ec_obj:
                    moyenne_ec_obj = calculer_moyenne_ec(etudiant, ec, session, annee_academique)
                
                if moyenne_ec_obj:
                    moyenne_ponderee += moyenne_ec_obj.moyenne * (ec.poids_ec / 100)
                    total_poids += ec.poids_ec
            
            if total_poids > 0:
                moyenne_finale = moyenne_ponderee * (100 / total_poids)
                
                # Crédits obtenus = crédits UE si moyenne >= 10, sinon 0
                credits_obtenus = ue.credits if moyenne_finale >= 10 else 0
                
                moyenne_ue, created = MoyenneUE.objects.update_or_create(
                    etudiant=etudiant,
                    ue=ue,
                    session=session,
                    annee_academique=annee_academique,
                    defaults={
                        'moyenne': round(moyenne_finale, 2),
                        'credits_obtenus': credits_obtenus,
                        'validee': moyenne_finale >= 10
                    }
                )
                
                logger.info(f"Moyenne UE calculée: {etudiant.user.matricule} - {ue.code}: {moyenne_finale}")
                return moyenne_ue
            
            return None
    
    except Exception as e:
        logger.error(f"Erreur calcul moyenne UE {ue.code} pour {etudiant.user.matricule}: {e}")
        return None

def calculer_moyenne_semestre(etudiant, classe, semestre, session, annee_academique):
    """Calcule la moyenne semestrielle - SANS coefficient UE, juste moyenne simple"""
    try:
        with transaction.atomic():
            ues = UE.objects.filter(
                niveau=classe.niveau,
                semestre=semestre,
                actif=True
            )
            
            if not ues.exists():
                logger.warning(f"Aucune UE pour {classe.niveau.nom} - {semestre.nom}")
                return None
            
            # Calcul simple: moyenne arithmétique des UE (sans coefficient)
            somme_moyennes = Decimal('0.00')
            nombre_ues_validees = 0
            credits_obtenus = 0
            credits_requis = 0
            
            for ue in ues:
                moyenne_ue_obj = MoyenneUE.objects.filter(
                    etudiant=etudiant,
                    ue=ue,
                    session=session,
                    annee_academique=annee_academique
                ).first()
                
                if not moyenne_ue_obj:
                    moyenne_ue_obj = calculer_moyenne_ue(etudiant, ue, session, annee_academique)
                
                if moyenne_ue_obj:
                    somme_moyennes += moyenne_ue_obj.moyenne
                    nombre_ues_validees += 1
                    credits_obtenus += moyenne_ue_obj.credits_obtenus
                    credits_requis += ue.credits
            
            if nombre_ues_validees > 0:
                moyenne_finale = somme_moyennes / nombre_ues_validees
                
                moyenne_semestre, created = MoyenneSemestre.objects.update_or_create(
                    etudiant=etudiant,
                    classe=classe,
                    semestre=semestre,
                    session=session,
                    annee_academique=annee_academique,
                    defaults={
                        'moyenne_generale': round(moyenne_finale, 2),
                        'credits_obtenus': credits_obtenus,
                        'credits_requis': credits_requis
                    }
                )
                
                logger.info(f"Moyenne semestre calculée: {etudiant.user.matricule} - {semestre.nom}: {moyenne_finale}")
                return moyenne_semestre
            
            return None
    
    except Exception as e:
        logger.error(f"Erreur calcul moyenne semestre pour {etudiant.user.matricule}: {e}")
        return None

def inscrire_etudiant_ecs_classe(etudiant, classe):
    """Inscrit automatiquement un étudiant aux ECs de sa classe"""
    from academics.models import ECClasse
    from evaluations.models import InscriptionEC
    
    try:
        with transaction.atomic():
            ec_classes = ECClasse.objects.filter(classe=classe)
            inscriptions_creees = 0
            
            for ec_classe in ec_classes:
                inscription_ec, created = InscriptionEC.objects.get_or_create(
                    etudiant=etudiant,
                    ec=ec_classe.ec,
                    classe=classe,
                    annee_academique=classe.annee_academique,
                    defaults={
                        'obligatoire': ec_classe.obligatoire,
                        'active': True
                    }
                )
                
                if created:
                    inscriptions_creees += 1
            
            logger.info(f"Étudiant {etudiant.user.matricule} inscrit à {inscriptions_creees} ECs")
            return inscriptions_creees
            
    except Exception as e:
        logger.error(f"Erreur inscription ECs pour {etudiant.user.matricule}: {e}")
        return 0

def verifier_coherence_evaluations(ec):
    """Vérifie la cohérence des configurations d'évaluation d'un EC"""
    configurations = ConfigurationEvaluationEC.objects.filter(ec=ec)
    
    if not configurations.exists():
        return {
            'valide': False,
            'erreurs': ['Aucune configuration d\'évaluation définie']
        }
    
    total_pourcentage = sum(config.pourcentage for config in configurations)
    erreurs = []
    
    if total_pourcentage != 100:
        erreurs.append(f'Total des pourcentages: {total_pourcentage}% (doit être 100%)')
    
    # Vérifier les types d'évaluation en double
    types_evaluation = [config.type_evaluation.id for config in configurations]
    if len(types_evaluation) != len(set(types_evaluation)):
        erreurs.append('Types d\'évaluation en double')
    
    return {
        'valide': len(erreurs) == 0,
        'erreurs': erreurs,
        'total_pourcentage': total_pourcentage,
        'nombre_types': configurations.count()
    }

def generer_matricule_etudiant(annee_academique, filiere):
    """Génère automatiquement un matricule pour un nouvel étudiant"""
    from users.models import User
    
    # Format: YYYY-FF-NNNN (Année-Code Filière-Numéro séquentiel)
    annee = annee_academique.date_debut.year
    code_filiere = filiere.code.upper()[:2]
    
    # Trouver le prochain numéro
    pattern = f"{annee}-{code_filiere}-"
    derniers_matricules = User.objects.filter(
        matricule__startswith=pattern,
        type_utilisateur='etudiant'
    ).order_by('-matricule')
    
    if derniers_matricules.exists():
        dernier_numero = int(derniers_matricules.first().matricule.split('-')[-1])
        nouveau_numero = dernier_numero + 1
    else:
        nouveau_numero = 1
    
    return f"{annee}-{code_filiere}-{nouveau_numero:04d}"

def generer_numero_carte_etudiant():
    """Génère un numéro de carte étudiant unique"""
    from users.models import Etudiant
    import random
    import string
    
    while True:
        # Format: CE + 8 chiffres
        numero = "CE" + ''.join(random.choices(string.digits, k=8))
        
        if not Etudiant.objects.filter(numero_carte=numero).exists():
            return numero

def calculer_statistiques_classe(classe, session):
    """Calcule les statistiques complètes d'une classe pour une session"""
    from evaluations.models import MoyenneSemestre
    from users.models import Inscription
    
    # Étudiants inscrits
    inscriptions = Inscription.objects.filter(classe=classe, active=True)
    nb_etudiants = inscriptions.count()
    
    if nb_etudiants == 0:
        return {
            'nb_etudiants': 0,
            'moyenne_classe': 0,
            'taux_reussite': 0,
            'mentions': {},
            'credits': {}
        }
    
    # Moyennes semestrielles
    moyennes = MoyenneSemestre.objects.filter(
        classe=classe,
        session=session
    )
    
    if not moyennes.exists():
        return {
            'nb_etudiants': nb_etudiants,
            'moyenne_classe': 0,
            'taux_reussite': 0,
            'mentions': {},
            'credits': {},
            'note': 'Moyennes non encore calculées'
        }
    
    moyennes_values = [float(m.moyenne_generale) for m in moyennes]
    
    # Statistiques générales
    moyenne_classe = sum(moyennes_values) / len(moyennes_values)
    nb_admis = len([m for m in moyennes_values if m >= 10])
    taux_reussite = (nb_admis / len(moyennes_values)) * 100
    
    # Mentions
    mentions = {
        'tres_bien': len([m for m in moyennes_values if m >= 16]),
        'bien': len([m for m in moyennes_values if 14 <= m < 16]),
        'assez_bien': len([m for m in moyennes_values if 12 <= m < 14]),
        'passable': len([m for m in moyennes_values if 10 <= m < 12]),
        'insuffisant': len([m for m in moyennes_values if m < 10])
    }
    
    # Crédits
    total_credits_obtenus = sum(m.credits_obtenus for m in moyennes)
    total_credits_requis = sum(m.credits_requis for m in moyennes)
    
    return {
        'nb_etudiants': nb_etudiants,
        'nb_moyennes_calculees': moyennes.count(),
        'moyenne_classe': round(moyenne_classe, 2),
        'moyenne_max': max(moyennes_values),
        'moyenne_min': min(moyennes_values),
        'taux_reussite': round(taux_reussite, 2),
        'nb_admis': nb_admis,
        'mentions': mentions,
        'credits': {
            'total_obtenus': total_credits_obtenus,
            'total_requis': total_credits_requis,
            'taux_validation': round((total_credits_obtenus / total_credits_requis) * 100, 2) if total_credits_requis > 0 else 0
        }
    }

def exporter_donnees_classe(classe, session, format_export='json'):
    """Exporte les données complètes d'une classe"""
    from evaluations.models import MoyenneSemestre, MoyenneUE, MoyenneEC
    from users.models import Inscription
    import json
    import csv
    from io import StringIO
    
    # Récupérer toutes les données
    inscriptions = Inscription.objects.filter(
        classe=classe, active=True
    ).select_related('etudiant__user')
    
    donnees = {
        'classe': {
            'nom': classe.nom,
            'code': classe.code,
            'niveau': classe.niveau.nom,
            'filiere': classe.filiere.nom,
            'annee_academique': classe.annee_academique.libelle
        },
        'session': session.nom,
        'export_date': timezone.now().isoformat(),
        'etudiants': []
    }
    
    for inscription in inscriptions:
        etudiant_data = {
            'matricule': inscription.etudiant.user.matricule,
            'nom_complet': inscription.etudiant.user.get_full_name(),
            'numero_carte': inscription.etudiant.numero_carte,
            'moyennes_semestre': [],
            'moyennes_ue': [],
            'statistiques': {}
        }
        
        # Moyennes semestrielles
        moyennes_sem = MoyenneSemestre.objects.filter(
            etudiant=inscription.etudiant,
            classe=classe,
            session=session
        )
        
        for moyenne in moyennes_sem:
            etudiant_data['moyennes_semestre'].append({
                'semestre': moyenne.semestre.nom,
                'moyenne': float(moyenne.moyenne_generale),
                'credits_obtenus': moyenne.credits_obtenus,
                'credits_requis': moyenne.credits_requis
            })
        
        # Moyennes UE
        moyennes_ue = MoyenneUE.objects.filter(
            etudiant=inscription.etudiant,
            session=session,
            annee_academique=classe.annee_academique
        ).select_related('ue')
        
        for moyenne in moyennes_ue:
            etudiant_data['moyennes_ue'].append({
                'ue_code': moyenne.ue.code,
                'ue_nom': moyenne.ue.nom,
                'moyenne': float(moyenne.moyenne),
                'credits': moyenne.ue.credits,
                'credits_obtenus': moyenne.credits_obtenus,
                'validee': moyenne.validee
            })
        
        donnees['etudiants'].append(etudiant_data)
    
    if format_export == 'csv':
        # Convertir en CSV
        output = StringIO()
        writer = csv.writer(output)
        
        # En-têtes
        headers = ['Matricule', 'Nom Complet', 'Numero Carte']
        # Ajouter colonnes pour chaque semestre et UE...
        
        writer.writerow(headers)
        
        for etudiant in donnees['etudiants']:
            row = [
                etudiant['matricule'],
                etudiant['nom_complet'],
                etudiant['numero_carte']
            ]
            # Ajouter les moyennes...
            writer.writerow(row)
        
        return output.getvalue()
    
    else:
        # Format JSON par défaut
        return json.dumps(donnees, indent=2, default=str, ensure_ascii=False)