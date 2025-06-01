from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from core.models import TimestampedModel, Filiere, Option, Niveau

class AnneeAcademique(TimestampedModel):
    """Années académiques"""
    libelle = models.CharField(max_length=20, unique=True)  # 2024-2025
    date_debut = models.DateField()
    date_fin = models.DateField()
    active = models.BooleanField(default=False)
    
    def __str__(self):
        return self.libelle
    
    class Meta:
        db_table = 'annees_academiques'
        ordering = ['-date_debut']

class Session(TimestampedModel):
    """Sessions d'évaluation (Normale, Rattrapage)"""
    nom = models.CharField(max_length=50)
    code = models.CharField(max_length=10, unique=True)
    ordre = models.PositiveIntegerField()  # 1 pour normale, 2 pour rattrapage
    actif = models.BooleanField(default=True)
    
    def __str__(self):
        return self.nom
    
    class Meta:
        db_table = 'sessions'
        ordering = ['ordre']

class Semestre(TimestampedModel):
    """Semestres"""
    nom = models.CharField(max_length=20)  # Semestre 1, Semestre 2
    numero = models.PositiveIntegerField(validators=[MinValueValidator(1), MaxValueValidator(2)])
    
    def __str__(self):
        return self.nom
    
    class Meta:
        db_table = 'semestres'

class Classe(TimestampedModel):
    """Classes/Promotions"""
    nom = models.CharField(max_length=100)
    code = models.CharField(max_length=20)
    filiere = models.ForeignKey(Filiere, on_delete=models.CASCADE)
    option = models.ForeignKey(Option, on_delete=models.CASCADE, null=True, blank=True)
    niveau = models.ForeignKey(Niveau, on_delete=models.CASCADE)
    annee_academique = models.ForeignKey(AnneeAcademique, on_delete=models.CASCADE)
    effectif_max = models.PositiveIntegerField(default=50)
    active = models.BooleanField(default=True)
    
    def __str__(self):
        return f"{self.nom} - {self.annee_academique}"
    
    class Meta:
        db_table = 'classes'
        unique_together = ['code', 'annee_academique']

class UE(TimestampedModel):
    """Unités d'Enseignement"""
    TYPES_UE = (
        ('obligatoire', 'Obligatoire'),
        ('optionnelle', 'Optionnelle'),
    )
    
    nom = models.CharField(max_length=200)
    code = models.CharField(max_length=20)
    credits = models.PositiveIntegerField(validators=[MinValueValidator(1)])
    coefficient = models.DecimalField(max_digits=4, decimal_places=2, default=1.0)
    type_ue = models.CharField(max_length=15, choices=TYPES_UE, default='obligatoire')
    niveau = models.ForeignKey(Niveau, on_delete=models.CASCADE)
    semestre = models.ForeignKey(Semestre, on_delete=models.CASCADE)
    actif = models.BooleanField(default=True)
    
    def __str__(self):
        return f"{self.code} - {self.nom}"
    
    class Meta:
        db_table = 'ues'
        unique_together = ['code', 'niveau', 'semestre']

class EC(TimestampedModel):
    """Éléments Constitutifs"""
    nom = models.CharField(max_length=200)
    code = models.CharField(max_length=20)
    ue = models.ForeignKey(UE, on_delete=models.CASCADE, related_name='elements_constitutifs')
    poids_ec = models.DecimalField(
        max_digits=5, 
        decimal_places=2,
        validators=[MinValueValidator(0.01), MaxValueValidator(100.00)]
    )
    actif = models.BooleanField(default=True)
    
    def __str__(self):
        return f"{self.code} - {self.nom}"
    
    class Meta:
        db_table = 'ecs'
        unique_together = ['code', 'ue']

class TypeEvaluation(TimestampedModel):
    """Types d'évaluations (CC, Partiel, Examen, etc.)"""
    nom = models.CharField(max_length=50, unique=True)
    code = models.CharField(max_length=10, unique=True)
    description = models.TextField(blank=True)
    actif = models.BooleanField(default=True)
    
    def __str__(self):
        return self.nom
    
    class Meta:
        db_table = 'types_evaluation'

class ConfigurationEvaluationEC(TimestampedModel):
    """Configuration des pourcentages d'évaluation par EC"""
    ec = models.ForeignKey(EC, on_delete=models.CASCADE)
    type_evaluation = models.ForeignKey(TypeEvaluation, on_delete=models.CASCADE)
    pourcentage = models.DecimalField(
        max_digits=5, 
        decimal_places=2,
        validators=[MinValueValidator(0.01), MaxValueValidator(100.00)]
    )
    
    class Meta:
        db_table = 'configuration_evaluations_ec'
        unique_together = ['ec', 'type_evaluation']