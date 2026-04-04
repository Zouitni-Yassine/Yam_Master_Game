# Yam's Casino

Jeu de dés multijoueur en ligne inspiré du Yams (variante française du Yahtzee), avec une interface web 3D immersive en style casino, une application mobile React Native/Expo, et un backend Socket.io/MongoDB temps réel.

---

## Note sur le dossier `backend/`

Le dossier `backend/` a été développé en collaboration avec le prof dans le cadre d'une session de travail. Il contient la logique serveur Socket.io complète, mais **il ne correspond pas exactement à la direction finale que je souhaitée pour le projet** — notamment la partie replay visuel complet. L'architecture a été gardée et adaptée, mais une autre solution a été envisagée pour certaines fonctionnalités avancées. Le backend reste fonctionnel et complet pour toutes les fonctionnalités listées ci-dessous.

---

## Architecture du projet

```
├── backend/                    # Serveur Node.js (Socket.io + MongoDB)
│   ├── index.js                # Point d'entrée principal (socket events, logique de jeu)
│   ├── .env                    # Variables d'environnement (URL MongoDB)
│   └── services/
│       ├── game.service.js     # Logique de jeu (dés, grille, combinaisons, score)
│       └── bot.service.js      # IA bot (facile / moyen / difficile)
│
├── web-client/                 # Client web 3D (Three.js, vanilla JS)
│   ├── index.html              # Page principale (UI complète)
│   ├── manifest.json           # PWA manifest
│   ├── css/style.css           # Styles casino
│   ├── js/
│   │   ├── main.js             # Init Three.js, game loop
│   │   ├── contexts/
│   │   │   └── socket-client.js     # Client Socket.io (tous les events)
│   │   ├── controllers/
│   │   │   └── socket-handlers.js   # Gestion des events reçus, UI updates
│   │   ├── services/           # Logique métier côté client
│   │   └── components/
│   │       ├── scene/          # Scène 3D (éclairage, salle casino, décors)
│   │       ├── table/          # Table de jeu 3D (géométrie, surface verre)
│   │       ├── dice/           # Dés 3D (géométrie, textures, physique)
│   │       ├── dice-cup/       # Cornet à dés 3D
│   │       ├── chips/          # Jetons de casino 3D
│   │       └── characters/     # Personnages 3D animés (FBX)
│   ├── models/                 # Modèles 3D FBX (personnages)
│   ├── assets/                 # Images, logos
│   ├── icons/                  # Icônes SVG
│   └── sound/                  # Effets sonores
│
├── frontend/                   # Application mobile React Native / Expo
│   ├── App.js                  # Point d'entrée Expo
│   ├── screens/
│   │   ├── home.screen.js
│   │   ├── online-game.screen.js
│   │   └── vs-bot-game.screen.js
│   └── contexts/
│       └── socket.context.js   # Socket.io client mobile
│
└── mobile/                     # Build natif iOS / Android (Capacitor)
    ├── package.json
    └── capacitor.config.json
```

---

## Stack technique

| Couche          | Technologie                     |
| --------------- | ------------------------------- |
| Backend         | Node.js, Express 4, Socket.io 4 |
| Base de données | MongoDB Atlas (cloud)           |
| Web 3D          | Three.js, FBXLoader, GSAP       |
| Mobile          | React Native 0.81, Expo 54      |
| Build natif     | Capacitor 6 (iOS / Android)     |
| Tunnel local    | localtunnel (dev)               |
| ID uniques      | uniqid                          |

---

## Fonctionnalités

### Jeu

- **Tour par tour** : 30 secondes par tour, chaque joueur lance jusqu'à 3 fois ses 5 dés
- **Verrouillage de dés** : le joueur peut verrouiller/déverrouiller des dés entre les lancés
- **Combinaisons** : Brelan 1–6, Full, Carré, Yam, Suite, ≤8, Sec, Défi
- **Grille de placement** : grille 4×6, le joueur place sa combinaison choisie sur une case
- **Condition de victoire** : 5 cases alignées (ligne, colonne ou diagonale) OU grille remplie (score le plus haut)
- **Déclaration de Défi** : avant le 2ᵉ lancé, le joueur peut cliquer sur la **carte Défi** (affichée à droite de la table). Si la combinaison obtenue n'est pas un Brelan, les gains sont bonifiés. C'est un pari risqué mais récompensé — la carte apparaît avec une animation et reste visible pendant toute la durée du choix

### Modes de jeu

- **vs Bot** : 3 niveaux de difficulté (facile / moyen / difficile), l'IA joue automatiquement
- **En ligne** : file d'attente matchmaking automatique
- **Partie privée (Ami)** : création d'une salle avec code à partager, rejoindre via code

### Compte & Classement

- Inscription / connexion (mot de passe hashé SHA256)
- Profil avec avatar, prénom, nom, email, date de naissance
- Système de score avec progression par victoire/défaite
- Classement global consultable en temps réel

### Reconnexion & Surrender

