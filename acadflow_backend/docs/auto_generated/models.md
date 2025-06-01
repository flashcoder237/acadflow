# Documentation des Modèles
==================================================
Générée automatiquement le 01/06/2025 à 10:35

## Vue d'ensemble
Cette documentation présente tous les modèles Django d'AcadFlow.

## App: Core (core)
----------------------------------------

### Domaine
**Table:** `domaines`

**Description:** Domaines d'études (Sciences et Technologies, Sciences Humaines, etc.)

**Champs:**

| Nom | Type | Options | Description |
|-----|------|---------|-------------|
| `filiere` | ForeignKey | null=True, → Filiere | - |
| `id` | BigAutoField | blank=True, unique=True | - |
| `created_at` | DateTimeField | blank=True | - |
| `updated_at` | DateTimeField | blank=True | - |
| `nom` | CharField | unique=True, max_length=100 | - |
| `code` | CharField | unique=True, max_length=10 | - |
| `description` | TextField | blank=True | - |
| `actif` | BooleanField | default=True | - |

**Méthodes personnalisées:**
- `Meta()`
- `adelete()`
- `arefresh_from_db()`
- `asave()`
- `check()`

### Cycle
**Table:** `cycles`

**Description:** Cycles LMD (Licence, Master, Doctorat)

**Champs:**

| Nom | Type | Options | Description |
|-----|------|---------|-------------|
| `typeformation` | ForeignKey | null=True, → TypeFormation | - |
| `niveau` | ForeignKey | null=True, → Niveau | - |
| `id` | BigAutoField | blank=True, unique=True | - |
| `created_at` | DateTimeField | blank=True | - |
| `updated_at` | DateTimeField | blank=True | - |
| `nom` | CharField | unique=True, max_length=50 | - |
| `code` | CharField | unique=True, max_length=5 | - |
| `duree_annees` | PositiveIntegerField | - | - |
| `actif` | BooleanField | default=True | - |

**Méthodes personnalisées:**
- `Meta()`
- `adelete()`
- `arefresh_from_db()`
- `asave()`
- `check()`

### TypeFormation
**Table:** `types_formation`

**Description:** Types de formations (Licence Pro, Master Recherche, etc.)

**Champs:**

| Nom | Type | Options | Description |
|-----|------|---------|-------------|
| `filiere` | ForeignKey | null=True, → Filiere | - |
| `id` | BigAutoField | blank=True, unique=True | - |
| `created_at` | DateTimeField | blank=True | - |
| `updated_at` | DateTimeField | blank=True | - |
| `nom` | CharField | max_length=100 | - |
| `code` | CharField | max_length=10 | - |
| `cycle` | ForeignKey | → Cycle | - |
| `actif` | BooleanField | default=True | - |

**Méthodes personnalisées:**
- `Meta()`
- `adelete()`
- `arefresh_from_db()`
- `asave()`
- `check()`

### Filiere
**Table:** `filieres`

**Description:** Filières d'études

**Champs:**

| Nom | Type | Options | Description |
|-----|------|---------|-------------|
| `option` | ForeignKey | null=True, → Option | - |
| `classe` | ForeignKey | null=True, → Classe | - |
| `id` | BigAutoField | blank=True, unique=True | - |
| `created_at` | DateTimeField | blank=True | - |
| `updated_at` | DateTimeField | blank=True | - |
| `nom` | CharField | max_length=150 | - |
| `code` | CharField | max_length=20 | - |
| `domaine` | ForeignKey | → Domaine | - |
| `type_formation` | ForeignKey | → TypeFormation | - |
| `actif` | BooleanField | default=True | - |

**Méthodes personnalisées:**
- `Meta()`
- `adelete()`
- `arefresh_from_db()`
- `asave()`
- `check()`

### Option
**Table:** `options`

**Description:** Options/Spécialisations dans les filières

**Champs:**

| Nom | Type | Options | Description |
|-----|------|---------|-------------|
| `classe` | ForeignKey | null=True, → Classe | - |
| `id` | BigAutoField | blank=True, unique=True | - |
| `created_at` | DateTimeField | blank=True | - |
| `updated_at` | DateTimeField | blank=True | - |
| `nom` | CharField | max_length=150 | - |
| `code` | CharField | max_length=20 | - |
| `filiere` | ForeignKey | → Filiere | - |
| `actif` | BooleanField | default=True | - |

