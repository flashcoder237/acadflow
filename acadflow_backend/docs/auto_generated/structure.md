# Structure du Projet AcadFlow
==================================================
Générée automatiquement le 01/06/2025 à 10:35

## Architecture générale

AcadFlow suit l'architecture MVT (Model-View-Template) de Django avec une API REST.

```
acadflow_backend/
├── acadflow_backend/          # Configuration principale
│   ├── settings.py            # Paramètres Django
│   ├── urls.py                # URLs principales
│   └── wsgi.py                # Interface WSGI
├── core/                      # App principale (domaines, filières)
│   ├── models.py              # Modèles de base
│   ├── views.py               # Vues API
│   ├── serializers.py        # Sérialiseurs
│   └── admin.py               # Interface admin
├── academics/                 # Gestion académique
│   ├── models.py              # UE, EC, Classes
│   ├── views.py               # API académique
│   └── management/commands/   # Commandes personnalisées
├── users/                     # Gestion des utilisateurs
│   ├── models.py              # Utilisateurs, Étudiants, Enseignants
│   └── views.py               # Authentification, profils
└── evaluations/               # Système d'évaluation
    ├── models.py              # Notes, Moyennes
    └── views.py               # API évaluations
```

## Description des Applications

### Core

**Description:** Application principale contenant les modèles de base de la structure académique.

**Rôle:** Définit la structure hiérarchique de l'établissement

**Modèles principaux:**

- `Domaine`
- `Cycle`
- `TypeFormation`
- `Filiere`
- `Option`
- `Niveau`

### Academics

**Description:** Gestion de la structure académique (années, classes, UE, EC).

**Rôle:** Organisation des enseignements et de la structure pédagogique

**Modèles principaux:**

- `AnneeAcademique`
- `Session`
- `Semestre`
- `Classe`
- `UE`
- `EC`

### Users

**Description:** Gestion des utilisateurs et de leurs profils.

**Rôle:** Authentification et gestion des profils utilisateurs

**Modèles principaux:**

- `User`
- `Enseignant`
- `Etudiant`
- `Inscription`
- `StatutEtudiant`

### Evaluations

**Description:** Système d'évaluation et de calcul des moyennes.

**Rôle:** Gestion des notes, évaluations et calcul des moyennes

**Modèles principaux:**

- `Enseignement`
- `Evaluation`
- `Note`
- `MoyenneEC`
- `MoyenneUE`
