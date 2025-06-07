# ========================================
# FICHIER: acadflow_backend/academics/models.py (Corrections)
# ========================================

from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from core.models import TimestampedModel, Filiere, Option, Niveau

class AnneeAcademique(TimestampedModel):
    """Années académiques"""
    libelle = models.CharField(max_length=20, unique=True)
    date_debut = models.DateField()
    date_fin = models.DateField()
    active = models.BooleanField(default=False)
    
    # Nouvelles fonctionnalités
    delai_saisie_notes = models.PositiveIntegerField(default=2)
    autoriser_modification_notes = models.BooleanField(default=False)
    generation_auto_recaps = models.BooleanField(default=True)
    
    def clean(self):
        from django.core.exceptions import ValidationError
        if self.date_debut >= self.date_fin:
            raise ValidationError('La date de début doit être antérieure à la date de fin.')
    
    def save(self, *args, **kwargs):
        # S'assurer qu'une seule année est active
        if self.active:
            AnneeAcademique.objects.filter(active=True).exclude(pk=self.pk).update(active=False)
        super().save(*args, **kwargs)
    
    def __str__(self):
        return self.libelle
    
    class Meta:
        db_table = 'annees_academiques'
        ordering = ['-date_debut']

class Session(TimestampedModel):
    """Sessions d'évaluation"""
    nom = models.CharField(max_length=50)
    code = models.CharField(max_length=10, unique=True)
    ordre = models.PositiveIntegerField()
    actif = models.BooleanField(default=True)
    
    # Nouvelles fonctionnalités
    date_debut_session = models.DateField(null=True, blank=True)
    date_fin_session = models.DateField(null=True, blank=True)
    generation_recaps_auto = models.BooleanField(default=True)
    
    def clean(self):
        from django.core.exceptions import ValidationError
        if self.date_debut_session and self.date_fin_session:
            if self.date_debut_session >= self.date_fin_session:
                raise ValidationError('La date de début doit être antérieure à la date de fin.')
    
    def __str__(self):
        return self.nom
    
    class Meta:
        db_table = 'sessions'
        ordering = ['ordre']

class Semestre(TimestampedModel):
    """Semestres"""
    nom = models.CharField(max_length=20)
    numero = models.PositiveIntegerField(validators=[MinValueValidator(1), MaxValueValidator(2)])
    
    # Nouvelles fonctionnalités
    date_debut = models.DateField(null=True, blank=True)
    date_fin = models.DateField(null=True, blank=True)
    
    def clean(self):
        from django.core.exceptions import ValidationError
        if self.date_debut and self.date_fin:
            if self.date_debut >= self.date_fin:
                raise ValidationError('La date de début doit être antérieure à la date de fin.')
    
    def __str__(self):
        return self.nom
    
    class Meta:
        db_table = 'semestres'
        unique_together = ['numero']

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
    
    # Nouvelles fonctionnalités
    responsable_classe = models.ForeignKey(
        'users.Enseignant', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='classes_responsables'
    )
    recap_s1_genere = models.BooleanField(default=False)
    recap_s2_genere = models.BooleanField(default=False)
    date_recap_s1 = models.DateTimeField(null=True, blank=True)
    date_recap_s2 = models.DateTimeField(null=True, blank=True)
    
    def clean(self):
        from django.core.exceptions import ValidationError
        if self.effectif_max <= 0:
            raise ValidationError('L\'effectif maximum doit être supérieur à 0.')
        
        # Vérifier que l'option appartient à la filière
        if self.option and self.option.filiere != self.filiere:
            raise ValidationError('L\'option sélectionnée n\'appartient pas à cette filière.')
    
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
    type_ue = models.CharField(max_length=15, choices=TYPES_UE, default='obligatoire')
    niveau = models.ForeignKey(Niveau, on_delete=models.CASCADE)
    semestre = models.ForeignKey(Semestre, on_delete=models.CASCADE)
    actif = models.BooleanField(default=True)
    
    # Nouvelles fonctionnalités
    volume_horaire_cm = models.PositiveIntegerField(default=0)
    volume_horaire_td = models.PositiveIntegerField(default=0)
    volume_horaire_tp = models.PositiveIntegerField(default=0)
    
    def clean(self):
        from django.core.exceptions import ValidationError
        if self.credits <= 0:
            raise ValidationError('Le nombre de crédits doit être supérieur à 0.')
    
    def __str__(self):
        return f"{self.code} - {self.nom}"
    
    @property
    def volume_horaire_total(self):
        return self.volume_horaire_cm + self.volume_horaire_td + self.volume_horaire_tp
    
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
    
    def clean(self):
        from django.core.exceptions import ValidationError
        from django.db.models import Sum
        
        # Vérifier que la somme des poids des EC de l'UE ne dépasse pas 100%
        if self.ue:
            total_poids = EC.objects.filter(ue=self.ue, actif=True).exclude(pk=self.pk).aggregate(
                total=Sum('poids_ec')
            )['total'] or 0
            
            if total_poids + self.poids_ec > 100:
                raise ValidationError(f'Le total des poids des EC ne peut pas dépasser 100%. Actuel: {total_poids}%')
    
    def __str__(self):
        return f"{self.code} - {self.nom}"
    
    class Meta:
        db_table = 'ecs'
        unique_together = ['code', 'ue']

