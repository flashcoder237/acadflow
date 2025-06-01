from rest_framework import serializers
from .models import (
    Enseignement, Evaluation, Note, MoyenneEC, MoyenneUE, MoyenneSemestre
)

class EnseignementSerializer(serializers.ModelSerializer):
    enseignant_nom = serializers.CharField(source='enseignant.user.get_full_name', read_only=True)
    ec_nom = serializers.CharField(source='ec.nom', read_only=True)
    ec_code = serializers.CharField(source='ec.code', read_only=True)
    classe_nom = serializers.CharField(source='classe.nom', read_only=True)
    ue_nom = serializers.CharField(source='ec.ue.nom', read_only=True)
    
    class Meta:
        model = Enseignement
        fields = '__all__'

class EvaluationSerializer(serializers.ModelSerializer):
    enseignement_details = EnseignementSerializer(source='enseignement', read_only=True)
    type_evaluation_nom = serializers.CharField(source='type_evaluation.nom', read_only=True)
    session_nom = serializers.CharField(source='session.nom', read_only=True)
    nombre_notes = serializers.SerializerMethodField()
    
    class Meta:
        model = Evaluation
        fields = '__all__'
    
    def get_nombre_notes(self, obj):
        return obj.note_set.count()

class NoteSerializer(serializers.ModelSerializer):
    etudiant_nom = serializers.CharField(source='etudiant.user.get_full_name', read_only=True)
    etudiant_matricule = serializers.CharField(source='etudiant.user.matricule', read_only=True)
    evaluation_nom = serializers.CharField(source='evaluation.nom', read_only=True)
    note_sur_20 = serializers.SerializerMethodField()
    
    class Meta:
        model = Note
        fields = '__all__'
    
    def get_note_sur_20(self, obj):
        if obj.evaluation.note_sur != 20:
            return round((obj.note_obtenue * 20) / obj.evaluation.note_sur, 2)
        return obj.note_obtenue

class MoyenneECSerializer(serializers.ModelSerializer):
    etudiant_nom = serializers.CharField(source='etudiant.user.get_full_name', read_only=True)
    etudiant_matricule = serializers.CharField(source='etudiant.user.matricule', read_only=True)
    ec_nom = serializers.CharField(source='ec.nom', read_only=True)
    ec_code = serializers.CharField(source='ec.code', read_only=True)
    
    class Meta:
        model = MoyenneEC
        fields = '__all__'

class MoyenneUESerializer(serializers.ModelSerializer):
    etudiant_nom = serializers.CharField(source='etudiant.user.get_full_name', read_only=True)
    etudiant_matricule = serializers.CharField(source='etudiant.user.matricule', read_only=True)
    ue_nom = serializers.CharField(source='ue.nom', read_only=True)
    ue_code = serializers.CharField(source='ue.code', read_only=True)
    mention = serializers.SerializerMethodField()
    
    class Meta:
        model = MoyenneUE
        fields = '__all__'
    
    def get_mention(self, obj):
        if obj.moyenne >= 16:
            return "Très Bien"
        elif obj.moyenne >= 14:
            return "Bien"
        elif obj.moyenne >= 12:
            return "Assez Bien"
        elif obj.moyenne >= 10:
            return "Passable"
        else:
            return "Insuffisant"

class MoyenneSemestreSerializer(serializers.ModelSerializer):
    etudiant_nom = serializers.CharField(source='etudiant.user.get_full_name', read_only=True)
    etudiant_matricule = serializers.CharField(source='etudiant.user.matricule', read_only=True)
    classe_nom = serializers.CharField(source='classe.nom', read_only=True)
    semestre_nom = serializers.CharField(source='semestre.nom', read_only=True)
    taux_validation = serializers.SerializerMethodField()
    mention = serializers.SerializerMethodField()
    
    class Meta:
        model = MoyenneSemestre
        fields = '__all__'
    
    def get_taux_validation(self, obj):
        if obj.credits_requis > 0:
            return round((obj.credits_obtenus / obj.credits_requis) * 100, 2)
        return 0
    
    def get_mention(self, obj):
        if obj.moyenne_generale >= 16:
            return "Très Bien"
        elif obj.moyenne_generale >= 14:
            return "Bien"
        elif obj.moyenne_generale >= 12:
            return "Assez Bien"
        elif obj.moyenne_generale >= 10:
            return "Passable"
        else:
            return "Insuffisant"

class SaisieNotesSerializer(serializers.Serializer):
    """Serializer pour la saisie multiple de notes"""
    evaluation_id = serializers.IntegerField()
    notes = serializers.ListField(
        child=serializers.DictField(
            child=serializers.DecimalField(max_digits=4, decimal_places=2)
        )
    )
    
    def validate_notes(self, value):
        for note_data in value:
            if 'etudiant_id' not in note_data or 'note_obtenue' not in note_data:
                raise serializers.ValidationError(
                    "Chaque note doit contenir etudiant_id et note_obtenue"
                )
        return value