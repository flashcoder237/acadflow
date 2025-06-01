from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from core.models import TimestampedModel
from academics.models import EC, Classe, Session, AnneeAcademique
from users.models import Etudiant, Enseignant

class Enseignement(TimestampedModel):
    """Affectation enseignant-EC-classe"""
    enseignant = models.ForeignKey(Enseignant, on_delete=models.CASCADE)
    ec = models.ForeignKey(EC, on_delete=models.CASCADE)
    classe = models.ForeignKey(Classe, on_delete=models.CASCADE)
    annee_academique = models.ForeignKey(AnneeAcademique, on_delete=models.CASCADE)
    actif = models.BooleanField(default=True)
    
    class Meta:
        db_table = 'enseignements'
        unique_together = ['enseignant', 'ec', 'classe', 'annee_academique']

class Evaluation(TimestampedModel):
    """Évaluations concrètes"""
    nom = models.CharField(max_length=200)
    enseignement = models.ForeignKey(Enseignement, on_delete=models.CASCADE)
    type_evaluation = models.ForeignKey('academics.TypeEvaluation', on_delete=models.CASCADE)
    session = models.ForeignKey(Session, on_delete=models.CASCADE)
    date_evaluation = models.DateField()
    note_sur = models.DecimalField(max_digits=4, decimal_places=2, default=20.00)
    coefficient = models.DecimalField(max_digits=4, decimal_places=2, default=1.0)
    saisie_terminee = models.BooleanField(default=False)
    
    def __str__(self):
        return f"{self.nom} - {self.enseignement.ec.nom}"
    
    class Meta:
        db_table = 'evaluations'

class Note(TimestampedModel):
    """Notes individuelles des étudiants"""
    etudiant = models.ForeignKey(Etudiant, on_delete=models.CASCADE)
    evaluation = models.ForeignKey(Evaluation, on_delete=models.CASCADE)
    note_obtenue = models.DecimalField(
        max_digits=4, 
        decimal_places=2,
        validators=[MinValueValidator(0)]
    )
    absent = models.BooleanField(default=False)
    justifie = models.BooleanField(default=False)
    commentaire = models.TextField(blank=True)
    
    class Meta:
        db_table = 'notes'
        unique_together = ['etudiant', 'evaluation']

class MoyenneEC(TimestampedModel):
    """Moyennes par EC"""
    etudiant = models.ForeignKey(Etudiant, on_delete=models.CASCADE)
    ec = models.ForeignKey(EC, on_delete=models.CASCADE)
    session = models.ForeignKey(Session, on_delete=models.CASCADE)
    annee_academique = models.ForeignKey(AnneeAcademique, on_delete=models.CASCADE)
    moyenne = models.DecimalField(max_digits=4, decimal_places=2)
    validee = models.BooleanField(default=False)
    
    class Meta:
        db_table = 'moyennes_ecs'
        unique_together = ['etudiant', 'ec', 'session', 'annee_academique']

class MoyenneUE(TimestampedModel):
    """Moyennes par UE"""
    etudiant = models.ForeignKey(Etudiant, on_delete=models.CASCADE)
    ue = models.ForeignKey('academics.UE', on_delete=models.CASCADE)
    session = models.ForeignKey(Session, on_delete=models.CASCADE)
    annee_academique = models.ForeignKey(AnneeAcademique, on_delete=models.CASCADE)
    moyenne = models.DecimalField(max_digits=4, decimal_places=2)
    credits_obtenus = models.PositiveIntegerField(default=0)
    validee = models.BooleanField(default=False)
    
    class Meta:
        db_table = 'moyennes_ues'
        unique_together = ['etudiant', 'ue', 'session', 'annee_academique']

class MoyenneSemestre(TimestampedModel):
    """Moyennes semestrielles"""
    etudiant = models.ForeignKey(Etudiant, on_delete=models.CASCADE)
    classe = models.ForeignKey(Classe, on_delete=models.CASCADE)
    semestre = models.ForeignKey('academics.Semestre', on_delete=models.CASCADE)
    session = models.ForeignKey(Session, on_delete=models.CASCADE)
    annee_academique = models.ForeignKey(AnneeAcademique, on_delete=models.CASCADE)
    moyenne_generale = models.DecimalField(max_digits=4, decimal_places=2)
    credits_obtenus = models.PositiveIntegerField(default=0)
    credits_requis = models.PositiveIntegerField(default=30)
    
    class Meta:
        db_table = 'moyennes_semestres'
        unique_together = ['etudiant', 'classe', 'semestre', 'session', 'annee_academique']