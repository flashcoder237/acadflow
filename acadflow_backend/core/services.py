# core/services.py - Correction pour éviter les imports circulaires
from django.db import transaction
from django.utils import timezone
from django.core.mail import send_mail
from django.conf import settings
from datetime import datetime, timedelta
from decimal import Decimal
import logging

logger = logging.getLogger(__name__)

class AutomationService:
    """Service principal pour les automatisations"""
    
    @staticmethod
    def inscrire_etudiants_ecs_automatique(classe):
        """Inscription automatique des étudiants aux ECs de leur classe"""
        # Import local pour éviter la circularité
        from academics.models import ECClasse
        from evaluations.models import InscriptionEC
        from users.models import Inscription
        
        try:
            with transaction.atomic():
                # Récupérer tous les étudiants inscrits dans la classe
                inscriptions_classe = Inscription.objects.filter(
                    classe=classe,
                    active=True
                )
                
                # Récupérer tous les ECs de la classe
                ec_classes = ECClasse.objects.filter(classe=classe)
                
                inscriptions_creees = 0
                
                for inscription in inscriptions_classe:
                    for ec_classe in ec_classes:
                        # Créer l'inscription EC si elle n'existe pas
                        inscription_ec, created = InscriptionEC.objects.get_or_create(
                            etudiant=inscription.etudiant,
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
                
                return {
                    'success': True,
                    'inscriptions_creees': inscriptions_creees,
                    'message': f'{inscriptions_creees} inscriptions EC créées pour la classe {classe.nom}'
                }
                
        except Exception as e:
            logger.error(f"Erreur lors de l'inscription automatique aux ECs pour {classe.nom}: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    @staticmethod
    def generer_recapitulatif_semestriel(classe, semestre, session):
        """Génération automatique du récapitulatif semestriel"""
        from academics.models import RecapitulatifSemestriel, UE
        from evaluations.models import MoyenneSemestre, MoyenneUE
        from users.models import Inscription
        from django.core.files.base import ContentFile
        import json
        
        try:
            with transaction.atomic():
                # Créer ou récupérer le récapitulatif
                recap, created = RecapitulatifSemestriel.objects.get_or_create(
                    classe=classe,
                    semestre=semestre,
                    session=session,
                    annee_academique=classe.annee_academique,
                    defaults={'statut': 'en_cours'}
                )
                
                if not created and recap.statut == 'termine':
                    return {
                        'success': True,
                        'message': 'Récapitulatif déjà généré',
                        'recap_id': recap.id
                    }
                
                # Récupérer tous les étudiants de la classe
                inscriptions = Inscription.objects.filter(
                    classe=classe,
                    active=True
                ).select_related('etudiant__user')
                
                # Statistiques globales
                moyennes_semestre = MoyenneSemestre.objects.filter(
                    classe=classe,
                    semestre=semestre,
                    session=session,
                    annee_academique=classe.annee_academique
                )
                
                if moyennes_semestre.exists():
                    moyennes_values = [float(m.moyenne_generale) for m in moyennes_semestre]
                    
                    recap.nombre_etudiants = len(moyennes_values)
                    recap.moyenne_classe = sum(moyennes_values) / len(moyennes_values)
                    recap.taux_reussite = (len([m for m in moyennes_values if m >= 10]) / len(moyennes_values)) * 100
                
                # Générer les données détaillées
                donnees_recap = AutomationService._generer_donnees_recap(
                    classe, semestre, session, inscriptions
                )
                
                # Sauvegarder les données (ici vous pourriez générer PDF/Excel)
                fichier_json = ContentFile(
                    json.dumps(donnees_recap, indent=2, default=str).encode('utf-8')
                )
                recap.fichier_excel.save(
                    f'recap_{classe.code}_{semestre.nom}_{session.code}.json',
                    fichier_json
                )
                
                recap.statut = 'termine'
                recap.save()
                
                # Marquer la classe comme ayant son récap généré
                if semestre.numero == 1:
                    classe.recap_s1_genere = True
                    classe.date_recap_s1 = timezone.now()
                else:
                    classe.recap_s2_genere = True
                    classe.date_recap_s2 = timezone.now()
                classe.save()
                
                return {
                    'success': True,
                    'message': f'Récapitulatif généré pour {classe.nom} - {semestre.nom}',
                    'recap_id': recap.id,
                    'stats': {
                        'nombre_etudiants': recap.nombre_etudiants,
                        'moyenne_classe': float(recap.moyenne_classe) if recap.moyenne_classe else 0,
                        'taux_reussite': float(recap.taux_reussite) if recap.taux_reussite else 0
                    }
                }
                
        except Exception as e:
            logger.error(f"Erreur génération récapitulatif {classe.nom} - {semestre.nom}: {str(e)}")
            if 'recap' in locals():
                recap.statut = 'erreur'
                recap.save()
            return {
                'success': False,
                'error': str(e)
            }
    
    @staticmethod
    def _generer_donnees_recap(classe, semestre, session, inscriptions):
        """Génère les données détaillées du récapitulatif"""
        from academics.models import UE
        from evaluations.models import MoyenneUE, MoyenneSemestre, MoyenneEC
        
        donnees = {
            'classe': {
                'nom': classe.nom,
                'code': classe.code,
                'niveau': classe.niveau.nom,
                'filiere': classe.filiere.nom,
                'effectif': inscriptions.count()
            },
            'semestre': semestre.nom,
            'session': session.nom,
            'date_generation': timezone.now().isoformat(),
            'etudiants': []
        }
        
        # UEs du semestre
        ues_semestre = UE.objects.filter(
            niveau=classe.niveau,
            semestre=semestre,
            actif=True
        ).order_by('code')
        
        for inscription in inscriptions:
            etudiant_data = {
                'matricule': inscription.etudiant.user.matricule,
                'nom_complet': inscription.etudiant.user.get_full_name(),
                'moyennes_ue': [],
                'moyenne_semestre': None,
                'credits_obtenus': 0,
                'credits_requis': 0,
                'mention': None,
                'decision': None
            }
            
            # Moyennes UE
            for ue in ues_semestre:
                moyenne_ue = MoyenneUE.objects.filter(
                    etudiant=inscription.etudiant,
                    ue=ue,
                    session=session,
                    annee_academique=classe.annee_academique
                ).first()
                
                if moyenne_ue:
                    etudiant_data['moyennes_ue'].append({
                        'ue_code': ue.code,
                        'ue_nom': ue.nom,
                        'moyenne': float(moyenne_ue.moyenne),
                        'credits': ue.credits,
                        'credits_obtenus': moyenne_ue.credits_obtenus,
                        'validee': moyenne_ue.validee
                    })
                    
                    etudiant_data['credits_obtenus'] += moyenne_ue.credits_obtenus
                    etudiant_data['credits_requis'] += ue.credits
            
            # Moyenne semestrielle
            moyenne_sem = MoyenneSemestre.objects.filter(
                etudiant=inscription.etudiant,
                classe=classe,
                semestre=semestre,
                session=session,
                annee_academique=classe.annee_academique
            ).first()
            
            if moyenne_sem:
                etudiant_data['moyenne_semestre'] = float(moyenne_sem.moyenne_generale)
                etudiant_data['mention'] = AutomationService._get_mention(moyenne_sem.moyenne_generale)
                etudiant_data['decision'] = AutomationService._get_decision(
                    moyenne_sem.moyenne_generale,
                    etudiant_data['credits_obtenus'],
                    etudiant_data['credits_requis']
                )
            
            donnees['etudiants'].append(etudiant_data)
        
        return donnees
    
    @staticmethod
    def _get_mention(moyenne):
        """Détermine la mention selon la moyenne"""
        if moyenne >= 16:
            return "Très Bien"
        elif moyenne >= 14:
            return "Bien"
        elif moyenne >= 12:
            return "Assez Bien"
        elif moyenne >= 10:
            return "Passable"
        else:
            return "Insuffisant"
    
    @staticmethod
    def _get_decision(moyenne, credits_obtenus, credits_requis):
        """Détermine la décision académique"""
        taux_validation = (credits_obtenus / credits_requis) * 100 if credits_requis > 0 else 0
        
        if moyenne >= 10 and taux_validation >= 100:
            return "Admis(e)"
        elif moyenne >= 10 and taux_validation >= 70:
            return "Admis(e) avec dettes"
        elif taux_validation >= 50:
            return "Autorisé(e) à continuer"
        else:
            return "Redoublement"
    
    @staticmethod
    def verifier_delais_saisie_notes():
        """Vérifie les délais de saisie des notes et envoie des notifications"""
        from evaluations.models import Evaluation
        from django.contrib.auth import get_user_model
        
        User = get_user_model()
        
        # Evaluations approchant la limite
        date_limite_proche = timezone.now() + timedelta(days=3)
        evaluations_urgentes = Evaluation.objects.filter(
            date_limite_saisie__lte=date_limite_proche,
            date_limite_saisie__gte=timezone.now(),
            saisie_terminee=False,
            saisie_autorisee=True
        ).select_related('enseignement__enseignant__user')
        
        notifications_envoyees = 0
        
        for evaluation in evaluations_urgentes:
            try:
                # Envoyer notification à l'enseignant
                AutomationService._envoyer_notification_delai(evaluation)
                notifications_envoyees += 1
                
                # Notifier aussi l'administration
                admins = User.objects.filter(
                    type_utilisateur__in=['admin', 'scolarite'],
                    is_active=True
                )
                
                for admin in admins:
                    AutomationService._envoyer_notification_admin_delai(evaluation, admin)
                    
            except Exception as e:
                logger.error(f"Erreur notification délai évaluation {evaluation.id}: {str(e)}")
        
        # Evaluations dépassées
        evaluations_depassees = Evaluation.objects.filter(
            date_limite_saisie__lt=timezone.now(),
            saisie_terminee=False,
            saisie_autorisee=True
        )
        
        # Désactiver la saisie pour les évaluations dépassées (sauf si admin autorise)
        for evaluation in evaluations_depassees:
            try:
                annee = evaluation.enseignement.annee_academique
                if not annee.autoriser_modification_notes:
                    evaluation.saisie_autorisee = False
                    evaluation.save()
            except:
                pass
        
        return {
            'notifications_envoyees': notifications_envoyees,
            'evaluations_urgentes': evaluations_urgentes.count(),
            'evaluations_depassees': evaluations_depassees.count()
        }
    
    @staticmethod
    def _envoyer_notification_delai(evaluation):
        """Envoie une notification de délai à l'enseignant"""
        if not evaluation.enseignement.enseignant.user.email:
            return
        
        jours_restants = (evaluation.date_limite_saisie.date() - timezone.now().date()).days
        
        sujet = f"Délai de saisie des notes - {evaluation.nom}"
        message = f"""
        Bonjour {evaluation.enseignement.enseignant.user.get_full_name()},
        
        Vous avez {jours_restants} jour(s) pour saisir les notes de l'évaluation suivante :
        
        Évaluation : {evaluation.nom}
        EC : {evaluation.enseignement.ec.nom}
        Classe : {evaluation.enseignement.classe.nom}
        Date limite : {evaluation.date_limite_saisie.strftime('%d/%m/%Y à %H:%M')}
        
        Veuillez vous connecter à la plateforme pour saisir les notes.
        
        Cordialement,
        L'équipe AcadFlow
        """
        
        send_mail(
            sujet,
            message,
            settings.DEFAULT_FROM_EMAIL,
            [evaluation.enseignement.enseignant.user.email],
            fail_silently=True
        )
    
    @staticmethod
    def _envoyer_notification_admin_delai(evaluation, admin):
        """Envoie une notification de délai à l'administration"""
        if not admin.email:
            return
        
        jours_restants = (evaluation.date_limite_saisie.date() - timezone.now().date()).days
        
        sujet = f"Alerte délai saisie - {evaluation.enseignement.enseignant.user.get_full_name()}"
        message = f"""
        Bonjour {admin.get_full_name()},
        
        L'enseignant {evaluation.enseignement.enseignant.user.get_full_name()} a {jours_restants} jour(s) 
        pour saisir les notes de l'évaluation :
        
        Évaluation : {evaluation.nom}
        EC : {evaluation.enseignement.ec.nom}
        Classe : {evaluation.enseignement.classe.nom}
        Date limite : {evaluation.date_limite_saisie.strftime('%d/%m/%Y à %H:%M')}
        
        Vous pouvez contacter l'enseignant ou autoriser une saisie tardive si nécessaire.
        
        Cordialement,
        Système AcadFlow
        """
        
        send_mail(
            sujet,
            message,
            settings.DEFAULT_FROM_EMAIL,
            [admin.email],
            fail_silently=True
        )
    
    @staticmethod
    def planifier_recapitulatifs_automatiques():
        """Planifie la génération automatique des récapitulatifs semestriels"""
        from academics.models import Classe, Semestre, Session, AnneeAcademique
        from evaluations.models import TacheAutomatisee
        
        try:
            annee_active = AnneeAcademique.objects.get(active=True)
            if not annee_active.generation_auto_recaps:
                return {'message': 'Génération automatique désactivée'}
            
            sessions = Session.objects.filter(
                actif=True,
                generation_recaps_auto=True,
                date_fin_session__isnull=False
            )
            
            taches_planifiees = 0
            
            for session in sessions:
                # Vérifier si on est après la fin de session
                if timezone.now().date() <= session.date_fin_session:
                    continue
                
                classes = Classe.objects.filter(
                    annee_academique=annee_active,
                    active=True
                )
                
                for classe in classes:
                    for semestre in Semestre.objects.all():
                        # Vérifier si le récap n'est pas déjà généré
                        if semestre.numero == 1 and classe.recap_s1_genere:
                            continue
                        if semestre.numero == 2 and classe.recap_s2_genere:
                            continue
                        
                        # Planifier la tâche si elle n'existe pas
                        tache, created = TacheAutomatisee.objects.get_or_create(
                            type_tache='recap_semestriel',
                            classe=classe,
                            semestre=semestre,
                            session=session,
                            annee_academique=annee_active,
                            defaults={
                                'date_planifiee': timezone.now() + timedelta(hours=1),
                                'statut': 'planifiee'
                            }
                        )
                        
                        if created:
                            taches_planifiees += 1
            
            return {
                'success': True,
                'taches_planifiees': taches_planifiees
            }
            
        except Exception as e:
            logger.error(f"Erreur planification récapitulatifs automatiques: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    @staticmethod
    def executer_taches_planifiees():
        """Exécute les tâches automatisées planifiées"""
        from evaluations.models import TacheAutomatisee
        
        taches_a_executer = TacheAutomatisee.objects.filter(
            statut='planifiee',
            date_planifiee__lte=timezone.now()
        ).order_by('date_planifiee')
        
        resultats = {
            'taches_executees': 0,
            'taches_echouees': 0,
            'details': []
        }
        
        for tache in taches_a_executer:
            try:
                tache.statut = 'en_cours'
                tache.date_execution = timezone.now()
                tache.save()
                
                if tache.type_tache == 'recap_semestriel':
                    resultat = AutomationService.generer_recapitulatif_semestriel(
                        tache.classe,
                        tache.semestre,
                        tache.session
                    )
                elif tache.type_tache == 'inscription_ec':
                    resultat = AutomationService.inscrire_etudiants_ecs_automatique(
                        tache.classe
                    )
                else:
                    resultat = {'success': False, 'error': 'Type de tâche non supporté'}
                
                if resultat['success']:
                    tache.statut = 'terminee'
                    tache.resultats = resultat
                    resultats['taches_executees'] += 1
                else:
                    tache.statut = 'erreur'
                    tache.erreurs = resultat.get('error', 'Erreur inconnue')
                    resultats['taches_echouees'] += 1
                
                tache.date_fin = timezone.now()
                tache.save()
                
                resultats['details'].append({
                    'tache_id': tache.id,
                    'type': tache.type_tache,
                    'statut': tache.statut,
                    'resultat': resultat
                })
                
            except Exception as e:
                logger.error(f"Erreur exécution tâche {tache.id}: {str(e)}")
                tache.statut = 'erreur'
                tache.erreurs = str(e)
                tache.date_fin = timezone.now()
                tache.save()
                
                resultats['taches_echouees'] += 1
                resultats['details'].append({
                    'tache_id': tache.id,
                    'type': tache.type_tache,
                    'statut': 'erreur',
                    'erreur': str(e)
                })
        
        return resultats

class NotificationService:
    """Service de notifications"""
    
    @staticmethod
    def notifier_fin_semestre(semestre, session):
        """Notifie la fin d'un semestre pour déclencher les récapitulatifs"""
        from academics.models import Classe, AnneeAcademique
        from django.contrib.auth import get_user_model
        
        User = get_user_model()
        
        try:
            annee_active = AnneeAcademique.objects.get(active=True)
            classes = Classe.objects.filter(
                annee_academique=annee_active,
                active=True
            )
            
            # Notifier les responsables de classe
            for classe in classes:
                if classe.responsable_classe and classe.responsable_classe.user.email:
                    NotificationService._envoyer_notification_fin_semestre(
                        classe, semestre, session
                    )
            
            # Notifier l'administration
            admins = User.objects.filter(
                type_utilisateur__in=['admin', 'scolarite', 'direction'],
                is_active=True
            )
            
            for admin in admins:
                if admin.email:
                    NotificationService._envoyer_notification_admin_fin_semestre(
                        admin, semestre, session, classes.count()
                    )
            
            return {'success': True, 'notifications_envoyees': classes.count() + admins.count()}
            
        except Exception as e:
            logger.error(f"Erreur notification fin semestre: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    @staticmethod
    def _envoyer_notification_fin_semestre(classe, semestre, session):
        """Envoie notification fin de semestre au responsable de classe"""
        sujet = f"Fin de {semestre.nom} - Récapitulatif à valider - {classe.nom}"
        message = f"""
        Bonjour {classe.responsable_classe.user.get_full_name()},
        
        Le {semestre.nom} de la session {session.nom} est terminé pour votre classe {classe.nom}.
        
        Le récapitulatif semestriel va être généré automatiquement.
        Vous pourrez le consulter et le valider dans votre espace enseignant.
        
        Informations de la classe :
        - Niveau : {classe.niveau.nom}
        - Filière : {classe.filiere.nom}
        - Effectif : {classe.inscription_set.filter(active=True).count()} étudiants
        
        Cordialement,
        L'équipe AcadFlow
        """
        
        send_mail(
            sujet,
            message,
            settings.DEFAULT_FROM_EMAIL,
            [classe.responsable_classe.user.email],
            fail_silently=True
        )
    
    @staticmethod
    def _envoyer_notification_admin_fin_semestre(admin, semestre, session, nb_classes):
        """Envoie notification fin de semestre à l'administration"""
        sujet = f"Fin de {semestre.nom} - {nb_classes} classes concernées"
        message = f"""
        Bonjour {admin.get_full_name()},
        
        Le {semestre.nom} de la session {session.nom} est terminé.
        
        {nb_classes} classes sont concernées par la génération automatique des récapitulatifs semestriels.
        
        Vous pouvez suivre l'avancement dans l'interface d'administration.
        
        Cordialement,
        Système AcadFlow
        """
        
        send_mail(
            sujet,
            message,
            settings.DEFAULT_FROM_EMAIL,
            [admin.email],
            fail_silently=True
        )



# Création des dossiers nécessaires
import os

def create_project_structure():
    """Crée la structure des dossiers nécessaires"""
    directories = [
        'logs',
        'media',
        'media/recapitulatifs',
        'media/photos',
        'staticfiles',
        'templates',
        'fixtures'
    ]
    
    for directory in directories:
        os.makedirs(directory, exist_ok=True)
        print(f"Dossier créé: {directory}")


