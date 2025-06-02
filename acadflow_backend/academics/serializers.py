# academics/serializers.py - Version corrigée avec tous les imports
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
    responsable_nom = serializers.CharField(source='responsable_classe.user.get_full_name', read_only=True)
    
    class Meta:
        model = Classe
        fields = '__all__'
    
    def get_effectif_actuel(self, obj):
        try:
            return obj.inscription_set.filter(active=True).count()
        except:
            return 0

class UESerializer(serializers.ModelSerializer):
    niveau_nom = serializers.CharField(source='niveau.nom', read_only=True)
    semestre_nom = serializers.CharField(source='semestre.nom', read_only=True)
    nombre_ec = serializers.SerializerMethodField()
    volume_horaire_total = serializers.ReadOnlyField()
    
    class Meta:
        model = UE
        fields = '__all__'
    
    def get_nombre_ec(self, obj):
        return obj.elements_constitutifs.filter(actif=True).count()

class ECSerializer(serializers.ModelSerializer):
    ue_nom = serializers.CharField(source='ue.nom', read_only=True)
    ue_code = serializers.CharField(source='ue.code', read_only=True)
    nombre_classes = serializers.SerializerMethodField()
    
    class Meta:
        model = EC
        fields = '__all__'
    
    def get_nombre_classes(self, obj):
        return obj.classes.filter(active=True).count()

class TypeEvaluationSerializer(serializers.ModelSerializer):
    nombre_utilisations = serializers.SerializerMethodField()
    
    class Meta:
        model = TypeEvaluation
        fields = '__all__'
    
    def get_nombre_utilisations(self, obj):
        return obj.configurationevaluationec_set.count()

class ConfigurationEvaluationECSerializer(serializers.ModelSerializer):
    ec_nom = serializers.CharField(source='ec.nom', read_only=True)
    type_evaluation_nom = serializers.CharField(source='type_evaluation.nom', read_only=True)
    
    class Meta:
        model = ConfigurationEvaluationEC
        fields = '__all__'

class UEDetailSerializer(serializers.ModelSerializer):
    """Serializer détaillé pour UE avec ses EC"""
    elements_constitutifs = ECSerializer(many=True, read_only=True)
    niveau = NiveauSerializer(read_only=True)
    semestre = SemestreSerializer(read_only=True)
    configuration_evaluations = serializers.SerializerMethodField()
    
    class Meta:
        model = UE
        fields = '__all__'

    def get_configuration_evaluations(self, obj):
        configurations = {}
        for ec in obj.elements_constitutifs.filter(actif=True):
            configs = ConfigurationEvaluationEC.objects.filter(ec=ec).select_related('type_evaluation')
            
            configurations[ec.code] = [
                {
                    'type_evaluation': config.type_evaluation.nom,
                    'pourcentage': float(config.pourcentage)
                }
                for config in configs
            ]
        
        return configurations

class ClasseDetailSerializer(serializers.ModelSerializer):
    """Serializer détaillé pour les classes"""
    filiere = FiliereSerializer(read_only=True)
    niveau = NiveauSerializer(read_only=True)
    option = OptionSerializer(read_only=True)
    annee_academique = AnneeAcademiqueSerializer(read_only=True)
    etudiants = serializers.SerializerMethodField()
    programme_pedagogique = serializers.SerializerMethodField()
    statistiques = serializers.SerializerMethodField()
    
    class Meta:
        model = Classe
        fields = '__all__'
    
    def get_etudiants(self, obj):
        from users.models import Inscription
        from users.serializers import InscriptionSerializer
        
        inscriptions = Inscription.objects.filter(
            classe=obj, active=True
        ).select_related('etudiant__user', 'statut')
        
        return InscriptionSerializer(inscriptions, many=True).data
    
    def get_programme_pedagogique(self, obj):
        semestres_data = []
        semestres = Semestre.objects.all().order_by('numero')
        
        for semestre in semestres:
            ues = UE.objects.filter(
                niveau=obj.niveau,
                semestre=semestre,
                actif=True
            ).prefetch_related('elements_constitutifs')
            
            if ues.exists():
                semestre_info = {
                    'semestre': SemestreSerializer(semestre).data,
                    'ues': UEDetailSerializer(ues, many=True).data,
                    'total_credits': sum(ue.credits for ue in ues)
                }
                semestres_data.append(semestre_info)
        
        return semestres_data
    
    def get_statistiques(self, obj):
        from users.models import Inscription
        
        inscriptions = Inscription.objects.filter(classe=obj, active=True)
        
        return {
            'effectif_total': inscriptions.count(),
            'effectif_max': obj.effectif_max,
            'taux_remplissage': round(
                (inscriptions.count() / obj.effectif_max) * 100, 2
            ) if obj.effectif_max > 0 else 0,
            'redoublants': inscriptions.filter(nombre_redoublements__gt=0).count(),
        }

