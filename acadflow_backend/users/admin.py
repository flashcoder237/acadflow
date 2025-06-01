from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.html import format_html
from django.db.models import Count
from .models import (
    User, Enseignant, Etudiant, StatutEtudiant, 
    Inscription, HistoriqueStatut
)

@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = [
        'matricule', 'username', 'first_name', 'last_name', 
        'email', 'type_utilisateur', 'actif', 'date_joined'
    ]
    list_filter = [
        'type_utilisateur', 'actif', 'is_staff', 'is_superuser', 'date_joined'
    ]
    search_fields = ['matricule', 'username', 'first_name', 'last_name', 'email']
    list_editable = ['actif']
    readonly_fields = ['date_joined', 'last_login']
    
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Informations personnalisées', {
            'fields': (
                'type_utilisateur', 'matricule', 'telephone', 'adresse',
                'date_naissance', 'lieu_naissance', 'photo', 'actif'
            )
        }),
    )
    
    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        ('Informations personnalisées', {
            'fields': (
                'type_utilisateur', 'matricule', 'first_name', 'last_name',
                'email', 'telephone', 'actif'
            )
        }),
    )

@admin.register(Enseignant)
class EnseignantAdmin(admin.ModelAdmin):
    list_display = [
        'matricule', 'nom_complet', 'grade', 'specialite', 
        'statut', 'nombre_enseignements', 'created_at'
    ]
    list_filter = ['grade', 'statut', 'created_at']
    search_fields = [
        'user__matricule', 'user__first_name', 'user__last_name',
        'specialite'
    ]
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('Utilisateur', {
            'fields': ('user',)
        }),
        ('Informations professionnelles', {
            'fields': ('grade', 'specialite', 'statut')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user').annotate(
            nombre_enseignements=Count('enseignement', distinct=True)
        )
    
    def matricule(self, obj):
        return obj.user.matricule
    matricule.short_description = 'Matricule'
    matricule.admin_order_field = 'user__matricule'
    
    def nom_complet(self, obj):
        return obj.user.get_full_name()
    nom_complet.short_description = 'Nom complet'
    nom_complet.admin_order_field = 'user__first_name'
    
    def nombre_enseignements(self, obj):
        return obj.nombre_enseignements
    nombre_enseignements.short_description = 'Enseignements'
    nombre_enseignements.admin_order_field = 'nombre_enseignements'

@admin.register(Etudiant)
class EtudiantAdmin(admin.ModelAdmin):
    list_display = [
        'matricule', 'nom_complet', 'numero_carte', 'statut_current',
        'classe_actuelle', 'nombre_inscriptions', 'created_at'
    ]
    list_filter = ['statut_current', 'created_at']
    search_fields = [
        'user__matricule', 'user__first_name', 'user__last_name',
        'numero_carte'
    ]
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('Utilisateur', {
            'fields': ('user',)
        }),
        ('Informations étudiant', {
            'fields': ('numero_carte', 'statut_current')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user').annotate(
            nombre_inscriptions=Count('inscription', distinct=True)
        )
    
    def matricule(self, obj):
        return obj.user.matricule
    matricule.short_description = 'Matricule'
    matricule.admin_order_field = 'user__matricule'
    
    def nom_complet(self, obj):
        return obj.user.get_full_name()
    nom_complet.short_description = 'Nom complet'
    nom_complet.admin_order_field = 'user__first_name'
    
    def classe_actuelle(self, obj):
        inscription = obj.inscription_set.filter(active=True).first()
        return inscription.classe.nom if inscription else "Aucune"
    classe_actuelle.short_description = 'Classe actuelle'
    
    def nombre_inscriptions(self, obj):
        return obj.nombre_inscriptions
    nombre_inscriptions.short_description = 'Inscriptions'
    nombre_inscriptions.admin_order_field = 'nombre_inscriptions'

@admin.register(StatutEtudiant)
class StatutEtudiantAdmin(admin.ModelAdmin):
    list_display = ['nom', 'code', 'actif', 'nombre_utilisations', 'created_at']
    list_filter = ['actif', 'created_at']
    search_fields = ['nom', 'code']
    list_editable = ['actif']
    readonly_fields = ['created_at', 'updated_at']
    
    def get_queryset(self, request):
        return super().get_queryset(request).annotate(
            nombre_utilisations=Count('inscription', distinct=True)
        )
    
    def nombre_utilisations(self, obj):
        return obj.nombre_utilisations
    nombre_utilisations.short_description = 'Utilisations'
    nombre_utilisations.admin_order_field = 'nombre_utilisations'

@admin.register(Inscription)
class InscriptionAdmin(admin.ModelAdmin):
    list_display = [
        'etudiant_matricule', 'etudiant_nom', 'classe', 'annee_academique',
        'statut', 'nombre_redoublements', 'date_inscription', 'active'
    ]
    list_filter = [
        'classe__filiere', 'classe__niveau', 'annee_academique',
        'statut', 'active', 'nombre_redoublements', 'date_inscription'
    ]
    search_fields = [
        'etudiant__user__matricule', 'etudiant__user__first_name',
        'etudiant__user__last_name', 'classe__nom'
    ]
    list_editable = ['active']
    readonly_fields = ['date_inscription', 'created_at', 'updated_at']
    
    fieldsets = (
        ('Inscription', {
            'fields': ('etudiant', 'classe', 'annee_academique', 'date_inscription')
        }),
        ('Statut', {
            'fields': ('statut', 'nombre_redoublements', 'active')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related(
            'etudiant__user', 'classe', 'annee_academique', 'statut'
        )
    
    def etudiant_matricule(self, obj):
        return obj.etudiant.user.matricule
    etudiant_matricule.short_description = 'Matricule'
    etudiant_matricule.admin_order_field = 'etudiant__user__matricule'
    
    def etudiant_nom(self, obj):
        return obj.etudiant.user.get_full_name()
    etudiant_nom.short_description = 'Nom étudiant'
    etudiant_nom.admin_order_field = 'etudiant__user__first_name'

@admin.register(HistoriqueStatut)
class HistoriqueStatutAdmin(admin.ModelAdmin):
    list_display = [
        'etudiant_matricule', 'etudiant_nom', 'statut',
        'annee_academique', 'date_changement'
    ]
    list_filter = [
        'statut', 'annee_academique', 'date_changement'
    ]
    search_fields = [
        'etudiant__user__matricule', 'etudiant__user__first_name',
        'etudiant__user__last_name'
    ]
    readonly_fields = ['date_changement', 'created_at', 'updated_at']
    
    fieldsets = (
        ('Historique', {
            'fields': ('etudiant', 'statut', 'annee_academique', 'date_changement')
        }),
        ('Détails', {
            'fields': ('motif',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related(
            'etudiant__user', 'statut', 'annee_academique'
        )
    
    def etudiant_matricule(self, obj):
        return obj.etudiant.user.matricule
    etudiant_matricule.short_description = 'Matricule'
    etudiant_matricule.admin_order_field = 'etudiant__user__matricule'
    
    def etudiant_nom(self, obj):
        return obj.etudiant.user.get_full_name()
    etudiant_nom.short_description = 'Nom étudiant'
    etudiant_nom.admin_order_field = 'etudiant__user__first_name'