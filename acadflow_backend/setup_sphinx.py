# docs/setup_sphinx.py
"""
Configuration automatique de Sphinx pour AcadFlow
Génère une documentation HTML complète avec navigation
"""

import os
import subprocess
import sys
from pathlib import Path

def setup_sphinx_docs():
    """Configure Sphinx pour la documentation"""
    print("📚 Configuration de Sphinx pour AcadFlow...")
    
    # Créer le répertoire docs
    docs_dir = Path('docs')
    docs_dir.mkdir(exist_ok=True)
    
    # Installer Sphinx si nécessaire
    try:
        import sphinx
        print("✅ Sphinx déjà installé")
    except ImportError:
        print("📦 Installation de Sphinx...")
        subprocess.run([sys.executable, '-m', 'pip', 'install', 'sphinx', 'sphinx-rtd-theme', 'sphinx-autodoc-typehints'])
    
    # Créer la configuration Sphinx
    create_sphinx_config(docs_dir)
    
    # Créer les fichiers de documentation
    create_sphinx_files(docs_dir)
    
    # Créer le Makefile
    create_makefile(docs_dir)
    
    print("✅ Configuration Sphinx terminée!")
    print(f"📂 Documentation dans : {docs_dir.absolute()}")
    print("🚀 Pour construire : cd docs && make html")

def create_sphinx_config(docs_dir):
    """Crée le fichier conf.py pour Sphinx"""
    conf_content = '''# Configuration file for the Sphinx documentation builder.
import os
import sys
import django

# Ajouter le projet au path
sys.path.insert(0, os.path.abspath('..'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'acadflow_backend.settings')
django.setup()

# -- Project information -----------------------------------------------------
project = 'AcadFlow'
copyright = '2024, Faculté de Médecine'
author = 'Équipe AcadFlow'
release = '1.0'

# -- General configuration ---------------------------------------------------
extensions = [
    'sphinx.ext.autodoc',
    'sphinx.ext.viewcode',
    'sphinx.ext.napoleon',
    'sphinx.ext.intersphinx',
    'sphinx.ext.todo',
    'sphinx.ext.coverage',
    'sphinx.ext.ifconfig',
]

templates_path = ['_templates']
exclude_patterns = ['_build', 'Thumbs.db', '.DS_Store']

# -- Options for HTML output -------------------------------------------------
html_theme = 'sphinx_rtd_theme'
html_static_path = ['_static']

# -- Extension configuration -------------------------------------------------
# Napoleon settings
napoleon_google_docstring = True
napoleon_numpy_docstring = True
napoleon_include_init_with_doc = False
napoleon_include_private_with_doc = False

# Autodoc settings
autodoc_default_options = {
    'members': True,
    'member-order': 'bysource',
    'special-members': '__init__',
    'undoc-members': True,
    'exclude-members': '__weakref__'
}

# Todo settings
todo_include_todos = True

# Intersphinx mapping
intersphinx_mapping = {
    'python': ('https://docs.python.org/3/', None),
    'django': ('https://docs.djangoproject.com/en/stable/', 'https://docs.djangoproject.com/en/stable/_objects/'),
}
'''
    
    with open(docs_dir / 'conf.py', 'w', encoding='utf-8') as f:
        f.write(conf_content)
    print("   ✅ conf.py créé")

