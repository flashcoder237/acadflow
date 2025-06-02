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


from datetime import timedelta, timezone
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator

from core.models import TimestampedModel

class Evaluation(TimestampedModel):
    """Évaluations concrètes"""
    nom = models.CharField(max_length=200)
    enseignement = models.ForeignKey('Enseignement', on_delete=models.CASCADE)
    type_evaluation = models.ForeignKey('academics.TypeEvaluation', on_delete=models.CASCADE)
    session = models.ForeignKey('academics.Session', on_delete=models.CASCADE)
    date_evaluation = models.DateField()
    note_sur = models.DecimalField(max_digits=4, decimal_places=2, default=20.00)
    saisie_terminee = models.BooleanField(default=False)
    
    # Nouvelles fonctionnalités pour gestion des délais
    date_limite_saisie = models.DateTimeField(null=True, blank=True)
    saisie_autorisee = models.BooleanField(default=True)
    modification_autorisee = models.BooleanField(default=False)
    nb_modifications = models.PositiveIntegerField(default=0)
    
    def save(self, *args, **kwargs):
        # Calculer automatiquement la date limite de saisie
        if not self.date_limite_saisie and self.date_evaluation:
            delai_defaut = 14  # 2 semaines par défaut
            
            # Vérifier s'il y a un délai spécifique pour ce type d'évaluation
            if self.type_evaluation.delai_saisie_defaut:
                delai = self.type_evaluation.delai_saisie_defaut
            else:
                # Utiliser le délai de l'année académique
                try:
                    annee = self.enseignement.annee_academique
                    delai = annee.delai_saisie_notes * 7  # Convertir semaines en jours
                except:
                    delai = delai_defaut
            
            self.date_limite_saisie = timezone.make_aware(
                timezone.datetime.combine(
                    self.date_evaluation + timedelta(days=delai),
                    timezone.datetime.min.time()
                )
            )
        
        super().save(*args, **kwargs)
    
    @property
    def peut_saisir_notes(self):
        """Vérifie si les notes peuvent encore être saisies"""
        if not self.saisie_autorisee:
            return False
        
        if self.date_limite_saisie and timezone.now() > self.date_limite_saisie:
            # Vérifier si l'admin autorise les modifications tardives
            try:
                annee = self.enseignement.annee_academique
                return annee.autoriser_modification_notes
            except:
                return False
        
        return True
    
    @property
    def peut_modifier_notes(self):
        """Vérifie si les notes peuvent être modifiées"""
        if not self.saisie_terminee:
            return self.peut_saisir_notes
        
        try:
            annee = self.enseignement.annee_academique
            return annee.autoriser_modification_notes and self.modification_autorisee
        except:
            return False
    
    def __str__(self):
        return f"{self.nom} - {self.enseignement.ec.nom}"
    
    class Meta:
        db_table = 'evaluations'

class Note(TimestampedModel):
    """Notes individuelles des étudiants"""
    etudiant = models.ForeignKey('users.Etudiant', on_delete=models.CASCADE)
    evaluation = models.ForeignKey(Evaluation, on_delete=models.CASCADE)
    note_obtenue = models.DecimalField(
        max_digits=4, 
        decimal_places=2,
        validators=[MinValueValidator(0)]
    )
    absent = models.BooleanField(default=False)
    justifie = models.BooleanField(default=False)
    commentaire = models.TextField(blank=True)
    
    # Traçabilité des modifications
    modifiee = models.BooleanField(default=False)
    date_modification = models.DateTimeField(null=True, blank=True)
    modifiee_par = models.ForeignKey(
        'users.User', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='notes_modifiees'
    )
    note_precedente = models.DecimalField(
        max_digits=4, 
        decimal_places=2, 
        null=True, 
        blank=True
    )
    
    def save(self, *args, **kwargs):
        # Traçabilité des modifications
        if self.pk:  # Si la note existe déjà
            old_note = Note.objects.get(pk=self.pk)
            if old_note.note_obtenue != self.note_obtenue:
                self.modifiee = True
                self.date_modification = timezone.now()
                self.note_precedente = old_note.note_obtenue
        
        super().save(*args, **kwargs)
    
    class Meta:
        db_table = 'notes'
        unique_together = ['etudiant', 'evaluation']

class MoyenneUE(TimestampedModel):
    """Moyennes par UE - sans coefficient, juste crédits"""
    etudiant = models.ForeignKey('users.Etudiant', on_delete=models.CASCADE)
    ue = models.ForeignKey('academics.UE', on_delete=models.CASCADE)
    session = models.ForeignKey('academics.Session', on_delete=models.CASCADE)
    annee_academique = models.ForeignKey('academics.AnneeAcademique', on_delete=models.CASCADE)
    moyenne = models.DecimalField(max_digits=4, decimal_places=2)
    credits_obtenus = models.PositiveIntegerField(default=0)
    validee = models.BooleanField(default=False)
    
    class Meta:
        db_table = 'moyennes_ues'
        unique_together = ['etudiant', 'ue', 'session', 'annee_academique']

class InscriptionEC(TimestampedModel):
    """Inscription automatique des étudiants aux ECs de leur classe"""
    etudiant = models.ForeignKey('users.Etudiant', on_delete=models.CASCADE)
    ec = models.ForeignKey('academics.EC', on_delete=models.CASCADE)
    classe = models.ForeignKey('academics.Classe', on_delete=models.CASCADE)
    annee_academique = models.ForeignKey('academics.AnneeAcademique', on_delete=models.CASCADE)
    obligatoire = models.BooleanField(default=True)
    active = models.BooleanField(default=True)
    
    class Meta:
        db_table = 'inscriptions_ec'
        unique_together = ['etudiant', 'ec', 'annee_academique']

class TacheAutomatisee(TimestampedModel):
    """Suivi des tâches automatisées"""
    TYPE_TACHES = [
        ('recap_semestriel', 'Récapitulatif semestriel'),
        ('inscription_ec', 'Inscription aux ECs'),
        ('calcul_moyennes', 'Calcul des moyennes'),
        ('notification_delai', 'Notification délai saisie'),
    ]
    
    type_tache = models.CharField(max_length=30, choices=TYPE_TACHES)
    classe = models.ForeignKey('academics.Classe', on_delete=models.CASCADE, null=True, blank=True)
    semestre = models.ForeignKey('academics.Semestre', on_delete=models.CASCADE, null=True, blank=True)
    session = models.ForeignKey('academics.Session', on_delete=models.CASCADE, null=True, blank=True)
    annee_academique = models.ForeignKey('academics.AnneeAcademique', on_delete=models.CASCADE)
    
    statut = models.CharField(
        max_length=20,
        choices=[
            ('planifiee', 'Planifiée'),
            ('en_cours', 'En cours'),
            ('terminee', 'Terminée'),
            ('erreur', 'Erreur'),
        ],
        default='planifiee'
    )
    
    date_planifiee = models.DateTimeField()
    date_execution = models.DateTimeField(null=True, blank=True)
    date_fin = models.DateTimeField(null=True, blank=True)
    
    resultats = models.JSONField(default=dict, blank=True)
    erreurs = models.TextField(blank=True)
    
    class Meta:
        db_table = 'taches_automatisees'
        ordering = ['-date_planifiee']