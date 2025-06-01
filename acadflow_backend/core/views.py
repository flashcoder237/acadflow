from django.shortcuts import render
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
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

class CycleViewSet(viewsets.ModelViewSet):
    queryset = Cycle.objects.filter(actif=True)
    serializer_class = CycleSerializer
    permission_classes = [permissions.IsAuthenticated]

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