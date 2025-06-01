# core/views.py - Vues améliorées
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
                'nombre_etudiants': sum([
                    filiere.classe_set.filter(active=True).aggregate(
                        total=Count('inscription__etudiant', distinct=True)
                    )['total'] or 0
                    for filiere in domaine.filiere_set.filter(actif=True)
                ])
            })
        return Response(stats)

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
        from academics.models import Classe, AnneeAcademique
        from academics.serializers import ClasseSerializer
        
        try:
            annee_active = AnneeAcademique.objects.get(active=True)
        except AnneeAcademique.DoesNotExist:
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


# academics/views.py - Vues améliorées
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
        from users.models import Inscription
        
        stats = {
            'nombre_classes': annee.classe_set.filter(active=True).count(),
            'nombre_inscriptions': Inscription.objects.filter(
                annee_academique=annee, active=True
            ).count(),
            'inscriptions_par_filiere': [],
            'inscriptions_par_niveau': []
        }
        
        # Statistiques par filière
        from core.models import Filiere
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
        from core.models import Niveau
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
        from users.models import Inscription
        from users.serializers import InscriptionSerializer
        
        inscriptions = Inscription.objects.filter(
            classe=classe, active=True
        ).select_related('etudiant__user', 'statut')
        
        serializer = InscriptionSerializer(inscriptions, many=True)
        return Response(serializer.data)
    
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
        
        from evaluations.models import MoyenneSemestre
        from evaluations.serializers import MoyenneSemestreSerializer
        
        moyennes = MoyenneSemestre.objects.filter(
            classe=classe,
            session_id=session_id
        ).select_related('etudiant__user', 'semestre')
        
        resultats = {
            'classe': ClasseSerializer(classe).data,
            'moyennes': MoyenneSemestreSerializer(moyennes, many=True).data,
            'statistiques': {
                'nombre_etudiants': moyennes.count(),
                'moyenne_classe': moyennes.aggregate(Avg('moyenne_generale'))['moyenne_generale__avg'] or 0,
                'taux_reussite': moyennes.filter(moyenne_generale__gte=10).count(),
                'mentions': {
                    'tres_bien': moyennes.filter(moyenne_generale__gte=16).count(),
                    'bien': moyennes.filter(moyenne_generale__gte=14, moyenne_generale__lt=16).count(),
                    'assez_bien': moyennes.filter(moyenne_generale__gte=12, moyenne_generale__lt=14).count(),
                    'passable': moyennes.filter(moyenne_generale__gte=10, moyenne_generale__lt=12).count(),
                    'insuffisant': moyennes.filter(moyenne_generale__lt=10).count(),
                }
            }
        }
        
        return Response(resultats)

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
        from evaluations.models import Enseignement
        from evaluations.serializers import EnseignementSerializer
        
        enseignements = Enseignement.objects.filter(
            ec=ec, actif=True
        ).select_related('enseignant__user', 'classe', 'annee_academique')
        
        serializer = EnseignementSerializer(enseignements, many=True)
        return Response(serializer.data)

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