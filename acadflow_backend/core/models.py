# ========================================
# FICHIER: acadflow_backend/core/models.py (Mise à jour avec Établissement)
# ========================================

from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.contrib.auth.models import AbstractUser

class TimestampedModel(models.Model):
    """Modèle de base avec timestamps"""
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        abstract = True

class TypeEtablissement(TimestampedModel):
    """Types d'établissements (Université, IPES, École Supérieure, etc.)"""
    nom = models.CharField(max_length=100, unique=True)
    code = models.CharField(max_length=10, unique=True)
    description = models.TextField(blank=True)
    actif = models.BooleanField(default=True)
    
    def __str__(self):
        return self.nom
    
    class Meta:
        db_table = 'types_etablissement'
        verbose_name = 'Type d\'établissement'
        verbose_name_plural = 'Types d\'établissement'

class Universite(TimestampedModel):
    """Universités de tutelle"""
    nom = models.CharField(max_length=200, unique=True)
    code = models.CharField(max_length=20, unique=True)
    acronyme = models.CharField(max_length=20, blank=True)
    ville = models.CharField(max_length=100)
    pays = models.CharField(max_length=100, default='Cameroun')
    site_web = models.URLField(blank=True)
    actif = models.BooleanField(default=True)
    
    def __str__(self):
        return f"{self.acronyme or self.nom}"
    
    class Meta:
        db_table = 'universites'
        verbose_name = 'Université'
        verbose_name_plural = 'Universités'

class Etablissement(TimestampedModel):
    """Établissements d'enseignement supérieur"""
    nom = models.CharField(max_length=200)
    nom_complet = models.CharField(max_length=300)
    acronyme = models.CharField(max_length=20, unique=True)
    type_etablissement = models.ForeignKey(TypeEtablissement, on_delete=models.CASCADE)
    universite_tutelle = models.ForeignKey(
        Universite, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        help_text="Université de tutelle (si applicable)"
    )
    
    # Informations de contact
    adresse = models.TextField()
    ville = models.CharField(max_length=100)
    region = models.CharField(max_length=100, default='Littoral')
    pays = models.CharField(max_length=100, default='Cameroun')
    code_postal = models.CharField(max_length=20, blank=True)
    telephone = models.CharField(max_length=20)
    email = models.EmailField()
    site_web = models.URLField(blank=True)
    
    # Informations administratives
    numero_autorisation = models.CharField(max_length=50, unique=True)
    date_creation = models.DateField()
    date_autorisation = models.DateField()
    ministre_tutelle = models.CharField(max_length=200)
    
    # Configuration système
    logo = models.ImageField(upload_to='logos/', null=True, blank=True)
    couleur_principale = models.CharField(max_length=7, default='#1976d2')  # Couleur hex
    couleur_secondaire = models.CharField(max_length=7, default='#f5f5f5')
    
    # Paramètres académiques
    systeme_credits = models.CharField(
        max_length=10,
        choices=[
            ('LMD', 'Licence-Master-Doctorat'),
            ('ECTS', 'European Credit Transfer System'),
            ('CUSTOM', 'Système personnalisé')
        ],
        default='LMD'
    )
    note_maximale = models.DecimalField(max_digits=4, decimal_places=2, default=20.00)
    note_passage = models.DecimalField(max_digits=4, decimal_places=2, default=10.00)
    
    # Statut
    actif = models.BooleanField(default=True)
    etablissement_principal = models.BooleanField(
        default=False,
        help_text="Un seul établissement peut être principal"
    )
    
    def clean(self):
        from django.core.exceptions import ValidationError
        if self.note_passage >= self.note_maximale:
            raise ValidationError('La note de passage doit être inférieure à la note maximale.')
    
    def save(self, *args, **kwargs):
        # S'assurer qu'un seul établissement est principal
        if self.etablissement_principal:
            Etablissement.objects.filter(etablissement_principal=True).exclude(pk=self.pk).update(etablissement_principal=False)
        super().save(*args, **kwargs)
    
    def __str__(self):
        return self.acronyme or self.nom
    
    class Meta:
        db_table = 'etablissements'
        verbose_name = 'Établissement'
        verbose_name_plural = 'Établissements'

class Campus(TimestampedModel):
    """Campus ou sites de l'établissement"""
    nom = models.CharField(max_length=100)
    etablissement = models.ForeignKey(Etablissement, on_delete=models.CASCADE)
    adresse = models.TextField()
    ville = models.CharField(max_length=100)
    campus_principal = models.BooleanField(default=False)
    actif = models.BooleanField(default=True)
    
    def save(self, *args, **kwargs):
        # S'assurer qu'un seul campus est principal par établissement
        if self.campus_principal:
            Campus.objects.filter(
                etablissement=self.etablissement,
                campus_principal=True
            ).exclude(pk=self.pk).update(campus_principal=False)
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.nom} - {self.etablissement.acronyme}"
    
    class Meta:
        db_table = 'campus'
        verbose_name = 'Campus'
        verbose_name_plural = 'Campus'

# Modèles académiques existants avec ajout des références établissement