**Méthodes personnalisées:**
- `Meta()`
- `adelete()`
- `arefresh_from_db()`
- `asave()`
- `check()`

### Niveau
**Table:** `niveaux`

**Description:** Niveaux d'études (L1, L2, L3, M1, M2, etc.)

**Champs:**

| Nom | Type | Options | Description |
|-----|------|---------|-------------|
| `classe` | ForeignKey | null=True, → Classe | - |
| `ue` | ForeignKey | null=True, → UE | - |
| `id` | BigAutoField | blank=True, unique=True | - |
| `created_at` | DateTimeField | blank=True | - |
| `updated_at` | DateTimeField | blank=True | - |
| `nom` | CharField | max_length=20 | - |
| `numero` | PositiveIntegerField | - | - |
| `cycle` | ForeignKey | → Cycle | - |
| `credits_requis` | PositiveIntegerField | default=60 | - |
| `actif` | BooleanField | default=True | - |

**Méthodes personnalisées:**
- `Meta()`
- `adelete()`
- `arefresh_from_db()`
- `asave()`
- `check()`

## App: Academics (academics)
----------------------------------------

### AnneeAcademique
**Table:** `annees_academiques`

**Description:** Années académiques

**Champs:**

| Nom | Type | Options | Description |
|-----|------|---------|-------------|
| `classe` | ForeignKey | null=True, → Classe | - |
| `enseignement` | ForeignKey | null=True, → Enseignement | - |
| `moyenneec` | ForeignKey | null=True, → MoyenneEC | - |
| `moyenneue` | ForeignKey | null=True, → MoyenneUE | - |
| `moyennesemestre` | ForeignKey | null=True, → MoyenneSemestre | - |
| `inscription` | ForeignKey | null=True, → Inscription | - |
| `historiquestatut` | ForeignKey | null=True, → HistoriqueStatut | - |
| `id` | BigAutoField | blank=True, unique=True | - |
| `created_at` | DateTimeField | blank=True | - |
| `updated_at` | DateTimeField | blank=True | - |
| `libelle` | CharField | unique=True, max_length=20 | - |
| `date_debut` | DateField | - | - |
| `date_fin` | DateField | - | - |
| `active` | BooleanField | default=False | - |

**Méthodes personnalisées:**
- `Meta()`
- `adelete()`
- `arefresh_from_db()`
- `asave()`
- `check()`

### Session
**Table:** `sessions`

**Description:** Sessions d'évaluation (Normale, Rattrapage)

**Champs:**

| Nom | Type | Options | Description |
|-----|------|---------|-------------|
| `evaluation` | ForeignKey | null=True, → Evaluation | - |
| `moyenneec` | ForeignKey | null=True, → MoyenneEC | - |
| `moyenneue` | ForeignKey | null=True, → MoyenneUE | - |
| `moyennesemestre` | ForeignKey | null=True, → MoyenneSemestre | - |
| `id` | BigAutoField | blank=True, unique=True | - |
| `created_at` | DateTimeField | blank=True | - |
| `updated_at` | DateTimeField | blank=True | - |
| `nom` | CharField | max_length=50 | - |
| `code` | CharField | unique=True, max_length=10 | - |
| `ordre` | PositiveIntegerField | - | - |
| `actif` | BooleanField | default=True | - |

**Méthodes personnalisées:**
- `Meta()`
- `adelete()`
- `arefresh_from_db()`
- `asave()`
- `check()`

### Semestre
**Table:** `semestres`

**Description:** Semestres

**Champs:**

| Nom | Type | Options | Description |
|-----|------|---------|-------------|
| `ue` | ForeignKey | null=True, → UE | - |
| `moyennesemestre` | ForeignKey | null=True, → MoyenneSemestre | - |
| `id` | BigAutoField | blank=True, unique=True | - |
| `created_at` | DateTimeField | blank=True | - |
| `updated_at` | DateTimeField | blank=True | - |
| `nom` | CharField | max_length=20 | - |
| `numero` | PositiveIntegerField | - | - |

**Méthodes personnalisées:**
- `Meta()`
- `adelete()`
- `arefresh_from_db()`
- `asave()`
- `check()`

### Classe
**Table:** `classes`

**Description:** Classes/Promotions

**Champs:**

