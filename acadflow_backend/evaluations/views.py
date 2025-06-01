from django.shortcuts import render
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q, Avg, Count
from django.db import transaction
from .models import (
    Enseignement, Evaluation, Note, MoyenneEC, MoyenneUE, MoyenneSemestre
)
from .serializers import (
    EnseignementSerializer, EvaluationSerializer, NoteSerializer,
    MoyenneECSerializer, MoyenneUESerializer, MoyenneSemestreSerializer,
    SaisieNotesSerializer
)
from core.permissions import IsEnseignantOrReadOnly, IsEtudiantOwner

class EnseignementViewSet(viewsets.ModelViewSet):
    queryset = Enseignement.objects.filter(actif=True)
    serializer_class = EnseignementSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        if self.request.user.type_utilisateur == 'enseignant':
            queryset = queryset.filter(enseignant__user=self.request.user)
        
        # Filtres
        enseignant_id = self.request.query_params.get('enseignant', None)
        classe_id = self.request.query_params.get('classe', None)
        ec_id = self.request.query_params.get('ec', None)
        
        if enseignant_id:
            queryset = queryset.filter(enseignant_id=enseignant_id)
        if classe_id:
            queryset = queryset.filter(classe_id=classe_id)
        if ec_id:
            queryset = queryset.filter(ec_id=ec_id)
        
        return queryset

class EvaluationViewSet(viewsets.ModelViewSet):
    queryset = Evaluation.objects.all()
    serializer_class = EvaluationSerializer
    permission_classes = [IsEnseignantOrReadOnly]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        if self.request.user.type_utilisateur == 'enseignant':
            queryset = queryset.filter(enseignement__enseignant__user=self.request.user)
        
        enseignement_id = self.request.query_params.get('enseignement', None)
        if enseignement_id:
            queryset = queryset.filter(enseignement_id=enseignement_id)
        
        return queryset
    
    @action(detail=True, methods=['post'])
    def saisir_notes(self, request, pk=None):
        """Saisie multiple de notes pour une évaluation"""
        evaluation = self.get_object()
        serializer = SaisieNotesSerializer(data=request.data)
        
        if serializer.is_valid():
            notes_data = serializer.validated_data['notes']
            
            try:
                with transaction.atomic():
                    for note_data in notes_data:
                        note, created = Note.objects.update_or_create(
                            etudiant_id=note_data['etudiant_id'],
                            evaluation=evaluation,
                            defaults={
                                'note_obtenue': note_data['note_obtenue'],
                                'absent': note_data.get('absent', False),
                                'justifie': note_data.get('justifie', False),
                                'commentaire': note_data.get('commentaire', '')
                            }
                        )
                    
                    # Marquer la saisie comme terminée
                    evaluation.saisie_terminee = True
                    evaluation.save()
                    
                    return Response({'message': 'Notes saisies avec succès'})
            
            except Exception as e:
                return Response(
                    {'error': f'Erreur lors de la saisie: {str(e)}'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class NoteViewSet(viewsets.ModelViewSet):
    queryset = Note.objects.all()
    serializer_class = NoteSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        if self.request.user.type_utilisateur == 'etudiant':
            queryset = queryset.filter(etudiant__user=self.request.user)
        elif self.request.user.type_utilisateur == 'enseignant':
            queryset = queryset.filter(evaluation__enseignement__enseignant__user=self.request.user)
        
        # Filtres
        etudiant_id = self.request.query_params.get('etudiant', None)
        evaluation_id = self.request.query_params.get('evaluation', None)
        ec_id = self.request.query_params.get('ec', None)
        
        if etudiant_id:
            queryset = queryset.filter(etudiant_id=etudiant_id)
        if evaluation_id:
            queryset = queryset.filter(evaluation_id=evaluation_id)
        if ec_id:
            queryset = queryset.filter(evaluation__enseignement__ec_id=ec_id)
        
        return queryset

class MoyenneECViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = MoyenneEC.objects.all()
    serializer_class = MoyenneECSerializer
    permission_classes = [IsEtudiantOwner]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        if self.request.user.type_utilisateur == 'etudiant':
            queryset = queryset.filter(etudiant__user=self.request.user)
        
        return queryset

class MoyenneUEViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = MoyenneUE.objects.all()
    serializer_class = MoyenneUESerializer
    permission_classes = [IsEtudiantOwner]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        if self.request.user.type_utilisateur == 'etudiant':
            queryset = queryset.filter(etudiant__user=self.request.user)
        
        return queryset

class MoyenneSemestreViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = MoyenneSemestre.objects.all()
    serializer_class = MoyenneSemestreSerializer
    permission_classes = [IsEtudiantOwner]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        if self.request.user.type_utilisateur == 'etudiant':
            queryset = queryset.filter(etudiant__user=self.request.user)
        
        return queryset
    
    @action(detail=False, methods=['get'])
    def statistiques(self, request):
        """Statistiques générales par classe/niveau"""
        if request.user.type_utilisateur not in ['admin', 'scolarite', 'direction']:
            return Response(
                {'error': 'Permission refusée'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        classe_id = request.query_params.get('classe', None)
        if not classe_id:
            return Response(
                {'error': 'classe_id requis'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        moyennes = self.get_queryset().filter(classe_id=classe_id)
        
        stats = {
            'nombre_etudiants': moyennes.count(),
            'moyenne_classe': moyennes.aggregate(Avg('moyenne_generale'))['moyenne_generale__avg'],
            'taux_reussite': moyennes.filter(moyenne_generale__gte=10).count(),
            'mentions': {
                'tres_bien': moyennes.filter(moyenne_generale__gte=16).count(),
                'bien': moyennes.filter(moyenne_generale__gte=14, moyenne_generale__lt=16).count(),
                'assez_bien': moyennes.filter(moyenne_generale__gte=12, moyenne_generale__lt=14).count(),
                'passable': moyennes.filter(moyenne_generale__gte=10, moyenne_generale__lt=12).count(),
                'insuffisant': moyennes.filter(moyenne_generale__lt=10).count(),
            }
        }
        
        if stats['nombre_etudiants'] > 0:
            stats['taux_reussite_pct'] = round(
                (stats['taux_reussite'] / stats['nombre_etudiants']) * 100, 2
            )
        else:
            stats['taux_reussite_pct'] = 0
        
        return Response(stats)
