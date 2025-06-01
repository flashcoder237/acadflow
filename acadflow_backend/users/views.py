from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from django.contrib.auth import authenticate
from django.db.models import Q, Count, Avg
from django.db import transaction
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
    """Connexion utilisateur avec informations détaillées"""
    serializer = LoginSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.validated_data['user']
        token, created = Token.objects.get_or_create(user=user)
        
        user_data = UserSerializer(user).data
        user_data.pop('password', None)
        
        # Ajouter des informations spécifiques selon le type d'utilisateur
        additional_info = {}
        
        if user.type_utilisateur == 'etudiant':
            try:
                etudiant = Etudiant.objects.get(user=user)
                inscription_active = Inscription.objects.filter(
                    etudiant=etudiant, active=True
                ).select_related('classe', 'annee_academique').first()
                
                additional_info = {
                    'etudiant_id': etudiant.id,
                    'numero_carte': etudiant.numero_carte,
                    'classe_actuelle': {
                        'id': inscription_active.classe.id,
                        'nom': inscription_active.classe.nom,
                        'niveau': inscription_active.classe.niveau.nom,
                        'filiere': inscription_active.classe.filiere.nom
                    } if inscription_active else None,
                    'statut_actuel': inscription_active.statut.nom if inscription_active else None
                }
            except Etudiant.DoesNotExist:
                pass
        
        elif user.type_utilisateur == 'enseignant':
            try:
                enseignant = Enseignant.objects.get(user=user)
                from evaluations.models import Enseignement
                enseignements_actifs = Enseignement.objects.filter(
                    enseignant=enseignant, actif=True
                ).count()
                
                additional_info = {
                    'enseignant_id': enseignant.id,
                    'grade': enseignant.grade,
                    'specialite': enseignant.specialite,
                    'nombre_enseignements': enseignements_actifs
                }
            except Enseignant.DoesNotExist:
                pass
        
        response_data = {
            'token': token.key,
            'user': {**user_data, **additional_info}
        }
        
        return Response(response_data)
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
    
    @action(detail=False, methods=['get'])
    def statistiques(self, request):
        """Statistiques des utilisateurs"""
        stats = {
            'total_utilisateurs': self.get_queryset().count(),
            'par_type': {},
            'nouveaux_cette_semaine': self.get_queryset().filter(
                date_joined__gte=timezone.now() - timedelta(days=7)
            ).count()
        }
        
        from django.utils import timezone
        from datetime import timedelta
        
        for type_user, _ in User.TYPES_UTILISATEUR:
            count = self.get_queryset().filter(type_utilisateur=type_user).count()
            stats['par_type'][type_user] = count
        
        return Response(stats)

