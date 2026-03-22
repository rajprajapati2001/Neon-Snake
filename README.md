![Neon Snake Icon](/src/assets/neon-snake-main-icon_128x128.png)
# Neon Snake
Neon Snake is a sleek, mobile-optimized take on the classic snake game, built with React, Vite, and Tailwind CSS. Featuring intuitive swipe controls, vibrant neon visuals, and smooth animations, this project showcases modern frontend development—prioritizing performance, responsive design, and engaging user experiences. Play now and chase the high score!

Neon Snake React Vite TailwindCSS CSS JavaScript Lucide-React Motion Node.js
![Neon Snake](https://img.shields.io/badge/Neon-Snake%20Game-green?style=for-the-badge) ![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white) ![NGINX](https://img.shields.io/badge/NGINX-009639?style=for-the-badge&logo=NGINX&logoColor=FFFFFF) ![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB) ![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white) ![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)  ![CSS](https://img.shields.io/badge/CSS-663399?style=for-the-badge&logo=CSS&logoColor=FFFFFF) ![Lucide](https://img.shields.io/badge/Lucide-F56565?style=for-the-badge&logo=Lucide&logoColor=FFFFFF) ![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=TypeScript&logoColor=FFFFFF) ![Gameloft](https://img.shields.io/badge/Gameloft-000000?style=for-the-badge&logo=Gameloft&logoColor=FFFFFF) ![Node.js](https://img.shields.io/badge/Node.js-5FA04E?style=for-the-badge&logo=Node.js&logoColor=FFFFFF) 


🌐 Website: [https://neon-snake-blond.vercel.app/](https://neon-snake-blond.vercel.app/)

## Screenshots
![Neon Snake Screenshot](/src/assets/neon-snake-all-componets.jpg)

## Tech Stack
| Layer | Technology |
| :--- | :--- |
| Frontend | React + Vite |
| Styling | Tailwind CSS |
| Icons | Lucide React |
| Animations | Motion |

## Project Structure
```bash
neon-snake/
├── node_modules/
├── public/
│   └── index.html
├── src/
│   ├── assets/
│   │   ├── neon-snake-main-icon_512x512.png
│   │   └── swipleicon.png
│   ├── components/
│   │   ├── GameBoard.tsx
│   │   ├── Hud.tsx
│   │   └── MobileControls.tsx
│   ├── hooks/
│   │   └── useSnakeGame.ts
│   ├── utils/
│   │   ├── json.ts
│   │   └── sound.ts
│   ├── types.ts
│   ├── App.tsx
│   ├── index.css
│   └── main.tsx
├── .dockerignore
├── docker-compose.yml
├── Dockerfile
├── package.json
├── README.md
├── tsconfig.json
└── vite.config.ts
```

## 🚀 Getting Started — Local Development

### Install & Run
1. **Install dependencies**
   ```bash
   npm install
   ```
2. **Start the dev server (React + Vite)**
   ```bash
   npm run dev
   ```
   * The Vite dev server runs on port 3000 by default. (See dev script in `package.json`)
   * Open [http://localhost:3000](http://localhost:3000) in your browser.

---
## 🐳 Run with Docker

This project includes a `Dockerfile` and `docker-compose.yaml` for running the app in a container, providing a consistent environment across machines.


1. Build & start the app (rebuild)

```bash
docker-compose up -d --build
```
2. Start using an existing image (no rebuild)

```bash
docker-compose up
```
3. Stop and remove containers

```bash
docker-compose down
```
>The app is available at http://localhost:3000

>Port mapping: `3000 (host) → 3000 (container)>`

>See the `docker-compose.yaml` for service configuration.

## Useful Files

- `Dockerfile` — container image build instructions ([Dockerfile](Dockerfile#L1)).
- `docker-compose.yaml` — service definition and port mapping ([docker-compose.yaml](docker-compose.yaml#L1)).
- `package.json` — npm scripts used for development and build ([package.json](package.json#L1)).

## Development tips

- If running in Docker, the compose file mounts the project directory so HMR updates work.
- If you change the port, update the `dev` script in [package.json](package.json#L1) and the port mapping in [docker-compose.yaml](docker-compose.yaml#L1).

---


## 📜 License
This project is open-source and available under the MIT License.

**Raj Prajapati**

Developed on 22nd March 2026 / Sunday.
