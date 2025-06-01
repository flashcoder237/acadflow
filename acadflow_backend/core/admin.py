from django.contrib import admin
from django.utils.html import format_html
from .models import Domaine, Cycle, TypeFormation, Filiere, Option, Niveau

@admin.register(Domaine)
class DomaineAdmin(admin.ModelAdmin):
    list_display = ['nom', 'code', 'actif', 'created_at']
    list_filter = ['actif', 'created_at']
    search_fields = ['nom', 'code']
    list_editable = ['actif']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('Informations générales', {
            'fields': ('nom', 'code', 'description', 'actif')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

@admin.register(Cycle)
class CycleAdmin(admin.ModelAdmin):
    list_display = ['nom', 'code', 'duree_annees', 'actif', 'created_at']
    list_filter = ['actif', 'duree_annees']
    search_fields = ['nom', 'code']
    list_editable = ['actif']
    readonly_fields = ['created_at', 'updated_at']

@admin.register(TypeFormation)
class TypeFormationAdmin(admin.ModelAdmin):
    list_display = ['nom', 'code', 'cycle', 'actif', 'created_at']
    list_filter = ['cycle', 'actif', 'created_at']
    search_fields = ['nom', 'code']
    list_editable = ['actif']
    readonly_fields = ['created_at', 'updated_at']
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('cycle')

@admin.register(Filiere)
class FiliereAdmin(admin.ModelAdmin):
    list_display = ['nom', 'code', 'domaine', 'type_formation', 'actif', 'created_at']
    list_filter = ['domaine', 'type_formation', 'actif', 'created_at']
    search_fields = ['nom', 'code']
    list_editable = ['actif']
    readonly_fields = ['created_at', 'updated_at']
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('domaine', 'type_formation')

@admin.register(Option)
class OptionAdmin(admin.ModelAdmin):
    list_display = ['nom', 'code', 'filiere', 'actif', 'created_at']
    list_filter = ['filiere__domaine', 'filiere', 'actif', 'created_at']
    search_fields = ['nom', 'code', 'filiere__nom']
    list_editable = ['actif']
    readonly_fields = ['created_at', 'updated_at']
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('filiere')

@admin.register(Niveau)
class NiveauAdmin(admin.ModelAdmin):
    list_display = ['nom', 'numero', 'cycle', 'credits_requis', 'actif', 'created_at']
    list_filter = ['cycle', 'actif', 'numero']
    search_fields = ['nom']
    list_editable = ['actif', 'credits_requis']
    readonly_fields = ['created_at', 'updated_at']
    ordering = ['cycle', 'numero']
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('cycle')