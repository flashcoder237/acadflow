# core/management/commands/export_data.py
from django.core.management.base import BaseCommand
from django.http import HttpResponse
import csv
from io import StringIO
from evaluations.models import MoyenneSemestre, Note
from users.models import Inscription

class Command(BaseCommand):
    help = 'Export data to CSV'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--type',
            choices=['notes', 'moyennes', 'inscriptions'],
            required=True,
            help='Type of data to export',
        )
        parser.add_argument(
            '--output',
            type=str,
            help='Output file path',
        )
        parser.add_argument(
            '--classe-id',
            type=int,
            help='Filter by classe',
        )
        parser.add_argument(
            '--session-id',
            type=int,
            help='Filter by session',
        )
    
    def handle(self, *args, **options):
        output = StringIO()
        
        if options['type'] == 'notes':
            self.export_notes(output, options)
        elif options['type'] == 'moyennes':
            self.export_moyennes(output, options)
        elif options['type'] == 'inscriptions':
            self.export_inscriptions(output, options)
        
        content = output.getvalue()
        
        if options['output']:
            with open(options['output'], 'w', encoding='utf-8') as f:
                f.write(content)
            self.stdout.write(f'Données exportées vers: {options["output"]}')
        else:
            self.stdout.write(content)
    
    def export_notes(self, output, options):
        writer = csv.writer(output)
        writer.writerow([
            'Matricule', 'Nom Complet', 'EC Code', 'EC Nom', 'Évaluation',
            'Type Évaluation', 'Note Obtenue', 'Note Sur', 'Absent', 'Session'
        ])
        
        notes = Note.objects.select_related(
            'etudiant__user', 'evaluation__enseignement__ec',
            'evaluation__type_evaluation', 'evaluation__session'
        )
        
        if options['classe_id']:
            notes = notes.filter(
                evaluation__enseignement__classe_id=options['classe_id']
            )
        
        if options['session_id']:
            notes = notes.filter(evaluation__session_id=options['session_id'])
        
        for note in notes:
            writer.writerow([
                note.etudiant.user.matricule,
                note.etudiant.user.get_full_name(),
                note.evaluation.enseignement.ec.code,
                note.evaluation.enseignement.ec.nom,
                note.evaluation.nom,
                note.evaluation.type_evaluation.nom,
                note.note_obtenue,
                note.evaluation.note_sur,
                'Oui' if note.absent else 'Non',
                note.evaluation.session.nom
            ])
    
    def export_moyennes(self, output, options):
        writer = csv.writer(output)
        writer.writerow([
            'Matricule', 'Nom Complet', 'Classe', 'Semestre',
            'Moyenne Générale', 'Crédits Obtenus', 'Crédits Requis',
            'Session', 'Année Académique'
        ])
        
        moyennes = MoyenneSemestre.objects.select_related(
            'etudiant__user', 'classe', 'semestre', 'session', 'annee_academique'
        )
        
        if options['classe_id']:
            moyennes = moyennes.filter(classe_id=options['classe_id'])
        
        if options['session_id']:
            moyennes = moyennes.filter(session_id=options['session_id'])
        
        for moyenne in moyennes:
            writer.writerow([
                moyenne.etudiant.user.matricule,
                moyenne.etudiant.user.get_full_name(),
                moyenne.classe.nom,
                moyenne.semestre.nom,
                moyenne.moyenne_generale,
                moyenne.credits_obtenus,
                moyenne.credits_requis,
                moyenne.session.nom,
                moyenne.annee_academique.libelle
            ])
    
    def export_inscriptions(self, output, options):
        writer = csv.writer(output)
        writer.writerow([
            'Matricule', 'Nom Complet', 'Email', 'Classe', 'Filière',
            'Niveau', 'Statut', 'Nombre Redoublements', 'Date Inscription',
            'Année Académique'
        ])
        
        inscriptions = Inscription.objects.select_related(
            'etudiant__user', 'classe__filiere', 'classe__niveau',
            'statut', 'annee_academique'
        ).filter(active=True)
        
        if options['classe_id']:
            inscriptions = inscriptions.filter(classe_id=options['classe_id'])
        
        for inscription in inscriptions:
            writer.writerow([
                inscription.etudiant.user.matricule,
                inscription.etudiant.user.get_full_name(),
                inscription.etudiant.user.email,
                inscription.classe.nom,
                inscription.classe.filiere.nom,
                inscription.classe.niveau.nom,
                inscription.statut.nom,
                inscription.nombre_redoublements,
                inscription.date_inscription,
                inscription.annee_academique.libelle
            ])


