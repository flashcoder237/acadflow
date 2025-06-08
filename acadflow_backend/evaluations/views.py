from django.shortcuts import render
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q, Avg, Count, Sum, F
from django.db import transaction
from django.core.paginator import Paginator
from django.utils import timezone
from datetime import timedelta
from decimal import Decimal

from .models import (
    Enseignement, Evaluation, Note, MoyenneEC, MoyenneUE, MoyenneSemestre
)
from .serializers import (
    EnseignementSerializer, EvaluationSerializer, NoteSerializer,
    MoyenneECSerializer, MoyenneUESerializer, MoyenneSemestreSerializer,
    SaisieNotesSerializer
)
from core.permissions import IsEnseignantOrReadOnly, IsEtudiantOwner
from users.models import Inscription, Etudiant

# Import conditionnel pour les utilitaires
try:
    from core.utils import calculer_moyenne_ec, calculer_moyenne_ue, calculer_moyenne_semestre
except ImportError:
    # Fonctions simplifiées si les utilitaires ne sont pas disponibles
    def calculer_moyenne_ec(etudiant, ec, session, annee_academique):
        return None
    def calculer_moyenne_ue(etudiant, ue, session, annee_academique):
        return None
    def calculer_moyenne_semestre(etudiant, classe, semestre, session, annee_academique):
        return None

# New imports for notifications and planning
from core.services import AutomationService, NotificationService
from academics.models import Classe, Session
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.generics import get_object_or_404

class EnseignantNotificationsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, enseignant_id):
        # Check if the user is the teacher or admin
        if not (request.user.type_utilisateur == 'enseignant' and request.user.enseignant.id == int(enseignant_id)) and request.user.type_utilisateur not in ['admin', 'scolarite']:
            return Response({'error': 'Permission refusée'}, status=status.HTTP_403_FORBIDDEN)

        # Fetch notifications for the teacher
        notifications = NotificationService.get_notifications_for_enseignant(enseignant_id)
        # Assuming notifications is a list of dicts with keys: id, titre, message, date_creation, lue, urgence, type, evaluation_id

        return Response(notifications)

class EnseignantPlanningView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, enseignant_id):
        # Check if the user is the teacher or admin
        if not (request.user.type_utilisateur == 'enseignant' and request.user.enseignant.id == int(enseignant_id)) and request.user.type_utilisateur not in ['admin', 'scolarite']:
            return Response({'error': 'Permission refusée'}, status=status.HTTP_403_FORBIDDEN)

        # Fetch planning data for the teacher
        # For example, upcoming evaluations and deadlines
        evaluations_a_venir = Evaluation.objects.filter(
            enseignement__enseignant__id=enseignant_id,
            date_evaluation__gte=timezone.now()
        ).order_by('date_evaluation')[:10]

        prochaines_echeances = Evaluation.objects.filter(
            enseignement__enseignant__id=enseignant_id,
            date_limite_saisie__gte=timezone.now()
        ).order_by('date_limite_saisie')[:10]

        data = {
            'evaluations_a_venir': EvaluationSerializer(evaluations_a_venir, many=True).data,
            'prochaines_echeances': EvaluationSerializer(prochaines_echeances, many=True).data
        }

        return Response(data)

class EnseignantStatistiquesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Check if user is teacher or admin
        if request.user.type_utilisateur != 'enseignant' and request.user.type_utilisateur not in ['admin', 'scolarite']:
            return Response({'error': 'Permission refusée'}, status=status.HTTP_403_FORBIDDEN)

        enseignant = request.user.enseignant

        # Aggregate statistics for the teacher's students
        classes_ids = Enseignement.objects.filter(
            enseignant=enseignant,
            actif=True
        ).values_list('classe_id', flat=True).distinct()

        total_etudiants = Inscription.objects.filter(
            classe_id__in=classes_ids,
            active=True
        ).count()

        repartition_niveau = Inscription.objects.filter(
            classe_id__in=classes_ids,
            active=True
        ).values(
            'classe__niveau__nom'
        ).annotate(
            count=Count('id')
        ).order_by('classe__niveau__numero')

        repartition_classe = Inscription.objects.filter(
            classe_id__in=classes_ids,
            active=True
        ).values(
            'classe__nom'
        ).annotate(
            count=Count('id')
        ).order_by('classe__nom')

        stats = {
            'total_etudiants': total_etudiants,
            'repartition_par_niveau': [
                {
                    'niveau': item['classe__niveau__nom'],
                    'nombre': item['count']
                }
                for item in repartition_niveau
            ],
            'repartition_par_classe': [
                {
                    'classe': item['classe__nom'],
                    'nombre': item['count']
                }
                for item in repartition_classe
            ]
        }

        return Response(stats)

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
        annee_id = self.request.query_params.get('annee_academique', None)
        
        if enseignant_id:
            queryset = queryset.filter(enseignant_id=enseignant_id)
        if classe_id:
            queryset = queryset.filter(classe_id=classe_id)
        if ec_id:
            queryset = queryset.filter(ec_id=ec_id)
        if annee_id:
            queryset = queryset.filter(annee_academique_id=annee_id)
        
        return queryset
    
    @action(detail=True, methods=['get'])
    def evaluations(self, request, pk=None):
        """Toutes les évaluations d'un enseignement"""
        enseignement = self.get_object()
        evaluations = Evaluation.objects.filter(
            enseignement=enseignement
        ).select_related('type_evaluation', 'session')
        
        serializer = EvaluationSerializer(evaluations, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def liste_etudiants(self, request, pk=None):
        """Liste des étudiants pour cet enseignement"""
        enseignement = self.get_object()
        from users.models import Inscription
        
        inscriptions = Inscription.objects.filter(
            classe=enseignement.classe,
            annee_academique=enseignement.annee_academique,
            active=True
        ).select_related('etudiant__user')
        
        etudiants = []
        for inscription in inscriptions:
            # Calculer les moyennes existantes pour cet EC
            moyenne_ec = MoyenneEC.objects.filter(
                etudiant=inscription.etudiant,
                ec=enseignement.ec,
                annee_academique=enseignement.annee_academique
            ).first()
            
            etudiant_data = {
                'id': inscription.etudiant.id,
                'matricule': inscription.etudiant.user.matricule,
                'nom_complet': inscription.etudiant.user.get_full_name(),
                'moyenne_ec': moyenne_ec.moyenne if moyenne_ec else None,
                'validee': moyenne_ec.validee if moyenne_ec else False
            }
            etudiants.append(etudiant_data)
        
        return Response(sorted(etudiants, key=lambda x: x['matricule']))

class EvaluationViewSet(viewsets.ModelViewSet):
    queryset = Evaluation.objects.all()
    serializer_class = EvaluationSerializer
    permission_classes = [IsEnseignantOrReadOnly]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        if self.request.user.type_utilisateur == 'enseignant':
            queryset = queryset.filter(enseignement__enseignant__user=self.request.user)
        
        enseignement_id = self.request.query_params.get('enseignement', None)
        session_id = self.request.query_params.get('session', None)
        type_evaluation_id = self.request.query_params.get('type_evaluation', None)
        
        if enseignement_id:
            queryset = queryset.filter(enseignement_id=enseignement_id)
        if session_id:
            queryset = queryset.filter(session_id=session_id)
        if type_evaluation_id:
            queryset = queryset.filter(type_evaluation_id=type_evaluation_id)
        
        return queryset
    
    @action(detail=True, methods=['get'])
    def feuille_notes(self, request, pk=None):
        """Feuille de notes pour une évaluation"""
        evaluation = self.get_object()
        from users.models import Inscription
        
        # Récupérer tous les étudiants de la classe
        inscriptions = Inscription.objects.filter(
            classe=evaluation.enseignement.classe,
            annee_academique=evaluation.enseignement.annee_academique,
            active=True
        ).select_related('etudiant__user').order_by('etudiant__user__matricule')
        
        feuille = {
            'evaluation': EvaluationSerializer(evaluation).data,
            'etudiants': []
        }
        
        for inscription in inscriptions:
            # Récupérer la note existante si elle existe
            note_obj = Note.objects.filter(
                etudiant=inscription.etudiant,
                evaluation=evaluation
            ).first()
            
            etudiant_data = {
                'etudiant_id': inscription.etudiant.id,
                'matricule': inscription.etudiant.user.matricule,
                'nom_complet': inscription.etudiant.user.get_full_name(),
                'note_obtenue': note_obj.note_obtenue if note_obj else None,
                'absent': note_obj.absent if note_obj else False,
                'justifie': note_obj.justifie if note_obj else False,
                'commentaire': note_obj.commentaire if note_obj else ''
            }
            feuille['etudiants'].append(etudiant_data)
        
        return Response(feuille)
    
    @action(detail=True, methods=['post'])
    def saisir_notes(self, request, pk=None):
        """Saisie multiple de notes pour une évaluation"""
        evaluation = self.get_object()
        
        # Vérifier les permissions
        if (request.user.type_utilisateur == 'enseignant' and 
            evaluation.enseignement.enseignant.user != request.user):
            return Response(
                {'error': 'Vous ne pouvez modifier que vos propres évaluations'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        notes_data = request.data.get('notes', [])
        
        if not notes_data:
            return Response(
                {'error': 'Données de notes requises'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        erreurs = []
        notes_sauvees = 0
        
        try:
            with transaction.atomic():
                for note_data in notes_data:
                    etudiant_id = note_data.get('etudiant_id')
                    note_obtenue = note_data.get('note_obtenue')
                    absent = note_data.get('absent', False)
                    justifie = note_data.get('justifie', False)
                    commentaire = note_data.get('commentaire', '')
                    
                    if not etudiant_id:
                        erreurs.append("etudiant_id manquant")
                        continue
                    
                    try:
                        from users.models import Etudiant
                        etudiant = Etudiant.objects.get(id=etudiant_id)
                        
                        # Validation de la note
                        if not absent and note_obtenue is not None:
                            if note_obtenue < 0 or note_obtenue > evaluation.note_sur:
                                erreurs.append(f"Note invalide pour {etudiant.user.matricule}: {note_obtenue}")
                                continue
                        
                        # Créer ou mettre à jour la note
                        note, created = Note.objects.update_or_create(
                            etudiant=etudiant,
                            evaluation=evaluation,
                            defaults={
                                'note_obtenue': note_obtenue or 0,
                                'absent': absent,
                                'justifie': justifie,
                                'commentaire': commentaire
                            }
                        )
                        notes_sauvees += 1
                        
                    except Etudiant.DoesNotExist:
                        erreurs.append(f"Étudiant ID {etudiant_id} non trouvé")
                
                # Marquer la saisie comme terminée si toutes les notes sont saisies
                if len(erreurs) == 0:
                    evaluation.saisie_terminee = True
                    evaluation.save()
                    
                    # Recalculer les moyennes EC pour tous les étudiants concernés
                    from users.models import Inscription
                    inscriptions = Inscription.objects.filter(
                        classe=evaluation.enseignement.classe,
                        annee_academique=evaluation.enseignement.annee_academique,
                        active=True
                    )
                    
                    for inscription in inscriptions:
                        calculer_moyenne_ec(
                            inscription.etudiant,
                            evaluation.enseignement.ec,
                            evaluation.session,
                            evaluation.enseignement.annee_academique
                        )
        
        except Exception as e:
            return Response(
                {'error': f'Erreur lors de la saisie: {str(e)}'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        return Response({
            'message': f'{notes_sauvees} notes sauvegardées',
            'erreurs': erreurs,
            'saisie_terminee': evaluation.saisie_terminee
        })
    
    @action(detail=True, methods=['get'])
    def statistiques(self, request, pk=None):
        """Statistiques d'une évaluation"""
        evaluation = self.get_object()
        notes = Note.objects.filter(evaluation=evaluation, absent=False)
        
        if not notes.exists():
            return Response({
                'message': 'Aucune note saisie',
                'nombre_notes': 0
            })
        
        notes_values = [note.note_obtenue for note in notes]
        
        stats = {
            'evaluation': EvaluationSerializer(evaluation).data,
            'nombre_notes': len(notes_values),
            'nombre_absents': Note.objects.filter(evaluation=evaluation, absent=True).count(),
            'moyenne': sum(notes_values) / len(notes_values),
            'note_max': max(notes_values),
            'note_min': min(notes_values),
            'repartition': {
                'excellents': len([n for n in notes_values if n >= 16]),
                'bien': len([n for n in notes_values if 14 <= n < 16]),
                'assez_bien': len([n for n in notes_values if 12 <= n < 14]),
                'passable': len([n for n in notes_values if 10 <= n < 12]),
                'insuffisant': len([n for n in notes_values if n < 10])
            }
        }
        
        return Response(stats)
    @action(detail=True, methods=['get'])
    def verifier_delai_saisie(self, request, pk=None):
        """Vérifie si la saisie est encore autorisée pour cette évaluation"""
        evaluation = self.get_object()
        
        delai_info = {
            'peut_saisir': evaluation.peut_saisir_notes,
            'peut_modifier': evaluation.peut_modifier_notes,
            'date_limite': evaluation.date_limite_saisie,
            'delai_depasse': timezone.now() > evaluation.date_limite_saisie if evaluation.date_limite_saisie else False,
            'nb_modifications': evaluation.nb_modifications,
            'saisie_terminee': evaluation.saisie_terminee
        }
        
        return Response(delai_info)
    
    @action(detail=True, methods=['post'])
    def autoriser_modification(self, request, pk=None):
        """Autorise la modification des notes pour cette évaluation"""
        if request.user.type_utilisateur not in ['admin', 'scolarite']:
            return Response(
                {'error': 'Permission refusée'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        evaluation = self.get_object()
        autoriser = request.data.get('autoriser', True)
        
        evaluation.modification_autorisee = autoriser
        evaluation.save()
        
        return Response({
            'message': f'Modification {"autorisée" if autoriser else "interdite"} pour {evaluation.nom}',
            'modification_autorisee': evaluation.modification_autorisee
        })
    
    @action(detail=True, methods=['post'])
    def prolonger_delai(self, request, pk=None):
        """Prolonge le délai de saisie des notes"""
        if request.user.type_utilisateur not in ['admin', 'scolarite']:
            return Response(
                {'error': 'Permission refusée'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        evaluation = self.get_object()
        jours_supplementaires = request.data.get('jours', 7)
        
        if evaluation.date_limite_saisie:
            evaluation.date_limite_saisie += timedelta(days=jours_supplementaires)
        else:
            evaluation.date_limite_saisie = timezone.now() + timedelta(days=jours_supplementaires)
        
        evaluation.saisie_autorisee = True
        evaluation.save()
        
        return Response({
            'message': f'Délai prolongé de {jours_supplementaires} jours',
            'nouvelle_date_limite': evaluation.date_limite_saisie
        })

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
        session_id = self.request.query_params.get('session', None)
        
        if etudiant_id:
            queryset = queryset.filter(etudiant_id=etudiant_id)
        if evaluation_id:
            queryset = queryset.filter(evaluation_id=evaluation_id)
        if ec_id:
            queryset = queryset.filter(evaluation__enseignement__ec_id=ec_id)
        if session_id:
            queryset = queryset.filter(evaluation__session_id=session_id)
        
        return queryset
    
    @action(detail=False, methods=['get'])
    def releve_notes_etudiant(self, request):
        """Relevé de notes complet pour un étudiant"""
        etudiant_id = request.query_params.get('etudiant')
        session_id = request.query_params.get('session')
        
        if not etudiant_id or not session_id:
            return Response(
                {'error': 'etudiant_id et session_id requis'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Vérifier les permissions
        if (request.user.type_utilisateur == 'etudiant' and 
            str(request.user.etudiant.id) != etudiant_id):
            return Response(
                {'error': 'Accès non autorisé'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        from users.models import Etudiant
        try:
            etudiant = Etudiant.objects.get(id=etudiant_id)
        except Etudiant.DoesNotExist:
            return Response(
                {'error': 'Étudiant non trouvé'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Notes par EC
        notes = self.get_queryset().filter(
            etudiant=etudiant,
            evaluation__session_id=session_id
        ).select_related('evaluation__enseignement__ec', 'evaluation__type_evaluation')
        
        # Organiser par EC
        notes_par_ec = {}
        for note in notes:
            ec_id = note.evaluation.enseignement.ec.id
            if ec_id not in notes_par_ec:
                notes_par_ec[ec_id] = {
                    'ec': {
                        'id': note.evaluation.enseignement.ec.id,
                        'code': note.evaluation.enseignement.ec.code,
                        'nom': note.evaluation.enseignement.ec.nom,
                        'ue': note.evaluation.enseignement.ec.ue.nom
                    },
                    'notes': []
                }
            
            notes_par_ec[ec_id]['notes'].append(NoteSerializer(note).data)
        
        return Response({
            'etudiant': {
                'id': etudiant.id,
                'matricule': etudiant.user.matricule,
                'nom_complet': etudiant.user.get_full_name()
            },
            'notes_par_ec': list(notes_par_ec.values())
        })

class MoyenneECViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = MoyenneEC.objects.all()
    serializer_class = MoyenneECSerializer
    permission_classes = [IsEtudiantOwner]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        if self.request.user.type_utilisateur == 'etudiant':
            queryset = queryset.filter(etudiant__user=self.request.user)
        
        # Filtres
        etudiant_id = self.request.query_params.get('etudiant', None)
        ec_id = self.request.query_params.get('ec', None)
        session_id = self.request.query_params.get('session', None)
        annee_id = self.request.query_params.get('annee_academique', None)
        
        if etudiant_id:
            queryset = queryset.filter(etudiant_id=etudiant_id)
        if ec_id:
            queryset = queryset.filter(ec_id=ec_id)
        if session_id:
            queryset = queryset.filter(session_id=session_id)
        if annee_id:
            queryset = queryset.filter(annee_academique_id=annee_id)
        
        return queryset
    
    @action(detail=False, methods=['post'])
    def recalculer_moyennes(self, request):
        """Recalculer les moyennes EC pour un groupe d'étudiants"""
        if request.user.type_utilisateur not in ['admin', 'scolarite']:
            return Response(
                {'error': 'Permission refusée'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        classe_id = request.data.get('classe_id')
        session_id = request.data.get('session_id')
        ec_id = request.data.get('ec_id')  # Optionnel
        
        if not classe_id or not session_id:
            return Response(
                {'error': 'classe_id et session_id requis'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            from academics.models import Classe, Session
            from academics.models import EC
            from users.models import Inscription
            
            classe = Classe.objects.get(id=classe_id)
            session = Session.objects.get(id=session_id)
            
            # Récupérer les étudiants de la classe
            inscriptions = Inscription.objects.filter(
                classe=classe,
                active=True
            )
            
            # Récupérer les EC à traiter
            if ec_id:
                ecs = [EC.objects.get(id=ec_id)]
            else:
                # Tous les EC du niveau
                ecs = EC.objects.filter(
                    ue__niveau=classe.niveau,
                    actif=True
                )
            
            moyennes_calculees = 0
            
            for inscription in inscriptions:
                for ec in ecs:
                    moyenne = calculer_moyenne_ec(
                        inscription.etudiant,
                        ec,
                        session,
                        classe.annee_academique
                    )
                    if moyenne:
                        moyennes_calculees += 1
            
            return Response({
                'message': f'{moyennes_calculees} moyennes EC recalculées'
            })
            
        except Exception as e:
            return Response(
                {'error': f'Erreur: {str(e)}'}, 
                status=status.HTTP_400_BAD_REQUEST
            )

class MoyenneUEViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = MoyenneUE.objects.all()
    serializer_class = MoyenneUESerializer
    permission_classes = [IsEtudiantOwner]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        if self.request.user.type_utilisateur == 'etudiant':
            queryset = queryset.filter(etudiant__user=self.request.user)
        
        return queryset
    
    @action(detail=False, methods=['post'])
    def recalculer_moyennes(self, request):
        """Recalculer les moyennes UE"""
        if request.user.type_utilisateur not in ['admin', 'scolarite']:
            return Response(
                {'error': 'Permission refusée'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        classe_id = request.data.get('classe_id')
        session_id = request.data.get('session_id')
        
        if not classe_id or not session_id:
            return Response(
                {'error': 'classe_id et session_id requis'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            from academics.models import Classe, Session, UE
            from users.models import Inscription
            
            classe = Classe.objects.get(id=classe_id)
            session = Session.objects.get(id=session_id)
            
            inscriptions = Inscription.objects.filter(classe=classe, active=True)
            ues = UE.objects.filter(niveau=classe.niveau, actif=True)
            
            moyennes_calculees = 0
            
            for inscription in inscriptions:
                for ue in ues:
                    moyenne = calculer_moyenne_ue(
                        inscription.etudiant,
                        ue,
                        session,
                        classe.annee_academique
                    )
                    if moyenne:
                        moyennes_calculees += 1
            
            return Response({
                'message': f'{moyennes_calculees} moyennes UE recalculées'
            })
            
        except Exception as e:
            return Response(
                {'error': f'Erreur: {str(e)}'}, 
                status=status.HTTP_400_BAD_REQUEST
            )

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
        if request.user.type_utilisateur not in ['admin', 'scolarite', 'direction', 'enseignant']:
            return Response(
                {'error': 'Permission refusée'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        classe_id = request.query_params.get('classe', None)
        session_id = request.query_params.get('session', None)
        
        if not classe_id or not session_id:
            return Response(
                {'error': 'classe_id et session_id requis'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        moyennes = self.get_queryset().filter(
            classe_id=classe_id,
            session_id=session_id
        )
        
        if not moyennes.exists():
            return Response({
                'message': 'Aucune moyenne trouvée',
                'nombre_etudiants': 0
            })
        
        moyennes_values = [m.moyenne_generale for m in moyennes]
        
        stats = {
            'classe_id': classe_id,
            'session_id': session_id,
            'nombre_etudiants': moyennes.count(),
            'moyenne_classe': sum(moyennes_values) / len(moyennes_values),
            'moyenne_max': max(moyennes_values),
            'moyenne_min': min(moyennes_values),
            'taux_reussite': moyennes.filter(moyenne_generale__gte=10).count(),
            'taux_reussite_pct': round(
                (moyennes.filter(moyenne_generale__gte=10).count() / moyennes.count()) * 100, 2
            ),
            'mentions': {
                'tres_bien': moyennes.filter(moyenne_generale__gte=16).count(),
                'bien': moyennes.filter(moyenne_generale__gte=14, moyenne_generale__lt=16).count(),
                'assez_bien': moyennes.filter(moyenne_generale__gte=12, moyenne_generale__lt=14).count(),
                'passable': moyennes.filter(moyenne_generale__gte=10, moyenne_generale__lt=12).count(),
                'insuffisant': moyennes.filter(moyenne_generale__lt=10).count(),
            },
            'credits': {
                'moyenne_credits_obtenus': moyennes.aggregate(Avg('credits_obtenus'))['credits_obtenus__avg'] or 0,
                'total_credits_requis': moyennes.first().credits_requis if moyennes.exists() else 0
            }
        }
        
        return Response(stats)
    
    @action(detail=False, methods=['post'])
    def recalculer_moyennes(self, request):
        """Recalculer les moyennes semestrielles"""
        if request.user.type_utilisateur not in ['admin', 'scolarite']:
            return Response(
                {'error': 'Permission refusée'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        classe_id = request.data.get('classe_id')
        session_id = request.data.get('session_id')
        
        if not classe_id or not session_id:
            return Response(
                {'error': 'classe_id et session_id requis'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            from academics.models import Classe, Session, Semestre
            from users.models import Inscription
            
            classe = Classe.objects.get(id=classe_id)
            session = Session.objects.get(id=session_id)
            
            inscriptions = Inscription.objects.filter(classe=classe, active=True)
            semestres = Semestre.objects.all()
            
            moyennes_calculees = 0
            
            for inscription in inscriptions:
                for semestre in semestres:
                    moyenne = calculer_moyenne_semestre(
                        inscription.etudiant,
                        classe,
                        semestre,
                        session,
                        classe.annee_academique
                    )
                    if moyenne:
                        moyennes_calculees += 1
            
            return Response({
                'message': f'{moyennes_calculees} moyennes semestrielles recalculées'
            })
            
        except Exception as e:
            return Response(
                {'error': f'Erreur: {str(e)}'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=False, methods=['get'])
    def tableau_notes_classe(self, request):
        """Tableau complet des notes d'une classe"""
        if request.user.type_utilisateur not in ['admin', 'scolarite', 'direction', 'enseignant']:
            return Response(
                {'error': 'Permission refusée'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        classe_id = request.query_params.get('classe')
        session_id = request.query_params.get('session')
        
        if not classe_id or not session_id:
            return Response(
                {'error': 'classe_id et session_id requis'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            from academics.models import Classe, Session
            from users.models import Inscription
            
            classe = Classe.objects.get(id=classe_id)
            session = Session.objects.get(id=session_id)
            
            # Récupérer toutes les inscriptions
            inscriptions = Inscription.objects.filter(
                classe=classe, active=True
            ).select_related('etudiant__user').order_by('etudiant__user__matricule')
            
            tableau = {
                'classe': {
                    'id': classe.id,
                    'nom': classe.nom,
                    'niveau': classe.niveau.nom,
                    'filiere': classe.filiere.nom
                },
                'session': {
                    'id': session.id,
                    'nom': session.nom
                },
                'etudiants': []
            }
            
            for inscription in inscriptions:
                # Moyennes semestrielles
                moyennes_sem = MoyenneSemestre.objects.filter(
                    etudiant=inscription.etudiant,
                    classe=classe,
                    session=session
                ).select_related('semestre')
                
                # Moyennes UE
                moyennes_ue = MoyenneUE.objects.filter(
                    etudiant=inscription.etudiant,
                    session=session,
                    annee_academique=classe.annee_academique
                ).select_related('ue')
                
                etudiant_data = {
                    'etudiant': {
                        'id': inscription.etudiant.id,
                        'matricule': inscription.etudiant.user.matricule,
                        'nom_complet': inscription.etudiant.user.get_full_name()
                    },
                    'moyennes_semestre': MoyenneSemestreSerializer(moyennes_sem, many=True).data,
                    'moyennes_ue': MoyenneUESerializer(moyennes_ue, many=True).data
                }
                
                tableau['etudiants'].append(etudiant_data)
            
            return Response(tableau)
            
        except Exception as e:
            return Response(
                {'error': f'Erreur: {str(e)}'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
class EnseignantEtudiantsViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet pour gérer les étudiants d'un enseignant
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        # Récupérer tous les étudiants des classes où l'enseignant enseigne
        if self.request.user.type_utilisateur != 'enseignant':
            return Etudiant.objects.none()
        
        try:
            enseignant = self.request.user.enseignant
        except:
            return Etudiant.objects.none()
        
        # Trouver toutes les classes où cet enseignant enseigne
        enseignements = Enseignement.objects.filter(
            enseignant=enseignant,
            actif=True
        ).values_list('classe_id', flat=True).distinct()
        
        # Récupérer tous les étudiants de ces classes
        return Etudiant.objects.filter(
            inscription__classe_id__in=enseignements,
            inscription__active=True
        ).select_related('user').distinct()
    
    def list(self, request):
        """Liste tous les étudiants de l'enseignant avec détails"""
        try:
            enseignant = request.user.enseignant
        except:
            return Response(
                {'error': 'Utilisateur non reconnu comme enseignant'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Filtres
        classe_id = request.query_params.get('classe')
        ec_id = request.query_params.get('ec')
        search = request.query_params.get('search')
        session_id = request.query_params.get('session')
        
        # Récupérer les enseignements de l'enseignant
        enseignements_query = Enseignement.objects.filter(
            enseignant=enseignant,
            actif=True
        )
        
        if classe_id:
            enseignements_query = enseignements_query.filter(classe_id=classe_id)
        if ec_id:
            enseignements_query = enseignements_query.filter(ec_id=ec_id)
        
        enseignements = enseignements_query.select_related('classe', 'ec__ue', 'annee_academique')
        
        # Récupérer toutes les classes concernées
        classes_ids = enseignements.values_list('classe_id', flat=True).distinct()
        
        # Récupérer les étudiants
        etudiants_query = Inscription.objects.filter(
            classe_id__in=classes_ids,
            active=True
        ).select_related(
            'etudiant__user', 'classe', 'statut', 'annee_academique'
        )
        
        if search:
            etudiants_query = etudiants_query.filter(
                Q(etudiant__user__first_name__icontains=search) |
                Q(etudiant__user__last_name__icontains=search) |
                Q(etudiant__user__matricule__icontains=search)
            )
        
        # Pagination
        page_size = int(request.query_params.get('page_size', 50))
        page = int(request.query_params.get('page', 1))
        
        paginator = Paginator(etudiants_query, page_size)
        page_obj = paginator.get_page(page)
        
        # Préparer les données des étudiants
        etudiants_data = []
        
        for inscription in page_obj:
            etudiant = inscription.etudiant
            
            # Calculer les moyennes pour cet étudiant dans les ECs de l'enseignant
            moyennes_ec = {}
            absences_totales = 0
            notes_saisies = 0
            total_evaluations = 0
            
            for enseignement in enseignements.filter(classe=inscription.classe):
                # Moyennes EC
                try:
                    moyenne_ec = MoyenneEC.objects.filter(
                        etudiant=etudiant,
                        ec=enseignement.ec,
                        annee_academique=inscription.annee_academique
                    ).first()
                    
                    if moyenne_ec:
                        moyennes_ec[enseignement.ec.code] = {
                            'moyenne': float(moyenne_ec.moyenne),
                            'validee': moyenne_ec.validee,
                            'ec_nom': enseignement.ec.nom
                        }
                except:
                    pass
                
                # Compter les évaluations et notes
                evaluations = Evaluation.objects.filter(
                    enseignement=enseignement
                )
                if session_id:
                    evaluations = evaluations.filter(session_id=session_id)
                
                total_evaluations += evaluations.count()
                
                # Compter les notes saisies
                notes_count = Note.objects.filter(
                    etudiant=etudiant,
                    evaluation__in=evaluations
                ).count()
                notes_saisies += notes_count
                
                # Compter les absences
                absences_count = Note.objects.filter(
                    etudiant=etudiant,
                    evaluation__in=evaluations,
                    absent=True
                ).count()
                absences_totales += absences_count
            
            # Calculer la progression
            progression_pct = 0
            if total_evaluations > 0:
                progression_pct = round((notes_saisies / total_evaluations) * 100, 1)
            
            etudiant_data = {
                'id': etudiant.id,
                'matricule': etudiant.user.matricule,
                'nom_complet': etudiant.user.get_full_name(),
                'email': etudiant.user.email,
                'telephone': etudiant.user.telephone,
                'photo': etudiant.user.photo.url if etudiant.user.photo else None,
                'classe': inscription.classe.nom,
                'niveau': inscription.classe.niveau.nom,
                'filiere': inscription.classe.filiere.nom,
                'statut': inscription.statut.nom,
                'nombre_redoublements': inscription.nombre_redoublements,
                'moyennes_ec': moyennes_ec,
                'absences': {
                    'total': absences_totales,
                    'justifiees': Note.objects.filter(
                        etudiant=etudiant,
                        evaluation__enseignement__in=enseignements.filter(classe=inscription.classe),
                        absent=True,
                        justifie=True
                    ).count(),
                    'non_justifiees': absences_totales - Note.objects.filter(
                        etudiant=etudiant,
                        evaluation__enseignement__in=enseignements.filter(classe=inscription.classe),
                        absent=True,
                        justifie=True
                    ).count()
                },
                'progression': {
                    'notes_saisies': notes_saisies,
                    'total_evaluations': total_evaluations,
                    'pourcentage': progression_pct
                }
            }
            
            etudiants_data.append(etudiant_data)
        
        # Préparer la réponse paginée
        response_data = {
            'count': paginator.count,
            'next': page_obj.next_page_number() if page_obj.has_next() else None,
            'previous': page_obj.previous_page_number() if page_obj.has_previous() else None,
            'results': etudiants_data
        }
        
        return Response(response_data)
    
    @action(detail=True, methods=['get'])
    def details(self, request, pk=None):
        """Détails complets d'un étudiant pour l'enseignant"""
        try:
            enseignant = request.user.enseignant
            etudiant = Etudiant.objects.get(id=pk)
        except:
            return Response(
                {'error': 'Étudiant non trouvé'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Vérifier que l'enseignant a accès à cet étudiant
        enseignements = Enseignement.objects.filter(
            enseignant=enseignant,
            actif=True
        ).values_list('classe_id', flat=True)
        
        inscription = Inscription.objects.filter(
            etudiant=etudiant,
            classe_id__in=enseignements,
            active=True
        ).first()
        
        if not inscription:
            return Response(
                {'error': 'Accès non autorisé à cet étudiant'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Récupérer les données détaillées
        session_id = request.query_params.get('session')
        
        details = {
            'etudiant': {
                'id': etudiant.id,
                'matricule': etudiant.user.matricule,
                'nom_complet': etudiant.user.get_full_name(),
                'email': etudiant.user.email,
                'telephone': etudiant.user.telephone,
                'photo': etudiant.user.photo.url if etudiant.user.photo else None,
                'date_naissance': etudiant.user.date_naissance,
                'lieu_naissance': etudiant.user.lieu_naissance,
            },
            'inscription': {
                'classe': inscription.classe.nom,
                'niveau': inscription.classe.niveau.nom,
                'filiere': inscription.classe.filiere.nom,
                'option': inscription.classe.option.nom if inscription.classe.option else None,
                'statut': inscription.statut.nom,
                'nombre_redoublements': inscription.nombre_redoublements,
                'date_inscription': inscription.date_inscription
            },
            'notes_par_ec': [],
            'moyennes': [],
            'statistiques': {}
        }
        
        # Récupérer les notes par EC pour cet enseignant
        enseignements_enseignant = Enseignement.objects.filter(
            enseignant=enseignant,
            classe=inscription.classe,
            actif=True
        ).select_related('ec__ue')
        
        for enseignement in enseignements_enseignant:
            # Notes de l'étudiant pour cet EC
            evaluations = Evaluation.objects.filter(enseignement=enseignement)
            notes = Note.objects.filter(
                etudiant=etudiant,
                evaluation__in=evaluations
            ).select_related('evaluation')
            
            if session_id:
                notes = notes.filter(evaluation__session_id=session_id)
            
            notes_data = []
            for note in notes:
                notes_data.append({
                    'evaluation': {
                        'nom': note.evaluation.nom,
                        'date_evaluation': note.evaluation.date_evaluation,
                        'note_sur': note.evaluation.note_sur,
                        'type_evaluation': note.evaluation.type_evaluation.nom
                    },
                    'note_obtenue': float(note.note_obtenue),
                    'absent': note.absent,
                    'justifie': note.justifie,
                    'commentaire': note.commentaire
                })
            
            # Moyenne EC
            moyenne_ec = None
            try:
                moyenne_obj = MoyenneEC.objects.filter(
                    etudiant=etudiant,
                    ec=enseignement.ec,
                    annee_academique=inscription.annee_academique
                ).first()
                if moyenne_obj:
                    moyenne_ec = {
                        'moyenne': float(moyenne_obj.moyenne),
                        'validee': moyenne_obj.validee
                    }
            except:
                pass
            
            ec_data = {
                'ec': {
                    'code': enseignement.ec.code,
                    'nom': enseignement.ec.nom,
                    'ue': enseignement.ec.ue.nom,
                    'credits': enseignement.ec.ue.credits
                },
                'notes': notes_data,
                'moyenne_ec': moyenne_ec,
                'nombre_evaluations': evaluations.count(),
                'nombre_notes': notes.count()
            }
            
            details['notes_par_ec'].append(ec_data)
        
        return Response(details)
    
    @action(detail=False, methods=['get'])
    def statistiques(self, request):
        """Statistiques générales des étudiants de l'enseignant"""
        try:
            enseignant = request.user.enseignant
        except:
            return Response(
                {'error': 'Utilisateur non reconnu comme enseignant'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Récupérer toutes les classes de l'enseignant
        classes_ids = Enseignement.objects.filter(
            enseignant=enseignant,
            actif=True
        ).values_list('classe_id', flat=True).distinct()
        
        # Statistiques globales
        total_etudiants = Inscription.objects.filter(
            classe_id__in=classes_ids,
            active=True
        ).count()
        
        # Répartition par niveau
        repartition_niveau = Inscription.objects.filter(
            classe_id__in=classes_ids,
            active=True
        ).values(
            'classe__niveau__nom'
        ).annotate(
            count=Count('id')
        ).order_by('classe__niveau__numero')
        
        # Répartition par classe
        repartition_classe = Inscription.objects.filter(
            classe_id__in=classes_ids,
            active=True
        ).values(
            'classe__nom'
        ).annotate(
            count=Count('id')
        ).order_by('classe__nom')
        
        stats = {
            'total_etudiants': total_etudiants,
            'repartition_par_niveau': [
                {
                    'niveau': item['classe__niveau__nom'],
                    'nombre': item['count']
                }
                for item in repartition_niveau
            ],
            'repartition_par_classe': [
                {
                    'classe': item['classe__nom'],
                    'nombre': item['count']
                }
                for item in repartition_classe
            ]
        }
        
        return Response(stats)
