# Mise en ligne sur 187.124.52.164 (Traefik)

Le serveur tourne derrière **Traefik** (reverse-proxy Docker : redirection
HTTP→HTTPS active, certificat par défaut auto-signé). On déploie donc le front
comme un **conteneur statique (nginx)** exposé via une **route Traefik**.

## Pré-requis IMPORTANTS (mode Firebase réel)

1. **Un nom de domaine en HTTPS.** Google Sign-In **refuse les adresses IP nues** :
   le bouton « Se connecter avec Google » ne fonctionnera pas sur
   `https://187.124.52.164/`. Il faut un domaine (ex. `intranet.cradesc.org`)
   pointé en DNS (enregistrement A) vers `187.124.52.164`, puis ajouté dans
   **Firebase → Authentication → Settings → Authorized domains**.

2. **Projet Firebase créé et backend déployé** (chez Google, pas sur ce serveur) :
   ```bash
   cd cradesc-intranet
   firebase deploy --only firestore:rules,firestore:indexes,functions
   ```
   puis amorcer les référentiels (`functions/seed.js`).

3. **`hosting/app/config.js` renseigné** avec la vraie configuration du projet
   (apiKey, projectId, appId…). Sans cela, le site reste en **mode démo**.

## Déploiement (depuis ce poste)

```bash
# Renseigner d'abord config.js, puis :
./deploy/deploy.sh <user_ssh> 187.124.52.164 intranet.cradesc.org
```
Le script copie le projet en SSH (mot de passe demandé) dans `/opt/cradesc-intranet`,
puis construit et démarre le conteneur via `docker compose`. Traefik détecte
automatiquement la route (labels dans `deploy/docker-compose.yml`) et émet le
certificat TLS pour le domaine.

## Déploiement (manuel, directement sur le serveur)

```bash
ssh <user>@187.124.52.164
git clone git@github.com:momssn-commits/pilotage_cradec.git
cd pilotage_cradec/cradesc-intranet
# vérifier le nom du réseau Traefik et du certresolver :
docker network ls
DOMAINE=intranet.cradesc.org \
TRAEFIK_NETWORK=traefik \
CERTRESOLVER=letsencrypt \
docker compose -f deploy/docker-compose.yml up -d --build
```

## À adapter selon votre installation Traefik

Dans `deploy/docker-compose.yml` :
- `TRAEFIK_NETWORK` — le réseau Docker de Traefik (`docker network ls`).
- `CERTRESOLVER` — le nom de votre resolver ACME/Let's Encrypt côté Traefik
  (souvent `letsencrypt` ou `myresolver` ; voir la config statique de Traefik).
- `entrypoints` — `web`/`websecure` sont les noms usuels ; ajustez si différents.

## Mode démo en ligne (sans domaine ni Firebase)

Pour publier seulement l'interface de démonstration (utile pour présenter),
laissez `config.js` en l'état : le conteneur fonctionne tel quel. Le sélecteur
de compte simulé remplace Google Sign-In, donc l'absence de domaine n'est pas
bloquante. La même commande `docker compose … up -d --build` s'applique.

## Mettre à jour le site plus tard

Relancer `./deploy/deploy.sh …` (ou `git pull` + `docker compose … up -d --build`
sur le serveur). Le `--build` reconstruit l'image avec le nouveau `hosting/`.
