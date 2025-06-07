# ========================================
# FICHIER: acadflow_backend/core/serializers.py (Mise à jour avec Établissement)
# ========================================

from rest_framework import serializers
from django.db.models import Count
from .models import (
    TypeEtablissement, Universite, Etablissement, Campus, ConfigurationEtablissement,
    Domaine, Cycle, TypeFormation, Filiere, Option, Niveau
)

class TypeEtablissementSerializer(serializers.ModelSerializer):
    class Meta:
        model = TypeEtablissement
        fields = '__all__'

class UniversiteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Universite
        fields = '__all__'

class CampusSerializer(serializers.ModelSerializer):
    etablissement_nom = serializers.CharField(source='etablissement.nom', read_only=True)
    
    class Meta:
        model = Campus
        fields = '__all__'

class ConfigurationEtablissementSerializer(serializers.ModelSerializer):
    class Meta:
        model = ConfigurationEtablissement
        fields = '__all__'

class EtablissementSerializer(serializers.ModelSerializer):
    type_etablissement_nom = serializers.CharField(source='type_etablissement.nom', read_only=True)
    universite_tutelle_nom = serializers.CharField(source='universite_tutelle.nom', read_only=True)
    configuration = ConfigurationEtablissementSerializer(read_only=True)
    nombre_campus = serializers.SerializerMethodField()
    
    class Meta:
        model = Etablissement
        fields = '__all__'
    
    def get_nombre_campus(self, obj):
        return obj.campus_set.filter(actif=True).count()

class EtablissementDetailSerializer(serializers.ModelSerializer):
    """Serializer détaillé pour l'établissement avec toutes ses informations"""
    type_etablissement = TypeEtablissementSerializer(read_only=True)
    universite_tutelle = UniversiteSerializer(read_only=True)
    configuration = ConfigurationEtablissementSerializer(read_only=True)
    campus = CampusSerializer(many=True, read_only=True)
    statistiques = serializers.SerializerMethodField()
    
    class Meta:
        model = Etablissement
        fields = '__all__'
    
    def get_statistiques(self, obj):
        try:
            from users.models import Inscription, User
            from academics.models import Classe
            
            # Compter les statistiques liées à cet établissement
            domaines = obj.domaine_set.filter(actif=True)
            cycles = Cycle.objects.filter(etablissement=obj, actif=True)
            
            # Classes actives de cet établissement
            classes_actives = Classe.objects.filter(
                filiere__domaine__etablissement=obj,
                active=True
            )
            
            # Inscriptions actives
            inscriptions_actives = Inscription.objects.filter(
                classe__filiere__domaine__etablissement=obj,
                active=True
            )
            
            # Enseignants de cet établissement (à adapter selon votre logique)
            enseignants = User.objects.filter(
                type_utilisateur='enseignant',
                actif=True
            )
            
            return {
                'nombre_domaines': domaines.count(),
                'nombre_cycles': cycles.count(),
                'nombre_classes_actives': classes_actives.count(),
                'nombre_etudiants': inscriptions_actives.count(),
                'nombre_enseignants': enseignants.count(),
                'nombre_campus': obj.campus_set.filter(actif=True).count()
            }
        except:
            return {
                'nombre_domaines': 0,
                'nombre_cycles': 0,
                'nombre_classes_actives': 0,
                'nombre_etudiants': 0,
                'nombre_enseignants': 0,
                'nombre_campus': 0
            }

class DomaineSerializer(serializers.ModelSerializer):
    etablissement_nom = serializers.CharField(source='etablissement.nom', read_only=True)
    
    class Meta:
        model = Domaine
        fields = '__all__'

class CycleSerializer(serializers.ModelSerializer):
    etablissement_nom = serializers.CharField(source='etablissement.nom', read_only=True)
    
    class Meta:
        model = Cycle
        fields = '__all__'

