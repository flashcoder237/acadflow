# academics/views.py - Version complète avec toutes les vues
from django.shortcuts import render
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q, Count, Sum, Avg
from django.db import transaction
from django.utils import timezone
from datetime import timedelta

from .models import (
    AnneeAcademique, RecapitulatifSemestriel, Session, Semestre, Classe, UE, EC,
    TypeEvaluation, ConfigurationEvaluationEC
)
from .serializers import (
    AnneeAcademiqueSerializer, SessionSerializer, SemestreSerializer,
    ClasseSerializer, UESerializer, ECSerializer, UEDetailSerializer,
    TypeEvaluationSerializer, ConfigurationEvaluationECSerializer
)
# Import conditionnel pour éviter les erreurs circulaires
try:
    from core.services import AutomationService, NotificationService
except ImportError:
    # Services simplifiés si les imports échouent
    class AutomationService:
        @staticmethod
        def inscrire_etudiants_ecs_automatique(classe):
            return {'success': True, 'inscriptions_creees': 0, 'message': 'Service non disponible'}
        
        @staticmethod
        def generer_recapitulatif_semestriel(classe, semestre, session):
            return {'success': True, 'message': 'Service non disponible', 'recap_id': None}
        
        @staticmethod
        def verifier_delais_saisie_notes():
            return {'notifications_envoyees': 0, 'evaluations_urgentes': 0, 'evaluations_depassees': 0}
        
        @staticmethod
        def planifier_recapitulatifs_automatiques():
            return {'success': True, 'taches_planifiees': 0}
        
        @staticmethod
        def executer_taches_planifiees():
            return {'taches_executees': 0, 'taches_echouees': 0, 'details': []}
    
    class NotificationService:
        @staticmethod
        def notifier_fin_semestre(semestre, session):
            return {'success': True, 'notifications_envoyees': 0}

