
# core/serializers.py - Ajouts pour les vues complexes
from rest_framework import serializers
from .models import Domaine, Cycle, TypeFormation, Filiere, Option, Niveau

class DomaineDetailSerializer(serializers.ModelSerializer):
    """Serializer détaillé pour les domaines avec statistiques"""
    nombre_filieres = serializers.SerializerMethodField()
    nombre_etudiants = serializers.SerializerMethodField()
    filieres = serializers.SerializerMethodField()
    
    class Meta:
        model = Domaine
        fields = '__all__'
    
    def get_nombre_filieres(self, obj):
        return obj.filiere_set.filter(actif=True).count()
    
    def get_nombre_etudiants(self, obj):
        from users.models import Inscription
        return Inscription.objects.filter(
            classe__filiere__domaine=obj,
            active=True
        ).count()
    
    def get_filieres(self, obj):
        filieres = obj.filiere_set.filter(actif=True)
        return FiliereSerializer(filieres, many=True).data

class CycleDetailSerializer(serializers.ModelSerializer):
    """Serializer détaillé pour les cycles"""
    niveaux = serializers.SerializerMethodField()
    types_formation = serializers.SerializerMethodField()
    
    class Meta:
        model = Cycle
        fields = '__all__'
    
    def get_niveaux(self, obj):
        niveaux = obj.niveau_set.filter(actif=True).order_by('numero')
        return NiveauSerializer(niveaux, many=True).data
    
    def get_types_formation(self, obj):
        types = obj.typeformation_set.filter(actif=True)
        return TypeFormationSerializer(types, many=True).data

class FiliereDetailSerializer(serializers.ModelSerializer):
    """Serializer détaillé pour les filières"""
    domaine = DomaineSerializer(read_only=True)
    type_formation = TypeFormationSerializer(read_only=True)
    options = serializers.SerializerMethodField()
    classes_actuelles = serializers.SerializerMethodField()
    statistiques = serializers.SerializerMethodField()
    
    class Meta:
        model = Filiere
        fields = '__all__'
    
    def get_options(self, obj):
        options = obj.option_set.filter(actif=True)
        return OptionSerializer(options, many=True).data
    
    def get_classes_actuelles(self, obj):
        from academics.models import AnneeAcademique, Classe
        from academics.serializers import ClasseSerializer
        
        try:
            annee_active = AnneeAcademique.objects.get(active=True)
            classes = Classe.objects.filter(
                filiere=obj,
                annee_academique=annee_active,
                active=True
            )
            return ClasseSerializer(classes, many=True).data
        except AnneeAcademique.DoesNotExist:
            return []
    
    def get_statistiques(self, obj):
        from users.models import Inscription
        from academics.models import AnneeAcademique
        
        try:
            annee_active = AnneeAcademique.objects.get(active=True)
            inscriptions = Inscription.objects.filter(
                classe__filiere=obj,
                annee_academique=annee_active,
                active=True
            )
            
            return {
                'nombre_etudiants': inscriptions.count(),
                'nombre_classes': inscriptions.values('classe').distinct().count(),
                'repartition_par_niveau': {}
            }
        except AnneeAcademique.DoesNotExist:
            return {
                'nombre_etudiants': 0,
                'nombre_classes': 0,
                'repartition_par_niveau': {}
            }