class Domaine(TimestampedModel):
    """Domaines d'études (Sciences et Technologies, Sciences Humaines, etc.)"""
    nom = models.CharField(max_length=100)
    code = models.CharField(max_length=10)
    etablissement = models.ForeignKey(Etablissement, on_delete=models.CASCADE)
    description = models.TextField(blank=True)
    actif = models.BooleanField(default=True)
    
    def __str__(self):
        return f"{self.nom} - {self.etablissement.acronyme}"
    
    class Meta:
        db_table = 'domaines'
        unique_together = ['code', 'etablissement']

class Cycle(TimestampedModel):
    """Cycles LMD (Licence, Master, Doctorat)"""
    nom = models.CharField(max_length=50)
    code = models.CharField(max_length=5)  # L, M, D
    etablissement = models.ForeignKey(Etablissement, on_delete=models.CASCADE)
    duree_annees = models.PositiveIntegerField()
    actif = models.BooleanField(default=True)
    
    def __str__(self):
        return f"{self.nom} - {self.etablissement.acronyme}"
    
    class Meta:
        db_table = 'cycles'
        unique_together = ['code', 'etablissement']

class TypeFormation(TimestampedModel):
    """Types de formations (Licence Pro, Master Recherche, etc.)"""
    nom = models.CharField(max_length=100)
    code = models.CharField(max_length=10)
    cycle = models.ForeignKey(Cycle, on_delete=models.CASCADE)
    actif = models.BooleanField(default=True)
    
    def __str__(self):
        return f"{self.nom} ({self.cycle.nom})"
    
    class Meta:
        db_table = 'types_formation'
        unique_together = ['code', 'cycle']

class Filiere(TimestampedModel):
    """Filières d'études"""
    nom = models.CharField(max_length=150)
    code = models.CharField(max_length=20)
    domaine = models.ForeignKey(Domaine, on_delete=models.CASCADE)
    type_formation = models.ForeignKey(TypeFormation, on_delete=models.CASCADE)
    campus = models.ForeignKey(Campus, on_delete=models.CASCADE, null=True, blank=True)
    actif = models.BooleanField(default=True)
    
    def __str__(self):
        return f"{self.nom} - {self.type_formation}"
    
    class Meta:
        db_table = 'filieres'
        unique_together = ['code', 'type_formation']

class Option(TimestampedModel):
    """Options/Spécialisations dans les filières"""
    nom = models.CharField(max_length=150)
    code = models.CharField(max_length=20)
    filiere = models.ForeignKey(Filiere, on_delete=models.CASCADE)
    actif = models.BooleanField(default=True)
    
    def __str__(self):
        return f"{self.nom} ({self.filiere.nom})"
    
    class Meta:
        db_table = 'options'
        unique_together = ['code', 'filiere']

class Niveau(TimestampedModel):
    """Niveaux d'études (L1, L2, L3, M1, M2, etc.)"""
    nom = models.CharField(max_length=20)  # L1, L2, etc.
    numero = models.PositiveIntegerField()  # 1, 2, 3, etc.
    cycle = models.ForeignKey(Cycle, on_delete=models.CASCADE)
    credits_requis = models.PositiveIntegerField(default=60)
    actif = models.BooleanField(default=True)
    
    def __str__(self):
        return f"{self.nom} ({self.cycle.nom})"
    
    class Meta:
        db_table = 'niveaux'
        unique_together = ['numero', 'cycle']
        ordering = ['cycle', 'numero']

class ConfigurationEtablissement(TimestampedModel):
    """Configuration globale de l'établissement"""
    etablissement = models.OneToOneField(Etablissement, on_delete=models.CASCADE)
    
    # Paramètres académiques
    duree_semestre_mois = models.PositiveIntegerField(default=4)
    nombre_semestres_par_annee = models.PositiveIntegerField(default=2)
    delai_saisie_notes_defaut = models.PositiveIntegerField(default=14, help_text="En jours")
    autoriser_modification_notes = models.BooleanField(default=False)
    
    # Paramètres de notation
    precision_notes = models.PositiveIntegerField(default=2, help_text="Nombre de décimales")
    arrondi_notes = models.CharField(
        max_length=10,
        choices=[
            ('NORMAL', 'Arrondi normal'),
            ('SUPERIEUR', 'Arrondi supérieur'),
            ('INFERIEUR', 'Arrondi inférieur')
        ],
        default='NORMAL'
    )
    
    # Paramètres de validation
    credits_minimum_passage = models.PositiveIntegerField(default=30)
    pourcentage_minimum_validation = models.DecimalField(max_digits=5, decimal_places=2, default=50.00)
    
    # Paramètres d'affichage
    langue_principale = models.CharField(max_length=10, default='fr')
    format_date = models.CharField(max_length=20, default='DD/MM/YYYY')
    fuseau_horaire = models.CharField(max_length=50, default='Africa/Douala')
    
    # Paramètres de sécurité
    duree_session_heures = models.PositiveIntegerField(default=8)
    tentatives_connexion_max = models.PositiveIntegerField(default=5)
    
    class Meta:
        db_table = 'configuration_etablissement'
        verbose_name = 'Configuration établissement'