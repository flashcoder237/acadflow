# ========================================
# FICHIER: acadflow_backend/management/commands/fix_database.py
# ========================================

from django.core.management.base import BaseCommand
from django.db import transaction, connection
from django.contrib.auth import get_user_model
import logging

logger = logging.getLogger('acadflow')

class Command(BaseCommand):
    help = 'Répare les problèmes de base de données identifiés'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--fix-admin-log',
            action='store_true',
            help='Répare les problèmes de contrainte dans django_admin_log',
        )
        parser.add_argument(
            '--clean-orphans',
            action='store_true',
            help='Nettoie les enregistrements orphelins',
        )
        parser.add_argument(
            '--reset-sequences',
            action='store_true',
            help='Remet à zéro les séquences PostgreSQL',
        )
    
    def handle(self, *args, **options):
        if options['fix_admin_log']:
            self.fix_admin_log_constraints()
        
        if options['clean_orphans']:
            self.clean_orphaned_records()
        
        if options['reset_sequences']:
            self.reset_database_sequences()
        
        self.stdout.write(
            self.style.SUCCESS('Réparations de base de données terminées!')
        )
    
    def fix_admin_log_constraints(self):
        """Répare les contraintes de clé étrangère dans django_admin_log"""
        self.stdout.write('Réparation des contraintes django_admin_log...')
        
        User = get_user_model()
        
        with connection.cursor() as cursor:
            # Trouver les entrées avec des user_id invalides
            cursor.execute("""
                SELECT DISTINCT user_id 
                FROM django_admin_log 
                WHERE user_id NOT IN (SELECT id FROM users)
            """)
            
            invalid_user_ids = [row[0] for row in cursor.fetchall()]
            
            if invalid_user_ids:
                self.stdout.write(f'Trouvé {len(invalid_user_ids)} user_id invalides: {invalid_user_ids}')
                
                # Option 1: Supprimer les entrées orphelines
                cursor.execute("""
                    DELETE FROM django_admin_log 
                    WHERE user_id NOT IN (SELECT id FROM users)
                """)
                
                self.stdout.write(f'Supprimé {cursor.rowcount} entrées orphelines du log admin')
                
                # Option 2: Ou créer un utilisateur par défaut pour les logs orphelins
                # admin_user, created = User.objects.get_or_create(
                #     username='system_admin',
                #     defaults={
                #         'first_name': 'Système',
                #         'last_name': 'Admin',
                #         'email': 'system@acadflow.com',
                #         'type_utilisateur': 'admin',
                #         'matricule': 'SYS001',
                #         'is_staff': True,
                #         'is_superuser': True
                #     }
                # )
                # 
                # if invalid_user_ids:
                #     cursor.execute("""
                #         UPDATE django_admin_log 
                #         SET user_id = %s 
                #         WHERE user_id IN %s
                #     """, [admin_user.id, tuple(invalid_user_ids)])
            else:
                self.stdout.write('Aucun problème trouvé dans django_admin_log')
    
    def clean_orphaned_records(self):
        """Nettoie les enregistrements orphelins dans toutes les tables"""
        self.stdout.write('Nettoyage des enregistrements orphelins...')
        
        with connection.cursor() as cursor:
            # Exemples de nettoyage - à adapter selon vos besoins
            
            # Nettoyer les inscriptions sans étudiant
            cursor.execute("""
                DELETE FROM inscriptions 
                WHERE etudiant_id NOT IN (SELECT id FROM etudiants)
            """)
            if cursor.rowcount > 0:
                self.stdout.write(f'Supprimé {cursor.rowcount} inscriptions orphelines')
            
            # Nettoyer les notes sans évaluation
            cursor.execute("""
                DELETE FROM notes 
                WHERE evaluation_id NOT IN (SELECT id FROM evaluations)
            """)
            if cursor.rowcount > 0:
                self.stdout.write(f'Supprimé {cursor.rowcount} notes orphelines')
            
            # Nettoyer les moyennes EC orphelines
            cursor.execute("""
                DELETE FROM moyennes_ecs 
                WHERE etudiant_id NOT IN (SELECT id FROM etudiants)
                OR ec_id NOT IN (SELECT id FROM ecs)
            """)
            if cursor.rowcount > 0:
                self.stdout.write(f'Supprimé {cursor.rowcount} moyennes EC orphelines')
    
    def reset_database_sequences(self):
        """Remet à zéro les séquences PostgreSQL pour éviter les conflits d'ID"""
        if 'postgresql' not in connection.settings_dict['ENGINE']:
            self.stdout.write('Séquences disponibles uniquement pour PostgreSQL')
            return
        
        self.stdout.write('Remise à zéro des séquences PostgreSQL...')
        
        with connection.cursor() as cursor:
            # Obtenir toutes les tables avec séquences
            cursor.execute("""
                SELECT schemaname, tablename, attname, adsrc
                FROM pg_attribute 
                JOIN pg_class ON pg_attribute.attrelid = pg_class.oid
                JOIN pg_namespace ON pg_class.relnamespace = pg_namespace.oid
                WHERE adsrc LIKE 'nextval%'
                AND schemaname = 'public'
            """)
            
            sequences = cursor.fetchall()
            
            for schema, table, column, seq_def in sequences:
                # Extraire le nom de la séquence
                seq_name = seq_def.split("'")[1]
                
                # Obtenir la valeur max actuelle
                cursor.execute(f"SELECT MAX({column}) FROM {table}")
                max_val = cursor.fetchone()[0] or 0
                
                # Remettre la séquence au bon niveau
                cursor.execute(f"SELECT setval('{seq_name}', {max_val + 1})")
                
                self.stdout.write(f'Séquence {seq_name} mise à jour: {max_val + 1}')