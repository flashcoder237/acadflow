# Documentation de l'API REST
==================================================
Générée automatiquement le 01/06/2025 à 10:35

## Endpoints disponibles

### Core

#### DomaineViewSet

**URL de base:** `/api/core/domaines/`

**Actions disponibles:**

| Méthode | URL | Description |
|---------|-----|-------------|
| GET | `/api/core/domaines/` | Liste tous les éléments |
| POST | `/api/core/domaines/` | Crée un nouvel élément |
| GET | `/api/core/domaines/{id}/` | Récupère un élément |
| PUT | `/api/core/domaines/{id}/` | Met à jour un élément |
| DELETE | `/api/core/domaines/{id}/` | Supprime un élément |

**Actions personnalisées:**
- `/api/core/domaines/{id}/filieres/`
- `/api/core/domaines/{id}/statistiques/`

#### FiliereViewSet

**URL de base:** `/api/core/filieres/`

**Actions disponibles:**

| Méthode | URL | Description |
|---------|-----|-------------|
| GET | `/api/core/filieres/` | Liste tous les éléments |
| POST | `/api/core/filieres/` | Crée un nouvel élément |
| GET | `/api/core/filieres/{id}/` | Récupère un élément |
| PUT | `/api/core/filieres/{id}/` | Met à jour un élément |
| DELETE | `/api/core/filieres/{id}/` | Supprime un élément |

**Actions personnalisées:**
- `/api/core/filieres/{id}/classes_par_niveau/`
- `/api/core/filieres/{id}/options/`

#### NiveauViewSet

**URL de base:** `/api/core/niveaus/`

**Actions disponibles:**

| Méthode | URL | Description |
|---------|-----|-------------|
| GET | `/api/core/niveaus/` | Liste tous les éléments |
| POST | `/api/core/niveaus/` | Crée un nouvel élément |
| GET | `/api/core/niveaus/{id}/` | Récupère un élément |
| PUT | `/api/core/niveaus/{id}/` | Met à jour un élément |
| DELETE | `/api/core/niveaus/{id}/` | Supprime un élément |

**Actions personnalisées:**
- `/api/core/niveaus/{id}/ues_par_semestre/`


### Academics

#### ClasseViewSet

**URL de base:** `/api/academics/classes/`

**Actions disponibles:**

| Méthode | URL | Description |
|---------|-----|-------------|
| GET | `/api/academics/classes/` | Liste tous les éléments |
| POST | `/api/academics/classes/` | Crée un nouvel élément |
| GET | `/api/academics/classes/{id}/` | Récupère un élément |
| PUT | `/api/academics/classes/{id}/` | Met à jour un élément |
| DELETE | `/api/academics/classes/{id}/` | Supprime un élément |

**Actions personnalisées:**
- `/api/academics/classes/{id}/etudiants/`
- `/api/academics/classes/{id}/programme_pedagogique/`
- `/api/academics/classes/{id}/resultats_session/`

#### UEViewSet

**URL de base:** `/api/academics/ues/`

**Actions disponibles:**

| Méthode | URL | Description |
|---------|-----|-------------|
| GET | `/api/academics/ues/` | Liste tous les éléments |
| POST | `/api/academics/ues/` | Crée un nouvel élément |
| GET | `/api/academics/ues/{id}/` | Récupère un élément |
| PUT | `/api/academics/ues/{id}/` | Met à jour un élément |
| DELETE | `/api/academics/ues/{id}/` | Supprime un élément |

**Actions personnalisées:**
- `/api/academics/ues/{id}/configuration_evaluations/`

#### ECViewSet

**URL de base:** `/api/academics/ecs/`

**Actions disponibles:**

| Méthode | URL | Description |
|---------|-----|-------------|
| GET | `/api/academics/ecs/` | Liste tous les éléments |
| POST | `/api/academics/ecs/` | Crée un nouvel élément |
| GET | `/api/academics/ecs/{id}/` | Récupère un élément |
| PUT | `/api/academics/ecs/{id}/` | Met à jour un élément |
| DELETE | `/api/academics/ecs/{id}/` | Supprime un élément |

**Actions personnalisées:**
- `/api/academics/ecs/{id}/enseignements/`


### Users

#### UserViewSet

**URL de base:** `/api/users/users/`

**Actions disponibles:**

