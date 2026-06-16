# 04 — Scénarios de recette

Valider de bout en bout, avec des comptes de rôles différents.

## Socle
- [ ] Connexion Google restreinte au domaine ; un compte hors domaine est refusé.
- [ ] Les rôles (custom claims) sont bien posés ; un agent ne voit pas les actions
      réservées à la direction.
- [ ] Les règles Firestore bloquent l'écriture directe des champs sensibles
      (ex. `statut` d'une demande de paiement).

## Chaîne métier (le fil de la démo)
- [ ] Créer une activité (Pilotage) → tâche visible et suivie.
- [ ] Rédiger et valider un TdR → livrables centralisés.
- [ ] Soumettre une réquisition → validation par seuil → bon de commande émis.
- [ ] Préparer un ordre de mission avec avance.
- [ ] **L'avance crée automatiquement une demande de paiement** (source = mission),
      sans ressaisie, et sans double comptage budgétaire.
- [ ] Décaisser (direction) → statut tracé.
- [ ] Le tableau de bord direction reflète l'engagé consolidé.
- [ ] La revue (Pilotage) consigne décisions et points de vigilance.

## Intégrations Google
- [ ] Dépôt d'un justificatif → fichier réellement créé dans le Drive partagé.
- [ ] Envoi d'un bon de commande → e-mail Gmail reçu, PDF en pièce jointe.
- [ ] Rappel d'échéance → e-mail et/ou événement Calendar créé.

## Traçabilité
- [ ] Chaque validation/décaissement apparaît dans le journal d'audit
      (lecture réservée à la direction, écriture en ajout seul).
