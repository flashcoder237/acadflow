from rest_framework import serializers
from .models import (
    AnneeAcademique, Session, Semestre, Classe, UE, EC, 
    TypeEvaluation, ConfigurationEvaluationEC
)
from core.serializers import FiliereSerializer, OptionSerializer, NiveauSerializer

class AnneeAcademiqueSerializer(serializers.ModelSerializer):
    class Meta:
        model = AnneeAcademique
        fields = '__all__'

class SessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Session
        fields = '__all__'

class SemestreSerializer(serializers.ModelSerializer):
    class Meta:
        model = Semestre
        fields = '__all__'

class ClasseSerializer(serializers.ModelSerializer):
    filiere_nom = serializers.CharField(source='filiere.nom', read_only=True)
    option_nom = serializers.CharField(source='option.nom', read_only=True)
    niveau_nom = serializers.CharField(source='niveau.nom', read_only=True)
    annee_academique_libelle = serializers.CharField(source='annee_academique.libelle', read_only=True)
    effectif_actuel = serializers.SerializerMethodField()
    
    class Meta:
        model = Classe
        fields = '__all__'
    
    def get_effectif_actuel(self, obj):
        return obj.inscription_set.filter(active=True).count()

class UESerializer(serializers.ModelSerializer):
    niveau_nom = serializers.CharField(source='niveau.nom', read_only=True)
    semestre_nom = serializers.CharField(source='semestre.nom', read_only=True)
    nombre_ec = serializers.SerializerMethodField()
    
    class Meta:
        model = UE
        fields = '__all__'
    
    def get_nombre_ec(self, obj):
        return obj.elements_constitutifs.filter(actif=True).count()

class ECSerializer(serializers.ModelSerializer):
    ue_nom = serializers.CharField(source='ue.nom', read_only=True)
    ue_code = serializers.CharField(source='ue.code', read_only=True)
    
    class Meta:
        model = EC
        fields = '__all__'

class TypeEvaluationSerializer(serializers.ModelSerializer):
    class Meta:
        model = TypeEvaluation
        fields = '__all__'

class ConfigurationEvaluationECSerializer(serializers.ModelSerializer):
    ec_nom = serializers.CharField(source='ec.nom', read_only=True)
    type_evaluation_nom = serializers.CharField(source='type_evaluation.nom', read_only=True)
    
    class Meta:
        model = ConfigurationEvaluationEC
        fields = '__all__'

class UEDetailSerializer(serializers.ModelSerializer):
    """Serializer détaillé pour UE avec ses EC"""
    elements_constitutifs = ECSerializer(many=True, read_only=True)
    niveau_nom = serializers.CharField(source='niveau.nom', read_only=True)
    semestre_nom = serializers.CharField(source='semestre.nom', read_only=True)
    
    class Meta:
        model = UE
        fields = '__all__'