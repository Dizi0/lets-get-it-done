# 🚀 TaskFlow — Application de Gestion de Tâches Temps Réel

[![CI Pipeline](https://github.com/Dizi0/lets-get-it-done/actions/workflows/ci.yml/badge.svg)](https://github.com/Dizi0/lets-get-it-done/actions)
![NestJS](https://img.shields.io/badge/NestJS-12-E0234E?style=flat&logo=nestjs&logoColor=white)
![Nuxt 3](https://img.shields.io/badge/Nuxt_3-Vue_3-00DC82?style=flat&logo=nuxtdotjs&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?style=flat&logo=prisma&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=flat&logo=postgresql&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat&logo=tailwind-css&logoColor=white)
![Socket.io](https://img.shields.io/badge/Socket.io-Realtime-010101?style=flat&logo=socketdotio&logoColor=white)

Application collaborative de gestion de listes et de tâches développée selon les standards **Lead Developer** : architecture modulaire, double authentification JWT avec cookies sécurisés `httpOnly`, synchronisation temps réel par salon WebSocket, tests unitaires et E2E automatisés, et conteneurisation Docker multi-stage.

---

## ⚡ Démarrage Rapide (3 commandes)

```bash
# 1. Cloner le projet
git clone https://github.com/Dizi0/lets-get-it-done.git && cd lets-get-it-done

# 2. Configurer les variables d'environnement
cp .env.example .env

# 3. Lancer l'ensemble de la stack avec Docker Compose
docker compose up --build
```

- **Frontend (Nuxt 3)** : [http://localhost:3000](http://localhost:3000)
- **Backend API (NestJS)** : [http://localhost:3001/api](http://localhost:3001/api)
- **Documentation Swagger OpenAPI** : [http://localhost:3001/api/docs](http://localhost:3001/api/docs)

---

## 🏗️ Architecture Globale & Organisation du Code

Le projet est organisé sous la forme d'un monorepo propre et découplé :

```text
lets-get-it-done/
├── backend/                  # API REST & WebSocket Gateway NestJS
│   ├── prisma/               # Modèle relationnel & migrations PostgreSQL
│   ├── src/
│   │   ├── common/           # Filtres d'exceptions, décorateurs, guards, services partagés
│   │   │   ├── decorators/   # @CurrentUser(), @Public()
│   │   │   ├── filters/      # AllExceptionsFilter (format d'erreur standardisé)
│   │   │   ├── guards/       # JwtAuthGuard global (defensive security)
│   │   │   ├── services/     # HashingService (abstraction Bcrypt/Argon2)
│   │   │   └── validators/   # @Match() pour validation de confirmation
│   │   ├── modules/
│   │   │   ├── auth/         # Authentification, double token JWT, rotation refresh
│   │   │   ├── users/        # Gestion et isolation des profils utilisateurs
│   │   │   ├── lists/        # CRUD des listes de tâches (titre unique par user)
│   │   │   ├── tasks/        # CRUD des tâches, échéance, bascule d'état actif/terminé
│   │   │   └── websocket/    # EventsGateway Socket.io & gestion des rooms
│   │   └── main.ts           # ValidationPipe, CookieParser, Swagger, CORS
│   └── test/                 # Suite de tests E2E automatisés (flux complet)
│
├── frontend/                 # Application Client Nuxt 3 / Vue 3
│   ├── assets/css/           # Styles Tailwind CSS et scrollbars sur mesure
│   ├── components/           # Composants atomiques (LeftSidebar, MainContent, RightSidebar, TaskCard, ConfirmModal)
│   ├── composables/          # useApi (intercepteur 401 transparent), useSocket (gestion temps réel)
│   ├── middleware/           # auth.global.ts (protection des routes clientes)
│   ├── pages/                # Pages /login, /register, / (Dashboard 3 zones)
│   ├── stores/               # Stores Pinia (auth, lists, tasks avec mutations réactives)
│   └── types/                # Interfaces TypeScript strictes
│
├── docker-compose.yml        # Orchestration locale (PostgreSQL + NestJS + Nuxt)
└── .github/workflows/ci.yml  # Pipeline CI (Lint, Tests Unitaires, Tests E2E, Builds)
```

---

## 💡 Justification des Choix Techniques

### 1. Pourquoi Nuxt 3 plutôt qu'une SPA Vue classique ?
- **Architecture & Conventions** : Nuxt 3 structure nativement le routing par fichiers, les middlewares de navigation, et l'auto-import des composables, évitant le boilerplate excessif d'une SPA Vue artisanale.
- **Client HTTP optimisé ($fetch / ofetch)** : Gestion intégrée des en-têtes et des cookies lors des requêtes asynchrones, facilitant l'interception des codes `401 Unauthorized` pour la rotation automatique du token.
- **Évolutivité future** : Si l'application nécessite du rendu côté serveur (SSR) pour du SEO ou des landing pages publiques, le framework est déjà prêt sans réécriture.

### 2. Pourquoi Pinia pour la gestion d'état ?
- **Standard officiel Vue 3** : Recommandé par l'équipe Vue au détriment de Vuex.
- **Typage TypeScript natif** : Autocomplétion parfaite sans besoin de types complexes ou de mutations verbeuses.
- **Modularité** : Découpage clair en stores autonomes (`useAuthStore`, `useListStore`, `useTaskStore`) favorisant la séparation des responsabilités.

### 3. Structure du Temps Réel (WebSocket & Socket.io)
- **Isolation par Salons (*Rooms*)** : Les connexions s'abonnent dynamiquement au salon de la liste sélectionnée (`list:{listId}`). Lors d'une création, mise à jour ou suppression, l'événement n'est diffusé qu'aux clients connectés sur cette liste précise, réduisant drastiquement le trafic réseau inutile.
- **Handshake sécurisé** : Le JWT est vérifié dès la négociation de la connexion WebSocket (`handleConnection`). Tout socket anonyme ou expiré est immédiatement déconnecté.
- **Mise à jour Optimiste & Réactive** : À la réception d'un événement (`task:created`, `task:updated`, `task:deleted`, `task:completed`), le store Pinia mute directement son état local **sans effectuer de re-fetch HTTP**, garantissant une synchronisation instantanée sous les 20ms.

---

## 🔒 Approche Sécurité & Isolation des Données

1. **Double Token JWT & Cookies `httpOnly`** :
   - **Access Token (15 min)** : Court, stocké en mémoire client pour les appels API et le handshake WS.
   - **Refresh Token (7 jours)** : Long, stocké dans un cookie `httpOnly`, `SameSite=Strict/Lax`, inaccessible en JavaScript via XSS.
   - **Stockage hashé en base** : Pour prévenir le vol de session en cas de fuite de base de données, seul le hash (Bcrypt) du refresh token est conservé (`users.hashedRefreshToken`).
2. **Defensive Design côté NestJS** :
   - `JwtAuthGuard` appliqué globalement (`APP_GUARD`) : toutes les routes sont privées par défaut. Seules les routes explicitement décorées avec `@Public()` (login, register, swagger) sont ouvertes.
3. **Isolation stricte par `userId`** :
   - Aucun endpoint ne fait confiance aux IDs passés en paramètre sans vérifier l'appartenance de la ressource (`where: { id, userId }` ou `where: { id, list: { userId } }`).
   - Toute tentative d'accès à une ressource d'un autre utilisateur renvoie un `404 Not Found` défensif pour interdire l'énumération de données.

---

## 🧪 Tests Automatisés

Le projet inclut une suite de tests unitaires et de bout en bout :

```bash
# Exécuter les tests unitaires backend (AuthService, TasksService, AppController)
cd backend && npm run test

# Exécuter le test E2E (Flux complet : Inscription -> Connexion -> Création Liste -> Tâche -> Suppression)
cd backend && npm run test:e2e
```

---

## 🔮 Ce qui aurait été fait différemment avec plus de temps (Production-Ready)

1. **Base de données managée & Connection Pooling** :
   - En production, remplacer le conteneur PostgreSQL local par un service managé cloud (AWS RDS / Cloud SQL) avec réplicas en lecture et **PgBouncer** pour absorber des milliers de connexions concurrentes.
2. **Redis Pub/Sub pour le Scaling Horizontal WebSocket** :
   - Utiliser `@socket.io/redis-adapter` pour synchroniser les salons WebSocket sur un cluster de plusieurs instances NestJS derrière un Load Balancer.
3. **Rate Limiting & Protection Brute-Force** :
   - Mise en place de `@nestjs/throttler` avec backend Redis pour limiter les tentatives de connexion sur `/api/auth/login` et `/api/auth/register`.
4. **Monitoring & Observabilité** :
   - Intégration d'OpenTelemetry, Prometheus et Sentry pour le tracking des erreurs en temps réel et les métriques APM.

---

## 🎯 Ce qui aurait été testé en priorité avec plus de temps

1. **Tests de composants Vue & Stores Pinia** :
   - Mise en place de `@vue/test-utils` et Vitest côté frontend pour tester les interactions utilisateur (clic modal, dépliage des tâches terminées).
2. **Tests de charge WebSocket** :
   - Scripts de benchmarks avec **Artillery** ou **K6** simulant 5 000 utilisateurs connectés simultanément modifiant des tâches en temps réel.
3. **Tests de Sécurité Automatisés (OWASP ZAP)** :
   - Scans automatisés dans la CI pour vérifier la résistance aux failles CSRF, XSS et injections SQL.