- **Abandon (Surrender)** : bouton en jeu pour abandonner une partie, l'adversaire est déclaré vainqueur
- **Reconnexion** : en cas de déconnexion, 60 secondes pour se reconnecter (modes en ligne / ami)
- **Bannière de reconnexion** : affichée après login si une partie en cours est disponible
- **Bot** : déconnexion = fin immédiate de partie (pas de reconnexion)

### Rejouer (Rematch)

- **vs Bot** : relance automatiquement une partie contre le bot au même niveau
- **En ligne** : remet en file d'attente
- **Ami** : système d'acceptation mutuelle ("En attente de l'adversaire...")
- **Notification** : si l'adversaire quitte la page game-over, message "L'adversaire a quitté la partie."

### Replay

- Chaque partie est enregistrée en base de données avec l'historique complet de chaque action
- **Bouton "MES PARTIES"** dans le menu principal
- Vue liste de toutes les parties jouées (adversaire, mode, vainqueur, date)
- **Lecture visuelle** par étape :
  - Barre de tour : joueur actif coloré + type d'action (Lancé / Choix / Placement)
  - 5 dés avec faces Unicode (⚀⚁⚂⚃⚄⚅), dés verrouillés mis en valeur
  - Combinaisons disponibles en chips, combinaison sélectionnée surlignée
  - Grille avec couleurs par joueur (rouge = joueur 1, bleu = joueur 2)
  - Contrôles : ⏮ ◀ ▶ ▶| ⏭ + lecture automatique
  - Indicateur d'étape et numéro de lancé

### Interface Web 3D (Three.js)

- **Scène casino** : salle complète avec tables de poker/blackjack en arrière-plan, éclairage ambiant et spots
- **Table de jeu** : surface verte avec plateau en verre translucide, bords en bois
- **Dés 3D** : géométrie custom, textures avec points, animation lors du lancer
- **Cornet à dés** : modèle 3D présent sur la table
- **Jetons (chips)** : visuels 3D colorés comme dans un vrai casino
- **Personnages 3D animés** (FBX) :
  - Bot → personnage "Dice King" assis avec animation de parole
  - Mode online → deux personnages assis inactifs face à face
  - Les personnages sont chargés via FBXLoader et animés avec THREE.AnimationMixer
  - Skippés automatiquement sur mobile bas de gamme pour les performances
- **Effets visuels** : bordure lumineuse sur le tour actif (`turn-glow`), carte défi animée

### Mobile & PWA

- Application React Native disponible (Expo)
- **QR Code** en haut à droite pour joindre la partie depuis mobile
- **PWA** : installable sur téléphone via navigateur (manifest.json, icônes)
- Build iOS/Android natif via Capacitor

---

## Base de données (MongoDB)

**Connexion** : MongoDB Atlas, accessible depuis toutes les IPs (`0.0.0.0/0` dans les règles réseau Atlas).

**Collections** :

- `users` : username, password (SHA256), email, avatar, firstname, lastname, dob, score, wins, losses
- `replays` : idGame, mode, players, winner, finalGrid, moves (snapshots complets), playedAt

**Index** :

