from django.shortcuts import render
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q, Count
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
        """Retourne les étudiants d'une classe"""
        classe = self.get_object()
        inscriptions = classe.inscription_set.filter(active=True)
        etudiants_data = []
        
        for inscription in inscriptions:
            etudiant_data = {
                'id': inscription.etudiant.id,
                'matricule': inscription.etudiant.user.matricule,
                'nom_complet': inscription.etudiant.user.get_full_name(),
                'statut': inscription.statut.nom,
                'nombre_redoublements': inscription.nombre_redoublements
            }
            etudiants_data.append(etudiant_data)
        
        return Response(etudiants_data)

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

class TypeEvaluationViewSet(viewsets.ModelViewSet):
    queryset = TypeEvaluation.objects.filter(actif=True)
    serializer_class = TypeEvaluationSerializer
    permission_classes = [permissions.IsAuthenticated]

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