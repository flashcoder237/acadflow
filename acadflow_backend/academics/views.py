# academics/views.py - Version corrigée avec les bons imports
from django.shortcuts import render
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q, Count, Sum, Avg
from .models import (
    AnneeAcademique, Session, Semestre, Classe, UE, EC,
    TypeEvaluation, ConfigurationEvaluationEC
)
from .serializers import (
    AnneeAcademiqueSerializer, SessionSerializer, SemestreSerializer,
    ClasseSerializer, UESerializer, ECSerializer, UEDetailSerializer,
    TypeEvaluationSerializer, ConfigurationEvaluationECSerializer
)

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

class SemestreViewSet(viewsets.ModelViewSet):
    queryset = Semestre.objects.all()
    serializer_class = SemestreSerializer
    permission_classes = [permissions.IsAuthenticated]

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
    
    @action(detail=True, methods=['get'])
    def resultats_session(self, request, pk=None):
        """Retourne les résultats d'une classe pour une session donnée"""
        classe = self.get_object()
        session_id = request.query_params.get('session')
        
        if not session_id:
            return Response(
                {'error': 'session_id requis'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            from evaluations.models import MoyenneSemestre
            from evaluations.serializers import MoyenneSemestreSerializer
            
            moyennes = MoyenneSemestre.objects.filter(
                classe=classe,
                session_id=session_id
            ).select_related('etudiant__user', 'semestre')
            
            resultats = {
                'classe': ClasseSerializer(classe).data,
                'moyennes': MoyenneSemestreSerializer(moyennes, many=True).data,
                'statistiques': self._calculer_statistiques_classe(moyennes)
            }
            
            return Response(resultats)
            
        except ImportError:
            return Response({'error': 'Module evaluations non disponible'}, 
                          status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def _calculer_statistiques_classe(self, moyennes):
        """Calculer les statistiques d'une classe"""
        if not moyennes.exists():
            return {
                'nombre_etudiants': 0,
                'moyenne_classe': 0,
                'taux_reussite': 0,
                'mentions': {}
            }
        
        moyennes_values = [m.moyenne_generale for m in moyennes]
        
        return {
            'nombre_etudiants': len(moyennes_values),
            'moyenne_classe': round(sum(moyennes_values) / len(moyennes_values), 2),
            'taux_reussite': len([m for m in moyennes_values if m >= 10]),
            'mentions': {
                'tres_bien': len([m for m in moyennes_values if m >= 16]),
                'bien': len([m for m in moyennes_values if 14 <= m < 16]),
                'assez_bien': len([m for m in moyennes_values if 12 <= m < 14]),
                'passable': len([m for m in moyennes_values if 10 <= m < 12]),
                'insuffisant': len([m for m in moyennes_values if m < 10]),
            }
        }

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
        if ue_id:
            queryset = queryset.filter(ue_id=ue_id)
        return queryset
    
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