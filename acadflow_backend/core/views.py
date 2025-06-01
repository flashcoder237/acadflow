# core/views.py - Version corrigée avec les bons imports
from django.shortcuts import render
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q, Count, Avg, Sum
from .models import Domaine, Cycle, TypeFormation, Filiere, Option, Niveau
from .serializers import (
    DomaineSerializer, CycleSerializer, TypeFormationSerializer,
    FiliereSerializer, OptionSerializer, NiveauSerializer
)

class DomaineViewSet(viewsets.ModelViewSet):
    queryset = Domaine.objects.filter(actif=True)
    serializer_class = DomaineSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(nom__icontains=search) | Q(code__icontains=search)
            )
        return queryset
    
    @action(detail=True, methods=['get'])
    def filieres(self, request, pk=None):
        """Retourne toutes les filières d'un domaine"""
        domaine = self.get_object()
        filieres = domaine.filiere_set.filter(actif=True)
        serializer = FiliereSerializer(filieres, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def statistiques(self, request):
        """Statistiques des domaines"""
        stats = []
        for domaine in self.get_queryset():
            stats.append({
                'id': domaine.id,
                'nom': domaine.nom,
                'code': domaine.code,
                'nombre_filieres': domaine.filiere_set.filter(actif=True).count(),
                'nombre_etudiants': self._compter_etudiants_domaine(domaine)
            })
        return Response(stats)
    
    def _compter_etudiants_domaine(self, domaine):
        """Compter les étudiants d'un domaine"""
        try:
            from users.models import Inscription
            return Inscription.objects.filter(
                classe__filiere__domaine=domaine,
                active=True
            ).count()
        except:
            return 0

class CycleViewSet(viewsets.ModelViewSet):
    queryset = Cycle.objects.filter(actif=True)
    serializer_class = CycleSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    @action(detail=True, methods=['get'])
    def niveaux(self, request, pk=None):
        """Retourne tous les niveaux d'un cycle"""
        cycle = self.get_object()
        niveaux = cycle.niveau_set.filter(actif=True).order_by('numero')
        serializer = NiveauSerializer(niveaux, many=True)
        return Response(serializer.data)

class TypeFormationViewSet(viewsets.ModelViewSet):
    queryset = TypeFormation.objects.filter(actif=True)
    serializer_class = TypeFormationSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        cycle_id = self.request.query_params.get('cycle', None)
        if cycle_id:
            queryset = queryset.filter(cycle_id=cycle_id)
        return queryset

class FiliereViewSet(viewsets.ModelViewSet):
    queryset = Filiere.objects.filter(actif=True)
    serializer_class = FiliereSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        domaine_id = self.request.query_params.get('domaine', None)
        type_formation_id = self.request.query_params.get('type_formation', None)
        
        if domaine_id:
            queryset = queryset.filter(domaine_id=domaine_id)
        if type_formation_id:
            queryset = queryset.filter(type_formation_id=type_formation_id)
            
        return queryset
    
    @action(detail=True, methods=['get'])
    def options(self, request, pk=None):
        """Retourne toutes les options d'une filière"""
        filiere = self.get_object()
        options = filiere.option_set.filter(actif=True)
        serializer = OptionSerializer(options, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def classes_par_niveau(self, request, pk=None):
        """Retourne les classes organisées par niveau pour une filière"""
        filiere = self.get_object()
        
        try:
            from academics.models import Classe, AnneeAcademique
            from academics.serializers import ClasseSerializer
            
            # Récupérer l'année académique active
            annee_active = AnneeAcademique.objects.filter(active=True).first()
            if not annee_active:
                return Response({'error': 'Aucune année académique active'}, 
                              status=status.HTTP_404_NOT_FOUND)
            
            classes_par_niveau = {}
            classes = Classe.objects.filter(
                filiere=filiere,
                annee_academique=annee_active,
                active=True
            ).select_related('niveau').order_by('niveau__numero')
            
            for classe in classes:
                niveau_nom = classe.niveau.nom
                if niveau_nom not in classes_par_niveau:
                    classes_par_niveau[niveau_nom] = []
                classes_par_niveau[niveau_nom].append(ClasseSerializer(classe).data)
            
            return Response(classes_par_niveau)
            
        except ImportError:
            return Response({'error': 'Module academics non disponible'}, 
                          status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class OptionViewSet(viewsets.ModelViewSet):
    queryset = Option.objects.filter(actif=True)
    serializer_class = OptionSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        filiere_id = self.request.query_params.get('filiere', None)
        if filiere_id:
            queryset = queryset.filter(filiere_id=filiere_id)
        return queryset

class NiveauViewSet(viewsets.ModelViewSet):
    queryset = Niveau.objects.filter(actif=True)
    serializer_class = NiveauSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        cycle_id = self.request.query_params.get('cycle', None)
        if cycle_id:
            queryset = queryset.filter(cycle_id=cycle_id)
        return queryset
    
    @action(detail=True, methods=['get'])
    def ues_par_semestre(self, request, pk=None):
        """Retourne les UEs organisées par semestre pour un niveau"""
        niveau = self.get_object()
        
        try:
            from academics.models import UE, Semestre
            from academics.serializers import UESerializer
            
            ues_par_semestre = {}
            semestres = Semestre.objects.all().order_by('numero')
            
            for semestre in semestres:
                ues = UE.objects.filter(
                    niveau=niveau,
                    semestre=semestre,
                    actif=True
                ).order_by('code')
                
                if ues.exists():
                    ues_par_semestre[semestre.nom] = UESerializer(ues, many=True).data
            
            return Response(ues_par_semestre)
            
        except ImportError:
            return Response({'error': 'Module academics non disponible'}, 
                          status=status.HTTP_500_INTERNAL_SERVER_ERROR)