| Nom | Type | Options | Description |
|-----|------|---------|-------------|
| `enseignement` | ForeignKey | null=True, → Enseignement | - |
| `moyennesemestre` | ForeignKey | null=True, → MoyenneSemestre | - |
| `inscription` | ForeignKey | null=True, → Inscription | - |
| `id` | BigAutoField | blank=True, unique=True | - |
| `created_at` | DateTimeField | blank=True | - |
| `updated_at` | DateTimeField | blank=True | - |
| `nom` | CharField | max_length=100 | - |
| `code` | CharField | max_length=20 | - |
| `filiere` | ForeignKey | → Filiere | - |
| `option` | ForeignKey | null=True, blank=True, → Option | - |
| `niveau` | ForeignKey | → Niveau | - |
| `annee_academique` | ForeignKey | → AnneeAcademique | - |
| `effectif_max` | PositiveIntegerField | default=50 | - |
| `active` | BooleanField | default=True | - |

**Méthodes personnalisées:**
- `Meta()`
- `adelete()`
- `arefresh_from_db()`
- `asave()`
- `check()`

### UE
**Table:** `ues`

**Description:** Unités d'Enseignement

**Champs:**

| Nom | Type | Options | Description |
|-----|------|---------|-------------|
| `elements_constitutifs` | ForeignKey | null=True, → EC | - |
| `moyenneue` | ForeignKey | null=True, → MoyenneUE | - |
| `id` | BigAutoField | blank=True, unique=True | - |
| `created_at` | DateTimeField | blank=True | - |
| `updated_at` | DateTimeField | blank=True | - |
| `nom` | CharField | max_length=200 | - |
| `code` | CharField | max_length=20 | - |
| `credits` | PositiveIntegerField | - | - |
| `coefficient` | DecimalField | default=1.0 | - |
| `type_ue` | CharField | max_length=15, default=obligatoire | - |
| `niveau` | ForeignKey | → Niveau | - |
| `semestre` | ForeignKey | → Semestre | - |
| `actif` | BooleanField | default=True | - |

**Méthodes personnalisées:**
- `Meta()`
- `adelete()`
- `arefresh_from_db()`
- `asave()`
- `check()`

### EC
**Table:** `ecs`

**Description:** Éléments Constitutifs

**Champs:**

| Nom | Type | Options | Description |
|-----|------|---------|-------------|
| `configurationevaluationec` | ForeignKey | null=True, → ConfigurationEvaluationEC | - |
| `enseignement` | ForeignKey | null=True, → Enseignement | - |
| `moyenneec` | ForeignKey | null=True, → MoyenneEC | - |
| `id` | BigAutoField | blank=True, unique=True | - |
| `created_at` | DateTimeField | blank=True | - |
| `updated_at` | DateTimeField | blank=True | - |
| `nom` | CharField | max_length=200 | - |
| `code` | CharField | max_length=20 | - |
| `ue` | ForeignKey | → UE | - |
| `poids_ec` | DecimalField | - | - |
| `actif` | BooleanField | default=True | - |

**Méthodes personnalisées:**
- `Meta()`
- `adelete()`
- `arefresh_from_db()`
- `asave()`
- `check()`

### TypeEvaluation
**Table:** `types_evaluation`

**Description:** Types d'évaluations (CC, Partiel, Examen, etc.)

**Champs:**

| Nom | Type | Options | Description |
|-----|------|---------|-------------|
| `configurationevaluationec` | ForeignKey | null=True, → ConfigurationEvaluationEC | - |
| `evaluation` | ForeignKey | null=True, → Evaluation | - |
| `id` | BigAutoField | blank=True, unique=True | - |
| `created_at` | DateTimeField | blank=True | - |
| `updated_at` | DateTimeField | blank=True | - |
| `nom` | CharField | unique=True, max_length=50 | - |
| `code` | CharField | unique=True, max_length=10 | - |
| `description` | TextField | blank=True | - |
| `actif` | BooleanField | default=True | - |

**Méthodes personnalisées:**
- `Meta()`
- `adelete()`
- `arefresh_from_db()`
- `asave()`
- `check()`

### ConfigurationEvaluationEC
**Table:** `configuration_evaluations_ec`

**Description:** Configuration des pourcentages d'évaluation par EC

**Champs:**