class TypeEvaluation(TimestampedModel):
    """Types d'évaluations"""
    nom = models.CharField(max_length=50, unique=True)
    code = models.CharField(max_length=10, unique=True)
    description = models.TextField(blank=True)
    actif = models.BooleanField(default=True)
    
    # Nouvelles fonctionnalités
    delai_saisie_defaut = models.PositiveIntegerField(null=True, blank=True)
    
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
    
    def clean(self):
        from django.core.exceptions import ValidationError
        from django.db.models import Sum
        
        # Vérifier que le total des pourcentages pour un EC ne dépasse pas 100%
        if self.ec:
            total_pourcentage = ConfigurationEvaluationEC.objects.filter(
                ec=self.ec
            ).exclude(pk=self.pk).aggregate(
                total=Sum('pourcentage')
            )['total'] or 0
            
            if total_pourcentage + self.pourcentage > 100:
                raise ValidationError(
                    f'Le total des pourcentages ne peut pas dépasser 100%. Actuel: {total_pourcentage}%'
                )
    
    class Meta:
        db_table = 'configuration_evaluations_ec'
        unique_together = ['ec', 'type_evaluation']

# Modèles supplémentaires avec gestion d'erreur
class ECClasse(TimestampedModel):
    """Liaison EC-Classe"""
    ec = models.ForeignKey(EC, on_delete=models.CASCADE)
    classe = models.ForeignKey(Classe, on_delete=models.CASCADE)
    obligatoire = models.BooleanField(default=True)
    
    class Meta:
        db_table = 'ec_classes'
        unique_together = ['ec', 'classe']

class RecapitulatifSemestriel(TimestampedModel):
    """Récapitulatifs semestriels"""
    classe = models.ForeignKey(Classe, on_delete=models.CASCADE)
    semestre = models.ForeignKey(Semestre, on_delete=models.CASCADE)
    session = models.ForeignKey(Session, on_delete=models.CASCADE)
    annee_academique = models.ForeignKey(AnneeAcademique, on_delete=models.CASCADE)
    
    date_generation = models.DateTimeField(auto_now_add=True)
    genere_par = models.ForeignKey(
        'users.User', 
        on_delete=models.SET_NULL, 
        null=True,
        blank=True
    )
    statut = models.CharField(
        max_length=20,
        choices=[
            ('en_cours', 'En cours'),
            ('termine', 'Terminé'),
            ('erreur', 'Erreur'),
        ],
        default='en_cours'
    )
    
    nombre_etudiants = models.PositiveIntegerField(default=0)
    moyenne_classe = models.DecimalField(max_digits=4, decimal_places=2, null=True, blank=True)
    taux_reussite = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    
    fichier_pdf = models.FileField(upload_to='recapitulatifs/', null=True, blank=True)
    fichier_excel = models.FileField(upload_to='recapitulatifs/', null=True, blank=True)
    
    def __str__(self):
        return f"Récap {self.classe.nom} - {self.semestre.nom} - {self.session.nom}"
    
    class Meta:
        db_table = 'recapitulatifs_semestriels'
        unique_together = ['classe', 'semestre', 'session', 'annee_academique']

class ParametrageSysteme(TimestampedModel):
    """Paramètres système"""
    cle = models.CharField(max_length=100, unique=True)
    valeur = models.TextField()
    description = models.TextField()
    type_valeur = models.CharField(
        max_length=20,
        choices=[
            ('int', 'Entier'),
            ('float', 'Décimal'),
            ('bool', 'Booléen'),
            ('str', 'Chaîne'),
            ('date', 'Date'),
        ],
        default='str'
    )
    
    def get_valeur(self):
        """Retourne la valeur convertie selon son type"""
        try:
            if self.type_valeur == 'int':
                return int(self.valeur)
            elif self.type_valeur == 'float':
                return float(self.valeur)
            elif self.type_valeur == 'bool':
                return self.valeur.lower() in ['true', '1', 'yes', 'oui']
            elif self.type_valeur == 'date':
                from datetime import datetime
                return datetime.strptime(self.valeur, '%Y-%m-%d').date()
            return self.valeur
        except (ValueError, TypeError):
            return self.valeur  # Retourner la valeur brute en cas d'erreur
    
    class Meta:
        db_table = 'parametrage_systeme'