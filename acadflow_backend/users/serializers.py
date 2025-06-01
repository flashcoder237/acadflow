from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import User, Enseignant, Etudiant, StatutEtudiant, Inscription, HistoriqueStatut

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'type_utilisateur', 'matricule', 'telephone', 'adresse',
            'date_naissance', 'lieu_naissance', 'photo', 'actif', 'password'
        ]
    
    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User.objects.create_user(**validated_data)
        user.set_password(password)
        user.save()
        return user

class EnseignantSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    nom_complet = serializers.CharField(source='user.get_full_name', read_only=True)
    matricule = serializers.CharField(source='user.matricule', read_only=True)
    
    class Meta:
        model = Enseignant
        fields = '__all__'

class EtudiantSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    nom_complet = serializers.CharField(source='user.get_full_name', read_only=True)
    matricule = serializers.CharField(source='user.matricule', read_only=True)
    
    class Meta:
        model = Etudiant
        fields = '__all__'

class StatutEtudiantSerializer(serializers.ModelSerializer):
    class Meta:
        model = StatutEtudiant
        fields = '__all__'

class InscriptionSerializer(serializers.ModelSerializer):
    etudiant_nom = serializers.CharField(source='etudiant.user.get_full_name', read_only=True)
    etudiant_matricule = serializers.CharField(source='etudiant.user.matricule', read_only=True)
    classe_nom = serializers.CharField(source='classe.nom', read_only=True)
    statut_nom = serializers.CharField(source='statut.nom', read_only=True)
    
    class Meta:
        model = Inscription
        fields = '__all__'

class HistoriqueStatutSerializer(serializers.ModelSerializer):
    etudiant_nom = serializers.CharField(source='etudiant.user.get_full_name', read_only=True)
    statut_nom = serializers.CharField(source='statut.nom', read_only=True)
    
    class Meta:
        model = HistoriqueStatut
        fields = '__all__'

class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField()
    
    def validate(self, data):
        username = data.get('username')
        password = data.get('password')
        
        if username and password:
            user = authenticate(username=username, password=password)
            if user:
                if user.is_active:
                    data['user'] = user
                else:
                    raise serializers.ValidationError('Compte désactivé.')
            else:
                raise serializers.ValidationError('Identifiants incorrects.')
        else:
            raise serializers.ValidationError('Username et password requis.')
        
        return data