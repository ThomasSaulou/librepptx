# Utiliser une image de base Ubuntu
FROM ubuntu:22.04

# Éviter les interactions pendant l'installation
ENV DEBIAN_FRONTEND=noninteractive

# Installation des dépendances
RUN apt-get update && apt-get install -y \
    nodejs \
    npm \
    libreoffice \
    libreoffice-writer \
    libreoffice-impress \
    && rm -rf /var/lib/apt/lists/*

# Créer le répertoire de l'application
WORKDIR /app

# Copier les fichiers du projet
COPY package*.json ./
COPY packages ./packages
COPY apps ./apps
COPY tsconfig.json ./

# Installer les dépendances
RUN npm install

# Build le projet
RUN cd packages/librepptx && npm run build

# Exposer le port pour l'API (à venir)
EXPOSE 3000

# Commande par défaut (à adapter selon les besoins)
CMD ["node", "apps/server/dist/index.js"] 