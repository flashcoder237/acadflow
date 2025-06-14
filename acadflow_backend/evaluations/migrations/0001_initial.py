# Generated by Django 5.2.1 on 2025-06-07 17:21

import django.core.validators
import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('academics', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='Evaluation',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('nom', models.CharField(max_length=200)),
                ('date_evaluation', models.DateField()),
                ('note_sur', models.DecimalField(decimal_places=2, default=20.0, max_digits=4)),
                ('saisie_terminee', models.BooleanField(default=False)),
                ('date_limite_saisie', models.DateTimeField(blank=True, null=True)),
                ('saisie_autorisee', models.BooleanField(default=True)),
                ('modification_autorisee', models.BooleanField(default=False)),
                ('nb_modifications', models.PositiveIntegerField(default=0)),
            ],
            options={
                'db_table': 'evaluations',
            },
        ),
        migrations.CreateModel(
            name='InscriptionEC',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('obligatoire', models.BooleanField(default=True)),
                ('active', models.BooleanField(default=True)),
            ],
            options={
                'db_table': 'inscriptions_ec',
            },
        ),
        migrations.CreateModel(
            name='MoyenneEC',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('moyenne', models.DecimalField(decimal_places=2, max_digits=4)),
                ('validee', models.BooleanField(default=False)),
            ],
            options={
                'db_table': 'moyennes_ecs',
            },
        ),
        migrations.CreateModel(
            name='MoyenneSemestre',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('moyenne_generale', models.DecimalField(decimal_places=2, max_digits=4)),
                ('credits_obtenus', models.PositiveIntegerField(default=0)),
                ('credits_requis', models.PositiveIntegerField(default=30)),
            ],
            options={
                'db_table': 'moyennes_semestres',
            },
        ),
        migrations.CreateModel(
            name='MoyenneUE',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('moyenne', models.DecimalField(decimal_places=2, max_digits=4)),
                ('credits_obtenus', models.PositiveIntegerField(default=0)),
                ('validee', models.BooleanField(default=False)),
            ],
            options={
                'db_table': 'moyennes_ues',
            },
        ),
        migrations.CreateModel(
            name='Note',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('note_obtenue', models.DecimalField(decimal_places=2, max_digits=4, validators=[django.core.validators.MinValueValidator(0)])),
                ('absent', models.BooleanField(default=False)),
                ('justifie', models.BooleanField(default=False)),
                ('commentaire', models.TextField(blank=True)),
                ('modifiee', models.BooleanField(default=False)),
                ('date_modification', models.DateTimeField(blank=True, null=True)),
                ('note_precedente', models.DecimalField(blank=True, decimal_places=2, max_digits=4, null=True)),
            ],
            options={
                'db_table': 'notes',
            },
        ),
        migrations.CreateModel(
            name='TacheAutomatisee',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('type_tache', models.CharField(choices=[('recap_semestriel', 'Récapitulatif semestriel'), ('inscription_ec', 'Inscription aux ECs'), ('calcul_moyennes', 'Calcul des moyennes'), ('notification_delai', 'Notification délai saisie')], max_length=30)),
                ('statut', models.CharField(choices=[('planifiee', 'Planifiée'), ('en_cours', 'En cours'), ('terminee', 'Terminée'), ('erreur', 'Erreur')], default='planifiee', max_length=20)),
                ('date_planifiee', models.DateTimeField()),
                ('date_execution', models.DateTimeField(blank=True, null=True)),
                ('date_fin', models.DateTimeField(blank=True, null=True)),
                ('resultats', models.JSONField(blank=True, default=dict)),
                ('erreurs', models.TextField(blank=True)),
            ],
            options={
                'db_table': 'taches_automatisees',
                'ordering': ['-date_planifiee'],
            },
        ),
        migrations.CreateModel(
            name='Enseignement',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('actif', models.BooleanField(default=True)),
                ('annee_academique', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='academics.anneeacademique')),
                ('classe', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='academics.classe')),
                ('ec', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='academics.ec')),
            ],
            options={
                'db_table': 'enseignements',
            },
        ),
    ]
