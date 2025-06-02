from django.shortcuts import render
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q, Avg, Count, Sum, F
from django.db import transaction
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
from core.utils import calculer_moyenne_ec, calculer_moyenne_ue, calculer_moyenne_semestre

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