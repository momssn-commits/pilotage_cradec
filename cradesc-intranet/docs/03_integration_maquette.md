# 03 — Brancher la maquette sur Firebase

La maquette (`CRADESC_Intranet.html`) fixe l'interface et le comportement.
La production remplace ses simulations par les vraies API. Cartographie complète :
**Note d'intégration API** (HTML). Résumé des points de bascule :

| Dans la maquette | À remplacer par |
|---|---|
| Sélecteur de compte simulé | `signInWithPopup` (Google) du SDK Firebase Auth |
| Données en mémoire des plateformes | Lectures/écritures **Firestore** (avec les règles) |
| `postMessage` entre iframes | Données partagées **Firestore** + Cloud Functions |
| Aperçus Gmail / Agenda / Drive figés | Appels **Gmail / Calendar / Drive API** |
| Boutons d'action sensibles | Appels aux **Cloud Functions** (`httpsCallable`) |
| Accès « tout ouvert » (démo) | Règles Firestore + custom claims réactivés |

### Côté front
1. Initialiser le SDK Firebase (config du projet).
2. Remplacer le module de connexion par Google Sign-In.
3. Remplacer chaque jeu de données figé par un accès Firestore.
4. Router les actions sensibles vers les Cloud Functions :
   `achats.valider`, `paiements.decaisser`, `notifications.envoyerBonCommande`, etc.

> La passerelle **avance → paiement** n'a rien à câbler côté front : elle se
> déclenche côté serveur à la création d'une avance (`missions.avanceVersPaiement`).