| Méthode | URL | Description |
|---------|-----|-------------|
| GET | `/api/users/users/` | Liste tous les éléments |
| POST | `/api/users/users/` | Crée un nouvel élément |
| GET | `/api/users/users/{id}/` | Récupère un élément |
| PUT | `/api/users/users/{id}/` | Met à jour un élément |
| DELETE | `/api/users/users/{id}/` | Supprime un élément |

**Actions personnalisées:**
- `/api/users/users/{id}/statistiques/`

#### EtudiantViewSet

**URL de base:** `/api/users/etudiants/`

**Actions disponibles:**

| Méthode | URL | Description |
|---------|-----|-------------|
| GET | `/api/users/etudiants/` | Liste tous les éléments |
| POST | `/api/users/etudiants/` | Crée un nouvel élément |
| GET | `/api/users/etudiants/{id}/` | Récupère un élément |
| PUT | `/api/users/etudiants/{id}/` | Met à jour un élément |
| DELETE | `/api/users/etudiants/{id}/` | Supprime un élément |

**Actions personnalisées:**
- `/api/users/etudiants/{id}/changer_statut/`
- `/api/users/etudiants/{id}/notes_detaillees/`
- `/api/users/etudiants/{id}/parcours_academique/`

#### EnseignantViewSet

**URL de base:** `/api/users/enseignants/`

**Actions disponibles:**

| Méthode | URL | Description |
|---------|-----|-------------|
| GET | `/api/users/enseignants/` | Liste tous les éléments |
| POST | `/api/users/enseignants/` | Crée un nouvel élément |
| GET | `/api/users/enseignants/{id}/` | Récupère un élément |
| PUT | `/api/users/enseignants/{id}/` | Met à jour un élément |
| DELETE | `/api/users/enseignants/{id}/` | Supprime un élément |

**Actions personnalisées:**
- `/api/users/enseignants/{id}/charge_travail/`
- `/api/users/enseignants/{id}/enseignements/`
- `/api/users/enseignants/{id}/planning_evaluations/`


### Evaluations

#### EvaluationViewSet

**URL de base:** `/api/evaluations/evaluations/`

**Actions disponibles:**

| Méthode | URL | Description |
|---------|-----|-------------|
| GET | `/api/evaluations/evaluations/` | Liste tous les éléments |
| POST | `/api/evaluations/evaluations/` | Crée un nouvel élément |
| GET | `/api/evaluations/evaluations/{id}/` | Récupère un élément |
| PUT | `/api/evaluations/evaluations/{id}/` | Met à jour un élément |
| DELETE | `/api/evaluations/evaluations/{id}/` | Supprime un élément |

**Actions personnalisées:**
- `/api/evaluations/evaluations/{id}/feuille_notes/`
- `/api/evaluations/evaluations/{id}/saisir_notes/`
- `/api/evaluations/evaluations/{id}/statistiques/`

#### NoteViewSet

**URL de base:** `/api/evaluations/notes/`

**Actions disponibles:**

| Méthode | URL | Description |
|---------|-----|-------------|
| GET | `/api/evaluations/notes/` | Liste tous les éléments |
| POST | `/api/evaluations/notes/` | Crée un nouvel élément |
| GET | `/api/evaluations/notes/{id}/` | Récupère un élément |
| PUT | `/api/evaluations/notes/{id}/` | Met à jour un élément |
| DELETE | `/api/evaluations/notes/{id}/` | Supprime un élément |

**Actions personnalisées:**
- `/api/evaluations/notes/{id}/releve_notes_etudiant/`


## Exemples d'utilisation

### Authentification
```bash
# Login
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}'

# Utiliser le token
curl -H "Authorization: Token YOUR_TOKEN" \
  http://localhost:8000/api/academics/classes/
```

### Récupération de données
```bash
# Liste des classes
GET /api/academics/classes/

# Détails d'une classe
GET /api/academics/classes/1/

# Étudiants d'une classe
GET /api/academics/classes/1/etudiants/

# Programme pédagogique d'une classe
GET /api/academics/classes/1/programme_pedagogique/
```

### Filtrage
```bash
# Classes par filière
GET /api/academics/classes/?filiere=1

# UE par niveau
GET /api/academics/ues/?niveau=1

# Notes d'un étudiant
GET /api/evaluations/notes/?etudiant=1&session=1
```