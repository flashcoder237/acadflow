from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from django.contrib.auth import authenticate
from django.db.models import Q
from .models import User, Enseignant, Etudiant, StatutEtudiant, Inscription, HistoriqueStatut
from .serializers import (
    UserSerializer, EnseignantSerializer, EtudiantSerializer,
    StatutEtudiantSerializer, InscriptionSerializer, HistoriqueStatutSerializer,
    LoginSerializer
)
from core.permissions import IsAdminOrScolarite, IsEtudiantOwner

@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def login_view(request):
    """Connexion utilisateur"""
    serializer = LoginSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.validated_data['user']
        token, created = Token.objects.get_or_create(user=user)
        
        user_data = UserSerializer(user).data
        user_data.pop('password', None)  # Remove password from response
        
        return Response({
            'token': token.key,
            'user': user_data
        })
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
def logout_view(request):
    """Déconnexion utilisateur"""
    try:
        request.user.auth_token.delete()
        return Response({'message': 'Déconnexion réussie'})
    except:
        return Response({'error': 'Erreur lors de la déconnexion'}, 
                       status=status.HTTP_400_BAD_REQUEST)

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.filter(actif=True)
    serializer_class = UserSerializer
    permission_classes = [IsAdminOrScolarite]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        type_utilisateur = self.request.query_params.get('type', None)
        search = self.request.query_params.get('search', None)
        
        if type_utilisateur:
            queryset = queryset.filter(type_utilisateur=type_utilisateur)
        
        if search:
            queryset = queryset.filter(
                Q(matricule__icontains=search) |
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search) |
                Q(email__icontains=search)
            )
        
        return queryset

class EnseignantViewSet(viewsets.ModelViewSet):
    queryset = Enseignant.objects.all()
    serializer_class = EnseignantSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        if self.request.user.type_utilisateur == 'enseignant':
            queryset = queryset.filter(user=self.request.user)
        return queryset

class EtudiantViewSet(viewsets.ModelViewSet):
    queryset = Etudiant.objects.all()
    serializer_class = EtudiantSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        if self.request.user.type_utilisateur == 'etudiant':
            queryset = queryset.filter(user=self.request.user)
        
        # Filtres pour les administrateurs
        matricule = self.request.query_params.get('matricule', None)
        classe_id = self.request.query_params.get('classe', None)
        
        if matricule:
            queryset = queryset.filter(user__matricule__icontains=matricule)
        if classe_id:
            queryset = queryset.filter(
                inscription__classe_id=classe_id,
                inscription__active=True
            )
        
        return queryset

class StatutEtudiantViewSet(viewsets.ModelViewSet):
    queryset = StatutEtudiant.objects.filter(actif=True)
    serializer_class = StatutEtudiantSerializer
    permission_classes = [permissions.IsAuthenticated]

class InscriptionViewSet(viewsets.ModelViewSet):
    queryset = Inscription.objects.filter(active=True)
    serializer_class = InscriptionSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        if self.request.user.type_utilisateur == 'etudiant':
            queryset = queryset.filter(etudiant__user=self.request.user)
        
        # Filtres
        etudiant_id = self.request.query_params.get('etudiant', None)
        classe_id = self.request.query_params.get('classe', None)
        annee_id = self.request.query_params.get('annee_academique', None)
        
        if etudiant_id:
            queryset = queryset.filter(etudiant_id=etudiant_id)
        if classe_id:
            queryset = queryset.filter(classe_id=classe_id)
        if annee_id:
            queryset = queryset.filter(annee_academique_id=annee_id)
        
        return queryset

class HistoriqueStatutViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = HistoriqueStatut.objects.all()
    serializer_class = HistoriqueStatutSerializer
    permission_classes = [IsEtudiantOwner]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        if self.request.user.type_utilisateur == 'etudiant':
            queryset = queryset.filter(etudiant__user=self.request.user)
        
        etudiant_id = self.request.query_params.get('etudiant', None)
        if etudiant_id:
            queryset = queryset.filter(etudiant_id=etudiant_id)
        
        return queryset