class AnneeAcademiqueViewSet(viewsets.ModelViewSet):
    queryset = AnneeAcademique.objects.all()
    serializer_class = AnneeAcademiqueSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    @action(detail=False, methods=['get'])
    def active(self, request):
        """Retourne l'année académique active"""
        try:
            annee_active = AnneeAcademique.objects.get(active=True)
            serializer = self.get_serializer(annee_active)
            return Response(serializer.data)
        except AnneeAcademique.DoesNotExist:
            return Response(
                {'error': 'Aucune année académique active trouvée'}, 
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=True, methods=['post'])
    def configurer_parametres(self, request, pk=None):
        """Configure les paramètres d'automatisation pour une année académique"""
        if request.user.type_utilisateur not in ['admin', 'direction']:
            return Response(
                {'error': 'Permission refusée'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        annee = self.get_object()
        
        delai_saisie = request.data.get('delai_saisie_notes')
        autoriser_modif = request.data.get('autoriser_modification_notes')
        generation_auto = request.data.get('generation_auto_recaps')
        
        if delai_saisie is not None:
            annee.delai_saisie_notes = delai_saisie
        if autoriser_modif is not None:
            annee.autoriser_modification_notes = autoriser_modif
        if generation_auto is not None:
            annee.generation_auto_recaps = generation_auto
        
        annee.save()
        
        return Response({
            'message': 'Paramètres mis à jour',
            'parametres': {
                'delai_saisie_notes': annee.delai_saisie_notes,
                'autoriser_modification_notes': annee.autoriser_modification_notes,
                'generation_auto_recaps': annee.generation_auto_recaps
            }
        })
    
    @action(detail=True, methods=['post'])
    def generer_recaps_masse(self, request, pk=None):
        """Génère tous les récapitulatifs semestriels en masse"""
        if request.user.type_utilisateur not in ['admin', 'scolarite']:
            return Response(
                {'error': 'Permission refusée'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        annee = self.get_object()
        session_id = request.data.get('session_id')
        semestre_id = request.data.get('semestre_id')
        
        if not session_id or not semestre_id:
            return Response(
                {'error': 'session_id et semestre_id requis'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            session = Session.objects.get(id=session_id)
            semestre = Semestre.objects.get(id=semestre_id)
        except (Session.DoesNotExist, Semestre.DoesNotExist):
            return Response(
                {'error': 'Session ou semestre non trouvé'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        classes = Classe.objects.filter(
            annee_academique=annee,
            active=True
        )
        
        resultats = {
            'total_classes': classes.count(),
            'recaps_generes': 0,
            'echecs': 0,
            'details': []
        }
        
        for classe in classes:
            resultat = AutomationService.generer_recapitulatif_semestriel(
                classe, semestre, session
            )
            
            if resultat['success']:
                resultats['recaps_generes'] += 1
            else:
                resultats['echecs'] += 1
            
            resultats['details'].append({
                'classe': classe.nom,
                'statut': 'succès' if resultat['success'] else 'échec',
                'message': resultat.get('message', resultat.get('error'))
            })
        
        return Response(resultats)
    
    @action(detail=True, methods=['get'])
    def statistiques(self, request, pk=None):
        """Statistiques d'une année académique"""
        annee = self.get_object()
        
        try:
            from users.models import Inscription
            from core.models import Filiere, Niveau
            
            stats = {
                'nombre_classes': annee.classe_set.filter(active=True).count(),
                'nombre_inscriptions': Inscription.objects.filter(
                    annee_academique=annee, active=True
                ).count(),
                'inscriptions_par_filiere': [],
                'inscriptions_par_niveau': []
            }
            
            # Statistiques par filière
            for filiere in Filiere.objects.filter(actif=True):
                nombre = Inscription.objects.filter(
                    annee_academique=annee,
                    classe__filiere=filiere,
                    active=True
                ).count()
                if nombre > 0:
                    stats['inscriptions_par_filiere'].append({
                        'filiere': filiere.nom,
                        'nombre': nombre
                    })
            
            # Statistiques par niveau
            for niveau in Niveau.objects.filter(actif=True):
                nombre = Inscription.objects.filter(
                    annee_academique=annee,
                    classe__niveau=niveau,
                    active=True
                ).count()
                if nombre > 0:
                    stats['inscriptions_par_niveau'].append({
                        'niveau': niveau.nom,
                        'nombre': nombre
                    })
            
            return Response(stats)
            
        except ImportError:
            return Response({
                'nombre_classes': annee.classe_set.filter(active=True).count(),
                'nombre_inscriptions': 0,
                'inscriptions_par_filiere': [],
                'inscriptions_par_niveau': []
            })

class SessionViewSet(viewsets.ModelViewSet):
    queryset = Session.objects.filter(actif=True)
    serializer_class = SessionSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    @action(detail=True, methods=['post'])
    def configurer_dates(self, request, pk=None):
        """Configure les dates de début et fin de session"""
        if request.user.type_utilisateur not in ['admin', 'scolarite']:
            return Response(
                {'error': 'Permission refusée'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        session = self.get_object()
        date_debut = request.data.get('date_debut_session')
        date_fin = request.data.get('date_fin_session')
        generation_auto = request.data.get('generation_recaps_auto')
        
        if date_debut:
            session.date_debut_session = date_debut
        if date_fin:
            session.date_fin_session = date_fin
        if generation_auto is not None:
            session.generation_recaps_auto = generation_auto
        
        session.save()
        
        return Response({
            'message': 'Dates de session configurées',
            'session': SessionSerializer(session).data
        })
    
    @action(detail=False, methods=['get'])
    def sessions_actives(self, request):
        """Retourne les sessions actuellement actives"""
        date_actuelle = timezone.now().date()
        
        sessions_actives = self.get_queryset().filter(
            date_debut_session__lte=date_actuelle,
            date_fin_session__gte=date_actuelle
        )
        
        serializer = self.get_serializer(sessions_actives, many=True)
        return Response(serializer.data)

class SemestreViewSet(viewsets.ModelViewSet):
    queryset = Semestre.objects.all()
    serializer_class = SemestreSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    @action(detail=True, methods=['post'])
    def configurer_periode(self, request, pk=None):
        """Configure les dates de début et fin du semestre"""
        if request.user.type_utilisateur not in ['admin', 'scolarite']:
            return Response(
                {'error': 'Permission refusée'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        semestre = self.get_object()
        date_debut = request.data.get('date_debut')
        date_fin = request.data.get('date_fin')
        
        if date_debut:
            semestre.date_debut = date_debut
        if date_fin:
            semestre.date_fin = date_fin
        
        semestre.save()
        
        return Response({
            'message': 'Période du semestre configurée',
            'semestre': SemestreSerializer(semestre).data
        })
    
    @action(detail=True, methods=['get'])
    def classes_concernees(self, request, pk=None):
        """Retourne les classes concernées par ce semestre"""
        semestre = self.get_object()
        
        # Classes ayant des UE dans ce semestre
        classes = Classe.objects.filter(
            niveau__ue__semestre=semestre,
            active=True
        ).distinct()
        
        serializer = ClasseSerializer(classes, many=True)
        return Response(serializer.data)

class ClasseViewSet(viewsets.ModelViewSet):
    queryset = Classe.objects.filter(active=True)
    serializer_class = ClasseSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        filiere_id = self.request.query_params.get('filiere', None)
        niveau_id = self.request.query_params.get('niveau', None)
        annee_id = self.request.query_params.get('annee_academique', None)
        
        if filiere_id:
            queryset = queryset.filter(filiere_id=filiere_id)
        if niveau_id:
            queryset = queryset.filter(niveau_id=niveau_id)
        if annee_id:
            queryset = queryset.filter(annee_academique_id=annee_id)
            
        return queryset
    
    @action(detail=True, methods=['post'])
    def inscrire_etudiants_ecs(self, request, pk=None):
        """Inscription automatique des étudiants aux ECs de la classe"""
        if request.user.type_utilisateur not in ['admin', 'scolarite']:
            return Response(
                {'error': 'Permission refusée'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        classe = self.get_object()
        resultat = AutomationService.inscrire_etudiants_ecs_automatique(classe)
        
        if resultat['success']:
            return Response(resultat)
        else:
            return Response(resultat, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['get'])
    def ecs_disponibles(self, request, pk=None):
        """Liste des ECs disponibles pour cette classe"""
        classe = self.get_object()
        
        # ECs du niveau et semestre
        ecs_niveau = EC.objects.filter(
            ue__niveau=classe.niveau,
            actif=True
        ).select_related('ue')
        
        # ECs déjà assignés à la classe
        ecs_assignes = ECClasse.objects.filter(classe=classe).values_list('ec_id', flat=True)
        
        ecs_data = []
        for ec in ecs_niveau:
            ec_info = {
                'id': ec.id,
                'code': ec.code,
                'nom': ec.nom,
                'ue': {
                    'code': ec.ue.code,
                    'nom': ec.ue.nom,
                    'semestre': ec.ue.semestre.nom,
                    'credits': ec.ue.credits
                },
                'assigne': ec.id in ecs_assignes
            }
            ecs_data.append(ec_info)
        
        return Response(ecs_data)
    
    @action(detail=True, methods=['post'])
    def assigner_ecs(self, request, pk=None):
        """Assigne des ECs à la classe"""
        if request.user.type_utilisateur not in ['admin', 'scolarite']:
            return Response(
                {'error': 'Permission refusée'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        classe = self.get_object()
        ecs_ids = request.data.get('ecs_ids', [])
        
        if not ecs_ids:
            return Response(
                {'error': 'ecs_ids requis'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        assignations_creees = 0
        
        try:
            with transaction.atomic():
                for ec_id in ecs_ids:
                    try:
                        ec = EC.objects.get(id=ec_id)
                        ec_classe, created = ECClasse.objects.get_or_create(
                            ec=ec,
                            classe=classe,
                            defaults={'obligatoire': True}
                        )
                        if created:
                            assignations_creees += 1
                    except EC.DoesNotExist:
                        continue
                
                # Inscrire automatiquement les étudiants existants
                AutomationService.inscrire_etudiants_ecs_automatique(classe)
            
            return Response({
                'message': f'{assignations_creees} ECs assignés à la classe',
                'assignations_creees': assignations_creees
            })
            
        except Exception as e:
            return Response(
                {'error': f'Erreur lors de l\'assignation: {str(e)}'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=True, methods=['get'])
    def recapitulatifs(self, request, pk=None):
        """Liste des récapitulatifs semestriels de la classe"""
        classe = self.get_object()
        
        recaps = RecapitulatifSemestriel.objects.filter(
            classe=classe
        ).select_related('semestre', 'session').order_by('-date_generation')
        
        recaps_data = []
        for recap in recaps:
            recap_info = {
                'id': recap.id,
                'semestre': recap.semestre.nom,
                'session': recap.session.nom,
                'statut': recap.statut,
                'date_generation': recap.date_generation,
                'nombre_etudiants': recap.nombre_etudiants,
                'moyenne_classe': float(recap.moyenne_classe) if recap.moyenne_classe else None,
                'taux_reussite': float(recap.taux_reussite) if recap.taux_reussite else None,
                'fichiers': {
                    'pdf': recap.fichier_pdf.url if recap.fichier_pdf else None,
                    'excel': recap.fichier_excel.url if recap.fichier_excel else None
                }
            }
            recaps_data.append(recap_info)
        
        return Response(recaps_data)
    
    @action(detail=True, methods=['post'])
    def generer_recap_manuel(self, request, pk=None):
        """Génère manuellement un récapitulatif semestriel"""
        if request.user.type_utilisateur not in ['admin', 'scolarite', 'enseignant']:
            return Response(
                {'error': 'Permission refusée'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        classe = self.get_object()
        session_id = request.data.get('session_id')
        semestre_id = request.data.get('semestre_id')
        
        if not session_id or not semestre_id:
            return Response(
                {'error': 'session_id et semestre_id requis'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            session = Session.objects.get(id=session_id)
            semestre = Semestre.objects.get(id=semestre_id)
        except (Session.DoesNotExist, Semestre.DoesNotExist):
            return Response(
                {'error': 'Session ou semestre non trouvé'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        resultat = AutomationService.generer_recapitulatif_semestriel(
            classe, semestre, session
        )
        
        if resultat['success']:
            # Enregistrer qui a déclenché la génération manuelle
            try:
                recap = RecapitulatifSemestriel.objects.get(id=resultat['recap_id'])
                recap.genere_par = request.user
                recap.save()
            except:
                pass
            
            return Response(resultat)
        else:
            return Response(resultat, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def definir_responsable(self, request, pk=None):
        """Définit le responsable de classe"""
        if request.user.type_utilisateur not in ['admin', 'direction']:
            return Response(
                {'error': 'Permission refusée'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        classe = self.get_object()
        enseignant_id = request.data.get('enseignant_id')
        
        if not enseignant_id:
            return Response(
                {'error': 'enseignant_id requis'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            from users.models import Enseignant
            enseignant = Enseignant.objects.get(id=enseignant_id)
            classe.responsable_classe = enseignant
            classe.save()
            
            return Response({
                'message': f'{enseignant.user.get_full_name()} défini comme responsable de {classe.nom}',
                'responsable': {
                    'id': enseignant.id,
                    'nom': enseignant.user.get_full_name(),
                    'grade': enseignant.grade
                }
            })
            
        except Enseignant.DoesNotExist:
            return Response(
                {'error': 'Enseignant non trouvé'}, 
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=True, methods=['get'])
    def etudiants(self, request, pk=None):
        """Retourne les étudiants d'une classe avec informations détaillées"""
        classe = self.get_object()
        
        try:
            from users.models import Inscription
            from users.serializers import InscriptionSerializer
            
            inscriptions = Inscription.objects.filter(
                classe=classe, active=True
            ).select_related('etudiant__user', 'statut')
            
            serializer = InscriptionSerializer(inscriptions, many=True)
            return Response(serializer.data)
            
        except ImportError:
            return Response({'error': 'Module users non disponible'}, 
                          status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=True, methods=['get'])
    def programme_pedagogique(self, request, pk=None):
        """Retourne le programme pédagogique complet d'une classe"""
        classe = self.get_object()
        
        programme = {
            'classe': ClasseSerializer(classe).data,
            'semestres': []
        }
        
        semestres = Semestre.objects.all().order_by('numero')
        for semestre in semestres:
            ues = UE.objects.filter(
                niveau=classe.niveau,
                semestre=semestre,
                actif=True
            ).prefetch_related('elements_constitutifs')
            
            if ues.exists():
                semestre_data = {
                    'semestre': SemestreSerializer(semestre).data,
                    'ues': UEDetailSerializer(ues, many=True).data,
                    'total_credits': sum(ue.credits for ue in ues),
                    'nombre_ues': ues.count()
                }
                programme['semestres'].append(semestre_data)
        
        return Response(programme)

class UEViewSet(viewsets.ModelViewSet):
    queryset = UE.objects.filter(actif=True)
    serializer_class = UESerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return UEDetailSerializer
        return UESerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        niveau_id = self.request.query_params.get('niveau', None)
        semestre_id = self.request.query_params.get('semestre', None)
        
        if niveau_id:
            queryset = queryset.filter(niveau_id=niveau_id)
        if semestre_id:
            queryset = queryset.filter(semestre_id=semestre_id)
            
        return queryset
    
    @action(detail=True, methods=['get'])
    def configuration_evaluations(self, request, pk=None):
        """Retourne la configuration des évaluations pour tous les EC de l'UE"""
        ue = self.get_object()
        
        configuration = {
            'ue': UESerializer(ue).data,
            'elements_constitutifs': []
        }
        
        for ec in ue.elements_constitutifs.filter(actif=True):
            ec_config = {
                'ec': ECSerializer(ec).data,
                'evaluations': []
            }
            
            configs = ConfigurationEvaluationEC.objects.filter(ec=ec).select_related('type_evaluation')
            for config in configs:
                ec_config['evaluations'].append({
                    'type_evaluation': config.type_evaluation.nom,
                    'pourcentage': config.pourcentage
                })
            
            ec_config['total_pourcentage'] = sum(c['pourcentage'] for c in ec_config['evaluations'])
            configuration['elements_constitutifs'].append(ec_config)
        
        return Response(configuration)

class ECViewSet(viewsets.ModelViewSet):
    queryset = EC.objects.filter(actif=True)
    serializer_class = ECSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        ue_id = self.request.query_params.get('ue', None)
        classe_id = self.request.query_params.get('classe', None)
        
        if ue_id:
            queryset = queryset.filter(ue_id=ue_id)
        if classe_id:
            queryset = queryset.filter(classes__id=classe_id)
            
        return queryset
    
    @action(detail=True, methods=['get'])
    def classes_assignees(self, request, pk=None):
        """Liste des classes assignées à cet EC"""
        ec = self.get_object()
        
        ec_classes = ECClasse.objects.filter(ec=ec).select_related('classe')
        classes_data = []
        
        for ec_classe in ec_classes:
            classe_info = {
                'id': ec_classe.classe.id,
                'nom': ec_classe.classe.nom,
                'code': ec_classe.classe.code,
                'niveau': ec_classe.classe.niveau.nom,
                'filiere': ec_classe.classe.filiere.nom,
                'obligatoire': ec_classe.obligatoire,
                'effectif': ec_classe.classe.inscription_set.filter(active=True).count()
            }
            classes_data.append(classe_info)
        
        return Response(classes_data)
    
    @action(detail=True, methods=['get'])
    def enseignements(self, request, pk=None):
        """Retourne tous les enseignements de cet EC"""
        ec = self.get_object()
        
        try:
            from evaluations.models import Enseignement
            from evaluations.serializers import EnseignementSerializer
            
            enseignements = Enseignement.objects.filter(
                ec=ec, actif=True
            ).select_related('enseignant__user', 'classe', 'annee_academique')
            
            serializer = EnseignementSerializer(enseignements, many=True)
            return Response(serializer.data)
            
        except ImportError:
            return Response({'error': 'Module evaluations non disponible'}, 
                          status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class TypeEvaluationViewSet(viewsets.ModelViewSet):
    queryset = TypeEvaluation.objects.filter(actif=True)
    serializer_class = TypeEvaluationSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    @action(detail=False, methods=['get'])
    def usage_statistics(self, request):
        """Statistiques d'utilisation des types d'évaluation"""
        stats = []
        for type_eval in self.get_queryset():
            usage = ConfigurationEvaluationEC.objects.filter(
                type_evaluation=type_eval
            ).count()
            stats.append({
                'type_evaluation': TypeEvaluationSerializer(type_eval).data,
                'nombre_utilisations': usage
            })
        
        return Response(sorted(stats, key=lambda x: x['nombre_utilisations'], reverse=True))

class ConfigurationEvaluationECViewSet(viewsets.ModelViewSet):
    queryset = ConfigurationEvaluationEC.objects.all()
    serializer_class = ConfigurationEvaluationECSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        ec_id = self.request.query_params.get('ec', None)
        if ec_id:
            queryset = queryset.filter(ec_id=ec_id)
        return queryset
    
    @action(detail=False, methods=['post'])
    def configurer_ec(self, request):
        """Configuration complète des évaluations pour un EC"""
        ec_id = request.data.get('ec_id')
        configurations = request.data.get('configurations', [])
        
        if not ec_id:
            return Response(
                {'error': 'ec_id requis'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            ec = EC.objects.get(id=ec_id)
        except EC.DoesNotExist:
            return Response(
                {'error': 'EC non trouvé'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Vérifier que le total des pourcentages = 100%
        total_pourcentage = sum(config.get('pourcentage', 0) for config in configurations)
        if total_pourcentage != 100:
            return Response(
                {'error': f'Le total des pourcentages doit être 100% (actuellement {total_pourcentage}%)'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Supprimer les anciennes configurations
        ConfigurationEvaluationEC.objects.filter(ec=ec).delete()
        
        # Créer les nouvelles configurations
        for config in configurations:
            ConfigurationEvaluationEC.objects.create(
                ec=ec,
                type_evaluation_id=config['type_evaluation_id'],
                pourcentage=config['pourcentage']
            )
        
        return Response({'message': 'Configuration mise à jour avec succès'})

class RecapitulatifSemestrielViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = RecapitulatifSemestriel.objects.all()
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        if self.request.user.type_utilisateur == 'enseignant':
            # Seuls les récaps des classes dont il est responsable
            queryset = queryset.filter(classe__responsable_classe__user=self.request.user)
        
        classe_id = self.request.query_params.get('classe', None)
        session_id = self.request.query_params.get('session', None)
        semestre_id = self.request.query_params.get('semestre', None)
        statut = self.request.query_params.get('statut', None)
        
        if classe_id:
            queryset = queryset.filter(classe_id=classe_id)
        if session_id:
            queryset = queryset.filter(session_id=session_id)
        if semestre_id:
            queryset = queryset.filter(semestre_id=semestre_id)
        if statut:
            queryset = queryset.filter(statut=statut)
        
        return queryset
    
    def get_serializer_class(self):
        # Définir un serializer basique pour les récapitulatifs
        from rest_framework import serializers
        
        class RecapitulatifSerializer(serializers.ModelSerializer):
            classe_nom = serializers.CharField(source='classe.nom', read_only=True)
            semestre_nom = serializers.CharField(source='semestre.nom', read_only=True)
            session_nom = serializers.CharField(source='session.nom', read_only=True)
            genere_par_nom = serializers.CharField(source='genere_par.get_full_name', read_only=True)
            
            class Meta:
                model = RecapitulatifSemestriel
                fields = '__all__'
        
        return RecapitulatifSerializer
    
    @action(detail=True, methods=['get'])
    def donnees_detaillees(self, request, pk=None):
        """Récupère les données détaillées du récapitulatif"""
        recap = self.get_object()
        
        # Charger les données depuis le fichier JSON si disponible
        donnees = {}
        if recap.fichier_excel:
            try:
                import json
                with recap.fichier_excel.open('r') as f:
                    donnees = json.load(f)
            except:
                donnees = {'erreur': 'Impossible de charger les données'}
        
        return Response({
            'recap': self.get_serializer(recap).data,
            'donnees': donnees
        })
    
    @action(detail=True, methods=['post'])
    def regenerer(self, request, pk=None):
        """Régénère un récapitulatif existant"""
        if request.user.type_utilisateur not in ['admin', 'scolarite']:
            return Response(
                {'error': 'Permission refusée'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        recap = self.get_object()
        
        # Supprimer l'ancien récap
        recap.delete()
        
        # Régénérer
        resultat = AutomationService.generer_recapitulatif_semestriel(
            recap.classe, recap.semestre, recap.session
        )
        
        if resultat['success']:
            # Marquer comme généré manuellement
            try:
                nouveau_recap = RecapitulatifSemestriel.objects.get(id=resultat['recap_id'])
                nouveau_recap.genere_par = request.user
                nouveau_recap.save()
            except:
                pass
            
            return Response(resultat)
        else:
            return Response(resultat, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'])
    def statistiques_globales(self, request):
        """Statistiques globales des récapitulatifs"""
        if request.user.type_utilisateur not in ['admin', 'scolarite', 'direction']:
            return Response(
                {'error': 'Permission refusée'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        queryset = self.get_queryset()
        
        stats = {
            'total_recaps': queryset.count(),
            'par_statut': {},
            'par_semestre': {},
            'par_session': {},
            'moyennes_globales': {}
        }
        
        # Statistiques par statut
        statuts_choices = [
            ('en_cours', 'En cours'),
            ('termine', 'Terminé'),
            ('erreur', 'Erreur'),
        ]
        
        for statut, _ in statuts_choices:
            count = queryset.filter(statut=statut).count()
            stats['par_statut'][statut] = count
        
        # Statistiques par semestre
        for recap in queryset.values('semestre__nom').annotate(count=Count('id')):
            stats['par_semestre'][recap['semestre__nom']] = recap['count']
        
        # Statistiques par session
        for recap in queryset.values('session__nom').annotate(count=Count('id')):
            stats['par_session'][recap['session__nom']] = recap['count']
        
        # Moyennes globales
        recaps_termines = queryset.filter(statut='termine', moyenne_classe__isnull=False)
        if recaps_termines.exists():
            stats['moyennes_globales'] = {
                'moyenne_generale': recaps_termines.aggregate(Avg('moyenne_classe'))['moyenne_classe__avg'],
                'taux_reussite_moyen': recaps_termines.aggregate(Avg('taux_reussite'))['taux_reussite__avg'],
                'effectif_total': recaps_termines.aggregate(Sum('nombre_etudiants'))['nombre_etudiants__sum']
            }
        
        return Response(stats)

class SystemeViewSet(viewsets.ViewSet):
    """Actions système pour l'automatisation"""
    permission_classes = [permissions.IsAuthenticated]
    
    @action(detail=False, methods=['post'])
    def executer_taches_automatisees(self, request):
        """Exécute manuellement les tâches automatisées"""
        if request.user.type_utilisateur not in ['admin']:
            return Response(
                {'error': 'Permission refusée'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        resultats = AutomationService.executer_taches_planifiees()
        return Response(resultats)
    
    @action(detail=False, methods=['post'])
    def planifier_recapitulatifs(self, request):
        """Planifie la génération des récapitulatifs semestriels"""
        if request.user.type_utilisateur not in ['admin', 'scolarite']:
            return Response(
                {'error': 'Permission refusée'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        resultats = AutomationService.planifier_recapitulatifs_automatiques()
        return Response(resultats)
    
    @action(detail=False, methods=['post'])
    def verifier_delais_notes(self, request):
        """Vérifie les délais de saisie des notes"""
        if request.user.type_utilisateur not in ['admin', 'scolarite']:
            return Response(
                {'error': 'Permission refusée'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        resultats = AutomationService.verifier_delais_saisie_notes()
        return Response(resultats)
    
    @action(detail=False, methods=['get'])
    def parametres_systeme(self, request):
        """Récupère les paramètres système"""
        if request.user.type_utilisateur not in ['admin']:
            return Response(
                {'error': 'Permission refusée'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        parametres = ParametrageSysteme.objects.all()
        params_data = {}
        
        for param in parametres:
            params_data[param.cle] = {
                'valeur': param.get_valeur(),
                'description': param.description,
                'type': param.type_valeur
            }
        
        return Response(params_data)
    
    @action(detail=False, methods=['post'])
    def modifier_parametres(self, request):
        """Modifie les paramètres système"""
        if request.user.type_utilisateur not in ['admin']:
            return Response(
                {'error': 'Permission refusée'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        parametres = request.data.get('parametres', {})
        
        for cle, valeur in parametres.items():
            try:
                param = ParametrageSysteme.objects.get(cle=cle)
                param.valeur = str(valeur)
                param.save()
            except ParametrageSysteme.DoesNotExist:
                continue
        
        return Response({'message': 'Paramètres mis à jour'})
    
    @action(detail=False, methods=['get'])
    def statut_automatisations(self, request):
        """Statut des automatisations en cours"""
        from evaluations.models import TacheAutomatisee
        
        if request.user.type_utilisateur not in ['admin', 'scolarite']:
            return Response(
                {'error': 'Permission refusée'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Tâches récentes
        taches_recentes = TacheAutomatisee.objects.filter(
            created_at__gte=timezone.now() - timedelta(days=7)
        ).order_by('-created_at')
        
        statut = {
            'taches_en_cours': taches_recentes.filter(statut='en_cours').count(),
            'taches_planifiees': taches_recentes.filter(statut='planifiee').count(),
            'taches_terminees': taches_recentes.filter(statut='terminee').count(),
            'taches_erreur': taches_recentes.filter(statut='erreur').count(),
            'derniere_execution': None,
            'prochaine_execution': None
        }
        
        # Dernière exécution
        derniere = taches_recentes.filter(statut='terminee').first()
        if derniere:
            statut['derniere_execution'] = {
                'date': derniere.date_fin,
                'type': derniere.type_tache,
                'classe': derniere.classe.nom if derniere.classe else None
            }
        
        # Prochaine exécution
        prochaine = TacheAutomatisee.objects.filter(
            statut='planifiee',
            date_planifiee__gte=timezone.now()
        ).order_by('date_planifiee').first()
        
        if prochaine:
            statut['prochaine_execution'] = {
                'date': prochaine.date_planifiee,
                'type': prochaine.type_tache,
                'classe': prochaine.classe.nom if prochaine.classe else None
            }
        
        return Response(statut)
    
    @action(detail=False, methods=['post'])
    def notifier_fin_semestre(self, request):
        """Déclenche manuellement les notifications de fin de semestre"""
        if request.user.type_utilisateur not in ['admin', 'scolarite']:
            return Response(
                {'error': 'Permission refusée'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        semestre_id = request.data.get('semestre_id')
        session_id = request.data.get('session_id')
        
        if not semestre_id or not session_id:
            return Response(
                {'error': 'semestre_id et session_id requis'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            semestre = Semestre.objects.get(id=semestre_id)
            session = Session.objects.get(id=session_id)
        except (Semestre.DoesNotExist, Session.DoesNotExist):
            return Response(
                {'error': 'Semestre ou session non trouvé'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        resultats = NotificationService.notifier_fin_semestre(semestre, session)
        
        if resultats['success']:
            return Response(resultats)
        else:
            return Response(resultats, status=status.HTTP_400_BAD_REQUEST)