- `replays.participantUsernames` (pour récupérer les parties d'un joueur)
- `replays.playedAt` (tri chronologique)

---

## Lancer le projet

### 1. Backend

```bash
cd backend
npm install
node index.js
```

Au démarrage, le terminal affiche :

```
[DB] MongoDB connecté
[Server] En écoute sur *:3000
[Server] Web: http://localhost:3000
[Server] 📱 Mobile public: https://nasty-snail-88.loca.lt
[idvKoEQS1LqFOiyUAAAB] connected
```

- `Web` → URL locale pour jouer depuis le navigateur du même réseau
- `Mobile public` → URL publique générée automatiquement par **localtunnel**, utilisée pour la version mobile via QR code
- Chaque nouvelle connexion socket affiche son ID en console

Le fichier `backend/.env` doit contenir :

```
MONGO_URL=mongodb+srv://...
```

### 2. Client web

Le client web est servi automatiquement par le backend depuis le dossier `/web-client`.
Ouvrir http://localhost:3000 dans le navigateur après avoir lancé le backend.

Pas de build requis — HTML/CSS/JS vanilla servis statiquement.

### 3. Version mobile via QR Code

Dans la version web, un bouton **QR Code** est disponible en haut à droite. Il génère automatiquement le QR code de l'URL publique localtunnel.

**Flux pour jouer sur mobile :**

1. Scanner le QR code depuis un téléphone (iOS ou Android)
2. Une page s'ouvre demandant de **copier l'URL du tunnel hébergé**
3. Coller l'URL dans le champ et cliquer sur **Continue**
4. Le navigateur mobile charge directement la version mobile du jeu

> Cette étape de confirmation est imposée par localtunnel pour éviter les abus sur les tunnels publics.

### 5. Build natif iOS / Android (Capacitor)

```bash
cd mobile
npx cap sync
npx cap open ios      # Ouvre Xcode
npx cap open android  # Ouvre Android Studio
```

---

## Tests unitaires

Les services backend sont couverts par **123 tests unitaires** avec Jest.

### Lancer les tests

```bash
cd backend
npm test                # tous les tests
npm run test:coverage   # avec rapport de couverture
npm run test:watch      # mode watch pendant le développement
```

### Couverture

| Fichier | Instructions | Branches | Fonctions | Lignes |
|---|---|---|---|---|
| `bot.service.js` | 100 % | 100 % | 100 % | 100 % |
| `game.service.js` | 99.47 % | 95.14 % | 98.11 % | 99.27 % |
| **Total** | **99.65 %** | **96.89 %** | **98.68 %** | **99.48 %** |

### Architecture des tests

```
backend/tests/
├── helpers/
│   └── fixtures.js               ← factories partagées (dés, grilles, jeux simulés)
└── __tests__/
    ├── game-service/
    │   ├── init.test.js           ← initialisation de l'état de jeu, deck, grille, choices
    │   ├── timer.test.js          ← durées de tour
    │   ├── dices.test.js          ← lancer et verrouillage des dés
    │   ├── utils.test.js          ← recherche par ID, socket, index de dé
    │   ├── grid.test.js           ← sélection de cases, calcul des scores, détection victoire
    │   ├── choices.test.js        ← détection des combinaisons, verrouillage des dés par combo
    │   └── send.test.js           ← états de vue envoyés aux joueurs (timer, deck, choix, grille)
    └── bot-service/
        ├── decideLock.test.js     ← stratégie de verrouillage par difficulté (easy/medium/hard)
        ├── decideChoice.test.js   ← choix de la combinaison optimale
        ├── decideCell.test.js     ← choix de la case optimale sur la grille
        └── scoreCell.test.js      ← algorithme de scoring (gain×2 + blocage×1.5, victoire=1000)
```

### Ce que les tests couvrent

- **Immutabilité** : chaque fonction retourne de nouveaux objets sans modifier les originaux
- **Cas nominaux** : Brelan, Full, Carré, Yam, Suite, ≤8, Sec, Défi — toutes les combinaisons
- **Cas limites** : tableau vide, dés non lancés, grille pleine, socket inexistant, jeu terminé
- **IA bot** : les trois niveaux de difficulté (easy/medium/hard), préférence pour la victoire immédiate, blocage adverse
- **Scoring** : alignements horizontaux, verticaux et diagonaux, 3→1pt, 4→2pts, 5→victoire
- **Jeux terminés** : `findGameIndexBySocketId` ignore les jeux avec `ended = true`

---

## Events Socket.io (résumé)

| Direction        | Event                         | Description                                |
| ---------------- | ----------------------------- | ------------------------------------------ |
| Client → Serveur | `user.register`               | Inscription                                |
| Client → Serveur | `user.login`                  | Connexion                                  |
| Client → Serveur | `queue.join`                  | Rejoindre la file en ligne                 |
| Client → Serveur | `queue.join.bot`              | Jouer contre le bot                        |
| Client → Serveur | `room.create` / `room.join`   | Partie privée                              |
| Client → Serveur | `game.dices.roll`             | Lancer les dés                             |
| Client → Serveur | `game.dices.lock`             | Verrouiller un dé                          |
| Client → Serveur | `game.choices.selected`       | Choisir une combinaison                    |
| Client → Serveur | `game.grid.selected`          | Placer sur la grille                       |
| Client → Serveur | `game.surrender`              | Abandonner                                 |
| Client → Serveur | `game.reconnect`              | Se reconnecter à une partie                |
| Client → Serveur | `game.rematch.request`        | Demander un rematch                        |
| Client → Serveur | `game.gameover.leave`         | Quitter l'écran fin de partie              |
| Client → Serveur | `user.replays.get`            | Récupérer ses replays                      |
| Client → Serveur | `replay.get`                  | Charger un replay spécifique               |
| Serveur → Client | `game.start`                  | Début de partie (mode, difficulté, idGame) |
| Serveur → Client | `game.deck.view-state`        | État des dés                               |
| Serveur → Client | `game.choices.view-state`     | Combinaisons disponibles                   |
| Serveur → Client | `game.grid.view-state`        | État de la grille (+ winner si fin)        |
| Serveur → Client | `game.surrendered`            | Fin par abandon                            |
| Serveur → Client | `game.opponent.disconnected`  | Adversaire déconnecté                      |
| Serveur → Client | `game.opponent.reconnected`   | Adversaire reconnecté                      |
| Serveur → Client | `game.opponent.timeout`       | Adversaire expiré                          |
| Serveur → Client | `game.reconnected`            | Reconnexion réussie (état complet)         |
| Serveur → Client | `game.rematch.requested`      | L'adversaire veut rejouer                  |
| Serveur → Client | `game.rematch.accepted`       | Rematch accepté                            |
| Serveur → Client | `game.opponent.left.gameover` | L'adversaire a quitté                      |
| Serveur → Client | `ranking.update`              | Mise à jour du classement                  |
| Serveur → Client | `user.replays.list`           | Liste des replays                          |
| Serveur → Client | `replay.data`                 | Données d'un replay complet                |
