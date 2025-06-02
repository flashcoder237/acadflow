# academics/management/commands/initialiser_parametres.py
from django.core.management.base import BaseCommand
from academics.models import ParametrageSysteme

class Command(BaseCommand):
    help = 'Initialise les paramètres système par défaut'
    
    def handle(self, *args, **options):
        parametres_defaut = [
            {
                'cle': 'delai_saisie_notes_defaut',
                'valeur': '14',
                'description': 'Délai par défaut en jours pour la saisie des notes après évaluation',
                'type_valeur': 'int'
            },
            {
                'cle': 'generation_auto_recaps',
                'valeur': 'true',
                'description': 'Génération automatique des récapitulatifs semestriels',
                'type_valeur': 'bool'
            },
            {
                'cle': 'notification_delais_actif',
                'valeur': 'true',
                'description': 'Envoi automatique des notifications de délais',
                'type_valeur': 'bool'
            },
            {
                'cle': 'seuil_alerte_delai',
                'valeur': '3',
                'description': 'Nombre de jours avant échéance pour envoyer l\'alerte',
                'type_valeur': 'int'
            },
            {
                'cle': 'auto_inscription_ec',
                'valeur': 'true',
                'description': 'Inscription automatique des étudiants aux ECs de leur classe',
                'type_valeur': 'bool'
            },
            {
                'cle': 'email_notifications',
                'valeur': 'true',
                'description': 'Envoi d\'emails de notification',
                'type_valeur': 'bool'
            },
            {
                'cle': 'retention_logs',
                'valeur': '90',
                'description': 'Durée de conservation des logs en jours',
                'type_valeur': 'int'
            },
            {
                'cle': 'max_modifications_note',
                'valeur': '3',
                'description': 'Nombre maximum de modifications autorisées par note',
                'type_valeur': 'int'
            }
        ]
        
        created_count = 0
        for param_data in parametres_defaut:
            param, created = ParametrageSysteme.objects.get_or_create(
                cle=param_data['cle'],
                defaults=param_data
            )
            if created:
                created_count += 1
                self.stdout.write(
                    self.style.SUCCESS(f'Paramètre créé: {param.cle}')
                )
        
        self.stdout.write(
            self.style.SUCCESS(f'{created_count} nouveaux paramètres créés')
        )