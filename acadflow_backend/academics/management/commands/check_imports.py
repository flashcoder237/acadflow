# check_imports.py - Script pour vérifier que tous les imports fonctionnent
import os
import sys
import django

# Ajouter le répertoire du projet au path
project_root = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, project_root)

# Configuration Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'acadflow_backend.settings')

try:
    django.setup()
    print("✅ Django configuré avec succès")
except Exception as e:
    print(f"❌ Erreur de configuration Django: {e}")
    sys.exit(1)

# Test des imports
imports_to_test = [
    # Models Core
    ("core.models", ["Domaine", "Cycle", "TypeFormation", "Filiere", "Option", "Niveau"]),
    
    # Models Academics
    ("academics.models", [
        "AnneeAcademique", "Session", "Semestre", "Classe", "UE", "EC", 
        "TypeEvaluation", "ConfigurationEvaluationEC"
    ]),
    
    # Models Users
    ("users.models", [
        "User", "Enseignant", "Etudiant", "StatutEtudiant", 
        "Inscription", "HistoriqueStatut"
    ]),
    
    # Models Evaluations
    ("evaluations.models", [
        "Enseignement", "Evaluation", "Note", "MoyenneEC", 
        "MoyenneUE", "MoyenneSemestre"
    ]),
    
    # Serializers
    ("core.serializers", ["DomaineSerializer", "FiliereSerializer"]),
    ("academics.serializers", ["ClasseSerializer", "UESerializer"]),
    ("users.serializers", ["UserSerializer", "EtudiantSerializer"]),
    ("evaluations.serializers", ["EvaluationSerializer", "NoteSerializer"]),
    
    # Utils
    ("core.utils", ["calculer_moyenne_ec", "calculer_moyenne_ue", "calculer_moyenne_semestre"]),
    
    # Django imports
    ("django.db.models", ["Count", "Avg", "Sum", "F", "Q"]),
    ("django.contrib.auth", ["authenticate", "get_user_model"]),
    ("django.core.management.base", ["BaseCommand"]),
]

print("\n🔍 Vérification des imports...\n")

all_imports_ok = True

for module_name, items in imports_to_test:
    try:
        module = __import__(module_name, fromlist=items)
        print(f"✅ {module_name}")
        
        # Vérifier chaque item dans le module
        for item in items:
            if hasattr(module, item):
                print(f"   ✅ {item}")
            else:
                print(f"   ❌ {item} - Non trouvé")
                all_imports_ok = False
                
    except ImportError as e:
        print(f"❌ {module_name} - Erreur d'import: {e}")
        all_imports_ok = False
    except Exception as e:
        print(f"❌ {module_name} - Erreur: {e}")
        all_imports_ok = False

print("\n" + "="*50)

if all_imports_ok:
    print("✅ Tous les imports sont OK!")
    print("\n🚀 Vous pouvez maintenant exécuter:")
    print("   python manage.py reset_medical_data --confirm")
else:
    print("❌ Certains imports ont échoué!")
    print("\n🔧 Actions recommandées:")
    print("   1. Vérifiez que toutes les apps sont dans INSTALLED_APPS")
    print("   2. Exécutez: python manage.py makemigrations")
    print("   3. Exécutez: python manage.py migrate")
    print("   4. Relancez ce script")

# Test de connexion à la base de données
print("\n🗄️ Test de connexion à la base de données...")
try:
    from django.db import connection
    with connection.cursor() as cursor:
        cursor.execute("SELECT 1")
        result = cursor.fetchone()
        if result[0] == 1:
            print("✅ Connexion à la base de données OK")
        else:
            print("❌ Problème de connexion à la base de données")
except Exception as e:
    print(f"❌ Erreur de connexion à la base de données: {e}")

# Test des migrations
print("\n📦 Vérification des migrations...")
try:
    from django.core.management import call_command
    from io import StringIO
    
    output = StringIO()
    call_command('showmigrations', '--plan', stdout=output)
    migrations_output = output.getvalue()
    
    if "[ ]" in migrations_output:
        print("⚠️ Des migrations ne sont pas appliquées")
        print("   Exécutez: python manage.py migrate")
    else:
        print("✅ Toutes les migrations sont appliquées")
        
except Exception as e:
    print(f"❌ Erreur lors de la vérification des migrations: {e}")

print("\n" + "="*50)
print("🎯 STATUT FINAL:", "✅ PRÊT" if all_imports_ok else "❌ CORRECTIONS NÉCESSAIRES")
print("="*50)