| Nom | Type | Options | Description |
|-----|------|---------|-------------|
| `id` | BigAutoField | blank=True, unique=True | - |
| `created_at` | DateTimeField | blank=True | - |
| `updated_at` | DateTimeField | blank=True | - |
| `ec` | ForeignKey | → EC | - |
| `type_evaluation` | ForeignKey | → TypeEvaluation | - |
| `pourcentage` | DecimalField | - | - |

**Méthodes personnalisées:**
- `Meta()`
- `adelete()`
- `arefresh_from_db()`
- `asave()`
- `check()`

## App: Evaluations (evaluations)
----------------------------------------

### Enseignement
**Table:** `enseignements`

**Description:** Affectation enseignant-EC-classe

**Champs:**

| Nom | Type | Options | Description |
|-----|------|---------|-------------|
| `evaluation` | ForeignKey | null=True, → Evaluation | - |
| `id` | BigAutoField | blank=True, unique=True | - |
| `created_at` | DateTimeField | blank=True | - |
| `updated_at` | DateTimeField | blank=True | - |
| `enseignant` | ForeignKey | → Enseignant | - |
| `ec` | ForeignKey | → EC | - |
| `classe` | ForeignKey | → Classe | - |
| `annee_academique` | ForeignKey | → AnneeAcademique | - |
| `actif` | BooleanField | default=True | - |

**Méthodes personnalisées:**
- `Meta()`
- `adelete()`
- `arefresh_from_db()`
- `asave()`
- `check()`

### Evaluation
**Table:** `evaluations`

**Description:** Évaluations concrètes

**Champs:**

| Nom | Type | Options | Description |
|-----|------|---------|-------------|
| `note` | ForeignKey | null=True, → Note | - |
| `id` | BigAutoField | blank=True, unique=True | - |
| `created_at` | DateTimeField | blank=True | - |
| `updated_at` | DateTimeField | blank=True | - |
| `nom` | CharField | max_length=200 | - |
| `enseignement` | ForeignKey | → Enseignement | - |
| `type_evaluation` | ForeignKey | → TypeEvaluation | - |
| `session` | ForeignKey | → Session | - |
| `date_evaluation` | DateField | - | - |
| `note_sur` | DecimalField | default=20.0 | - |
| `coefficient` | DecimalField | default=1.0 | - |
| `saisie_terminee` | BooleanField | default=False | - |

**Méthodes personnalisées:**
- `Meta()`
- `adelete()`
- `arefresh_from_db()`
- `asave()`
- `check()`

### Note
**Table:** `notes`

**Description:** Notes individuelles des étudiants

**Champs:**

| Nom | Type | Options | Description |
|-----|------|---------|-------------|
| `id` | BigAutoField | blank=True, unique=True | - |
| `created_at` | DateTimeField | blank=True | - |
| `updated_at` | DateTimeField | blank=True | - |
| `etudiant` | ForeignKey | → Etudiant | - |
| `evaluation` | ForeignKey | → Evaluation | - |
| `note_obtenue` | DecimalField | - | - |
| `absent` | BooleanField | default=False | - |
| `justifie` | BooleanField | default=False | - |
| `commentaire` | TextField | blank=True | - |

**Méthodes personnalisées:**
- `Meta()`
- `adelete()`
- `arefresh_from_db()`
- `asave()`
- `check()`

### MoyenneEC
**Table:** `moyennes_ecs`

**Description:** Moyennes par EC

**Champs:**

| Nom | Type | Options | Description |
|-----|------|---------|-------------|
| `id` | BigAutoField | blank=True, unique=True | - |
| `created_at` | DateTimeField | blank=True | - |
| `updated_at` | DateTimeField | blank=True | - |
| `etudiant` | ForeignKey | → Etudiant | - |
| `ec` | ForeignKey | → EC | - |
| `session` | ForeignKey | → Session | - |
| `annee_academique` | ForeignKey | → AnneeAcademique | - |
| `moyenne` | DecimalField | - | - |
| `validee` | BooleanField | default=False | - |

**Méthodes personnalisées:**
- `Meta()`
- `adelete()`
- `arefresh_from_db()`
- `asave()`
- `check()`

### MoyenneUE
**Table:** `moyennes_ues`

**Description:** Moyennes par UE

**Champs:**

