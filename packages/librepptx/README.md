# LibrePPTX

Une bibliothèque Node.js permettant de convertir des fichiers PowerPoint (PPTX) en différents formats (HTML, PDF, FODP) en utilisant LibreOffice.

## Prérequis

- Node.js 14.x ou supérieur
- LibreOffice installé et accessible dans le PATH

## Installation

```bash
npm install librepptx
```

## Fonctionnalités

- Conversion de fichiers PPTX en HTML, PDF et FODP (Format OpenDocument Presentation)
- Conversion de fichiers FODP en PPTX
- Conversion de fichiers PPTX en JSON (pour édition)
- Conversion de JSON en PPTX (pour générer des présentations modifiées)
- Création automatique d'archives ZIP pour les sorties HTML avec toutes les ressources
- Utilisation de LibreOffice en mode headless pour des conversions rapides
- API simple et facile à utiliser
- Possibilité de faire des aller-retours complets : PPTX → JSON → Modification → PPTX

## Fonctionnalités principales

- Conversion de fichiers PPTX vers HTML (avec ressources zippées)
- Conversion de fichiers PPTX vers PDF
- Conversion de fichiers PPTX vers FODP (Format OpenDocument Flat)
- Conversion de fichiers FODP vers PPTX
- Conversion de fichiers PPTX vers JSON (structure éditable)
- Gestion d'erreurs avancée
- Options de configuration flexibles

## Utilisation de base

```javascript
const { 
  convertPptxToHtml, 
  convertPptxToPdf, 
  convertPptxToFodp, 
  convertFodpToPptx,
  convertPptxToJson
} = require('librepptx');

// Conversion PPTX vers HTML (avec ressources zippées)
try {
  const htmlZipPath = await convertPptxToHtml('/chemin/vers/presentation.pptx', '/chemin/sortie');
  console.log('Fichier HTML zippé créé:', htmlZipPath);
} catch (error) {
  console.error('Erreur de conversion:', error.message);
}

// Conversion PPTX vers une structure JSON
try {
  const jsonResult = await convertPptxToJson('/chemin/vers/presentation.pptx', {
    outputDir: '/chemin/sortie',
    verbose: true
  });
  console.log('Titre de la présentation:', jsonResult.title);
  console.log('Nombre de diapositives:', jsonResult.slides.length);
} catch (error) {
  console.error('Erreur de conversion JSON:', error.message);
}

// Conversion PPTX vers PDF
try {
  const pdfResult = await convertPptxToPdf('/chemin/vers/presentation.pptx', {
    outputDir: '/chemin/sortie',
    outputFileName: 'ma-presentation'
  });
  console.log('Fichier PDF créé:', pdfResult.outputPath);
} catch (error) {
  console.error('Erreur de conversion:', error.message);
}
```

## API

### Fonctions principales

#### `convertPptxToHtml(inputPath, options)`

Convertit un fichier PPTX en HTML.

- **inputPath**: Chemin du fichier PPTX d'entrée
- **options**: Options de conversion ou chemin du dossier de sortie (string)
- **Retourne**: Chemin du fichier ZIP contenant le HTML et ses ressources, ou un objet `ConversionResult`

#### `convertPptxToPdf(inputPath, options)`

Convertit un fichier PPTX en PDF.

- **inputPath**: Chemin du fichier PPTX d'entrée
- **options**: Options de conversion
- **Retourne**: Objet `ConversionResult` contenant le chemin du fichier PDF généré

#### `convertPptxToFodp(inputPath, options)`

Convertit un fichier PPTX en FODP (Format OpenDocument Flat).

- **inputPath**: Chemin du fichier PPTX d'entrée
- **options**: Options de conversion
- **Retourne**: Objet `ConversionResult` contenant le chemin du fichier FODP généré

#### `convertFodpToPptx(inputPath, options)`

Convertit un fichier FODP en PPTX.

- **inputPath**: Chemin du fichier FODP d'entrée
- **options**: Options de conversion
- **Retourne**: Objet `ConversionResult` contenant le chemin du fichier PPTX généré

#### `convertPptxToJson(inputPath, options)`

Convertit un fichier PPTX en structure JSON éditable.

- **inputPath**: Chemin du fichier PPTX d'entrée
- **options**: Options de conversion
- **Retourne**: Objet `Presentation` contenant la structure complète de la présentation

#### `convertFodpToJson(fodpPath)`

Convertit un fichier FODP en structure JSON éditable.

- **fodpPath**: Chemin du fichier FODP d'entrée
- **Retourne**: Objet `Presentation` contenant la structure complète de la présentation

#### `convertJsonToPptx(presentation, options)`

Convertit une structure JSON en fichier PPTX via FODP.

- **presentation**: Objet JSON représentant la présentation
- **options**: Options de conversion
- **Retourne**: Objet `ConversionResult` contenant le chemin du fichier PPTX généré

### Options de conversion

```typescript
interface ConversionOptions {
  // Répertoire de sortie pour les fichiers générés
  outputDir?: string;
  
  // Format de sortie désiré
  format?: 'html' | 'pdf' | 'fodp' | 'pptx';
  
  // Nom du fichier de sortie (sans extension)
  outputFileName?: string;
  
  // Si vrai, conserve les fichiers temporaires après la conversion
  keepTempFiles?: boolean;
  
  // Si vrai, les messages de log sont détaillés
  verbose?: boolean;
  
  // Options spécifiques au format HTML
  htmlOptions?: {
    // Si vrai, crée un fichier ZIP contenant le HTML et ses ressources
    createZip?: boolean;
    
    // Si vrai, inclut les feuilles de style dans le HTML
    embedStyles?: boolean;
  };
  
  // Options spécifiques au format PDF
  pdfOptions?: {
    // Qualité de l'export (1-100)
    quality?: number;
  };
}
```

### Gestion des journaux (logs)

```javascript
const { setLogLevel, LogLevel } = require('librepptx');

// Configurer le niveau de log
setLogLevel(LogLevel.DEBUG); // Plus verbeux
setLogLevel(LogLevel.ERROR); // Erreurs uniquement
```

## Gestion des erreurs

La bibliothèque fournit des classes d'erreur personnalisées pour une meilleure gestion des problèmes:

```javascript
const { 
  LibrepptxError,
  LibreOfficeNotFoundError,
  InvalidInputFileError,
  OutputGenerationError,
  ConversionError
} = require('librepptx');

try {
  await convertPptxToHtml('/chemin/vers/presentation.pptx', '/chemin/sortie');
} catch (error) {
  if (error instanceof LibreOfficeNotFoundError) {
    console.error('LibreOffice n\'est pas installé ou accessible');
  } else if (error instanceof InvalidInputFileError) {
    console.error('Le fichier d\'entrée est invalide ou n\'existe pas');
  } else if (error instanceof ConversionError) {
    console.error(`Erreur de conversion: ${error.message}`);
    console.error(`Code de sortie: ${error.exitCode}`);
    console.error(`Erreur standard: ${error.stderr}`);
  } else {
    console.error(`Erreur inattendue: ${error.message}`);
  }
}
```

## Exemple complet

```javascript
const { 
  convertPptxToHtml,
  convertPptxToPdf,
  setLogLevel,
  LogLevel,
  LibreOfficeNotFoundError
} = require('librepptx');
const path = require('path');

async function convertPresentation() {
  // Configurer le niveau de log
  setLogLevel(LogLevel.INFO);
  
  try {
    // Vérifier que LibreOffice est installé
    await checkLibreOfficeInstallation();
    
    // Convertir en HTML
    const htmlResult = await convertPptxToHtml(
      '/chemin/vers/presentation.pptx',
      {
        outputDir: './output',
        outputFileName: 'ma-presentation-html',
        htmlOptions: {
          createZip: true
        }
      }
    );
    
    console.log(`Conversion HTML réussie: ${htmlResult.outputPath}`);
    
    // Convertir en PDF
    const pdfResult = await convertPptxToPdf(
      '/chemin/vers/presentation.pptx',
      {
        outputDir: './output',
        outputFileName: 'ma-presentation-pdf'
      }
    );
    
    console.log(`Conversion PDF réussie: ${pdfResult.outputPath}`);
    
  } catch (error) {
    if (error instanceof LibreOfficeNotFoundError) {
      console.error('Veuillez installer LibreOffice pour utiliser cette bibliothèque');
    } else {
      console.error('Erreur:', error.message);
    }
  }
}

convertPresentation();
```

## Limitations

- LibreOffice doit être installé et accessible dans le PATH du système
- La bibliothèque ne prend pas en charge les conversions vers d'autres formats que HTML, PDF et FODP pour le moment
- La mise en page HTML peut différer légèrement de la présentation originale

## Licence

MIT 

### Conversion de PPTX en JSON (pour édition)

```javascript
const { convertPptxToJson } = require('librepptx');

async function convertToJson() {
  try {
    const jsonData = await convertPptxToJson('presentation.pptx', {
      outputDir: './output'
    });
    
    console.log('Titre de la présentation:', jsonData.title);
    console.log('Nombre de diapositives:', jsonData.slides.length);
    
    // Sauvegarder le JSON
    const fs = require('fs');
    fs.writeFileSync('presentation.json', JSON.stringify(jsonData, null, 2));
    
    console.log('Données JSON extraites et sauvegardées');
  } catch (error) {
    console.error('Erreur lors de la conversion:', error);
  }
}

convertToJson();
```

### Conversion de JSON en PPTX

```javascript
const { convertJsonToPptx } = require('librepptx');
const fs = require('fs');

async function convertJsonToPptxFile() {
  try {
    // Charger un fichier JSON existant
    const jsonData = JSON.parse(fs.readFileSync('presentation.json', 'utf8'));
    
    // Convertir en PPTX
    const result = await convertJsonToPptx(jsonData, {
      outputDir: './output',
      outputFileName: 'presentation_modifiee'
    });
    
    console.log(`Présentation PPTX générée: ${result.outputPath}`);
  } catch (error) {
    console.error('Erreur lors de la conversion:', error);
  }
}

convertJsonToPptxFile();
```

### Modification du JSON et conversion en PPTX

```javascript
const { convertPptxToJson, convertJsonToPptx } = require('librepptx');

async function modifyAndConvert() {
  try {
    // 1. Convertir PPTX en JSON
    const jsonData = await convertPptxToJson('presentation.pptx');
    
    // 2. Modifier le JSON
    jsonData.title = 'Présentation modifiée';
    
    // Ajouter un élément texte à la première diapositive
    if (jsonData.slides.length > 0) {
      jsonData.slides[0].elements.push({
        type: 'text',
        id: `text-${Date.now()}`,
        text: 'Ce texte a été ajouté programmatiquement',
        position: {
          x: 100,
          y: 300,
          width: 400,
          height: 50
        },
        style: {
          fontFamily: 'Arial',
          fontSize: 18,
          color: '#FF0000',
          bold: true
        }
      });
    }
    
    // 3. Convertir le JSON modifié en PPTX
    const result = await convertJsonToPptx(jsonData, {
      outputDir: './output',
      outputFileName: 'presentation_modifiee'
    });
    
    console.log(`Présentation modifiée et convertie: ${result.outputPath}`);
  } catch (error) {
    console.error('Erreur lors de la modification et conversion:', error);
  }
}

modifyAndConvert();
```

## Structure du JSON

Le format JSON pour représenter une présentation suit cette structure:

```javascript
{
  "title": "Titre de la présentation",
  "slides": [
    {
      "id": "slide-1",
      "title": "Première diapositive",
      "elements": [
        {
          "type": "text",
          "id": "text-1",
          "text": "Titre de la diapositive",
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
            "bold": true,
            "italic": false,
            "underline": false,
            "align": "center"
          }
        },
        {
          "type": "image",
          "id": "image-1",
          "src": "chemin/vers/image.jpg",
          "position": {
            "x": 150,
            "y": 150,
            "width": 300,
            "height": 200
          },
          "alt": "Description de l'image"
        },
        {
          "type": "shape",
          "id": "shape-1",
          "shapeType": "rectangle",
          "position": {
            "x": 100,
            "y": 350,
            "width": 150,
            "height": 100
          },
          "style": {
            "fill": "#E6F7FF",
            "stroke": "#1890FF",
            "strokeWidth": 2
          },
          "text": "Texte dans la forme"
        }
      ],
      "background": {
        "color": "#FFFFFF"
      }
    }
  ],
  "metadata": {
    "author": "Auteur",
    "created": "2023-01-01T12:00:00.000Z",
    "modified": "2023-01-02T12:00:00.000Z",
    "description": "Description de la présentation"
  }
}
``` 