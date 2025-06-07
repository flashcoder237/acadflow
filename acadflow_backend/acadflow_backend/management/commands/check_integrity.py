# ========================================
# FICHIER: acadflow_backend/management/commands/check_integrity.py  
# ========================================

from django.core.management.base import BaseCommand
from django.db import connection
from django.contrib.auth import get_user_model
import logging
from django.db import models

class Command(BaseCommand):
    help = 'Vérifie l\'intégrité de la base de données'
    
    def handle(self, *args, **options):
        self.stdout.write('Vérification de l\'intégrité de la base de données...\n')
        
        issues_found = 0
        
        # Vérifier les contraintes de clé étrangère
        issues_found += self.check_foreign_key_constraints()
        
        # Vérifier les utilisateurs orphelins
        issues_found += self.check_orphaned_users()
        
        # Vérifier les données incohérentes
        issues_found += self.check_data_consistency()
        
        # Vérifier les séquences (PostgreSQL)
        if 'postgresql' in connection.settings_dict['ENGINE']:
            issues_found += self.check_sequences()
        
        if issues_found == 0:
            self.stdout.write(
                self.style.SUCCESS('✅ Aucun problème d\'intégrité détecté!')
            )
        else:
            self.stdout.write(
                self.style.WARNING(f'⚠️ {issues_found} problème(s) détecté(s). Utilisez les commandes de réparation.')
            )
    
    def check_foreign_key_constraints(self):
        """Vérifie les contraintes de clé étrangère"""
        self.stdout.write('🔍 Vérification des contraintes de clé étrangère...')
        issues = 0
        
        with connection.cursor() as cursor:
            # Vérifier django_admin_log
            cursor.execute("""
                SELECT COUNT(*) FROM django_admin_log 
                WHERE user_id NOT IN (SELECT id FROM users)
            """)
            orphaned_logs = cursor.fetchone()[0]
            
            if orphaned_logs > 0:
                self.stdout.write(
                    self.style.ERROR(f'❌ {orphaned_logs} entrées orphelines dans django_admin_log')
                )
                issues += 1
            
            # Vérifier les inscriptions
            cursor.execute("""
                SELECT COUNT(*) FROM inscriptions 
                WHERE etudiant_id NOT IN (SELECT id FROM etudiants)
            """)
            orphaned_inscriptions = cursor.fetchone()[0]
            
            if orphaned_inscriptions > 0:
                self.stdout.write(
                    self.style.ERROR(f'❌ {orphaned_inscriptions} inscriptions orphelines')
                )
                issues += 1
            
            # Vérifier les notes
            cursor.execute("""
                SELECT COUNT(*) FROM notes 
                WHERE evaluation_id NOT IN (SELECT id FROM evaluations)
                OR etudiant_id NOT IN (SELECT id FROM etudiants)
            """)
            orphaned_notes = cursor.fetchone()[0]
            
            if orphaned_notes > 0:
                self.stdout.write(
                    self.style.ERROR(f'❌ {orphaned_notes} notes orphelines')
                )
                issues += 1
        
        return issues
    
    def check_orphaned_users(self):
        """Vérifie les utilisateurs orphelins"""
        self.stdout.write('👤 Vérification des utilisateurs orphelins...')
        issues = 0
        
        User = get_user_model()
        
        # Utilisateurs étudiants sans profil étudiant
        from users.models import Etudiant
        etudiants_sans_profil = User.objects.filter(
            type_utilisateur='etudiant'
        ).exclude(
            id__in=Etudiant.objects.values_list('user_id', flat=True)
        )
        
        if etudiants_sans_profil.exists():
            self.stdout.write(
                self.style.ERROR(f'❌ {etudiants_sans_profil.count()} utilisateurs étudiants sans profil')
            )
            issues += 1
        
        # Utilisateurs enseignants sans profil enseignant
        from users.models import Enseignant
        enseignants_sans_profil = User.objects.filter(
            type_utilisateur='enseignant'
        ).exclude(
            id__in=Enseignant.objects.values_list('user_id', flat=True)
        )
        
        if enseignants_sans_profil.exists():
            self.stdout.write(
                self.style.ERROR(f'❌ {enseignants_sans_profil.count()} utilisateurs enseignants sans profil')
            )
            issues += 1
        
        return issues
    
    def check_data_consistency(self):
        """Vérifie la cohérence des données"""
        self.stdout.write('📊 Vérification de la cohérence des données...')
        issues = 0
        
        # Vérifier les configurations d'évaluation EC
        from academics.models import ConfigurationEvaluationEC
        from django.db.models import Sum
        
        ecs_problematiques = ConfigurationEvaluationEC.objects.values('ec').annotate(
            total_pourcentage=Sum('pourcentage')
        ).exclude(total_pourcentage=100)
        
        if ecs_problematiques:
            self.stdout.write(
                self.style.ERROR(f'❌ {len(ecs_problematiques)} ECs avec pourcentages ≠ 100%')
            )
            issues += 1
        
        # Vérifier les années académiques multiples actives
        from academics.models import AnneeAcademique
        annees_actives = AnneeAcademique.objects.filter(active=True).count()
        
        if annees_actives != 1:
            self.stdout.write(
                self.style.ERROR(f'❌ {annees_actives} années académiques actives (doit être 1)')
            )
            issues += 1
        
        # Vérifier les moyennes incohérentes
        from evaluations.models import MoyenneSemestre
        moyennes_invalides = MoyenneSemestre.objects.filter(
            models.Q(moyenne_generale__lt=0) | models.Q(moyenne_generale__gt=20)
        ).count()
        
        if moyennes_invalides > 0:
            self.stdout.write(
                self.style.ERROR(f'❌ {moyennes_invalides} moyennes hors limites [0-20]')
            )
            issues += 1
        
        return issues
    
    def check_sequences(self):
        """Vérifie les séquences PostgreSQL"""
        self.stdout.write('🔢 Vérification des séquences PostgreSQL...')
        issues = 0
        
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT 
                    schemaname, 
                    tablename, 
                    attname, 
                    adsrc,
                    (SELECT MAX(attname::text::int) FROM pg_attribute WHERE attname ~ '^[0-9]+) as max_id
                FROM pg_attribute 
                JOIN pg_class ON pg_attribute.attrelid = pg_class.oid
                JOIN pg_namespace ON pg_class.relnamespace = pg_namespace.oid
                WHERE adsrc LIKE 'nextval%'
                AND schemaname = 'public'
                LIMIT 5  -- Limiter pour l'exemple
            """)
            
            sequences_info = cursor.fetchall()
            
            for schema, table, column, seq_def, max_id in sequences_info:
                # Obtenir la valeur actuelle de la séquence
                seq_name = seq_def.split("'")[1]
                cursor.execute(f"SELECT last_value FROM {seq_name}")
                current_seq_val = cursor.fetchone()[0]
                
                # Obtenir la valeur max dans la table
                cursor.execute(f"SELECT COALESCE(MAX({column}), 0) FROM {table}")
                max_table_val = cursor.fetchone()[0]
                
                if current_seq_val <= max_table_val:
                    self.stdout.write(
                        self.style.ERROR(f'❌ Séquence {seq_name}: {current_seq_val} <= max table: {max_table_val}')
                    )
                    issues += 1
        
        return issues