def create_sphinx_files(docs_dir):
    """Crée les fichiers RST pour la documentation"""
    
    # Index principal
    index_content = '''AcadFlow Documentation
======================

.. toctree::
   :maxdepth: 2
   :caption: Contents:

   installation
   quickstart
   api/index
   models/index
   development
   changelog

Indices and tables
==================

* :ref:`genindex`
* :ref:`modindex`
* :ref:`search`
'''
    
    # Installation
    installation_content = '''Installation
============

Prérequis
---------

* Python 3.8+
* PostgreSQL 12+
* Git

Installation rapide
-------------------

.. code-block:: bash

   # Cloner le projet
   git clone <repo-url>
   cd acadflow_backend

   # Créer un environnement virtuel
   python -m venv acadflow_env
   source acadflow_env/bin/activate  # Linux/Mac
   # ou
   acadflow_env\\Scripts\\activate  # Windows

   # Installer les dépendances
   pip install -r requirements.txt

   # Configuration de la base de données
   createdb acadflow_db
   python manage.py migrate

   # Initialiser les données de test
   python manage.py reset_medical_data --confirm

   # Démarrer le serveur
   python manage.py runserver

Configuration
-------------

Base de données
~~~~~~~~~~~~~~~

Créez un fichier ``.env`` avec vos paramètres :

.. code-block:: bash

   SECRET_KEY=your-secret-key
   DEBUG=True
   DB_NAME=acadflow_db
   DB_USER=postgres
   DB_PASSWORD=your-password
   DB_HOST=localhost
   DB_PORT=5432

Vérification
~~~~~~~~~~~~

.. code-block:: bash

   python manage.py check
   python manage.py verify_data
'''
    
    # Guide de démarrage rapide
    quickstart_content = '''Guide de démarrage rapide
========================

Interface d'administration
---------------------------

1. Accédez à http://localhost:8000/admin/
2. Connectez-vous avec :
   
   * **Username:** admin
   * **Password:** admin123

3. Explorez les différentes sections :
   
   * **Core** : Domaines, Filières, Niveaux
   * **Academics** : Classes, UE, EC
   * **Users** : Utilisateurs, Étudiants, Enseignants
   * **Evaluations** : Notes, Moyennes

API REST
--------

Authentification
~~~~~~~~~~~~~~~~

.. code-block:: python

   import requests

   # Login
   response = requests.post('http://localhost:8000/api/auth/login/', {
       'username': 'admin',
       'password': 'admin123'
   })
   token = response.json()['token']

   # Headers pour les requêtes authentifiées
   headers = {'Authorization': f'Token {token}'}

Exemples d'utilisation
~~~~~~~~~~~~~~~~~~~~~~

.. code-block:: python

   # Liste des classes
   classes = requests.get('http://localhost:8000/api/academics/classes/', headers=headers)

   # Étudiants d'une classe
   etudiants = requests.get('http://localhost:8000/api/academics/classes/1/etudiants/', headers=headers)

   # Notes d'un étudiant
   notes = requests.get('http://localhost:8000/api/evaluations/notes/?etudiant=1', headers=headers)

Comptes de test
---------------

.. list-table:: Comptes disponibles
   :header-rows: 1

   * - Type
     - Username
     - Password
     - Description
   * - Admin
     - admin
     - admin123
     - Accès complet
   * - Enseignant
     - ens001
     - ens123
     - Prof. Jean-Claude MBALLA
   * - Étudiant
     - med0001
     - etud123
     - Étudiant en L1
'''
    
    # Documentation de développement
    development_content = '''Guide de développement
=====================

Architecture
------------

AcadFlow suit l'architecture MVT (Model-View-Template) de Django avec une API REST.

Apps Django
~~~~~~~~~~~

.. list-table:: Applications
   :header-rows: 1

   * - App
     - Description
     - Modèles principaux
   * - core
     - Structure de base
     - Domaine, Filiere, Niveau
   * - academics
     - Gestion académique
     - Classe, UE, EC
   * - users
     - Utilisateurs
     - User, Etudiant, Enseignant
   * - evaluations
     - Évaluations
     - Note, Evaluation, Moyenne

Conventions de code
-------------------

Models
~~~~~~

.. code-block:: python

   class MonModel(TimestampedModel):
       """Description du modèle"""
       nom = models.CharField(max_length=100)
       actif = models.BooleanField(default=True)
       
       def __str__(self):
           return self.nom
       
       class Meta:
           db_table = 'ma_table'
           ordering = ['nom']

Views (API)
~~~~~~~~~~~

.. code-block:: python

   class MonViewSet(viewsets.ModelViewSet):
       queryset = MonModel.objects.filter(actif=True)
       serializer_class = MonSerializer
       permission_classes = [permissions.IsAuthenticated]
       
       @action(detail=True, methods=['get'])
       def action_personnalisee(self, request, pk=None):
           obj = self.get_object()
           # Logique métier
           return Response(data)

Tests
-----

.. code-block:: bash

   # Lancer tous les tests
   python manage.py test

   # Tests d'une app spécifique
   python manage.py test academics

   # Tests avec couverture
   pip install coverage
   coverage run --source='.' manage.py test
   coverage report

Commandes personnalisées
------------------------

.. code-block:: bash

   # Réinitialiser les données
   python manage.py reset_medical_data --confirm

   # Nettoyer les données
   python manage.py cleanup_data --confirm

   # Vérifier l'intégrité
   python manage.py verify_data

   # Générer la documentation
   python docs/generate_docs.py
'''
    
    # Changelog
    changelog_content = '''Changelog
=========

Version 1.0.0 (2024-12)
------------------------

Première version fonctionnelle d'AcadFlow pour faculté de médecine.

Fonctionnalités ajoutées
~~~~~~~~~~~~~~~~~~~~~~~~

* **Gestion académique complète**
  
  * Structure hiérarchique (Domaines → Filières → Niveaux)
  * Organisation pédagogique (UE → EC)
  * Gestion des classes et inscriptions

* **Système d'évaluation**
  
  * Saisie des notes par évaluation
  * Calcul automatique des moyennes (EC, UE, Semestre)
  * Configuration flexible des types d'évaluation

* **Gestion des utilisateurs**
  
  * Authentification et profils
  * Rôles : Admin, Enseignant, Étudiant, Scolarité
  * Système de permissions

* **API REST complète**
  
  * Endpoints pour toutes les entités
  * Authentification par token
  * Documentation automatique

* **Interface d'administration**
  
  * Interface Django Admin personnalisée
  * Statistiques et tableaux de bord
  * Filtres et recherche avancée

* **Outils de gestion**
  
  * Commandes de gestion personnalisées
  * Scripts d'initialisation de données
  * Outils de vérification et nettoyage

Données de test
~~~~~~~~~~~~~~~

* 50 étudiants en médecine (L1-L2)
* 5 enseignants spécialisés
* Structure complète UE/EC pour médecine
* Notes et moyennes générées automatiquement

Configuration
~~~~~~~~~~~~~

* Optimisé pour faculté de médecine
* Base de données PostgreSQL
* Support multilingue (français)
* Timezone Africa/Douala
'''
    
    # Créer les répertoires
    (docs_dir / 'api').mkdir(exist_ok=True)
    (docs_dir / 'models').mkdir(exist_ok=True)
    (docs_dir / '_static').mkdir(exist_ok=True)
    (docs_dir / '_templates').mkdir(exist_ok=True)
    
    # Écrire les fichiers
    files = {
        'index.rst': index_content,
        'installation.rst': installation_content,
        'quickstart.rst': quickstart_content,
        'development.rst': development_content,
        'changelog.rst': changelog_content,
    }
    
    for filename, content in files.items():
        with open(docs_dir / filename, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"   ✅ {filename} créé")
    
    # Créer la documentation API
    create_api_docs(docs_dir)
    
    # Créer la documentation des modèles
    create_models_docs(docs_dir)

