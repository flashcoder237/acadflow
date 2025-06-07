# ========================================
# FICHIER: acadflow_backend/core/admin.py (Mise à jour avec Établissement)
# ========================================

from django.contrib import admin
from django.utils.html import format_html
from .models import (
    TypeEtablissement, Universite, Etablissement, Campus, ConfigurationEtablissement,
    Domaine, Cycle, TypeFormation, Filiere, Option, Niveau
)

@admin.register(TypeEtablissement)
class TypeEtablissementAdmin(admin.ModelAdmin):
    list_display = ['nom', 'code', 'actif', 'created_at']
    list_filter = ['actif', 'created_at']
    search_fields = ['nom', 'code']
    list_editable = ['actif']
    readonly_fields = ['created_at', 'updated_at']

@admin.register(Universite)
class UniversiteAdmin(admin.ModelAdmin):
    list_display = ['nom', 'acronyme', 'ville', 'pays', 'site_web', 'actif', 'created_at']
    list_filter = ['actif', 'pays', 'ville', 'created_at']
    search_fields = ['nom', 'acronyme', 'ville']
    list_editable = ['actif']
    readonly_fields = ['created_at', 'updated_at']

class CampusInline(admin.TabularInline):
    model = Campus
    extra = 1
    fields = ['nom', 'ville', 'campus_principal', 'actif']

class ConfigurationEtablissementInline(admin.StackedInline):
    model = ConfigurationEtablissement
    can_delete = False
    fieldsets = (
        ('Paramètres académiques', {
            'fields': (
                'duree_semestre_mois', 'nombre_semestres_par_annee',
                'delai_saisie_notes_defaut', 'autoriser_modification_notes'
            )
        }),
        ('Paramètres de notation', {
            'fields': ('precision_notes', 'arrondi_notes')
        }),
        ('Paramètres de validation', {
            'fields': ('credits_minimum_passage', 'pourcentage_minimum_validation')
        }),
        ('Paramètres d\'affichage', {
            'fields': ('langue_principale', 'format_date', 'fuseau_horaire')
        }),
        ('Paramètres de sécurité', {
            'fields': ('duree_session_heures', 'tentatives_connexion_max')
        }),
    )

