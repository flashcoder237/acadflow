# core/tasks.py
from celery import shared_task
from core.services import AutomationService
import logging

logger = logging.getLogger(__name__)

@shared_task
def executer_taches_automatisees_periodique():
    """Tâche Celery pour exécuter les automatisations périodiquement"""
    try:
        # Vérifier les délais de saisie
        resultats_delais = AutomationService.verifier_delais_saisie_notes()
        
        # Planifier les récapitulatifs
        resultats_recaps = AutomationService.planifier_recapitulatifs_automatiques()
        
        # Exécuter les tâches planifiées
        resultats_execution = AutomationService.executer_taches_planifiees()
        
        return {
            'success': True,
            'delais': resultats_delais,
            'recaps': resultats_recaps,
            'execution': resultats_execution
        }
        
    except Exception as e:
        logger.error(f"Erreur dans la tâche automatisée périodique: {str(e)}")
        return {
            'success': False,
            'error': str(e)
        }

@shared_task
def generer_recapitulatif_async(classe_id, semestre_id, session_id):
    """Génération asynchrone d'un récapitulatif semestriel"""
    try:
        from academics.models import Classe, Semestre, Session
        
        classe = Classe.objects.get(id=classe_id)
        semestre = Semestre.objects.get(id=semestre_id)
        session = Session.objects.get(id=session_id)
        
        return AutomationService.generer_recapitulatif_semestriel(
            classe, semestre, session
        )
        
    except Exception as e:
        logger.error(f"Erreur génération récapitulatif async: {str(e)}")
        return {
            'success': False,
            'error': str(e)
        }

@shared_task
def envoyer_notifications_delais():
    """Envoi périodique des notifications de délais"""
    return AutomationService.verifier_delais_saisie_notes()

@shared_task
def nettoyer_donnees_anciennes():
    """Nettoyage périodique des anciennes données"""
    from django.core.management import call_command
    
    try:
        call_command('nettoyer_donnees', '--force')
        return {'success': True, 'message': 'Nettoyage effectué'}
    except Exception as e:
        logger.error(f"Erreur nettoyage automatique: {str(e)}")
        return {'success': False, 'error': str(e)}