# ========================================
# FICHIER: acadflow_backend/core/exceptions.py
# ========================================

from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status
import logging

logger = logging.getLogger('acadflow')

def custom_exception_handler(exc, context):
    """
    Gestionnaire d'exceptions personnalisé pour capturer et loguer les erreurs
    """
    response = exception_handler(exc, context)
    
    if response is not None:
        custom_response_data = {
            'error': True,
            'message': 'Une erreur est survenue',
            'details': response.data,
            'status_code': response.status_code
        }
        
        # Logger l'erreur
        logger.error(f"API Error: {exc}", extra={
            'request': context.get('request'),
            'view': context.get('view'),
            'exception': str(exc)
        })
        
        response.data = custom_response_data
    
    return response