@admin.register(Etablissement)
class EtablissementAdmin(admin.ModelAdmin):
    list_display = [
        'acronyme', 'nom', 'type_etablissement', 'universite_tutelle',
        'ville', 'etablissement_principal', 'actif', 'created_at'
    ]
    list_filter = [
        'type_etablissement', 'universite_tutelle', 'etablissement_principal',
        'actif', 'ville', 'systeme_credits', 'created_at'
    ]
    search_fields = ['nom', 'acronyme', 'nom_complet']
    list_editable = ['actif', 'etablissement_principal']
    readonly_fields = ['created_at', 'updated_at']
    inlines = [CampusInline, ConfigurationEtablissementInline]
    
    fieldsets = (
        ('Informations générales', {
            'fields': (
                'nom', 'nom_complet', 'acronyme', 'type_etablissement',
                'universite_tutelle'
            )
        }),
        ('Contact', {
            'fields': (
                'adresse', 'ville', 'region', 'pays', 'code_postal',
                'telephone', 'email', 'site_web'
            )
        }),
        ('Informations administratives', {
            'fields': (
                'numero_autorisation', 'date_creation', 'date_autorisation',
                'ministre_tutelle'
            )
        }),
        ('Configuration visuelle', {
            'fields': ('logo', 'couleur_principale', 'couleur_secondaire')
        }),
        ('Paramètres académiques', {
            'fields': ('systeme_credits', 'note_maximale', 'note_passage')
        }),
        ('Statut', {
            'fields': ('actif', 'etablissement_principal')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related(
            'type_etablissement', 'universite_tutelle'
        )

@admin.register(Campus)
class CampusAdmin(admin.ModelAdmin):
    list_display = [
        'nom', 'etablissement', 'ville', 'campus_principal', 'actif', 'created_at'
    ]
    list_filter = ['etablissement', 'campus_principal', 'actif', 'ville', 'created_at']
    search_fields = ['nom', 'ville', 'etablissement__nom']
    list_editable = ['actif', 'campus_principal']
    readonly_fields = ['created_at', 'updated_at']
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('etablissement')

@admin.register(Domaine)
class DomaineAdmin(admin.ModelAdmin):
    list_display = ['nom', 'code', 'etablissement', 'actif', 'created_at']
    list_filter = ['etablissement', 'actif', 'created_at']
    search_fields = ['nom', 'code']
    list_editable = ['actif']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('Informations générales', {
            'fields': ('nom', 'code', 'etablissement', 'description', 'actif')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('etablissement')

@admin.register(Cycle)
class CycleAdmin(admin.ModelAdmin):
    list_display = ['nom', 'code', 'etablissement', 'duree_annees', 'actif', 'created_at']
    list_filter = ['etablissement', 'actif', 'duree_annees']
    search_fields = ['nom', 'code']
    list_editable = ['actif']
    readonly_fields = ['created_at', 'updated_at']
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('etablissement')

@admin.register(TypeFormation)
class TypeFormationAdmin(admin.ModelAdmin):
    list_display = ['nom', 'code', 'cycle', 'etablissement_nom', 'actif', 'created_at']
    list_filter = ['cycle__etablissement', 'cycle', 'actif', 'created_at']
    search_fields = ['nom', 'code']
    list_editable = ['actif']
    readonly_fields = ['created_at', 'updated_at']
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('cycle__etablissement')
    
    def etablissement_nom(self, obj):
        return obj.cycle.etablissement.acronyme
    etablissement_nom.short_description = 'Établissement'
    etablissement_nom.admin_order_field = 'cycle__etablissement__acronyme'

@admin.register(Filiere)
class FiliereAdmin(admin.ModelAdmin):
    list_display = [
        'nom', 'code', 'domaine', 'type_formation', 'campus', 
        'etablissement_nom', 'actif', 'created_at'
    ]
    list_filter = [
        'domaine__etablissement', 'domaine', 'type_formation', 'campus',
        'actif', 'created_at'
    ]
    search_fields = ['nom', 'code']
    list_editable = ['actif']
    readonly_fields = ['created_at', 'updated_at']
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related(
            'domaine__etablissement', 'type_formation', 'campus'
        )
    
    def etablissement_nom(self, obj):
        return obj.domaine.etablissement.acronyme
    etablissement_nom.short_description = 'Établissement'
    etablissement_nom.admin_order_field = 'domaine__etablissement__acronyme'

@admin.register(Option)
class OptionAdmin(admin.ModelAdmin):
    list_display = ['nom', 'code', 'filiere', 'etablissement_nom', 'actif', 'created_at']
    list_filter = [
        'filiere__domaine__etablissement', 'filiere__domaine', 'filiere',
        'actif', 'created_at'
    ]
    search_fields = ['nom', 'code', 'filiere__nom']
    list_editable = ['actif']
    readonly_fields = ['created_at', 'updated_at']
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related(
            'filiere__domaine__etablissement'
        )
    
    def etablissement_nom(self, obj):
        return obj.filiere.domaine.etablissement.acronyme
    etablissement_nom.short_description = 'Établissement'
    etablissement_nom.admin_order_field = 'filiere__domaine__etablissement__acronyme'

@admin.register(Niveau)
class NiveauAdmin(admin.ModelAdmin):
    list_display = [
        'nom', 'numero', 'cycle', 'etablissement_nom', 'credits_requis', 
        'actif', 'created_at'
    ]
    list_filter = ['cycle__etablissement', 'cycle', 'actif', 'numero']
    search_fields = ['nom']
    list_editable = ['actif', 'credits_requis']
    readonly_fields = ['created_at', 'updated_at']
    ordering = ['cycle__etablissement', 'cycle', 'numero']
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('cycle__etablissement')
    
    def etablissement_nom(self, obj):
        return obj.cycle.etablissement.acronyme
    etablissement_nom.short_description = 'Établissement'
    etablissement_nom.admin_order_field = 'cycle__etablissement__acronyme'

@admin.register(ConfigurationEtablissement)
class ConfigurationEtablissementAdmin(admin.ModelAdmin):
    list_display = [
        'etablissement', 'duree_semestre_mois', 'delai_saisie_notes_defaut',
        'autoriser_modification_notes', 'created_at'
    ]
    list_filter = [
        'etablissement', 'autoriser_modification_notes', 'langue_principale'
    ]
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('Établissement', {
            'fields': ('etablissement',)
        }),
        ('Paramètres académiques', {
            'fields': (
                'duree_semestre_mois', 'nombre_semestres_par_annee',
                'delai_saisie_notes_defaut', 'autoriser_modification_notes'
            )
        }),
        ('Paramètres de notation', {
            'fields': ('precision_notes', 'arrondi_notes')
        }),
        ('Paramètres de validation', {
            'fields': ('credits_minimum_passage', 'pourcentage_minimum_validation')
        }),
        ('Paramètres d\'affichage', {
            'fields': ('langue_principale', 'format_date', 'fuseau_horaire')
        }),
        ('Paramètres de sécurité', {
            'fields': ('duree_session_heures', 'tentatives_connexion_max')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )