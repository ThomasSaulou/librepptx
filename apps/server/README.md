# Serveur d'exemple LibrePPTX

Ce serveur Express.js fournit des API pour démontrer l'utilisation de la bibliothèque LibrePPTX.

## Fonctionnalités

- Conversion de fichiers PPTX en HTML avec création d'archive ZIP
- Conversion de données JSON en fichiers PPTX
- Pages de test pour tester les fonctionnalités

## Installation

```bash
cd apps/server
npm install
```

## Démarrage du serveur

```bash
npm run dev
```

Le serveur démarrera sur le port 3000 par défaut (configurable via la variable d'environnement PORT).

## Endpoints disponibles

### 1. Conversion PPTX en HTML

**Endpoint**: `/convert/pptx-to-html`
**Méthode**: POST
**Contenu**: Fichier .pptx (multipart/form-data, champ: 'file')
**Retourne**: Fichier ZIP contenant le HTML et les ressources

### 2. Conversion JSON en PPTX

**Endpoint**: `/export/json-to-pptx`
**Méthode**: POST
**Contenu**: JSON (application/json)
**Format**:
```json
{
  "presentation": {
    "title": "Titre de la présentation",
    "slides": [
      {
        "id": "slide-1",
        "title": "Première diapositive",
        "elements": [
          {
            "type": "text",
            "id": "text-1",
            "text": "Contenu texte",
            "position": {
              "x": 100,
              "y": 50,
              "width": 400,
              "height": 50
            },
            "style": {
              "fontFamily": "Arial",
              "fontSize": 24,
              "color": "#333333",
              "bold": true
            }
          }
        ]
      }
    ]
  }
}
```
**Retourne**: Fichier PPTX

## Pages de test

- `/test` - Page HTML pour tester la conversion PPTX vers HTML
- `/test-json-to-pptx` - Page HTML pour tester la conversion JSON vers PPTX

## Structure du projet

- `src/index.ts` - Point d'entrée du serveur
- `public/` - Fichiers statiques (pages HTML de test)
- `uploads/` - Répertoire temporaire pour les fichiers uploadés
- `converted/` - Répertoire pour les fichiers convertis

## Exemples

### Exemple de conversion PPTX vers HTML via cURL

```bash
curl -X POST -F "file=@presentation.pptx" http://localhost:3000/convert/pptx-to-html -o presentation.zip
```

### Exemple de conversion JSON vers PPTX via cURL

```bash
curl -X POST -H "Content-Type: application/json" -d @presentation.json http://localhost:3000/export/json-to-pptx -o presentation.pptx
```

Où `presentation.json` contient l'objet JSON décrit ci-dessus.

## Licence

MIT 