# Documentation AcadFlow
==================================================
Documentation générée automatiquement le 01/06/2025 à 10:35

## 🎯 Vue d'ensemble

AcadFlow est un système de gestion académique développé avec Django.
Il permet la gestion complète d'une institution éducative :

- 📚 **Gestion académique** : UE, EC, classes, programmes
- 👥 **Gestion des utilisateurs** : étudiants, enseignants, administration
- 📝 **Évaluations** : notes, moyennes, relevés
- 🔌 **API REST** : intégration avec d'autres systèmes

## 📖 Documentation disponible

### 🏗️ Architecture et développement
- [📊 **Modèles de données**](models.md) - Structure des données et relations
- [🔌 **API REST**](api.md) - Endpoints et utilisation de l'API
- [📁 **Structure du projet**](structure.md) - Organisation du code
- [🗄️ **Schéma de base de données**](database.md) - Relations et tables

### 🚀 Utilisation
- [📖 **Guide d'utilisation**](usage.md) - Installation et utilisation

## 🎓 Contexte : Faculté de Médecine

Cette instance d'AcadFlow est configurée pour une faculté de médecine avec :

### 🏥 Structure académique
- **Domaine** : Sciences de la Santé
- **Filières** : Médecine, Pharmacie, Dentaire, Kinésithérapie, etc.
- **Niveaux** : L1, L2, L3, M1, M2
- **UE typiques** : Anatomie, Physiologie, Biochimie, Pathologie

### 👥 Utilisateurs types
- **Administrateurs** : Gestion complète du système
- **Service Scolarité** : Inscriptions, planning, résultats
- **Enseignants** : Saisie des notes, gestion des évaluations
- **Étudiants** : Consultation des notes et relevés

### 📊 Données de test incluses
- 50 étudiants répartis en 4 classes
- 5 enseignants spécialisés
- UE et EC pour L1 et L2 médecine
- Évaluations et notes générées
- Moyennes calculées automatiquement

## 🔑 Accès rapide

### Comptes de test
| Type | Login | Password | Rôle |
|------|-------|----------|------|
| Admin | `admin` | `admin123` | Administration complète |
| Enseignant | `ens001` | `ens123` | Prof. Jean-Claude MBALLA |
| Étudiant | `med0001` | `etud123` | Étudiant en L1 |

### URLs importantes
- **Interface Admin** : http://localhost:8000/admin/
- **API Root** : http://localhost:8000/api/
- **Login API** : http://localhost:8000/api/auth/login/

## 🛠️ Commandes utiles

```bash
# Démarrer le serveur
python manage.py runserver

# Réinitialiser les données de test
python manage.py reset_medical_data --confirm

# Vérifier l'intégrité des données
python manage.py verify_data

# Générer cette documentation
python docs/generate_docs.py
```

## 📞 Support

Pour toute question technique :
1. Consultez d'abord cette documentation
2. Vérifiez les logs : `python manage.py check`
3. Utilisez les commandes de diagnostic intégrées

---

*Documentation générée automatiquement le 01/06/2025 à 10:35*

*Pour mettre à jour cette documentation, exécutez : `python docs/generate_docs.py`*