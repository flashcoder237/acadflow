from rest_framework import permissions

class IsEnseignantOrReadOnly(permissions.BasePermission):
    """
    Permission personnalisée pour permettre seulement aux enseignants
    de modifier leurs propres enseignements.
    """
    
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user.is_authenticated and request.user.type_utilisateur == 'enseignant'

class IsAdminOrScolarite(permissions.BasePermission):
    """
    Permission pour les opérations administratives.
    """
    
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and 
            request.user.type_utilisateur in ['admin', 'scolarite', 'direction']
        )

class IsOwnerOrReadOnly(permissions.BasePermission):
    """
    Permission personnalisée pour permettre seulement aux propriétaires
    d'un objet de le modifier.
    """
    
    def has_object_permission(self, request, view, obj):
        # Read permissions pour tous les utilisateurs authentifiés
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Write permissions seulement pour le propriétaire
        return obj.user == request.user

class IsEtudiantOwner(permissions.BasePermission):
    """
    Permission pour que les étudiants ne voient que leurs propres données.
    """
    
    def has_permission(self, request, view):
        return request.user.is_authenticated
    
    def has_object_permission(self, request, view, obj):
        if request.user.type_utilisateur == 'etudiant':
            return hasattr(obj, 'etudiant') and obj.etudiant.user == request.user
        return request.user.type_utilisateur in ['admin', 'scolarite', 'enseignant', 'direction']