class EnseignantViewSet(viewsets.ModelViewSet):
    queryset = Enseignant.objects.all()
    serializer_class = EnseignantSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        if self.request.user.type_utilisateur == 'enseignant':
            queryset = queryset.filter(user=self.request.user)
        
        # Filtres pour les administrateurs
        grade = self.request.query_params.get('grade', None)
        specialite = self.request.query_params.get('specialite', None)
        
        if grade:
            queryset = queryset.filter(grade=grade)
        if specialite:
            queryset = queryset.filter(specialite__icontains=specialite)
        
        return queryset
    
    @action(detail=True, methods=['get'])
    def enseignements(self, request, pk=None):
        """Retourne tous les enseignements d'un enseignant"""
        enseignant = self.get_object()
        from evaluations.models import Enseignement
        from evaluations.serializers import EnseignementSerializer
        
        enseignements = Enseignement.objects.filter(
            enseignant=enseignant, actif=True
        ).select_related('ec__ue', 'classe', 'annee_academique')
        
        serializer = EnseignementSerializer(enseignements, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def planning_evaluations(self, request, pk=None):
        """Planning des évaluations pour un enseignant"""
        enseignant = self.get_object()
        from evaluations.models import Evaluation
        from evaluations.serializers import EvaluationSerializer
        
        evaluations = Evaluation.objects.filter(
            enseignement__enseignant=enseignant
        ).select_related(
            'enseignement__ec', 'enseignement__classe', 'type_evaluation', 'session'
        ).order_by('date_evaluation')
        
        # Filtrer par date si spécifié
        date_debut = request.query_params.get('date_debut')
        date_fin = request.query_params.get('date_fin')
        
        if date_debut:
            evaluations = evaluations.filter(date_evaluation__gte=date_debut)
        if date_fin:
            evaluations = evaluations.filter(date_evaluation__lte=date_fin)
        
        serializer = EvaluationSerializer(evaluations, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def charge_travail(self, request):
        """Statistiques de charge de travail des enseignants"""
        from evaluations.models import Enseignement
        
        stats = []
        for enseignant in self.get_queryset():
            enseignements = Enseignement.objects.filter(
                enseignant=enseignant, actif=True
            )
            
            charge = {
                'enseignant': EnseignantSerializer(enseignant).data,
                'nombre_ec': enseignements.values('ec').distinct().count(),
                'nombre_classes': enseignements.values('classe').distinct().count(),
                'nombre_evaluations_en_attente': 0  # À calculer selon vos besoins
            }
            stats.append(charge)
        
        return Response(sorted(stats, key=lambda x: x['nombre_ec'], reverse=True))

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
        statut = self.request.query_params.get('statut', None)
        
        if matricule:
            queryset = queryset.filter(user__matricule__icontains=matricule)
        if classe_id:
            queryset = queryset.filter(
                inscription__classe_id=classe_id,
                inscription__active=True
            )
        if statut:
            queryset = queryset.filter(statut_current=statut)
        
        return queryset
    
    @action(detail=True, methods=['get'])
    def notes_detaillees(self, request, pk=None):
        """Notes détaillées d'un étudiant avec moyennes"""
        etudiant = self.get_object()
        from evaluations.models import Note, MoyenneEC, MoyenneUE, MoyenneSemestre
        from evaluations.serializers import NoteSerializer, MoyenneECSerializer, MoyenneUESerializer, MoyenneSemestreSerializer
        
        session_id = request.query_params.get('session')
        if not session_id:
            return Response(
                {'error': 'session_id requis'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Notes individuelles
        notes = Note.objects.filter(
            etudiant=etudiant,
            evaluation__session_id=session_id
        ).select_related('evaluation__enseignement__ec', 'evaluation__type_evaluation')
        
        # Moyennes par EC
        moyennes_ec = MoyenneEC.objects.filter(
            etudiant=etudiant,
            session_id=session_id
        ).select_related('ec__ue')
        
        # Moyennes par UE
        moyennes_ue = MoyenneUE.objects.filter(
            etudiant=etudiant,
            session_id=session_id
        ).select_related('ue')
        
        # Moyennes semestrielles
        moyennes_semestre = MoyenneSemestre.objects.filter(
            etudiant=etudiant,
            session_id=session_id
        ).select_related('semestre', 'classe')
        
        return Response({
            'etudiant': EtudiantSerializer(etudiant).data,
            'notes': NoteSerializer(notes, many=True).data,
            'moyennes_ec': MoyenneECSerializer(moyennes_ec, many=True).data,
            'moyennes_ue': MoyenneUESerializer(moyennes_ue, many=True).data,
            'moyennes_semestre': MoyenneSemestreSerializer(moyennes_semestre, many=True).data
        })
    
    @action(detail=True, methods=['get'])
    def parcours_academique(self, request, pk=None):
        """Parcours académique complet d'un étudiant"""
        etudiant = self.get_object()
        
        # Toutes les inscriptions
        inscriptions = Inscription.objects.filter(
            etudiant=etudiant
        ).select_related('classe', 'annee_academique', 'statut').order_by('-annee_academique__date_debut')
        
        # Historique des statuts
        historique = HistoriqueStatut.objects.filter(
            etudiant=etudiant
        ).select_related('statut', 'annee_academique').order_by('-date_changement')
        
        parcours = {
            'etudiant': EtudiantSerializer(etudiant).data,
            'inscriptions': InscriptionSerializer(inscriptions, many=True).data,
            'historique_statuts': HistoriqueStatutSerializer(historique, many=True).data,
            'statistiques': {
                'nombre_redoublements': inscriptions.aggregate(
                    total=models.Sum('nombre_redoublements')
                )['total'] or 0,
                'classes_frequentees': inscriptions.count(),
                'annees_etudes': inscriptions.values('annee_academique').distinct().count()
            }
        }
        
        return Response(parcours)
    
    @action(detail=True, methods=['post'])
    def changer_statut(self, request, pk=None):
        """Changer le statut d'un étudiant"""
        if request.user.type_utilisateur not in ['admin', 'scolarite', 'direction']:
            return Response(
                {'error': 'Permission refusée'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        etudiant = self.get_object()
        nouveau_statut_id = request.data.get('statut_id')
        motif = request.data.get('motif', '')
        
        if not nouveau_statut_id:
            return Response(
                {'error': 'statut_id requis'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            nouveau_statut = StatutEtudiant.objects.get(id=nouveau_statut_id)
        except StatutEtudiant.DoesNotExist:
            return Response(
                {'error': 'Statut non trouvé'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        from academics.models import AnneeAcademique
        try:
            annee_active = AnneeAcademique.objects.get(active=True)
        except AnneeAcademique.DoesNotExist:
            return Response(
                {'error': 'Aucune année académique active'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        with transaction.atomic():
            # Mettre à jour le statut actuel
            etudiant.statut_current = nouveau_statut.nom
            etudiant.save()
            
            # Enregistrer dans l'historique
            HistoriqueStatut.objects.create(
                etudiant=etudiant,
                statut=nouveau_statut,
                annee_academique=annee_active,
                motif=motif
            )
        
        return Response({'message': 'Statut mis à jour avec succès'})

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
    
    @action(detail=False, methods=['post'])
    def inscription_massive(self, request):
        """Inscription massive d'étudiants"""
        if request.user.type_utilisateur not in ['admin', 'scolarite']:
            return Response(
                {'error': 'Permission refusée'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        classe_id = request.data.get('classe_id')
        etudiants_ids = request.data.get('etudiants_ids', [])
        statut_id = request.data.get('statut_id')
        
        if not all([classe_id, etudiants_ids, statut_id]):
            return Response(
                {'error': 'classe_id, etudiants_ids et statut_id requis'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            from academics.models import Classe, AnneeAcademique
            classe = Classe.objects.get(id=classe_id)
            statut = StatutEtudiant.objects.get(id=statut_id)
            annee_active = AnneeAcademique.objects.get(active=True)
        except (Classe.DoesNotExist, StatutEtudiant.DoesNotExist, AnneeAcademique.DoesNotExist) as e:
            return Response(
                {'error': f'Objet non trouvé: {str(e)}'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        inscriptions_creees = 0
        erreurs = []
        
        with transaction.atomic():
            for etudiant_id in etudiants_ids:
                try:
                    etudiant = Etudiant.objects.get(id=etudiant_id)
                    
                    # Vérifier si une inscription existe déjà
                    if Inscription.objects.filter(
                        etudiant=etudiant,
                        annee_academique=annee_active,
                        active=True
                    ).exists():
                        erreurs.append(f"Étudiant {etudiant.user.matricule} déjà inscrit")
                        continue
                    
                    Inscription.objects.create(
                        etudiant=etudiant,
                        classe=classe,
                        annee_academique=annee_active,
                        statut=statut
                    )
                    inscriptions_creees += 1
                    
                except Etudiant.DoesNotExist:
                    erreurs.append(f"Étudiant ID {etudiant_id} non trouvé")
        
        return Response({
            'message': f'{inscriptions_creees} inscriptions créées',
            'erreurs': erreurs
        })
    
    @action(detail=False, methods=['get'])
    def statistiques_classe(self, request):
        """Statistiques d'inscription par classe"""
        classe_id = request.query_params.get('classe')
        if not classe_id:
            return Response(
                {'error': 'classe_id requis'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        inscriptions = self.get_queryset().filter(classe_id=classe_id)
        
        stats = {
            'total_inscriptions': inscriptions.count(),
            'par_statut': {},
            'par_genre': {},
            'redoublants': inscriptions.filter(nombre_redoublements__gt=0).count(),
            'moyenne_age': 0  # À calculer selon vos besoins
        }
        
        # Statistiques par statut
        for statut in StatutEtudiant.objects.filter(actif=True):
            count = inscriptions.filter(statut=statut).count()
            if count > 0:
                stats['par_statut'][statut.nom] = count
        
        return Response(stats)

class StatutEtudiantViewSet(viewsets.ModelViewSet):
    queryset = StatutEtudiant.objects.filter(actif=True)
    serializer_class = StatutEtudiantSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    @action(detail=False, methods=['get'])
    def usage_statistics(self, request):
        """Statistiques d'utilisation des statuts"""
        stats = []
        for statut in self.get_queryset():
            usage_inscriptions = Inscription.objects.filter(statut=statut).count()
            usage_historique = HistoriqueStatut.objects.filter(statut=statut).count()
            
            stats.append({
                'statut': StatutEtudiantSerializer(statut).data,
                'inscriptions_actuelles': usage_inscriptions,
                'changements_historique': usage_historique,
                'total_utilisation': usage_inscriptions + usage_historique
            })
        
        return Response(sorted(stats, key=lambda x: x['total_utilisation'], reverse=True))

class HistoriqueStatutViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = HistoriqueStatut.objects.all()
    serializer_class = HistoriqueStatutSerializer
    permission_classes = [IsEtudiantOwner]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        if self.request.user.type_utilisateur == 'etudiant':
            queryset = queryset.filter(etudiant__user=self.request.user)
        
        etudiant_id = self.request.query_params.get('etudiant', None)
        annee_id = self.request.query_params.get('annee_academique', None)
        
        if etudiant_id:
            queryset = queryset.filter(etudiant_id=etudiant_id)
        if annee_id:
            queryset = queryset.filter(annee_academique_id=annee_id)
        
        return queryset