| Nom | Type | Options | Description |
|-----|------|---------|-------------|
| `id` | BigAutoField | blank=True, unique=True | - |
| `created_at` | DateTimeField | blank=True | - |
| `updated_at` | DateTimeField | blank=True | - |
| `etudiant` | ForeignKey | → Etudiant | - |
| `ue` | ForeignKey | → UE | - |
| `session` | ForeignKey | → Session | - |
| `annee_academique` | ForeignKey | → AnneeAcademique | - |
| `moyenne` | DecimalField | - | - |
| `credits_obtenus` | PositiveIntegerField | default=0 | - |
| `validee` | BooleanField | default=False | - |

**Méthodes personnalisées:**
- `Meta()`
- `adelete()`
- `arefresh_from_db()`
- `asave()`
- `check()`

### MoyenneSemestre
**Table:** `moyennes_semestres`

**Description:** Moyennes semestrielles

**Champs:**

| Nom | Type | Options | Description |
|-----|------|---------|-------------|
| `id` | BigAutoField | blank=True, unique=True | - |
| `created_at` | DateTimeField | blank=True | - |
| `updated_at` | DateTimeField | blank=True | - |
| `etudiant` | ForeignKey | → Etudiant | - |
| `classe` | ForeignKey | → Classe | - |
| `semestre` | ForeignKey | → Semestre | - |
| `session` | ForeignKey | → Session | - |
| `annee_academique` | ForeignKey | → AnneeAcademique | - |
| `moyenne_generale` | DecimalField | - | - |
| `credits_obtenus` | PositiveIntegerField | default=0 | - |
| `credits_requis` | PositiveIntegerField | default=30 | - |

**Méthodes personnalisées:**
- `Meta()`
- `adelete()`
- `arefresh_from_db()`
- `asave()`
- `check()`

## App: Users (users)
----------------------------------------

### User
**Table:** `users_user`

**Description:** Utilisateur de base étendu

**Champs:**

| Nom | Type | Options | Description |
|-----|------|---------|-------------|
| `enseignant` | OneToOneField | null=True, → Enseignant | - |
| `etudiant` | OneToOneField | null=True, → Etudiant | - |
| `id` | BigAutoField | blank=True, unique=True | - |
| `password` | CharField | max_length=128 | - |
| `last_login` | DateTimeField | null=True, blank=True | - |
| `is_superuser` | BooleanField | default=False | Précise que l’utilisateur possède toutes les permissions sans les assigner explicitement. |
| `username` | CharField | unique=True, max_length=150 | Requis. 150 caractères maximum. Uniquement des lettres, nombres et les caractères « @ », « . », « + », « - » et « _ ». |
| `first_name` | CharField | blank=True, max_length=150 | - |
| `last_name` | CharField | blank=True, max_length=150 | - |
| `email` | CharField | blank=True, max_length=254 | - |
| `is_staff` | BooleanField | default=False | Précise si l’utilisateur peut se connecter à ce site d'administration. |
| `is_active` | BooleanField | default=True | Précise si l’utilisateur doit être considéré comme actif. Décochez ceci plutôt que de supprimer le compte. |
| `date_joined` | DateTimeField | default=<function now at 0x00000274D3925440> | - |
| `type_utilisateur` | CharField | max_length=15 | - |
| `matricule` | CharField | unique=True, max_length=20 | - |
| `telephone` | CharField | blank=True, max_length=20 | - |
| `adresse` | TextField | blank=True | - |
| `date_naissance` | DateField | null=True, blank=True | - |
| `lieu_naissance` | CharField | blank=True, max_length=100 | - |
| `photo` | FileField | null=True, blank=True, max_length=100 | - |
| `actif` | BooleanField | default=True | - |
| `groups` | ManyToManyField | blank=True, → Group | The groups this user belongs to. |
| `user_permissions` | ManyToManyField | blank=True, → Permission | Specific permissions for this user. |

**Méthodes personnalisées:**
- `Meta()`
- `acheck_password()`
- `adelete()`
- `aget_all_permissions()`
- `aget_group_permissions()`

### Enseignant
**Table:** `enseignants`

**Description:** Profil enseignant

**Champs:**

