# Guide d'Utilisation d'AcadFlow
==================================================
Générée automatiquement le 01/06/2025 à 10:35

## Installation et démarrage

### Prérequis
- Python 3.8+
- PostgreSQL 12+
- Django 5.2+

### Installation
```bash
# Cloner le projet
git clone <repo_url>
cd acadflow_backend

# Installer les dépendances
pip install -r requirements.txt

# Configuration de la base de données
python manage.py migrate

# Initialiser les données de test
python manage.py reset_medical_data --confirm

# Démarrer le serveur
python manage.py runserver
```

## Utilisation de l'interface admin

1. Accédez à `http://localhost:8000/admin/`
2. Connectez-vous avec : `admin` / `admin123`
3. Naviguez dans les différentes sections

## Utilisation de l'API

### Authentification
```python
import requests

# Login
response = requests.post('http://localhost:8000/api/auth/login/', {
    'username': 'admin',
    'password': 'admin123'
})
token = response.json()['token']

# Utiliser le token
headers = {'Authorization': f'Token {token}'}
response = requests.get('http://localhost:8000/api/academics/classes/', headers=headers)
```

### Exemples d'opérations courantes

#### Récupérer la liste des étudiants d'une classe
```python
classe_id = 1
response = requests.get(
    f'http://localhost:8000/api/academics/classes/{classe_id}/etudiants/',
    headers=headers
)
etudiants = response.json()
```

#### Saisir des notes
```python
evaluation_id = 1
notes_data = {
    'notes': [
        {'etudiant_id': 1, 'note_obtenue': 15.5},
        {'etudiant_id': 2, 'note_obtenue': 12.0, 'absent': False}
    ]
}
response = requests.post(
    f'http://localhost:8000/api/evaluations/evaluations/{evaluation_id}/saisir_notes/',
    json=notes_data,
    headers=headers
)
```

## Commandes de gestion

### Données de test
```bash
# Initialiser les données complètes
python manage.py reset_medical_data --confirm

# Nettoyer les données
python manage.py cleanup_data --confirm

# Vérifier l'intégrité
python manage.py verify_data
```

### Calcul des moyennes
```bash
# Recalculer toutes les moyennes
python manage.py recalculer_moyennes --classe=1 --session=1
```