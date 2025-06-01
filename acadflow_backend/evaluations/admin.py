from django.contrib import admin
from django.utils.html import format_html
from django.db.models import Count, Avg
from .models import (
    Enseignement, Evaluation, Note, MoyenneEC, 
    MoyenneUE, MoyenneSemestre
)

@admin.register(Enseignement)
class EnseignementAdmin(admin.ModelAdmin):
    list_display = [
        'enseignant_nom', 'ec_info', 'classe', 'annee_academique',
        'nombre_evaluations', 'actif', 'created_at'
    ]
    list_filter = [
        'classe__filiere', 'classe__niveau', 'annee_academique',
        'ec__ue__semestre', 'actif', 'created_at'
    ]
    search_fields = [
        'enseignant__user__first_name', 'enseignant__user__last_name',
        'ec__nom', 'ec__code', 'classe__nom'
    ]
    list_editable = ['actif']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('Affectation', {
            'fields': ('enseignant', 'ec', 'classe', 'annee_academique')
        }),
        ('Configuration', {
            'fields': ('actif',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related(
            'enseignant__user', 'ec__ue', 'classe', 'annee_academique'
        ).annotate(
            nombre_evaluations=Count('evaluation', distinct=True)
        )
    
    def enseignant_nom(self, obj):
        return obj.enseignant.user.get_full_name()
    enseignant_nom.short_description = 'Enseignant'
    enseignant_nom.admin_order_field = 'enseignant__user__first_name'
    
    def ec_info(self, obj):
        return f"{obj.ec.code} - {obj.ec.nom}"
    ec_info.short_description = 'EC'
    ec_info.admin_order_field = 'ec__code'
    
    def nombre_evaluations(self, obj):
        return obj.nombre_evaluations
    nombre_evaluations.short_description = 'Évaluations'
    nombre_evaluations.admin_order_field = 'nombre_evaluations'

@admin.register(Evaluation)
class EvaluationAdmin(admin.ModelAdmin):
    list_display = [
        'nom', 'ec_info', 'type_evaluation', 'session', 'date_evaluation',
        'coefficient', 'nombre_notes', 'saisie_terminee', 'created_at'
    ]
    list_filter = [
        'type_evaluation', 'session', 'saisie_terminee',
        'enseignement__ec__ue__niveau', 'enseignement__ec__ue__semestre',
        'date_evaluation', 'created_at'
    ]
    search_fields = [
        'nom', 'enseignement__ec__nom', 'enseignement__ec__code'
    ]
    list_editable = ['saisie_terminee']
    readonly_fields = ['created_at', 'updated_at']
    date_hierarchy = 'date_evaluation'
    
    fieldsets = (
        ('Évaluation', {
            'fields': ('nom', 'enseignement', 'type_evaluation', 'session')
        }),
        ('Configuration', {
            'fields': ('date_evaluation', 'note_sur', 'coefficient')
        }),
        ('Statut', {
            'fields': ('saisie_terminee',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related(
            'enseignement__ec', 'type_evaluation', 'session'
        ).annotate(
            nombre_notes=Count('note', distinct=True)
        )
    
    def ec_info(self, obj):
        return f"{obj.enseignement.ec.code} - {obj.enseignement.ec.nom}"
    ec_info.short_description = 'EC'
    ec_info.admin_order_field = 'enseignement__ec__code'
    
    def nombre_notes(self, obj):
        total = obj.nombre_notes
        if total == 0:
            color = 'red'
        elif obj.saisie_terminee:
            color = 'green'
        else:
            color = 'orange'
        return format_html(
            '<span style="color: {};">{}</span>',
            color, total
        )
    nombre_notes.short_description = 'Notes saisies'
    nombre_notes.admin_order_field = 'nombre_notes'

@admin.register(Note)
class NoteAdmin(admin.ModelAdmin):
    list_display = [
        'etudiant_info', 'evaluation_info', 'note_obtenue', 'note_sur_20',
        'absent', 'justifie', 'created_at'
    ]
    list_filter = [
        'absent', 'justifie', 'evaluation__type_evaluation',
        'evaluation__enseignement__ec__ue__niveau',
        'evaluation__enseignement__ec__ue__semestre',
        'created_at'
    ]
    search_fields = [
        'etudiant__user__matricule', 'etudiant__user__first_name',
        'etudiant__user__last_name', 'evaluation__nom'
    ]
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('Note', {
            'fields': ('etudiant', 'evaluation', 'note_obtenue')
        }),
        ('Statut', {
            'fields': ('absent', 'justifie', 'commentaire')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related(
            'etudiant__user', 'evaluation__enseignement__ec'
        )
    
    def etudiant_info(self, obj):
        return f"{obj.etudiant.user.matricule} - {obj.etudiant.user.get_full_name()}"
    etudiant_info.short_description = 'Étudiant'
    etudiant_info.admin_order_field = 'etudiant__user__matricule'
    
    def evaluation_info(self, obj):
        return f"{obj.evaluation.nom} ({obj.evaluation.enseignement.ec.code})"
    evaluation_info.short_description = 'Évaluation'
    evaluation_info.admin_order_field = 'evaluation__nom'
    
    def note_sur_20(self, obj):
        if obj.evaluation.note_sur != 20:
            note_20 = (obj.note_obtenue * 20) / obj.evaluation.note_sur
            return f"{note_20:.2f}/20"
        return f"{obj.note_obtenue}/20"
    note_sur_20.short_description = 'Note /20'

@admin.register(MoyenneEC)
class MoyenneECAdmin(admin.ModelAdmin):
    list_display = [
        'etudiant_info', 'ec_info', 'session', 'moyenne',
        'validee', 'annee_academique', 'created_at'
    ]
    list_filter = [
        'validee', 'session', 'annee_academique',
        'ec__ue__niveau', 'ec__ue__semestre', 'created_at'
    ]
    search_fields = [
        'etudiant__user__matricule', 'etudiant__user__first_name',
        'etudiant__user__last_name', 'ec__nom', 'ec__code'
    ]
    readonly_fields = ['created_at', 'updated_at']
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related(
            'etudiant__user', 'ec__ue', 'session', 'annee_academique'
        )
    
    def etudiant_info(self, obj):
        return f"{obj.etudiant.user.matricule} - {obj.etudiant.user.get_full_name()}"
    etudiant_info.short_description = 'Étudiant'
    etudiant_info.admin_order_field = 'etudiant__user__matricule'
    
    def ec_info(self, obj):
        return f"{obj.ec.code} - {obj.ec.nom}"
    ec_info.short_description = 'EC'
    ec_info.admin_order_field = 'ec__code'

@admin.register(MoyenneUE)
class MoyenneUEAdmin(admin.ModelAdmin):
    list_display = [
        'etudiant_info', 'ue_info', 'session', 'moyenne',
        'credits_obtenus', 'validee', 'mention', 'created_at'
    ]
    list_filter = [
        'validee', 'session', 'annee_academique',
        'ue__niveau', 'ue__semestre', 'created_at'
    ]
    search_fields = [
        'etudiant__user__matricule', 'etudiant__user__first_name',
        'etudiant__user__last_name', 'ue__nom', 'ue__code'
    ]
    readonly_fields = ['created_at', 'updated_at']
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related(
            'etudiant__user', 'ue__niveau', 'session', 'annee_academique'
        )
    
    def etudiant_info(self, obj):
        return f"{obj.etudiant.user.matricule} - {obj.etudiant.user.get_full_name()}"
    etudiant_info.short_description = 'Étudiant'
    etudiant_info.admin_order_field = 'etudiant__user__matricule'
    
    def ue_info(self, obj):
        return f"{obj.ue.code} - {obj.ue.nom}"
    ue_info.short_description = 'UE'
    ue_info.admin_order_field = 'ue__code'
    
    def mention(self, obj):
        if obj.moyenne >= 16:
            return format_html('<span style="color: green;">Très Bien</span>')
        elif obj.moyenne >= 14:
            return format_html('<span style="color: blue;">Bien</span>')
        elif obj.moyenne >= 12:
            return format_html('<span style="color: orange;">Assez Bien</span>')
        elif obj.moyenne >= 10:
            return format_html('<span style="color: black;">Passable</span>')
        else:
            return format_html('<span style="color: red;">Insuffisant</span>')
    mention.short_description = 'Mention'

@admin.register(MoyenneSemestre)
class MoyenneSemestreAdmin(admin.ModelAdmin):
    list_display = [
        'etudiant_info', 'classe', 'semestre', 'session',
        'moyenne_generale', 'credits_obtenus', 'credits_requis',
        'taux_validation', 'mention', 'created_at'
    ]
    list_filter = [
        'session', 'annee_academique', 'classe__niveau',
        'semestre', 'created_at'
    ]
    search_fields = [
        'etudiant__user__matricule', 'etudiant__user__first_name',
        'etudiant__user__last_name', 'classe__nom'
    ]
    readonly_fields = ['created_at', 'updated_at']
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related(
            'etudiant__user', 'classe', 'semestre', 'session', 'annee_academique'
        )
    
    def etudiant_info(self, obj):
        return f"{obj.etudiant.user.matricule} - {obj.etudiant.user.get_full_name()}"
    etudiant_info.short_description = 'Étudiant'
    etudiant_info.admin_order_field = 'etudiant__user__matricule'
    
    def taux_validation(self, obj):
        if obj.credits_requis > 0:
            taux = (obj.credits_obtenus / obj.credits_requis) * 100
            color = 'green' if taux >= 100 else 'orange' if taux >= 70 else 'red'
            return format_html(
                '<span style="color: {};">{:.1f}%</span>',
                color, taux
            )
        return "0%"
    taux_validation.short_description = 'Taux validation'
    
    def mention(self, obj):
        if obj.moyenne_generale >= 16:
            return format_html('<span style="color: green;">Très Bien</span>')
        elif obj.moyenne_generale >= 14:
            return format_html('<span style="color: blue;">Bien</span>')
        elif obj.moyenne_generale >= 12:
            return format_html('<span style="color: orange;">Assez Bien</span>')
        elif obj.moyenne_generale >= 10:
            return format_html('<span style="color: black;">Passable</span>')
        else:
            return format_html('<span style="color: red;">Insuffisant</span>')
    mention.short_description = 'Mention'