class UECompleteSerializer(serializers.ModelSerializer):
    """Serializer complet pour UE avec toutes les informations"""
    niveau = NiveauSerializer(read_only=True)
    semestre = SemestreSerializer(read_only=True)
    elements_constitutifs = serializers.SerializerMethodField()
    configuration_evaluations = serializers.SerializerMethodField()
    enseignements = serializers.SerializerMethodField()
    statistiques = serializers.SerializerMethodField()
    
    class Meta:
        model = UE
        fields = '__all__'
    
    def get_elements_constitutifs(self, obj):
        ecs = obj.elements_constitutifs.filter(actif=True)
        return ECDetailSerializer(ecs, many=True).data
    
    def get_configuration_evaluations(self, obj):
        configurations = {}
        for ec in obj.elements_constitutifs.filter(actif=True):
            configs = ConfigurationEvaluationEC.objects.filter(ec=ec).select_related('type_evaluation')
            
            configurations[ec.code] = [
                {
                    'type_evaluation': config.type_evaluation.nom,
                    'pourcentage': config.pourcentage
                }
                for config in configs
            ]
        
        return configurations
    
    def get_enseignements(self, obj):
        from evaluations.models import Enseignement
        from evaluations.serializers import EnseignementSerializer
        
        enseignements = []
        for ec in obj.elements_constitutifs.filter(actif=True):
            enseignements_ec = Enseignement.objects.filter(
                ec=ec, actif=True
            ).select_related('enseignant__user', 'classe')
            
            for enseignement in enseignements_ec:
                enseignements.append(EnseignementSerializer(enseignement).data)
        
        return enseignements
    
    def get_statistiques(self, obj):
        from evaluations.models import MoyenneUE
        from users.models import Inscription
        
        try:
            annee_active = AnneeAcademique.objects.get(active=True)
            
            # Nombre d'étudiants concernés
            classes = obj.niveau.classe_set.filter(
                annee_academique=annee_active, active=True
            )
            nombre_etudiants = Inscription.objects.filter(
                classe__in=classes, active=True
            ).count()
            
            # Moyennes récentes
            moyennes = MoyenneUE.objects.filter(
                ue=obj,
                annee_academique=annee_active
            )
            
            stats = {
                'nombre_etudiants': nombre_etudiants,
                'nombre_ec': obj.elements_constitutifs.filter(actif=True).count(),
                'moyennes_calculees': moyennes.count(),
                'taux_validation': moyennes.filter(validee=True).count()
            }
            
            if moyennes.exists():
                moyennes_values = [m.moyenne for m in moyennes]
                stats.update({
                    'moyenne_ue': sum(moyennes_values) / len(moyennes_values),
                    'note_max': max(moyennes_values),
                    'note_min': min(moyennes_values)
                })
            
            return stats
            
        except AnneeAcademique.DoesNotExist:
            return {
                'nombre_etudiants': 0,
                'nombre_ec': obj.elements_constitutifs.filter(actif=True).count(),
                'moyennes_calculees': 0,
                'taux_validation': 0
            }

class ECDetailSerializer(serializers.ModelSerializer):
    """Serializer détaillé pour les EC"""
    ue = UESerializer(read_only=True)
    configuration_evaluations = serializers.SerializerMethodField()
    enseignements = serializers.SerializerMethodField()
    moyennes_recentes = serializers.SerializerMethodField()
    
    class Meta:
        model = EC
        fields = '__all__'
    
    def get_configuration_evaluations(self, obj):
        configs = ConfigurationEvaluationEC.objects.filter(ec=obj).select_related('type_evaluation')
        
        return [
            {
                'id': config.id,
                'type_evaluation': {
                    'id': config.type_evaluation.id,
                    'nom': config.type_evaluation.nom,
                    'code': config.type_evaluation.code
                },
                'pourcentage': config.pourcentage
            }
            for config in configs
        ]
    
    def get_enseignements(self, obj):
        from evaluations.models import Enseignement
        from evaluations.serializers import EnseignementSerializer
        
        enseignements = Enseignement.objects.filter(
            ec=obj, actif=True
        ).select_related('enseignant__user', 'classe', 'annee_academique')
        
        return EnseignementSerializer(enseignements, many=True).data
    
    def get_moyennes_recentes(self, obj):
        from evaluations.models import MoyenneEC
        
        try:
            annee_active = AnneeAcademique.objects.get(active=True)
            moyennes = MoyenneEC.objects.filter(
                ec=obj,
                annee_academique=annee_active
            ).select_related('etudiant__user', 'session')[:10]  # 10 dernières
            
            return [
                {
                    'etudiant': {
                        'matricule': m.etudiant.user.matricule,
                        'nom_complet': m.etudiant.user.get_full_name()
                    },
                    'moyenne': m.moyenne,
                    'validee': m.validee,
                    'session': m.session.nom
                }
                for m in moyennes
            ]
            
        except AnneeAcademique.DoesNotExist:
            return []