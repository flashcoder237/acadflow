# evaluations/serializers.py - Ajouts
from rest_framework import serializers
from .models import Enseignement, Evaluation, Note, MoyenneEC, MoyenneUE, MoyenneSemestre

class EvaluationDetailSerializer(serializers.ModelSerializer):
    """Serializer détaillé pour les évaluations"""
    enseignement = serializers.SerializerMethodField()
    type_evaluation = serializers.SerializerMethodField()
    session = serializers.SerializerMethodField()
    notes = serializers.SerializerMethodField()
    statistiques = serializers.SerializerMethodField()
    
    class Meta:
        model = Evaluation
        fields = '__all__'
    
    def get_enseignement(self, obj):
        return {
            'id': obj.enseignement.id,
            'enseignant': {
                'nom_complet': obj.enseignement.enseignant.user.get_full_name(),
                'grade': obj.enseignement.enseignant.grade
            },
            'ec': {
                'code': obj.enseignement.ec.code,
                'nom': obj.enseignement.ec.nom,
                'ue': obj.enseignement.ec.ue.nom
            },
            'classe': {
                'nom': obj.enseignement.classe.nom,
                'niveau': obj.enseignement.classe.niveau.nom
            }
        }
    
    def get_type_evaluation(self, obj):
        from academics.serializers import TypeEvaluationSerializer
        return TypeEvaluationSerializer(obj.type_evaluation).data
    
    def get_session(self, obj):
        from academics.serializers import SessionSerializer
        return SessionSerializer(obj.session).data
    
    def get_notes(self, obj):
        notes = Note.objects.filter(evaluation=obj).select_related('etudiant__user')
        return [
            {
                'etudiant': {
                    'id': note.etudiant.id,
                    'matricule': note.etudiant.user.matricule,
                    'nom_complet': note.etudiant.user.get_full_name()
                },
                'note_obtenue': note.note_obtenue,
                'absent': note.absent,
                'justifie': note.justifie,
                'commentaire': note.commentaire
            }
            for note in notes
        ]
    
    def get_statistiques(self, obj):
        notes = Note.objects.filter(evaluation=obj, absent=False)
        
        if not notes.exists():
            return {
                'nombre_notes': 0,
                'nombre_absents': Note.objects.filter(evaluation=obj, absent=True).count(),
                'moyenne': 0,
                'note_max': 0,
                'note_min': 0
            }
        
        notes_values = [note.note_obtenue for note in notes]
        
        return {
            'nombre_notes': len(notes_values),
            'nombre_absents': Note.objects.filter(evaluation=obj, absent=True).count(),
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

class RelveNotesSerializer(serializers.Serializer):
    """Serializer pour relevé de notes complet"""
    etudiant = serializers.SerializerMethodField()
    session = serializers.SerializerMethodField()
    annee_academique = serializers.SerializerMethodField()
    classe = serializers.SerializerMethodField()
    notes_par_ue = serializers.SerializerMethodField()
    moyennes_semestre = serializers.SerializerMethodField()
    bilan = serializers.SerializerMethodField()
    
    def __init__(self, etudiant, session, annee_academique, *args, **kwargs):
        self.etudiant_obj = etudiant
        self.session_obj = session
        self.annee_academique_obj = annee_academique
        super().__init__(*args, **kwargs)
    
    def get_etudiant(self, obj):
        from users.serializers import EtudiantSerializer
        return EtudiantSerializer(self.etudiant_obj).data
    
    def get_session(self, obj):
        from academics.serializers import SessionSerializer
        return SessionSerializer(self.session_obj).data
    
    def get_annee_academique(self, obj):
        from academics.serializers import AnneeAcademiqueSerializer
        return AnneeAcademiqueSerializer(self.annee_academique_obj).data
    
    def get_classe(self, obj):
        from users.models import Inscription
        from academics.serializers import ClasseSerializer
        
        inscription = Inscription.objects.filter(
            etudiant=self.etudiant_obj,
            annee_academique=self.annee_academique_obj,
            active=True
        ).first()
        
        return ClasseSerializer(inscription.classe).data if inscription else None
    
    def get_notes_par_ue(self, obj):
        from users.models import Inscription
        from academics.models import UE
        
        inscription = Inscription.objects.filter(
            etudiant=self.etudiant_obj,
            annee_academique=self.annee_academique_obj,
            active=True
        ).first()
        
        if not inscription:
            return []
        
        ues_data = []
        ues = UE.objects.filter(
            niveau=inscription.classe.niveau,
            actif=True
        ).prefetch_related('elements_constitutifs')
        
        for ue in ues:
            # Moyenne UE
            moyenne_ue = MoyenneUE.objects.filter(
                etudiant=self.etudiant_obj,
                ue=ue,
                session=self.session_obj,
                annee_academique=self.annee_academique_obj
            ).first()
            
            # Moyennes EC
            moyennes_ec = []
            for ec in ue.elements_constitutifs.filter(actif=True):
                moyenne_ec = MoyenneEC.objects.filter(
                    etudiant=self.etudiant_obj,
                    ec=ec,
                    session=self.session_obj,
                    annee_academique=self.annee_academique_obj
                ).first()
                
                if moyenne_ec:
                    moyennes_ec.append({
                        'ec': {
                            'code': ec.code,
                            'nom': ec.nom,
                            'poids': ec.poids_ec
                        },
                        'moyenne': moyenne_ec.moyenne,
                        'validee': moyenne_ec.validee
                    })
            
            ue_data = {
                'ue': {
                    'code': ue.code,
                    'nom': ue.nom,
                    'credits': ue.credits,
                    'coefficient': ue.coefficient,
                    'semestre': ue.semestre.nom
                },
                'moyenne_ue': moyenne_ue.moyenne if moyenne_ue else None,
                'credits_obtenus': moyenne_ue.credits_obtenus if moyenne_ue else 0,
                'validee': moyenne_ue.validee if moyenne_ue else False,
                'moyennes_ec': moyennes_ec
            }
            
            ues_data.append(ue_data)
        
        return ues_data
    
    def get_moyennes_semestre(self, obj):
        from users.models import Inscription
        
        inscription = Inscription.objects.filter(
            etudiant=self.etudiant_obj,
            annee_academique=self.annee_academique_obj,
            active=True
        ).first()
        
        if not inscription:
            return []
        
        moyennes = MoyenneSemestre.objects.filter(
            etudiant=self.etudiant_obj,
            classe=inscription.classe,
            session=self.session_obj,
            annee_academique=self.annee_academique_obj
        ).select_related('semestre')
        
        return [
            {
                'semestre': moyenne.semestre.nom,
                'moyenne_generale': moyenne.moyenne_generale,
                'credits_obtenus': moyenne.credits_obtenus,
                'credits_requis': moyenne.credits_requis,
                'taux_validation': round(
                    (moyenne.credits_obtenus / moyenne.credits_requis) * 100, 2
                ) if moyenne.credits_requis > 0 else 0,
                'mention': self._get_mention(moyenne.moyenne_generale)
            }
            for moyenne in moyennes
        ]
    
    def get_bilan(self, obj):
        from users.models import Inscription
        
        inscription = Inscription.objects.filter(
            etudiant=self.etudiant_obj,
            annee_academique=self.annee_academique_obj,
            active=True
        ).first()
        
        if not inscription:
            return {}
        
        moyennes_sem = MoyenneSemestre.objects.filter(
            etudiant=self.etudiant_obj,
            classe=inscription.classe,
            session=self.session_obj,
            annee_academique=self.annee_academique_obj
        )
        
        if not moyennes_sem.exists():
            return {}
        
        total_credits_obtenus = sum(m.credits_obtenus for m in moyennes_sem)
        total_credits_requis = sum(m.credits_requis for m in moyennes_sem)
        moyenne_generale_annee = sum(m.moyenne_generale for m in moyennes_sem) / len(moyennes_sem)
        
        return {
            'moyenne_generale_annee': round(moyenne_generale_annee, 2),
            'total_credits_obtenus': total_credits_obtenus,
            'total_credits_requis': total_credits_requis,
            'taux_validation_annee': round(
                (total_credits_obtenus / total_credits_requis) * 100, 2
            ) if total_credits_requis > 0 else 0,
            'mention_annee': self._get_mention(moyenne_generale_annee),
            'decision': self._get_decision(moyenne_generale_annee, total_credits_obtenus, total_credits_requis)
        }
    
    def _get_mention(self, moyenne):
        if moyenne >= 16:
            return "Très Bien"
        elif moyenne >= 14:
            return "Bien"
        elif moyenne >= 12:
            return "Assez Bien"
        elif moyenne >= 10:
            return "Passable"
        else:
            return "Insuffisant"
    
    def _get_decision(self, moyenne, credits_obtenus, credits_requis):
        taux_validation = (credits_obtenus / credits_requis) * 100 if credits_requis > 0 else 0
        
        if moyenne >= 10 and taux_validation >= 100:
            return "Admis(e)"
        elif moyenne >= 10 and taux_validation >= 70:
            return "Admis(e) avec dettes"
        elif taux_validation >= 50:
            return "Autorisé(e) à continuer"
        else:
            return "Redoublement"

class TableauNotesClasseSerializer(serializers.Serializer):
    """Serializer pour tableau complet des notes d'une classe"""
    classe = serializers.SerializerMethodField()
    session = serializers.SerializerMethodField()
    structure_ues = serializers.SerializerMethodField()
    etudiants_notes = serializers.SerializerMethodField()
    statistiques_classe = serializers.SerializerMethodField()
    
    def __init__(self, classe, session, *args, **kwargs):
        self.classe_obj = classe
        self.session_obj = session
        super().__init__(*args, **kwargs)
    
    def get_classe(self, obj):
        from academics.serializers import ClasseSerializer
        return ClasseSerializer(self.classe_obj).data
    
    def get_session(self, obj):
        from academics.serializers import SessionSerializer
        return SessionSerializer(self.session_obj).data
    
    def get_structure_ues(self, obj):
        from academics.models import UE
        
        ues = UE.objects.filter(
            niveau=self.classe_obj.niveau,
            actif=True
        ).prefetch_related('elements_constitutifs').order_by('semestre__numero', 'code')
        
        return [
            {
                'id': ue.id,
                'code': ue.code,
                'nom': ue.nom,
                'credits': ue.credits,
                'semestre': ue.semestre.nom,
                'elements_constitutifs': [
                    {
                        'id': ec.id,
                        'code': ec.code,
                        'nom': ec.nom,
                        'poids': ec.poids_ec
                    }
                    for ec in ue.elements_constitutifs.filter(actif=True)
                ]
            }
            for ue in ues
        ]
    
    def get_etudiants_notes(self, obj):
        from users.models import Inscription
        
        inscriptions = Inscription.objects.filter(
            classe=self.classe_obj,
            active=True
        ).select_related('etudiant__user').order_by('etudiant__user__matricule')
        
        etudiants_data = []
        
        for inscription in inscriptions:
            etudiant = inscription.etudiant
            
            # Moyennes UE
            moyennes_ue = MoyenneUE.objects.filter(
                etudiant=etudiant,
                session=self.session_obj,
                ue__niveau=self.classe_obj.niveau
            ).select_related('ue')
            
            moyennes_ue_dict = {m.ue.id: m for m in moyennes_ue}
            
            # Moyennes semestrielles
            moyennes_sem = MoyenneSemestre.objects.filter(
                etudiant=etudiant,
                classe=self.classe_obj,
                session=self.session_obj
            ).select_related('semestre')
            
            moyennes_sem_dict = {m.semestre.id: m for m in moyennes_sem}
            
            etudiant_data = {
                'etudiant': {
                    'id': etudiant.id,
                    'matricule': etudiant.user.matricule,
                    'nom_complet': etudiant.user.get_full_name()
                },
                'moyennes_ue': moyennes_ue_dict,
                'moyennes_semestre': moyennes_sem_dict,
                'bilan': self._calculer_bilan_etudiant(moyennes_sem)
            }
            
            etudiants_data.append(etudiant_data)
        
        return etudiants_data
    
    def get_statistiques_classe(self, obj):
        moyennes = MoyenneSemestre.objects.filter(
            classe=self.classe_obj,
            session=self.session_obj
        )
        
        if not moyennes.exists():
            return {
                'nombre_etudiants': 0,
                'moyenne_classe': 0,
                'taux_reussite': 0
            }
        
        moyennes_values = [m.moyenne_generale for m in moyennes]
        
        return {
            'nombre_etudiants': len(moyennes_values),
            'moyenne_classe': round(sum(moyennes_values) / len(moyennes_values), 2),
            'moyenne_max': max(moyennes_values),
            'moyenne_min': min(moyennes_values),
            'taux_reussite': round(
                (len([m for m in moyennes_values if m >= 10]) / len(moyennes_values)) * 100, 2
            ),
            'mentions': {
                'tres_bien': len([m for m in moyennes_values if m >= 16]),
                'bien': len([m for m in moyennes_values if 14 <= m < 16]),
                'assez_bien': len([m for m in moyennes_values if 12 <= m < 14]),
                'passable': len([m for m in moyennes_values if 10 <= m < 12]),
                'insuffisant': len([m for m in moyennes_values if m < 10])
            }
        }
    
    def _calculer_bilan_etudiant(self, moyennes_sem):
        if not moyennes_sem:
            return {}
        
        moyenne_annee = sum(m.moyenne_generale for m in moyennes_sem) / len(moyennes_sem)
        total_credits_obtenus = sum(m.credits_obtenus for m in moyennes_sem)
        total_credits_requis = sum(m.credits_requis for m in moyennes_sem)
        
        return {
            'moyenne_annee': round(moyenne_annee, 2),
            'credits_obtenus': total_credits_obtenus,
            'credits_requis': total_credits_requis,
            'taux_validation': round(
                (total_credits_obtenus / total_credits_requis) * 100, 2
            ) if total_credits_requis > 0 else 0,
            'mention': self._get_mention(moyenne_annee)
        }
    
    def _get_mention(self, moyenne):
        if moyenne >= 16:
            return "Très Bien"
        elif moyenne >= 14:
            return "Bien"
        elif moyenne >= 12:
            return "Assez Bien"
        elif moyenne >= 10:
            return "Passable"
        else:
            return "Insuffisant"