def create_api_docs(docs_dir):
    """Crée la documentation de l'API"""
    api_index = '''API Reference
=============

.. toctree::
   :maxdepth: 2

   core
   academics
   users
   evaluations

Vue d'ensemble
--------------

L'API AcadFlow est une API REST qui suit les conventions de Django REST Framework.

Base URL
~~~~~~~~

.. code-block::

   http://localhost:8000/api/

Authentification
~~~~~~~~~~~~~~~~

L'API utilise l'authentification par token :

.. code-block:: http

   Authorization: Token your-token-here

Endpoints principaux
~~~~~~~~~~~~~~~~~~~~

* ``/api/core/`` - Structure de base (domaines, filières)
* ``/api/academics/`` - Gestion académique (classes, UE, EC)
* ``/api/users/`` - Utilisateurs et profils
* ``/api/evaluations/`` - Notes et évaluations
'''
    
    # API par app
    api_apps = {
        'core.rst': '''Core API
========

Domaines
--------

.. automodule:: core.views
   :members: DomaineViewSet

Filières
--------

.. automodule:: core.views
   :members: FiliereViewSet

Niveaux
-------

.. automodule:: core.views
   :members: NiveauViewSet
''',
        'academics.rst': '''Academics API
=============

Classes
-------

.. automodule:: academics.views
   :members: ClasseViewSet

Unités d'Enseignement
---------------------

.. automodule:: academics.views
   :members: UEViewSet

Éléments Constitutifs
--------------------

.. automodule:: academics.views
   :members: ECViewSet
''',
        'users.rst': '''Users API
=========

Utilisateurs
------------

.. automodule:: users.views
   :members: UserViewSet

Étudiants
---------

.. automodule:: users.views
   :members: EtudiantViewSet

Enseignants
-----------

.. automodule:: users.views
   :members: EnseignantViewSet
''',
        'evaluations.rst': '''Evaluations API
===============

Évaluations
-----------

.. automodule:: evaluations.views
   :members: EvaluationViewSet

Notes
-----

.. automodule:: evaluations.views
   :members: NoteViewSet

Moyennes
--------

.. automodule:: evaluations.views
   :members: MoyenneUEViewSet
'''
    }
    
    with open(docs_dir / 'api' / 'index.rst', 'w', encoding='utf-8') as f:
        f.write(api_index)
    
    for filename, content in api_apps.items():
        with open(docs_dir / 'api' / filename, 'w', encoding='utf-8') as f:
            f.write(content)
    
    print("   ✅ Documentation API créée")

