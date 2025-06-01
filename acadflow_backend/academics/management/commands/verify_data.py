# academics/management/commands/verify_data.py
import os
import django
from django.core.management.base import BaseCommand
from django.db.models import Count, Avg, Sum
from django.db import models

# Configuration Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'acadflow_backend.settings')
django.setup()

from core.models import Domaine, Filiere, Niveau
from academics.models import AnneeAcademique, Classe, UE, EC, ConfigurationEvaluationEC
from users.models import User, Enseignant, Etudiant, Inscription
from evaluations.models import Enseignement, Evaluation, Note, MoyenneEC, MoyenneUE, MoyenneSemestre

class Command(BaseCommand):
    help = 'Vérifie l\'intégrité des données créées'
    
    def handle(self, *args, **options):
        self.stdout.write('🔍 Vérification des données créées...\n')
        
        # Vérifications des données de base
        self.verify_basic_data()
        
        # Vérifications des utilisateurs
        self.verify_users()
        
        # Vérifications académiques
        self.verify_academic_data()
        
        # Vérifications des évaluations
        self.verify_evaluations()
        
        # Statistiques générales
        self.show_statistics()
        
        self.stdout.write(
            self.style.SUCCESS('\n✅ Vérification terminée!')
        )
    
    def verify_basic_data(self):
        """Vérifier les données de base"""
        self.stdout.write('📚 Vérification des données de base:')
        
        # Domaines
        domaines_count = Domaine.objects.count()
        self.stdout.write(f'   • Domaines: {domaines_count}')
        
        # Filières
        filieres_count = Filiere.objects.count()
        self.stdout.write(f'   • Filières: {filieres_count}')
        
        # Niveaux
        niveaux_count = Niveau.objects.count()
        self.stdout.write(f'   • Niveaux: {niveaux_count}')
        
        # Années académiques
        annees_count = AnneeAcademique.objects.count()
        annee_active = AnneeAcademique.objects.filter(active=True).first()
        self.stdout.write(f'   • Années académiques: {annees_count}')
        self.stdout.write(f'   • Année active: {annee_active.libelle if annee_active else "Aucune"}')
        
        print()
    
    def verify_users(self):
        """Vérifier les utilisateurs"""
        self.stdout.write('👥 Vérification des utilisateurs:')
        
        # Utilisateurs par type
        for type_user, label in User.TYPES_UTILISATEUR:
            count = User.objects.filter(type_utilisateur=type_user).count()
            self.stdout.write(f'   • {label}: {count}')
        
        # Enseignants
        enseignants_count = Enseignant.objects.count()
        self.stdout.write(f'   • Profils enseignants: {enseignants_count}')
        
        # Étudiants
        etudiants_count = Etudiant.objects.count()
        self.stdout.write(f'   • Profils étudiants: {etudiants_count}')
        
        # Inscriptions
        inscriptions_count = Inscription.objects.filter(active=True).count()
        self.stdout.write(f'   • Inscriptions actives: {inscriptions_count}')
        
        print()
    
    def verify_academic_data(self):
        """Vérifier les données académiques"""
        self.stdout.write('🏫 Vérification des données académiques:')
        
        # Classes
        classes_count = Classe.objects.filter(active=True).count()
        self.stdout.write(f'   • Classes actives: {classes_count}')
        
        # UE
        ues_count = UE.objects.filter(actif=True).count()
        self.stdout.write(f'   • UE actives: {ues_count}')
        
        # EC
        ecs_count = EC.objects.filter(actif=True).count()
        self.stdout.write(f'   • EC actifs: {ecs_count}')
        
        # Enseignements
        enseignements_count = Enseignement.objects.filter(actif=True).count()
        self.stdout.write(f'   • Enseignements: {enseignements_count}')
        
        # Détails par classe
        self.stdout.write('   • Détails par classe:')
        for classe in Classe.objects.filter(active=True):
            effectif = Inscription.objects.filter(classe=classe, active=True).count()
            self.stdout.write(f'     - {classe.nom}: {effectif} étudiants')
        
        print()
    
    def verify_evaluations(self):
        """Vérifier les évaluations et notes"""
        self.stdout.write('📝 Vérification des évaluations:')
        
        # Évaluations
        evaluations_count = Evaluation.objects.count()
        evaluations_terminees = Evaluation.objects.filter(saisie_terminee=True).count()
        self.stdout.write(f'   • Évaluations créées: {evaluations_count}')
        self.stdout.write(f'   • Évaluations terminées: {evaluations_terminees}')
        
        # Notes
        notes_count = Note.objects.count()
        notes_absents = Note.objects.filter(absent=True).count()
        self.stdout.write(f'   • Notes saisies: {notes_count}')
        self.stdout.write(f'   • Absences: {notes_absents}')
        
        # Moyennes
        moyennes_ec = MoyenneEC.objects.count()
        moyennes_ue = MoyenneUE.objects.count()
        moyennes_sem = MoyenneSemestre.objects.count()
        self.stdout.write(f'   • Moyennes EC: {moyennes_ec}')
        self.stdout.write(f'   • Moyennes UE: {moyennes_ue}')
        self.stdout.write(f'   • Moyennes Semestre: {moyennes_sem}')
        
        print()
    
    def show_statistics(self):
        """Afficher des statistiques détaillées"""
        self.stdout.write('📊 Statistiques détaillées:')
        
        # Moyennes générales
        if MoyenneSemestre.objects.exists():
            moyenne_generale = MoyenneSemestre.objects.aggregate(
                moyenne=Avg('moyenne_generale')
            )['moyenne']
            self.stdout.write(f'   • Moyenne générale: {moyenne_generale:.2f}/20')
        
        # Répartition des notes
        if Note.objects.filter(absent=False).exists():
            notes = Note.objects.filter(absent=False)
            moyenne_notes = notes.aggregate(moyenne=Avg('note_obtenue'))['moyenne']
            note_max = notes.order_by('-note_obtenue').first().note_obtenue
            note_min = notes.order_by('note_obtenue').first().note_obtenue
            
            self.stdout.write(f'   • Moyenne des notes: {moyenne_notes:.2f}/20')
            self.stdout.write(f'   • Note maximale: {note_max}/20')
            self.stdout.write(f'   • Note minimale: {note_min}/20')
        
        # Taux de réussite par classe
        self.stdout.write('   • Taux de réussite par classe:')
        for classe in Classe.objects.filter(active=True):
            moyennes_classe = MoyenneSemestre.objects.filter(classe=classe)
            if moyennes_classe.exists():
                total = moyennes_classe.count()
                reussis = moyennes_classe.filter(moyenne_generale__gte=10).count()
                taux = (reussis / total) * 100 if total > 0 else 0
                self.stdout.write(f'     - {classe.nom}: {taux:.1f}% ({reussis}/{total})')
        
        # Enseignants les plus actifs
        self.stdout.write('   • Enseignants par nombre d\'enseignements:')
        enseignants_stats = Enseignant.objects.annotate(
            nb_enseignements=Count('enseignement')
        ).order_by('-nb_enseignements')
        
        for enseignant in enseignants_stats[:5]:
            self.stdout.write(
                f'     - {enseignant.user.get_full_name()}: '
                f'{enseignant.nb_enseignements} enseignements'
            )
        
        print()
    
    def check_data_integrity(self):
        """Vérifier l'intégrité des données"""
        self.stdout.write('🔍 Vérification de l\'intégrité des données:')
        
        errors = []
        warnings = []
        
        # Vérifier que chaque étudiant a des inscriptions
        etudiants_sans_inscription = Etudiant.objects.filter(
            inscription__isnull=True
        ).count()
        if etudiants_sans_inscription > 0:
            warnings.append(f'{etudiants_sans_inscription} étudiants sans inscription')
        
        # Vérifier que chaque EC a une configuration d'évaluation
        from academics.models import ConfigurationEvaluationEC
        ecs_sans_config = EC.objects.filter(
            configurationevaluationec__isnull=True
        ).count()
        if ecs_sans_config > 0:
            warnings.append(f'{ecs_sans_config} EC sans configuration d\'évaluation')
        
        # Vérifier les pourcentages d'évaluation
        for ec in EC.objects.filter(actif=True):
            total_pourcentage = ConfigurationEvaluationEC.objects.filter(
                ec=ec
            ).aggregate(
                total=Sum('pourcentage')
            )['total'] or 0
            
            if total_pourcentage != 100:
                errors.append(
                    f'EC {ec.code}: pourcentage total = {total_pourcentage}% (≠ 100%)'
                )
        
        # Vérifier les années académiques
        annees_actives = AnneeAcademique.objects.filter(active=True).count()
        if annees_actives != 1:
            errors.append(f'{annees_actives} années académiques actives (doit être 1)')
        
        # Vérifier les notes sans évaluation
        notes_orphelines = Note.objects.filter(evaluation__isnull=True).count()
        if notes_orphelines > 0:
            errors.append(f'{notes_orphelines} notes sans évaluation associée')
        
        # Afficher les résultats
        if errors:
            self.stdout.write(self.style.ERROR('   ❌ Erreurs détectées:'))
            for error in errors:
                self.stdout.write(f'     • {error}')
        
        if warnings:
            self.stdout.write(self.style.WARNING('   ⚠️ Avertissements:'))
            for warning in warnings:
                self.stdout.write(f'     • {warning}')
        
        if not errors and not warnings:
            self.stdout.write(self.style.SUCCESS('   ✅ Aucun problème détecté'))
        
        print()
        
        return len(errors) == 0

# Pour exécuter le script directement
if __name__ == '__main__':
    command = Command()
    command.handle()
    print("✅ Vérification terminée !")