| Nom | Type | Options | Description |
|-----|------|---------|-------------|
| `enseignement` | ForeignKey | null=True, → Enseignement | - |
| `id` | BigAutoField | blank=True, unique=True | - |
| `created_at` | DateTimeField | blank=True | - |
| `updated_at` | DateTimeField | blank=True | - |
| `user` | OneToOneField | unique=True, → User | - |
| `grade` | CharField | max_length=20 | - |
| `specialite` | CharField | max_length=200 | - |
| `statut` | CharField | max_length=50 | - |

**Méthodes personnalisées:**
- `Meta()`
- `adelete()`
- `arefresh_from_db()`
- `asave()`
- `check()`

### Etudiant
**Table:** `etudiants`

**Description:** Profil étudiant

**Champs:**

| Nom | Type | Options | Description |
|-----|------|---------|-------------|
| `note` | ForeignKey | null=True, → Note | - |
| `moyenneec` | ForeignKey | null=True, → MoyenneEC | - |
| `moyenneue` | ForeignKey | null=True, → MoyenneUE | - |
| `moyennesemestre` | ForeignKey | null=True, → MoyenneSemestre | - |
| `inscription` | ForeignKey | null=True, → Inscription | - |
| `historiquestatut` | ForeignKey | null=True, → HistoriqueStatut | - |
| `id` | BigAutoField | blank=True, unique=True | - |
| `created_at` | DateTimeField | blank=True | - |
| `updated_at` | DateTimeField | blank=True | - |
| `user` | OneToOneField | unique=True, → User | - |
| `numero_carte` | CharField | blank=True, unique=True, max_length=20 | - |
| `statut_current` | CharField | max_length=50, default=inscrit | - |

**Méthodes personnalisées:**
- `Meta()`
- `adelete()`
- `arefresh_from_db()`
- `asave()`
- `check()`

### StatutEtudiant
**Table:** `statuts_etudiant`

**Description:** Catalogue des statuts étudiants

**Champs:**

| Nom | Type | Options | Description |
|-----|------|---------|-------------|
| `inscription` | ForeignKey | null=True, → Inscription | - |
| `historiquestatut` | ForeignKey | null=True, → HistoriqueStatut | - |
| `id` | BigAutoField | blank=True, unique=True | - |
| `created_at` | DateTimeField | blank=True | - |
| `updated_at` | DateTimeField | blank=True | - |
| `nom` | CharField | unique=True, max_length=50 | - |
| `code` | CharField | unique=True, max_length=20 | - |
| `description` | TextField | blank=True | - |
| `actif` | BooleanField | default=True | - |

**Méthodes personnalisées:**
- `Meta()`
- `adelete()`
- `arefresh_from_db()`
- `asave()`
- `check()`

### Inscription
**Table:** `inscriptions`

**Description:** Inscriptions des étudiants aux classes

**Champs:**

| Nom | Type | Options | Description |
|-----|------|---------|-------------|
| `id` | BigAutoField | blank=True, unique=True | - |
| `created_at` | DateTimeField | blank=True | - |
| `updated_at` | DateTimeField | blank=True | - |
| `etudiant` | ForeignKey | → Etudiant | - |
| `classe` | ForeignKey | → Classe | - |
| `annee_academique` | ForeignKey | → AnneeAcademique | - |
| `date_inscription` | DateField | blank=True | - |
| `statut` | ForeignKey | → StatutEtudiant | - |
| `nombre_redoublements` | PositiveIntegerField | default=0 | - |
| `active` | BooleanField | default=True | - |

**Méthodes personnalisées:**
- `Meta()`
- `adelete()`
- `arefresh_from_db()`
- `asave()`
- `check()`

### HistoriqueStatut
**Table:** `historique_statuts`

**Description:** Historique des statuts étudiants

**Champs:**

| Nom | Type | Options | Description |
|-----|------|---------|-------------|
| `id` | BigAutoField | blank=True, unique=True | - |
| `created_at` | DateTimeField | blank=True | - |
| `updated_at` | DateTimeField | blank=True | - |
| `etudiant` | ForeignKey | → Etudiant | - |
| `statut` | ForeignKey | → StatutEtudiant | - |
| `date_changement` | DateTimeField | blank=True | - |
| `annee_academique` | ForeignKey | → AnneeAcademique | - |
| `motif` | TextField | blank=True | - |

**Méthodes personnalisées:**
- `Meta()`
- `adelete()`
- `arefresh_from_db()`
- `asave()`
- `check()`