def create_models_docs(docs_dir):
    """Crée la documentation des modèles"""
    models_index = '''Models Reference
================

.. toctree::
   :maxdepth: 2

   core
   academics
   users
   evaluations

Vue d'ensemble
--------------

Les modèles AcadFlow organisent les données selon une hiérarchie logique :

1. **Core** : Structure de base de l'établissement
2. **Academics** : Organisation pédagogique
3. **Users** : Utilisateurs et profils
4. **Evaluations** : Système d'évaluation
'''
    
    models_apps = {
        'core.rst': '''Core Models
===========

.. automodule:: core.models
   :members:
   :undoc-members:
   :show-inheritance:
''',
        'academics.rst': '''Academics Models
================

.. automodule:: academics.models
   :members:
   :undoc-members:
   :show-inheritance:
''',
        'users.rst': '''Users Models
============

.. automodule:: users.models
   :members:
   :undoc-members:
   :show-inheritance:
''',
        'evaluations.rst': '''Evaluations Models
=================

.. automodule:: evaluations.models
   :members:
   :undoc-members:
   :show-inheritance:
'''
    }
    
    with open(docs_dir / 'models' / 'index.rst', 'w', encoding='utf-8') as f:
        f.write(models_index)
    
    for filename, content in models_apps.items():
        with open(docs_dir / 'models' / filename, 'w', encoding='utf-8') as f:
            f.write(content)
    
    print("   ✅ Documentation des modèles créée")

def create_makefile(docs_dir):
    """Crée le Makefile pour construire la documentation"""
    makefile_content = '''# Minimal makefile for Sphinx documentation

# You can set these variables from the command line, and also
# from the environment for the first two.
SPHINXOPTS    ?=
SPHINXBUILD  ?= sphinx-build
SOURCEDIR    = .
BUILDDIR     = _build

# Put it first so that "make" without argument is like "make help".
help:
	@$(SPHINXBUILD) -M help "$(SOURCEDIR)" "$(BUILDDIR)" $(SPHINXOPTS) $(O)

.PHONY: help Makefile

# Catch-all target: route all unknown targets to Sphinx using the new
# "make mode" option.  $(O) is meant as a shortcut for $(SPHINXOPTS).
%: Makefile
	@$(SPHINXBUILD) -M $@ "$(SOURCEDIR)" "$(BUILDDIR)" $(SPHINXOPTS) $(O)
'''
    
    with open(docs_dir / 'Makefile', 'w', encoding='utf-8') as f:
        f.write(makefile_content)
    
    # Batch file pour Windows
    batch_content = '''@ECHO OFF

pushd %~dp0

REM Command file for Sphinx documentation

if "%SPHINXBUILD%" == "" (
	set SPHINXBUILD=sphinx-build
)
set SOURCEDIR=.
set BUILDDIR=_build

if "%1" == "" goto help

%SPHINXBUILD% -M %1 %SOURCEDIR% %BUILDDIR% %SPHINXOPTS% %O%
goto end

:help
%SPHINXBUILD% -M help %SOURCEDIR% %BUILDDIR% %SPHINXOPTS% %O%

:end
popd
'''
    
    with open(docs_dir / 'make.bat', 'w', encoding='utf-8') as f:
        f.write(batch_content)
    
    print("   ✅ Makefile créé")

if __name__ == '__main__':
    setup_sphinx_docs()
    
    print("\n" + "="*60)
    print("📚 SPHINX CONFIGURÉ AVEC SUCCÈS!")
    print("="*60)
    print("\n🚀 Commandes disponibles:")
    print("   cd docs")
    print("   make html      # Génère la documentation HTML")
    print("   make pdf       # Génère un PDF (si LaTeX installé)")
    print("   make clean     # Nettoie les fichiers générés")
    print("\n📂 La documentation sera dans : docs/_build/html/")
    print("🌐 Ouvrez : docs/_build/html/index.html")
    print("="*60)