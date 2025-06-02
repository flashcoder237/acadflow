# Vérification de la structure du projet
def verify_project_structure():
    """Vérifie que tous les fichiers nécessaires sont présents"""
    required_files = [
        'manage.py',
        'acadflow_backend/settings.py',
        'acadflow_backend/urls.py',
        'academics/models.py',
        'academics/views.py',
        'academics/serializers.py',
        'academics/urls.py',
        'academics/admin.py',
        'core/models.py',
        'core/services.py',
        'core/utils.py',
        'evaluations/models.py',
        'users/models.py'
    ]
    
    missing_files = []
    for file_path in required_files:
        if not os.path.exists(file_path):
            missing_files.append(file_path)
    
    if missing_files:
        print("Fichiers manquants:")
        for file_path in missing_files:
            print(f"  - {file_path}")
    else:
        print("Tous les fichiers requis sont présents!")
    
    return len(missing_files) == 0