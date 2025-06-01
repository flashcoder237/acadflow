from rest_framework import serializers
from .models import Domaine, Cycle, TypeFormation, Filiere, Option, Niveau

class DomaineSerializer(serializers.ModelSerializer):
    class Meta:
        model = Domaine
        fields = '__all__'

class CycleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Cycle
        fields = '__all__'

class TypeFormationSerializer(serializers.ModelSerializer):
    cycle_nom = serializers.CharField(source='cycle.nom', read_only=True)
    
    class Meta:
        model = TypeFormation
        fields = '__all__'

class FiliereSerializer(serializers.ModelSerializer):
    domaine_nom = serializers.CharField(source='domaine.nom', read_only=True)
    type_formation_nom = serializers.CharField(source='type_formation.nom', read_only=True)
    
    class Meta:
        model = Filiere
        fields = '__all__'

class OptionSerializer(serializers.ModelSerializer):
    filiere_nom = serializers.CharField(source='filiere.nom', read_only=True)
    
    class Meta:
        model = Option
        fields = '__all__'

class NiveauSerializer(serializers.ModelSerializer):
    cycle_nom = serializers.CharField(source='cycle.nom', read_only=True)
    
    class Meta:
        model = Niveau
        fields = '__all__'