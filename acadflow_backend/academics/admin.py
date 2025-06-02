from django.contrib import admin
from django.utils.html import format_html
from django.db.models import Count, Sum
from .models import (
    AnneeAcademique, Session, Semestre, Classe, UE, EC, 
    TypeEvaluation, ConfigurationEvaluationEC
)

@admin.register(AnneeAcademique)
class AnneeAcademiqueAdmin(admin.ModelAdmin):
    list_display = ['libelle', 'date_debut', 'date_fin', 'active', 'nombre_classes', 'created_at']
    list_filter = ['active', 'date_debut']
    search_fields = ['libelle']
    list_editable = ['active']
    readonly_fields = ['created_at', 'updated_at']
    ordering = ['-date_debut']
    
    def get_queryset(self, request):
        return super().get_queryset(request).annotate(
            nombre_classes=Count('classe', distinct=True)
        )
    
    def nombre_classes(self, obj):
        return obj.nombre_classes
    nombre_classes.short_description = 'Nombre de classes'
    nombre_classes.admin_order_field = 'nombre_classes'

@admin.register(Session)
class SessionAdmin(admin.ModelAdmin):
    list_display = ['nom', 'code', 'ordre', 'actif', 'created_at']
    list_filter = ['actif', 'ordre']
    search_fields = ['nom', 'code']
    list_editable = ['actif', 'ordre']
    readonly_fields = ['created_at', 'updated_at']
    ordering = ['ordre']

@admin.register(Semestre)
class SemestreAdmin(admin.ModelAdmin):
    list_display = ['nom', 'numero', 'nombre_ues', 'created_at']
    list_filter = ['numero']
    search_fields = ['nom']
    readonly_fields = ['created_at', 'updated_at']
    ordering = ['numero']
    
    def get_queryset(self, request):
        return super().get_queryset(request).annotate(
            nombre_ues=Count('ue', distinct=True)
        )
    
    def nombre_ues(self, obj):
        return obj.nombre_ues
    nombre_ues.short_description = 'Nombre d\'UEs'
    nombre_ues.admin_order_field = 'nombre_ues'

@admin.register(Classe)
class ClasseAdmin(admin.ModelAdmin):
    list_display = [
        'nom', 'code', 'filiere', 'niveau', 'annee_academique', 
        'effectif_max', 'effectif_actuel', 'active', 'created_at'
    ]
    list_filter = [
        'filiere__domaine', 'filiere', 'niveau', 'annee_academique', 
        'active', 'created_at'
    ]
    search_fields = ['nom', 'code']
    list_editable = ['active', 'effectif_max']
    readonly_fields = ['created_at', 'updated_at', 'effectif_actuel']
    
    fieldsets = (
        ('Informations générales', {
            'fields': ('nom', 'code', 'filiere', 'option', 'niveau', 'annee_academique')
        }),
        ('Configuration', {
            'fields': ('effectif_max', 'active')
        }),
        ('Statistiques', {
            'fields': ('effectif_actuel',),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related(
            'filiere', 'option', 'niveau', 'annee_academique'
        ).annotate(
            effectif_inscrit=Count('inscription', distinct=True)
        )
    
    def effectif_actuel(self, obj):
        return obj.inscription_set.filter(active=True).count()
    effectif_actuel.short_description = 'Effectif actuel'

@admin.register(UE)
class UEAdmin(admin.ModelAdmin):
    list_display = [
        'code', 'nom', 'niveau', 'semestre', 'credits', 
         'type_ue', 'nombre_ec', 'actif'
    ]
    list_filter = [
        'niveau__cycle', 'niveau', 'semestre', 'type_ue', 
        'actif', 'created_at'
    ]
    search_fields = ['code', 'nom']
    list_editable = ['actif', 'credits']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('Informations générales', {
            'fields': ('nom', 'code', 'type_ue')
        }),
        ('Rattachement', {
            'fields': ('niveau', 'semestre')
        }),
        ('Configuration', {
            'fields': ('credits', 'actif')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related(
            'niveau', 'semestre'
        ).annotate(
            nombre_ec=Count('elements_constitutifs', distinct=True)
        )
    
    def nombre_ec(self, obj):
        return obj.nombre_ec
    nombre_ec.short_description = 'Nombre d\'ECs'
    nombre_ec.admin_order_field = 'nombre_ec'

class ConfigurationEvaluationECInline(admin.TabularInline):
    model = ConfigurationEvaluationEC
    extra = 1
    fields = ['type_evaluation', 'pourcentage']

@admin.register(EC)
class ECAdmin(admin.ModelAdmin):
    list_display = [
        'code', 'nom', 'ue', 'poids_ec', 'total_pourcentage_eval', 'actif'
    ]
    list_filter = [
        'ue__niveau__cycle', 'ue__niveau', 'ue__semestre', 
        'ue', 'actif', 'created_at'
    ]
    search_fields = ['code', 'nom', 'ue__nom']
    list_editable = ['actif', 'poids_ec']
    readonly_fields = ['created_at', 'updated_at']
    inlines = [ConfigurationEvaluationECInline]
    
    fieldsets = (
        ('Informations générales', {
            'fields': ('nom', 'code', 'ue')
        }),
        ('Configuration', {
            'fields': ('poids_ec', 'actif')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('ue').annotate(
            total_pourcentage=Sum('configurationevaluationec__pourcentage')
        )
    
    def total_pourcentage_eval(self, obj):
        total = obj.configurationevaluationec_set.aggregate(
            total=Sum('pourcentage')
        )['total'] or 0
        color = 'green' if total == 100 else 'red' if total > 100 else 'orange'
        return format_html(
            '<span style="color: {};">{:.1f}%</span>',
            color, total
        )
    total_pourcentage_eval.short_description = 'Total % évaluations'

@admin.register(TypeEvaluation)
class TypeEvaluationAdmin(admin.ModelAdmin):
    list_display = ['nom', 'code', 'actif', 'nombre_utilisations', 'created_at']
    list_filter = ['actif', 'created_at']
    search_fields = ['nom', 'code']
    list_editable = ['actif']
    readonly_fields = ['created_at', 'updated_at']
    
    def get_queryset(self, request):
        return super().get_queryset(request).annotate(
            nombre_utilisations=Count('configurationevaluationec', distinct=True)
        )
    
    def nombre_utilisations(self, obj):
        return obj.nombre_utilisations
    nombre_utilisations.short_description = 'Utilisations'
    nombre_utilisations.admin_order_field = 'nombre_utilisations'

@admin.register(ConfigurationEvaluationEC)
class ConfigurationEvaluationECAdmin(admin.ModelAdmin):
    list_display = ['ec', 'type_evaluation', 'pourcentage']
    list_filter = [
        'ec__ue__niveau', 'ec__ue__semestre', 
        'type_evaluation', 'ec__ue'
    ]
    search_fields = ['ec__nom', 'ec__code', 'type_evaluation__nom']
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related(
            'ec', 'ec__ue', 'type_evaluation'
        )