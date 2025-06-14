# ========================================
# FICHIER: users/models.py - VERSION CORRIGÉE
# ========================================

from django.contrib.auth.models import AbstractUser
from django.db import models
from core.models import TimestampedModel

class User(AbstractUser):
    """Utilisateur de base étendu"""
    TYPES_UTILISATEUR = (
        ('etudiant', 'Étudiant'),
        ('enseignant', 'Enseignant'),
        ('admin', 'Administrateur'),
        ('scolarite', 'Service Scolarité'),
        ('direction', 'Direction'),
    )
    
    type_utilisateur = models.CharField(max_length=15, choices=TYPES_UTILISATEUR)
    matricule = models.CharField(max_length=20, unique=True)
    telephone = models.CharField(max_length=20, blank=True)
    adresse = models.TextField(blank=True)
    date_naissance = models.DateField(null=True, blank=True)
    lieu_naissance = models.CharField(max_length=100, blank=True)
    photo = models.ImageField(upload_to='photos/', null=True, blank=True)
    actif = models.BooleanField(default=True)
    
    # Résoudre les conflits related_name avec auth.User
    groups = models.ManyToManyField(
        'auth.Group',
        verbose_name='groups',
        blank=True,
        help_text='The groups this user belongs to.',
        related_name='acadflow_user_set',
        related_query_name='acadflow_user',
    )
    user_permissions = models.ManyToManyField(
        'auth.Permission',
        verbose_name='user permissions',
        blank=True,
        help_text='Specific permissions for this user.',
        related_name='acadflow_user_set',
        related_query_name='acadflow_user',
    )
    
    def __str__(self):
        return f"{self.matricule} - {self.get_full_name()}"
    
    class Meta:
        db_table = 'users'
        verbose_name = 'Utilisateur'
        verbose_name_plural = 'Utilisateurs'

class Enseignant(TimestampedModel):
    """Profil enseignant"""
    GRADES = (
        ('assistant', 'Assistant'),
        ('maitre_assistant', 'Maître Assistant'),
        ('maitre_conference', 'Maître de Conférences'),
        ('professeur', 'Professeur'),
    )
    
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    grade = models.CharField(max_length=20, choices=GRADES)
    specialite = models.CharField(max_length=200)
    statut = models.CharField(max_length=50)
    
    def __str__(self):
        return f"{self.user.get_full_name()} ({self.grade})"
    
    class Meta:
        db_table = 'enseignants'

class Etudiant(TimestampedModel):
    """Profil étudiant"""
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    numero_carte = models.CharField(max_length=20, unique=True, blank=True)
    statut_current = models.CharField(max_length=50, default='inscrit')
    
    def __str__(self):
        return f"{self.user.matricule} - {self.user.get_full_name()}"
    
    class Meta:
        db_table = 'etudiants'

class StatutEtudiant(TimestampedModel):
    """Catalogue des statuts étudiants"""
    nom = models.CharField(max_length=50, unique=True)
    code = models.CharField(max_length=20, unique=True)
    description = models.TextField(blank=True)
    actif = models.BooleanField(default=True)
    
    def __str__(self):
        return self.nom
    
    class Meta:
        db_table = 'statuts_etudiant'

class Inscription(TimestampedModel):
    """Inscriptions étudiants"""
    etudiant = models.ForeignKey(Etudiant, on_delete=models.CASCADE)
    # Références vers academics via chaînes
    classe = models.ForeignKey('academics.Classe', on_delete=models.CASCADE)
    annee_academique = models.ForeignKey('academics.AnneeAcademique', on_delete=models.CASCADE)
    
    date_inscription = models.DateField(auto_now_add=True)
    statut = models.ForeignKey(StatutEtudiant, on_delete=models.CASCADE)
    nombre_redoublements = models.PositiveIntegerField(default=0)
    active = models.BooleanField(default=True)
    
    def clean(self):
        from django.core.exceptions import ValidationError
        if self.nombre_redoublements < 0:
            raise ValidationError('Le nombre de redoublements ne peut être négatif.')
    
    def __str__(self):
        return f"{self.etudiant.user.matricule} - {self.classe.nom} ({self.annee_academique})"
    
    class Meta:
        db_table = 'inscriptions'
        unique_together = ['etudiant', 'annee_academique', 'active']

class HistoriqueStatut(TimestampedModel):
    """Historique des changements de statut"""
    etudiant = models.ForeignKey(Etudiant, on_delete=models.CASCADE)
    statut = models.ForeignKey(StatutEtudiant, on_delete=models.CASCADE)
    date_changement = models.DateTimeField(auto_now_add=True)
    annee_academique = models.ForeignKey('academics.AnneeAcademique', on_delete=models.CASCADE)
    motif = models.TextField(blank=True)
    
    def __str__(self):
        return f"{self.etudiant.user.matricule} - {self.statut.nom} ({self.date_changement.date()})"
    
    class Meta:
        db_table = 'historique_statuts'
        ordering = ['-date_changement']
