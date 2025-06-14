# Generated by Django 5.2.1 on 2025-06-07 17:21

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='Etablissement',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('nom', models.CharField(max_length=200)),
                ('nom_complet', models.CharField(max_length=300)),
                ('acronyme', models.CharField(max_length=20, unique=True)),
                ('adresse', models.TextField()),
                ('ville', models.CharField(max_length=100)),
                ('region', models.CharField(default='Littoral', max_length=100)),
                ('pays', models.CharField(default='Cameroun', max_length=100)),
                ('code_postal', models.CharField(blank=True, max_length=20)),
                ('telephone', models.CharField(max_length=20)),
                ('email', models.EmailField(max_length=254)),
                ('site_web', models.URLField(blank=True)),
                ('numero_autorisation', models.CharField(max_length=50, unique=True)),
                ('date_creation', models.DateField()),
                ('date_autorisation', models.DateField()),
                ('ministre_tutelle', models.CharField(max_length=200)),
                ('logo', models.ImageField(blank=True, null=True, upload_to='logos/')),
                ('couleur_principale', models.CharField(default='#1976d2', max_length=7)),
                ('couleur_secondaire', models.CharField(default='#f5f5f5', max_length=7)),
                ('systeme_credits', models.CharField(choices=[('LMD', 'Licence-Master-Doctorat'), ('ECTS', 'European Credit Transfer System'), ('CUSTOM', 'Système personnalisé')], default='LMD', max_length=10)),
                ('note_maximale', models.DecimalField(decimal_places=2, default=20.0, max_digits=4)),
                ('note_passage', models.DecimalField(decimal_places=2, default=10.0, max_digits=4)),
                ('actif', models.BooleanField(default=True)),
                ('etablissement_principal', models.BooleanField(default=False, help_text='Un seul établissement peut être principal')),
            ],
            options={
                'verbose_name': 'Établissement',
                'verbose_name_plural': 'Établissements',
                'db_table': 'etablissements',
            },
        ),
        migrations.CreateModel(
            name='TypeEtablissement',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('nom', models.CharField(max_length=100, unique=True)),
                ('code', models.CharField(max_length=10, unique=True)),
                ('description', models.TextField(blank=True)),
                ('actif', models.BooleanField(default=True)),
            ],
            options={
                'verbose_name': "Type d'établissement",
                'verbose_name_plural': "Types d'établissement",
                'db_table': 'types_etablissement',
            },
        ),
        migrations.CreateModel(
            name='Universite',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('nom', models.CharField(max_length=200, unique=True)),
                ('code', models.CharField(max_length=20, unique=True)),
                ('acronyme', models.CharField(blank=True, max_length=20)),
                ('ville', models.CharField(max_length=100)),
                ('pays', models.CharField(default='Cameroun', max_length=100)),
                ('site_web', models.URLField(blank=True)),
                ('actif', models.BooleanField(default=True)),
            ],
            options={
                'verbose_name': 'Université',
                'verbose_name_plural': 'Universités',
                'db_table': 'universites',
            },
        ),
        migrations.CreateModel(
            name='Domaine',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('nom', models.CharField(max_length=100)),
                ('code', models.CharField(max_length=10)),
                ('description', models.TextField(blank=True)),
                ('actif', models.BooleanField(default=True)),
                ('etablissement', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='core.etablissement')),
            ],
            options={
                'db_table': 'domaines',
                'unique_together': {('code', 'etablissement')},
            },
        ),
        migrations.CreateModel(
            name='Cycle',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('nom', models.CharField(max_length=50)),
                ('code', models.CharField(max_length=5)),
                ('duree_annees', models.PositiveIntegerField()),
                ('actif', models.BooleanField(default=True)),
                ('etablissement', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='core.etablissement')),
            ],
            options={
                'db_table': 'cycles',
                'unique_together': {('code', 'etablissement')},
            },
        ),
        migrations.CreateModel(
            name='ConfigurationEtablissement',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('duree_semestre_mois', models.PositiveIntegerField(default=4)),
                ('nombre_semestres_par_annee', models.PositiveIntegerField(default=2)),
                ('delai_saisie_notes_defaut', models.PositiveIntegerField(default=14, help_text='En jours')),
                ('autoriser_modification_notes', models.BooleanField(default=False)),
                ('precision_notes', models.PositiveIntegerField(default=2, help_text='Nombre de décimales')),
                ('arrondi_notes', models.CharField(choices=[('NORMAL', 'Arrondi normal'), ('SUPERIEUR', 'Arrondi supérieur'), ('INFERIEUR', 'Arrondi inférieur')], default='NORMAL', max_length=10)),
                ('credits_minimum_passage', models.PositiveIntegerField(default=30)),
                ('pourcentage_minimum_validation', models.DecimalField(decimal_places=2, default=50.0, max_digits=5)),
                ('langue_principale', models.CharField(default='fr', max_length=10)),
                ('format_date', models.CharField(default='DD/MM/YYYY', max_length=20)),
                ('fuseau_horaire', models.CharField(default='Africa/Douala', max_length=50)),
                ('duree_session_heures', models.PositiveIntegerField(default=8)),
                ('tentatives_connexion_max', models.PositiveIntegerField(default=5)),
                ('etablissement', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, to='core.etablissement')),
            ],
            options={
                'verbose_name': 'Configuration établissement',
                'db_table': 'configuration_etablissement',
            },
        ),
        migrations.CreateModel(
            name='Campus',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('nom', models.CharField(max_length=100)),
                ('adresse', models.TextField()),
                ('ville', models.CharField(max_length=100)),
                ('campus_principal', models.BooleanField(default=False)),
                ('actif', models.BooleanField(default=True)),
                ('etablissement', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='core.etablissement')),
            ],
            options={
                'verbose_name': 'Campus',
                'verbose_name_plural': 'Campus',
                'db_table': 'campus',
            },
        ),
        migrations.AddField(
            model_name='etablissement',
            name='type_etablissement',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='core.typeetablissement'),
        ),
        migrations.CreateModel(
            name='TypeFormation',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('nom', models.CharField(max_length=100)),
                ('code', models.CharField(max_length=10)),
                ('actif', models.BooleanField(default=True)),
                ('cycle', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='core.cycle')),
            ],
            options={
                'db_table': 'types_formation',
                'unique_together': {('code', 'cycle')},
            },
        ),
        migrations.CreateModel(
            name='Filiere',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('nom', models.CharField(max_length=150)),
                ('code', models.CharField(max_length=20)),
                ('actif', models.BooleanField(default=True)),
                ('campus', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, to='core.campus')),
                ('domaine', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='core.domaine')),
                ('type_formation', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='core.typeformation')),
            ],
            options={
                'db_table': 'filieres',
                'unique_together': {('code', 'type_formation')},
            },
        ),
        migrations.AddField(
            model_name='etablissement',
            name='universite_tutelle',
            field=models.ForeignKey(blank=True, help_text='Université de tutelle (si applicable)', null=True, on_delete=django.db.models.deletion.SET_NULL, to='core.universite'),
        ),
        migrations.CreateModel(
            name='Niveau',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('nom', models.CharField(max_length=20)),
                ('numero', models.PositiveIntegerField()),
                ('credits_requis', models.PositiveIntegerField(default=60)),
                ('actif', models.BooleanField(default=True)),
                ('cycle', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='core.cycle')),
            ],
            options={
                'db_table': 'niveaux',
                'ordering': ['cycle', 'numero'],
                'unique_together': {('numero', 'cycle')},
            },
        ),
        migrations.CreateModel(
            name='Option',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('nom', models.CharField(max_length=150)),
                ('code', models.CharField(max_length=20)),
                ('actif', models.BooleanField(default=True)),
                ('filiere', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='core.filiere')),
            ],
            options={
                'db_table': 'options',
                'unique_together': {('code', 'filiere')},
            },
        ),
    ]
