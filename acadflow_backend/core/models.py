from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.contrib.auth.models import AbstractUser

class TimestampedModel(models.Model):
    """Modèle de base avec timestamps"""
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        abstract = True

class Domaine(TimestampedModel):
    """Domaines d'études (Sciences et Technologies, Sciences Humaines, etc.)"""
    nom = models.CharField(max_length=100, unique=True)
    code = models.CharField(max_length=10, unique=True)
    description = models.TextField(blank=True)
    actif = models.BooleanField(default=True)
    
    def __str__(self):
        return self.nom
    
    class Meta:
        db_table = 'domaines'

class Cycle(TimestampedModel):
    """Cycles LMD (Licence, Master, Doctorat)"""
    nom = models.CharField(max_length=50, unique=True)
    code = models.CharField(max_length=5, unique=True)  # L, M, D
    duree_annees = models.PositiveIntegerField()
    actif = models.BooleanField(default=True)
    
    def __str__(self):
        return self.nom
    
    class Meta:
        db_table = 'cycles'

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
        unique_together = ['nom', 'cycle']

class Filiere(TimestampedModel):
    """Filières d'études"""
    nom = models.CharField(max_length=150)
    code = models.CharField(max_length=20)
    domaine = models.ForeignKey(Domaine, on_delete=models.CASCADE)
    type_formation = models.ForeignKey(TypeFormation, on_delete=models.CASCADE)
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