# Mise en ligne sur 187.124.52.164 (Traefik)

Le serveur tourne derrière **Traefik** (reverse-proxy Docker : redirection
HTTP→HTTPS active, certificat par défaut auto-signé). On déploie donc le front
comme un **conteneur statique (nginx)** exposé via une **route Traefik**.

## Mode retenu : réel, SANS nom de domaine

- **Connexion par e-mail + mot de passe** (`METHODE_AUTH="password"` dans
  `app/config.js`). Choisi parce que **Google Sign-In refuse les adresses IP
  nues** : sur `187.124.52.164` sans domaine, le bouton Google ne peut pas
  aboutir. L'e-mail/mot de passe fonctionne depuis n'importe quelle origine.
  Le jour où un domaine HTTPS est en place, basculez `METHODE_AUTH="google"`.
- **Super-administrateur : `momssn@gmail.com`** (rôle `admin`). Aucune donnée
  ni compte de test.
- **Aucune restriction de domaine** (`DOMAINES_AUTORISES = []`) : les comptes
  sont créés explicitement par l'administrateur (pas d'inscription libre).

### Pré-requis (à faire une fois, par vous)

1. **Créer le projet Firebase** (console Firebase) + activer Authentication
   (fournisseur **E-mail/Mot de passe**), Firestore (production), Functions,
   Hosting. *(Seul vous pouvez le faire : compte Google + facturation.)*
2. **Renseigner `hosting/app/config.js`** avec la config du projet (apiKey,
   projectId, appId…). Sans cela, le site reste en **mode démo**.
3. **Déployer le backend** (chez Google, pas sur ce serveur) :
   ```bash
   cd cradesc-intranet
   firebase deploy --only firestore:rules,firestore:indexes,functions
   ```
4. **Créer le super-administrateur** (compte + rôle admin + fiche agent) :
   ```bash
   cd functions && npm install
   GOOGLE_APPLICATION_CREDENTIALS=/chemin/cle-service.json \
   ADMIN_PASSWORD='un-mot-de-passe-fort' \
   node seed.js --project=<votre-projet>
   ```
   Vous vous connecterez ensuite avec **momssn@gmail.com** + ce mot de passe.

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

## Mode démo en ligne (sans Firebase)

Pour publier seulement l'interface (utile pour présenter), laissez `config.js`
en l'état : le conteneur fonctionne tel quel. La connexion se fait par le bouton
« Entrer (super-administrateur) » (données simulées), donc l'absence de domaine
et de projet Firebase n'est pas bloquante. La même commande
`docker compose … up -d --build` s'applique.

## Mettre à jour le site plus tard

Relancer `./deploy/deploy.sh …` (ou `git pull` + `docker compose … up -d --build`
sur le serveur). Le `--build` reconstruit l'image avec le nouveau `hosting/`.
