# Generated by Django 5.2.1 on 2025-06-07 17:21

import django.core.validators
import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('core', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='AnneeAcademique',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('libelle', models.CharField(max_length=20, unique=True)),
                ('date_debut', models.DateField()),
                ('date_fin', models.DateField()),
                ('active', models.BooleanField(default=False)),
                ('delai_saisie_notes', models.PositiveIntegerField(default=2)),
                ('autoriser_modification_notes', models.BooleanField(default=False)),
                ('generation_auto_recaps', models.BooleanField(default=True)),
            ],
            options={
                'db_table': 'annees_academiques',
                'ordering': ['-date_debut'],
            },
        ),
        migrations.CreateModel(
            name='ConfigurationEvaluationEC',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('pourcentage', models.DecimalField(decimal_places=2, max_digits=5, validators=[django.core.validators.MinValueValidator(0.01), django.core.validators.MaxValueValidator(100.0)])),
            ],
            options={
                'db_table': 'configuration_evaluations_ec',
            },
        ),
        migrations.CreateModel(
            name='EC',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('nom', models.CharField(max_length=200)),
                ('code', models.CharField(max_length=20)),
                ('poids_ec', models.DecimalField(decimal_places=2, max_digits=5, validators=[django.core.validators.MinValueValidator(0.01), django.core.validators.MaxValueValidator(100.0)])),
                ('actif', models.BooleanField(default=True)),
            ],
            options={
                'db_table': 'ecs',
            },
        ),
        migrations.CreateModel(
            name='ECClasse',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('obligatoire', models.BooleanField(default=True)),
            ],
            options={
                'db_table': 'ec_classes',
            },
        ),
        migrations.CreateModel(
            name='ParametrageSysteme',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('cle', models.CharField(max_length=100, unique=True)),
                ('valeur', models.TextField()),
                ('description', models.TextField()),
                ('type_valeur', models.CharField(choices=[('int', 'Entier'), ('float', 'Décimal'), ('bool', 'Booléen'), ('str', 'Chaîne'), ('date', 'Date')], default='str', max_length=20)),
            ],
            options={
                'db_table': 'parametrage_systeme',
            },
        ),
        migrations.CreateModel(
            name='RecapitulatifSemestriel',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('date_generation', models.DateTimeField(auto_now_add=True)),
                ('statut', models.CharField(choices=[('en_cours', 'En cours'), ('termine', 'Terminé'), ('erreur', 'Erreur')], default='en_cours', max_length=20)),
                ('nombre_etudiants', models.PositiveIntegerField(default=0)),
                ('moyenne_classe', models.DecimalField(blank=True, decimal_places=2, max_digits=4, null=True)),
                ('taux_reussite', models.DecimalField(blank=True, decimal_places=2, max_digits=5, null=True)),
                ('fichier_pdf', models.FileField(blank=True, null=True, upload_to='recapitulatifs/')),
                ('fichier_excel', models.FileField(blank=True, null=True, upload_to='recapitulatifs/')),
            ],
            options={
                'db_table': 'recapitulatifs_semestriels',
            },
        ),
        migrations.CreateModel(
            name='Semestre',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('nom', models.CharField(max_length=20)),
                ('numero', models.PositiveIntegerField(validators=[django.core.validators.MinValueValidator(1), django.core.validators.MaxValueValidator(2)])),
                ('date_debut', models.DateField(blank=True, null=True)),
                ('date_fin', models.DateField(blank=True, null=True)),
            ],
            options={
                'db_table': 'semestres',
            },
        ),
        migrations.CreateModel(
            name='Session',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('nom', models.CharField(max_length=50)),
                ('code', models.CharField(max_length=10, unique=True)),
                ('ordre', models.PositiveIntegerField()),
                ('actif', models.BooleanField(default=True)),
                ('date_debut_session', models.DateField(blank=True, null=True)),
                ('date_fin_session', models.DateField(blank=True, null=True)),
                ('generation_recaps_auto', models.BooleanField(default=True)),
            ],
            options={
                'db_table': 'sessions',
                'ordering': ['ordre'],
            },
        ),
        migrations.CreateModel(
            name='TypeEvaluation',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('nom', models.CharField(max_length=50, unique=True)),
                ('code', models.CharField(max_length=10, unique=True)),
                ('description', models.TextField(blank=True)),
                ('actif', models.BooleanField(default=True)),
                ('delai_saisie_defaut', models.PositiveIntegerField(blank=True, null=True)),
            ],
            options={
                'db_table': 'types_evaluation',
            },
        ),
        migrations.CreateModel(
            name='UE',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('nom', models.CharField(max_length=200)),
                ('code', models.CharField(max_length=20)),
                ('credits', models.PositiveIntegerField(validators=[django.core.validators.MinValueValidator(1)])),
                ('type_ue', models.CharField(choices=[('obligatoire', 'Obligatoire'), ('optionnelle', 'Optionnelle')], default='obligatoire', max_length=15)),
                ('actif', models.BooleanField(default=True)),
                ('volume_horaire_cm', models.PositiveIntegerField(default=0)),
                ('volume_horaire_td', models.PositiveIntegerField(default=0)),
                ('volume_horaire_tp', models.PositiveIntegerField(default=0)),
            ],
            options={
                'db_table': 'ues',
            },
        ),
        migrations.CreateModel(
            name='Classe',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('nom', models.CharField(max_length=100)),
                ('code', models.CharField(max_length=20)),
                ('effectif_max', models.PositiveIntegerField(default=50)),
                ('active', models.BooleanField(default=True)),
                ('recap_s1_genere', models.BooleanField(default=False)),
                ('recap_s2_genere', models.BooleanField(default=False)),
                ('date_recap_s1', models.DateTimeField(blank=True, null=True)),
                ('date_recap_s2', models.DateTimeField(blank=True, null=True)),
                ('annee_academique', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='academics.anneeacademique')),
                ('filiere', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='core.filiere')),
                ('niveau', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='core.niveau')),
                ('option', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, to='core.option')),
            ],
            options={
                'db_table': 'classes',
            },
        ),
    ]
