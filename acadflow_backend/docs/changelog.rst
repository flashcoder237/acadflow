Changelog
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
