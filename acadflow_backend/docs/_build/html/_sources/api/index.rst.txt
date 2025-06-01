API Reference
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
