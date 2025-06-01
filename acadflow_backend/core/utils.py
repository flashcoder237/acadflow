from decimal import Decimal
from django.db import transaction
from academics.models import UE, EC, ConfigurationEvaluationEC
from evaluations.models import Note, MoyenneEC, MoyenneUE, MoyenneSemestre

def calculer_moyenne_ec(etudiant, ec, session, annee_academique):
    """Calcule la moyenne d'un EC pour un étudiant"""
    try:
        with transaction.atomic():
            # Récupérer les configurations d'évaluation pour cet EC
            configurations = ConfigurationEvaluationEC.objects.filter(ec=ec)
            
            if not configurations.exists():
                return None
            
            moyenne_ponderee = Decimal('0.00')
            total_pourcentage = Decimal('0.00')
            
            for config in configurations:
                # Récupérer les notes pour ce type d'évaluation
                notes = Note.objects.filter(
                    etudiant=etudiant,
                    evaluation__enseignement__ec=ec,
                    evaluation__type_evaluation=config.type_evaluation,
                    evaluation__session=session
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
                
                return moyenne_ec
            
            return None
    
    except Exception as e:
        print(f"Erreur calcul moyenne EC: {e}")
        return None

def calculer_moyenne_ue(etudiant, ue, session, annee_academique):
    """Calcule la moyenne d'une UE pour un étudiant"""
    try:
        with transaction.atomic():
            # Récupérer tous les EC de l'UE
            ecs = EC.objects.filter(ue=ue, actif=True)
            
            if not ecs.exists():
                return None
            
            moyenne_ponderee = Decimal('0.00')
            total_poids = Decimal('0.00')
            
            for ec in ecs:
                # Calculer ou récupérer la moyenne EC
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
                # Ajuster si le total des poids n'est pas 100%
                moyenne_finale = moyenne_ponderee * (100 / total_poids)
                
                # Déterminer les crédits obtenus
                credits_obtenus = ue.credits if moyenne_finale >= 10 else 0
                
                # Sauvegarder la moyenne
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
                
                return moyenne_ue
            
            return None
    
    except Exception as e:
        print(f"Erreur calcul moyenne UE: {e}")
        return None

def calculer_moyenne_semestre(etudiant, classe, semestre, session, annee_academique):
    """Calcule la moyenne semestrielle pour un étudiant"""
    try:
        with transaction.atomic():
            # Récupérer toutes les UE du semestre pour ce niveau
            ues = UE.objects.filter(
                niveau=classe.niveau,
                semestre=semestre,
                actif=True
            )
            
            if not ues.exists():
                return None
            
            moyenne_ponderee = Decimal('0.00')
            total_coefficients = Decimal('0.00')
            credits_obtenus = 0
            credits_requis = 0
            
            for ue in ues:
                # Calculer ou récupérer la moyenne UE
                moyenne_ue_obj = MoyenneUE.objects.filter(
                    etudiant=etudiant,
                    ue=ue,
                    session=session,
                    annee_academique=annee_academique
                ).first()
                
                if not moyenne_ue_obj:
                    moyenne_ue_obj = calculer_moyenne_ue(etudiant, ue, session, annee_academique)
                
                if moyenne_ue_obj:
                    moyenne_ponderee += moyenne_ue_obj.moyenne * ue.coefficient
                    total_coefficients += ue.coefficient
                    credits_obtenus += moyenne_ue_obj.credits_obtenus
                    credits_requis += ue.credits
            
            if total_coefficients > 0:
                moyenne_finale = moyenne_ponderee / total_coefficients
                
                # Sauvegarder la moyenne semestrielle
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
                
                return moyenne_semestre
            
            return None
    
    except Exception as e:
        print(f"Erreur calcul moyenne semestre: {e}")
        return None