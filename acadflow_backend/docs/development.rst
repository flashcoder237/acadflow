Guide de développement
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
