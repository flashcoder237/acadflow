# ========================================
# FICHIER: acadflow_backend/core/utils.py (Corrections)
# ========================================

from decimal import Decimal, InvalidOperation
from django.db import transaction
from django.utils import timezone
from academics.models import UE, EC, ConfigurationEvaluationEC
from evaluations.models import Note, MoyenneEC, MoyenneUE, MoyenneSemestre
import logging

logger = logging.getLogger('acadflow')

def calculer_moyenne_ec(etudiant, ec, session, annee_academique):
    """Calcule la moyenne d'un EC pour un étudiant avec gestion d'erreur"""
    try:
        with transaction.atomic():
            configurations = ConfigurationEvaluationEC.objects.filter(ec=ec)
            
            if not configurations.exists():
                logger.warning(f"Aucune configuration d'évaluation pour EC {ec.code}")
                return None
            
            moyenne_ponderee = Decimal('0.00')
            total_pourcentage = Decimal('0.00')
            notes_trouvees = False
            
            for config in configurations:
                try:
                    notes = Note.objects.filter(
                        etudiant=etudiant,
                        evaluation__enseignement__ec=ec,
                        evaluation__type_evaluation=config.type_evaluation,
                        evaluation__session=session,
                        evaluation__enseignement__annee_academique=annee_academique
                    ).exclude(absent=True)
                    
                    if notes.exists():
                        notes_trouvees = True
                        # Moyenne des notes pour ce type d'évaluation
                        notes_values = [note.note_obtenue for note in notes]
                        moyenne_type = sum(notes_values) / len(notes_values)
                        
                        # Pondération
                        moyenne_ponderee += moyenne_type * (config.pourcentage / 100)
                        total_pourcentage += config.pourcentage
                
                except Exception as e:
                    logger.error(f"Erreur traitement config {config.id}: {e}")
                    continue
            
            if not notes_trouvees:
                logger.info(f"Aucune note trouvée pour {etudiant.user.matricule} - EC {ec.code}")
                return None
            
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
    """Calcule la moyenne d'une UE pour un étudiant avec gestion d'erreur"""
    try:
        with transaction.atomic():
            ecs = EC.objects.filter(ue=ue, actif=True)
            
            if not ecs.exists():
                logger.warning(f"Aucun EC actif pour UE {ue.code}")
                return None
            
            moyenne_ponderee = Decimal('0.00')
            total_poids = Decimal('0.00')
            moyennes_trouvees = False
            
            for ec in ecs:
                try:
                    moyenne_ec_obj = MoyenneEC.objects.filter(
                        etudiant=etudiant,
                        ec=ec,
                        session=session,
                        annee_academique=annee_academique
                    ).first()
                    
                    if not moyenne_ec_obj:
                        moyenne_ec_obj = calculer_moyenne_ec(etudiant, ec, session, annee_academique)
                    
                    if moyenne_ec_obj:
                        moyennes_trouvees = True
                        poids = ec.poids_ec / 100
                        moyenne_ponderee += moyenne_ec_obj.moyenne * poids
                        total_poids += poids
                
                except Exception as e:
                    logger.error(f"Erreur traitement EC {ec.code}: {e}")
                    continue
            
            if not moyennes_trouvees:
                logger.info(f"Aucune moyenne EC trouvée pour {etudiant.user.matricule} - UE {ue.code}")
                return None
            
            if total_poids > 0:
                moyenne_finale = moyenne_ponderee / total_poids
                
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
    """Calcule la moyenne semestrielle avec gestion d'erreur"""
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
                try:
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
                
                except Exception as e:
                    logger.error(f"Erreur traitement UE {ue.code}: {e}")
                    continue
            
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

def safe_decimal_operation(operation, default_value=Decimal('0.00')):
    """Wrapper sécurisé pour les opérations Decimal"""
    try:
        return operation()
    except (InvalidOperation, TypeError, ValueError) as e:
        logger.warning(f"Erreur opération Decimal: {e}")
        return default_value

def generer_matricule_etudiant(annee_academique, filiere):
    """Génère automatiquement un matricule pour un nouvel étudiant avec gestion d'erreur"""
    try:
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
            try:
                dernier_numero = int(derniers_matricules.first().matricule.split('-')[-1])
                nouveau_numero = dernier_numero + 1
            except (ValueError, IndexError):
                nouveau_numero = 1
        else:
            nouveau_numero = 1
        
        return f"{annee}-{code_filiere}-{nouveau_numero:04d}"
        
    except Exception as e:
        logger.error(f"Erreur génération matricule: {e}")
        # Fallback sur un matricule basique
        import random
        return f"ETU{random.randint(1000, 9999)}"