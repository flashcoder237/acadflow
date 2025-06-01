Guide de démarrage rapide
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