class TypeFormationSerializer(serializers.ModelSerializer):
    cycle_nom = serializers.CharField(source='cycle.nom', read_only=True)
    etablissement_nom = serializers.CharField(source='cycle.etablissement.nom', read_only=True)
    
    class Meta:
        model = TypeFormation
        fields = '__all__'

class FiliereSerializer(serializers.ModelSerializer):
    domaine_nom = serializers.CharField(source='domaine.nom', read_only=True)
    type_formation_nom = serializers.CharField(source='type_formation.nom', read_only=True)
    campus_nom = serializers.CharField(source='campus.nom', read_only=True)
    etablissement_nom = serializers.CharField(source='domaine.etablissement.nom', read_only=True)
    
    class Meta:
        model = Filiere
        fields = '__all__'

class OptionSerializer(serializers.ModelSerializer):
    filiere_nom = serializers.CharField(source='filiere.nom', read_only=True)
    etablissement_nom = serializers.CharField(source='filiere.domaine.etablissement.nom', read_only=True)
    
    class Meta:
        model = Option
        fields = '__all__'

class NiveauSerializer(serializers.ModelSerializer):
    cycle_nom = serializers.CharField(source='cycle.nom', read_only=True)
    etablissement_nom = serializers.CharField(source='cycle.etablissement.nom', read_only=True)
    
    class Meta:
        model = Niveau
        fields = '__all__'

class DomaineDetailSerializer(serializers.ModelSerializer):
    """Serializer détaillé pour les domaines avec statistiques"""
    etablissement = EtablissementSerializer(read_only=True)
    nombre_filieres = serializers.SerializerMethodField()
    nombre_etudiants = serializers.SerializerMethodField()
    filieres = serializers.SerializerMethodField()
    
    class Meta:
        model = Domaine
        fields = '__all__'
    
    def get_nombre_filieres(self, obj):
        return obj.filiere_set.filter(actif=True).count()
    
    def get_nombre_etudiants(self, obj):
        try:
            from users.models import Inscription
            return Inscription.objects.filter(
                classe__filiere__domaine=obj,
                active=True
            ).count()
        except:
            return 0
    
    def get_filieres(self, obj):
        filieres = obj.filiere_set.filter(actif=True)
        return FiliereSerializer(filieres, many=True).data

class CycleDetailSerializer(serializers.ModelSerializer):
    """Serializer détaillé pour les cycles"""
    etablissement = EtablissementSerializer(read_only=True)
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
    campus = CampusSerializer(read_only=True)
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
        try:
            from academics.models import AnneeAcademique, Classe
            from academics.serializers import ClasseSerializer
            
            annee_active = AnneeAcademique.objects.get(active=True)
            classes = Classe.objects.filter(
                filiere=obj,
                annee_academique=annee_active,
                active=True
            )
            return ClasseSerializer(classes, many=True).data
        except:
            return []
    
    def get_statistiques(self, obj):
        try:
            from users.models import Inscription
            from academics.models import AnneeAcademique
            
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
        except:
            return {
                'nombre_etudiants': 0,
                'nombre_classes': 0,
                'repartition_par_niveau': {}
            }

# Serializer pour les informations publiques de l'établissement
class EtablissementPublicSerializer(serializers.ModelSerializer):
    """Serializer pour les informations publiques (page de connexion, etc.)"""
    type_etablissement_nom = serializers.CharField(source='type_etablissement.nom', read_only=True)
    universite_tutelle_nom = serializers.CharField(source='universite_tutelle.nom', read_only=True)
    campus_principal = serializers.SerializerMethodField()
    
    class Meta:
        model = Etablissement
        fields = [
            'nom', 'nom_complet', 'acronyme', 'type_etablissement_nom',
            'universite_tutelle_nom', 'ville', 'email', 'site_web',
            'logo', 'couleur_principale', 'couleur_secondaire',
            'campus_principal'
        ]
    
    def get_campus_principal(self, obj):
        campus = obj.campus_set.filter(campus_principal=True, actif=True).first()
        return CampusSerializer(campus).data if campus else None