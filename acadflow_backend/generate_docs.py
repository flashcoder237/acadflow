# docs/generate_docs.py
"""
Script de génération automatique de documentation pour AcadFlow
Génère la documentation des modèles, API, et structure du projet
"""

import os
import sys
import django
import inspect
from datetime import datetime
from pathlib import Path

# Configuration Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'acadflow_backend.settings')
django.setup()

from django.apps import apps
from django.db import models
from django.urls import get_resolver
from rest_framework import serializers, viewsets
from rest_framework.routers import DefaultRouter

class DocumentationGenerator:
    def __init__(self):
        self.docs_dir = Path('docs/auto_generated')
        self.docs_dir.mkdir(parents=True, exist_ok=True)
        
    def generate_all(self):
        """Génère toute la documentation"""
        print("🚀 Génération de la documentation complète d'AcadFlow...")
        
        # 1. Documentation des modèles
        self.generate_models_documentation()
        
        # 2. Documentation de l'API
        self.generate_api_documentation()
        
        # 3. Structure du projet
        self.generate_project_structure()
        
        # 4. Guide d'utilisation
        self.generate_usage_guide()
        
        # 5. Schéma de base de données
        self.generate_database_schema()
        
        # 6. Index principal
        self.generate_main_index()
        
        print("✅ Documentation générée dans le dossier 'docs/auto_generated/'")
    
    def generate_models_documentation(self):
        """Génère la documentation des modèles Django"""
        print("📊 Génération de la documentation des modèles...")
        
        content = [
            "# Documentation des Modèles",
            "=" * 50,
            f"Générée automatiquement le {datetime.now().strftime('%d/%m/%Y à %H:%M')}",
            "",
            "## Vue d'ensemble",
            "Cette documentation présente tous les modèles Django d'AcadFlow.",
            ""
        ]
        
        # Parcourir toutes les apps Django
        for app_config in apps.get_app_configs():
            if app_config.name in ['core', 'academics', 'users', 'evaluations']:
                content.extend(self._document_app_models(app_config))
        
        self._write_file('models.md', '\n'.join(content))
    
    def _document_app_models(self, app_config):
        """Documente les modèles d'une app"""
        content = [
            f"## App: {app_config.verbose_name} ({app_config.name})",
            "-" * 40,
            ""
        ]
        
        for model in app_config.get_models():
            content.extend(self._document_model(model))
            content.append("")
        
        return content
    
    def _document_model(self, model):
        """Documente un modèle spécifique"""
        content = [
            f"### {model.__name__}",
            f"**Table:** `{model._meta.db_table}`",
            ""
        ]
        
        # Description du modèle
        if model.__doc__:
            content.append(f"**Description:** {model.__doc__.strip()}")
            content.append("")
        
        # Champs
        content.append("**Champs:**")
        content.append("")
        content.append("| Nom | Type | Options | Description |")
        content.append("|-----|------|---------|-------------|")
        
        for field in model._meta.get_fields():
            if hasattr(field, 'get_internal_type'):
                field_type = field.get_internal_type()
                options = []
                
                # Options du champ
                if hasattr(field, 'null') and field.null:
                    options.append("null=True")
                if hasattr(field, 'blank') and field.blank:
                    options.append("blank=True")
                if hasattr(field, 'unique') and field.unique:
                    options.append("unique=True")
                if hasattr(field, 'max_length') and field.max_length:
                    options.append(f"max_length={field.max_length}")
                if hasattr(field, 'default') and field.default != models.NOT_PROVIDED:
                    options.append(f"default={field.default}")
                
                # Relations
                if hasattr(field, 'related_model') and field.related_model:
                    options.append(f"→ {field.related_model.__name__}")
                
                options_str = ", ".join(options) if options else "-"
                help_text = getattr(field, 'help_text', '') or '-'
                
                content.append(f"| `{field.name}` | {field_type} | {options_str} | {help_text} |")
        
        # Méthodes importantes
        methods = [method for method in dir(model) if not method.startswith('_') and callable(getattr(model, method))]
        custom_methods = [m for m in methods if m not in ['objects', 'DoesNotExist', 'MultipleObjectsReturned']]
        
        if custom_methods:
            content.append("")
            content.append("**Méthodes personnalisées:**")
            for method in custom_methods[:5]:  # Limiter à 5 méthodes
                content.append(f"- `{method}()`")
        
        return content
    
    def generate_api_documentation(self):
        """Génère la documentation de l'API REST"""
        print("🔌 Génération de la documentation de l'API...")
        
        content = [
            "# Documentation de l'API REST",
            "=" * 50,
            f"Générée automatiquement le {datetime.now().strftime('%d/%m/%Y à %H:%M')}",
            "",
            "## Endpoints disponibles",
            ""
        ]
        
        # Documentation des ViewSets
        content.extend(self._document_viewsets())
        
        # Exemples d'utilisation
        content.extend(self._generate_api_examples())
        
        self._write_file('api.md', '\n'.join(content))
    
    def _document_viewsets(self):
        """Documente les ViewSets"""
        content = []
        
        # Mapper les apps et leurs ViewSets
        app_viewsets = {
            'core': ['DomaineViewSet', 'FiliereViewSet', 'NiveauViewSet'],
            'academics': ['ClasseViewSet', 'UEViewSet', 'ECViewSet'],
            'users': ['UserViewSet', 'EtudiantViewSet', 'EnseignantViewSet'],
            'evaluations': ['EvaluationViewSet', 'NoteViewSet']
        }
        
        for app_name, viewset_names in app_viewsets.items():
            content.append(f"### {app_name.capitalize()}")
            content.append("")
            
            try:
                app_module = __import__(f'{app_name}.views', fromlist=[''])
                
                for viewset_name in viewset_names:
                    if hasattr(app_module, viewset_name):
                        viewset_class = getattr(app_module, viewset_name)
                        content.extend(self._document_viewset(viewset_class, app_name))
                        
            except ImportError:
                content.append(f"*Module {app_name}.views non trouvé*")
            
            content.append("")
        
        return content
    
    def _document_viewset(self, viewset_class, app_name):
        """Documente un ViewSet spécifique"""
        content = [
            f"#### {viewset_class.__name__}",
            ""
        ]
        
        # URL de base
        model_name = viewset_class.__name__.replace('ViewSet', '').lower()
        base_url = f"/api/{app_name}/{model_name}s/"
        
        content.append(f"**URL de base:** `{base_url}`")
        content.append("")
        
        # Actions CRUD standards
        content.append("**Actions disponibles:**")
        content.append("")
        content.append("| Méthode | URL | Description |")
        content.append("|---------|-----|-------------|")
        content.append(f"| GET | `{base_url}` | Liste tous les éléments |")
        content.append(f"| POST | `{base_url}` | Crée un nouvel élément |")
        content.append(f"| GET | `{base_url}{{id}}/` | Récupère un élément |")
        content.append(f"| PUT | `{base_url}{{id}}/` | Met à jour un élément |")
        content.append(f"| DELETE | `{base_url}{{id}}/` | Supprime un élément |")
        
        # Actions personnalisées
        custom_actions = []
        for method_name in dir(viewset_class):
            method = getattr(viewset_class, method_name)
            if hasattr(method, 'mapping') or hasattr(method, 'detail'):
                custom_actions.append(method_name)
        
        if custom_actions:
            content.append("")
            content.append("**Actions personnalisées:**")
            for action in custom_actions:
                content.append(f"- `{base_url}{{id}}/{action}/`")
        
        content.append("")
        return content
    
    def _generate_api_examples(self):
        """Génère des exemples d'utilisation de l'API"""
        return [
            "## Exemples d'utilisation",
            "",
            "### Authentification",
            "```bash",
            "# Login",
            "curl -X POST http://localhost:8000/api/auth/login/ \\",
            '  -H "Content-Type: application/json" \\',
            '  -d \'{"username": "admin", "password": "admin123"}\'',
            "",
            "# Utiliser le token",
            "curl -H \"Authorization: Token YOUR_TOKEN\" \\",
            "  http://localhost:8000/api/academics/classes/",
            "```",
            "",
            "### Récupération de données",
            "```bash",
            "# Liste des classes",
            "GET /api/academics/classes/",
            "",
            "# Détails d'une classe",
            "GET /api/academics/classes/1/",
            "",
            "# Étudiants d'une classe",
            "GET /api/academics/classes/1/etudiants/",
            "",
            "# Programme pédagogique d'une classe",
            "GET /api/academics/classes/1/programme_pedagogique/",
            "```",
            "",
            "### Filtrage",
            "```bash",
            "# Classes par filière",
            "GET /api/academics/classes/?filiere=1",
            "",
            "# UE par niveau",
            "GET /api/academics/ues/?niveau=1",
            "",
            "# Notes d'un étudiant",
            "GET /api/evaluations/notes/?etudiant=1&session=1",
            "```"
        ]
    
    def generate_project_structure(self):
        """Génère la documentation de la structure du projet"""
        print("📁 Génération de la structure du projet...")
        
        content = [
            "# Structure du Projet AcadFlow",
            "=" * 50,
            f"Générée automatiquement le {datetime.now().strftime('%d/%m/%Y à %H:%M')}",
            "",
            "## Architecture générale",
            "",
            "AcadFlow suit l'architecture MVT (Model-View-Template) de Django avec une API REST.",
            "",
            "```",
            "acadflow_backend/",
            "├── acadflow_backend/          # Configuration principale",
            "│   ├── settings.py            # Paramètres Django",
            "│   ├── urls.py                # URLs principales",
            "│   └── wsgi.py                # Interface WSGI",
            "├── core/                      # App principale (domaines, filières)",
            "│   ├── models.py              # Modèles de base",
            "│   ├── views.py               # Vues API",
            "│   ├── serializers.py        # Sérialiseurs",
            "│   └── admin.py               # Interface admin",
            "├── academics/                 # Gestion académique",
            "│   ├── models.py              # UE, EC, Classes",
            "│   ├── views.py               # API académique",
            "│   └── management/commands/   # Commandes personnalisées",
            "├── users/                     # Gestion des utilisateurs",
            "│   ├── models.py              # Utilisateurs, Étudiants, Enseignants",
            "│   └── views.py               # Authentification, profils",
            "└── evaluations/               # Système d'évaluation",
            "    ├── models.py              # Notes, Moyennes",
            "    └── views.py               # API évaluations",
            "```",
            ""
        ]
        
        # Documentation des apps
        content.extend(self._document_apps())
        
        self._write_file('structure.md', '\n'.join(content))
    
    def _document_apps(self):
        """Documente chaque app du projet"""
        content = [
            "## Description des Applications",
            ""
        ]
        
        apps_description = {
            'core': {
                'description': 'Application principale contenant les modèles de base de la structure académique.',
                'models': ['Domaine', 'Cycle', 'TypeFormation', 'Filiere', 'Option', 'Niveau'],
                'role': 'Définit la structure hiérarchique de l\'établissement'
            },
            'academics': {
                'description': 'Gestion de la structure académique (années, classes, UE, EC).',
                'models': ['AnneeAcademique', 'Session', 'Semestre', 'Classe', 'UE', 'EC'],
                'role': 'Organisation des enseignements et de la structure pédagogique'
            },
            'users': {
                'description': 'Gestion des utilisateurs et de leurs profils.',
                'models': ['User', 'Enseignant', 'Etudiant', 'Inscription', 'StatutEtudiant'],
                'role': 'Authentification et gestion des profils utilisateurs'
            },
            'evaluations': {
                'description': 'Système d\'évaluation et de calcul des moyennes.',
                'models': ['Enseignement', 'Evaluation', 'Note', 'MoyenneEC', 'MoyenneUE'],
                'role': 'Gestion des notes, évaluations et calcul des moyennes'
            }
        }
        
        for app_name, info in apps_description.items():
            content.extend([
                f"### {app_name.capitalize()}",
                "",
                f"**Description:** {info['description']}",
                "",
                f"**Rôle:** {info['role']}",
                "",
                "**Modèles principaux:**",
                ""
            ])
            
            for model in info['models']:
                content.append(f"- `{model}`")
            
            content.append("")
        
        return content
    
    def generate_database_schema(self):
        """Génère le schéma de base de données"""
        print("🗄️ Génération du schéma de base de données...")
        
        content = [
            "# Schéma de Base de Données",
            "=" * 50,
            f"Générée automatiquement le {datetime.now().strftime('%d/%m/%Y à %H:%M')}",
            "",
            "## Relations entre les modèles",
            "",
            "```mermaid",
            "erDiagram",
            "    DOMAINE ||--o{ FILIERE : contains",
            "    CYCLE ||--o{ NIVEAU : contains",
            "    CYCLE ||--o{ TYPE_FORMATION : contains",
            "    FILIERE ||--o{ OPTION : has",
            "    FILIERE ||--o{ CLASSE : organizes",
            "    NIVEAU ||--o{ CLASSE : groups",
            "    NIVEAU ||--o{ UE : teaches",
            "    UE ||--o{ EC : contains",
            "    CLASSE ||--o{ INSCRIPTION : enrolls",
            "    USER ||--o{ ETUDIANT : extends",
            "    USER ||--o{ ENSEIGNANT : extends",
            "    ETUDIANT ||--o{ INSCRIPTION : has",
            "    ENSEIGNANT ||--o{ ENSEIGNEMENT : teaches",
            "    EC ||--o{ ENSEIGNEMENT : assigned_to",
            "    ENSEIGNEMENT ||--o{ EVALUATION : creates",
            "    EVALUATION ||--o{ NOTE : generates",
            "    ETUDIANT ||--o{ NOTE : receives",
            "```",
            "",
            "## Tables principales",
            ""
        ]
        
        # Documenter les tables importantes
        important_models = [
            ('core', ['Domaine', 'Filiere', 'Niveau']),
            ('academics', ['Classe', 'UE', 'EC']),
            ('users', ['User', 'Etudiant', 'Inscription']),
            ('evaluations', ['Evaluation', 'Note', 'MoyenneUE'])
        ]
        
        for app_name, model_names in important_models:
            try:
                app_models = apps.get_app_config(app_name).get_models()
                for model in app_models:
                    if model.__name__ in model_names:
                        content.extend(self._document_table(model))
            except:
                pass
        
        self._write_file('database.md', '\n'.join(content))
    
    def _document_table(self, model):
        """Documente une table de base de données"""
        content = [
            f"### {model._meta.db_table}",
            f"**Modèle:** {model.__name__}",
            "",
            "| Colonne | Type | Contraintes |",
            "|---------|------|-------------|"
        ]
        
        for field in model._meta.get_fields():
            if hasattr(field, 'get_internal_type'):
                constraints = []
                if hasattr(field, 'primary_key') and field.primary_key:
                    constraints.append("PRIMARY KEY")
                if hasattr(field, 'unique') and field.unique:
                    constraints.append("UNIQUE")
                if hasattr(field, 'null') and not field.null:
                    constraints.append("NOT NULL")
                if hasattr(field, 'related_model') and field.related_model:
                    constraints.append(f"FK → {field.related_model._meta.db_table}")
                
                content.append(f"| {field.name} | {field.get_internal_type()} | {', '.join(constraints) or '-'} |")
        
        content.append("")
        return content
    
    def generate_usage_guide(self):
        """Génère un guide d'utilisation"""
        print("📖 Génération du guide d'utilisation...")
        
        content = [
            "# Guide d'Utilisation d'AcadFlow",
            "=" * 50,
            f"Générée automatiquement le {datetime.now().strftime('%d/%m/%Y à %H:%M')}",
            "",
            "## Installation et démarrage",
            "",
            "### Prérequis",
            "- Python 3.8+",
            "- PostgreSQL 12+",
            "- Django 5.2+",
            "",
            "### Installation",
            "```bash",
            "# Cloner le projet",
            "git clone <repo_url>",
            "cd acadflow_backend",
            "",
            "# Installer les dépendances",
            "pip install -r requirements.txt",
            "",
            "# Configuration de la base de données",
            "python manage.py migrate",
            "",
            "# Initialiser les données de test",
            "python manage.py reset_medical_data --confirm",
            "",
            "# Démarrer le serveur",
            "python manage.py runserver",
            "```",
            "",
            "## Utilisation de l'interface admin",
            "",
            "1. Accédez à `http://localhost:8000/admin/`",
            "2. Connectez-vous avec : `admin` / `admin123`",
            "3. Naviguez dans les différentes sections",
            "",
            "## Utilisation de l'API",
            "",
            "### Authentification",
            "```python",
            "import requests",
            "",
            "# Login",
            "response = requests.post('http://localhost:8000/api/auth/login/', {",
            "    'username': 'admin',",
            "    'password': 'admin123'",
            "})",
            "token = response.json()['token']",
            "",
            "# Utiliser le token",
            "headers = {'Authorization': f'Token {token}'}",
            "response = requests.get('http://localhost:8000/api/academics/classes/', headers=headers)",
            "```",
            "",
            "### Exemples d'opérations courantes",
            "",
            "#### Récupérer la liste des étudiants d'une classe",
            "```python",
            "classe_id = 1",
            "response = requests.get(",
            "    f'http://localhost:8000/api/academics/classes/{classe_id}/etudiants/',",
            "    headers=headers",
            ")",
            "etudiants = response.json()",
            "```",
            "",
            "#### Saisir des notes",
            "```python",
            "evaluation_id = 1",
            "notes_data = {",
            "    'notes': [",
            "        {'etudiant_id': 1, 'note_obtenue': 15.5},",
            "        {'etudiant_id': 2, 'note_obtenue': 12.0, 'absent': False}",
            "    ]",
            "}",
            "response = requests.post(",
            "    f'http://localhost:8000/api/evaluations/evaluations/{evaluation_id}/saisir_notes/',",
            "    json=notes_data,",
            "    headers=headers",
            ")",
            "```",
            "",
            "## Commandes de gestion",
            "",
            "### Données de test",
            "```bash",
            "# Initialiser les données complètes",
            "python manage.py reset_medical_data --confirm",
            "",
            "# Nettoyer les données",
            "python manage.py cleanup_data --confirm",
            "",
            "# Vérifier l'intégrité",
            "python manage.py verify_data",
            "```",
            "",
            "### Calcul des moyennes",
            "```bash",
            "# Recalculer toutes les moyennes",
            "python manage.py recalculer_moyennes --classe=1 --session=1",
            "```"
        ]
        
        self._write_file('usage.md', '\n'.join(content))
    
    def generate_main_index(self):
        """Génère l'index principal de la documentation"""
        print("📋 Génération de l'index principal...")
        
        content = [
            "# Documentation AcadFlow",
            "=" * 50,
            f"Documentation générée automatiquement le {datetime.now().strftime('%d/%m/%Y à %H:%M')}",
            "",
            "## 🎯 Vue d'ensemble",
            "",
            "AcadFlow est un système de gestion académique développé avec Django.",
            "Il permet la gestion complète d'une institution éducative :",
            "",
            "- 📚 **Gestion académique** : UE, EC, classes, programmes",
            "- 👥 **Gestion des utilisateurs** : étudiants, enseignants, administration",
            "- 📝 **Évaluations** : notes, moyennes, relevés",
            "- 🔌 **API REST** : intégration avec d'autres systèmes",
            "",
            "## 📖 Documentation disponible",
            "",
            "### 🏗️ Architecture et développement",
            "- [📊 **Modèles de données**](models.md) - Structure des données et relations",
            "- [🔌 **API REST**](api.md) - Endpoints et utilisation de l'API",
            "- [📁 **Structure du projet**](structure.md) - Organisation du code",
            "- [🗄️ **Schéma de base de données**](database.md) - Relations et tables",
            "",
            "### 🚀 Utilisation",
            "- [📖 **Guide d'utilisation**](usage.md) - Installation et utilisation",
            "",
            "## 🎓 Contexte : Faculté de Médecine",
            "",
            "Cette instance d'AcadFlow est configurée pour une faculté de médecine avec :",
            "",
            "### 🏥 Structure académique",
            "- **Domaine** : Sciences de la Santé",
            "- **Filières** : Médecine, Pharmacie, Dentaire, Kinésithérapie, etc.",
            "- **Niveaux** : L1, L2, L3, M1, M2",
            "- **UE typiques** : Anatomie, Physiologie, Biochimie, Pathologie",
            "",
            "### 👥 Utilisateurs types",
            "- **Administrateurs** : Gestion complète du système",
            "- **Service Scolarité** : Inscriptions, planning, résultats",
            "- **Enseignants** : Saisie des notes, gestion des évaluations",
            "- **Étudiants** : Consultation des notes et relevés",
            "",
            "### 📊 Données de test incluses",
            "- 50 étudiants répartis en 4 classes",
            "- 5 enseignants spécialisés",
            "- UE et EC pour L1 et L2 médecine",
            "- Évaluations et notes générées",
            "- Moyennes calculées automatiquement",
            "",
            "## 🔑 Accès rapide",
            "",
            "### Comptes de test",
            "| Type | Login | Password | Rôle |",
            "|------|-------|----------|------|",
            "| Admin | `admin` | `admin123` | Administration complète |",
            "| Enseignant | `ens001` | `ens123` | Prof. Jean-Claude MBALLA |",
            "| Étudiant | `med0001` | `etud123` | Étudiant en L1 |",
            "",
            "### URLs importantes",
            "- **Interface Admin** : http://localhost:8000/admin/",
            "- **API Root** : http://localhost:8000/api/",
            "- **Login API** : http://localhost:8000/api/auth/login/",
            "",
            "## 🛠️ Commandes utiles",
            "",
            "```bash",
            "# Démarrer le serveur",
            "python manage.py runserver",
            "",
            "# Réinitialiser les données de test",
            "python manage.py reset_medical_data --confirm",
            "",
            "# Vérifier l'intégrité des données",
            "python manage.py verify_data",
            "",
            "# Générer cette documentation",
            "python docs/generate_docs.py",
            "```",
            "",
            "## 📞 Support",
            "",
            "Pour toute question technique :",
            "1. Consultez d'abord cette documentation",
            "2. Vérifiez les logs : `python manage.py check`",
            "3. Utilisez les commandes de diagnostic intégrées",
            "",
            "---",
            "",
            f"*Documentation générée automatiquement le {datetime.now().strftime('%d/%m/%Y à %H:%M')}*",
            "",
            "*Pour mettre à jour cette documentation, exécutez : `python docs/generate_docs.py`*"
        ]
        
        self._write_file('README.md', '\n'.join(content))
    
    def _write_file(self, filename, content):
        """Écrit le contenu dans un fichier"""
        filepath = self.docs_dir / filename
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"   ✅ {filename} généré")

# Script principal
if __name__ == '__main__':
    generator = DocumentationGenerator()
    generator.generate_all()
    
    print("\n" + "="*60)
    print("📚 DOCUMENTATION GÉNÉRÉE AVEC SUCCÈS!")
    print("="*60)
    print("\n📂 Fichiers créés dans 'docs/auto_generated/':")
    print("   • README.md - Index principal")
    print("   • models.md - Documentation des modèles")
    print("   • api.md - Documentation de l'API")
    print("   • structure.md - Structure du projet")
    print("   • database.md - Schéma de base de données")
    print("   • usage.md - Guide d'utilisation")
    print("\n🌐 Consultez README.md pour commencer!")
    print("="*60)