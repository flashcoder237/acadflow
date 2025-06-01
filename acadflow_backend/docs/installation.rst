Installation
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
   acadflow_env\Scripts\activate  # Windows

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
