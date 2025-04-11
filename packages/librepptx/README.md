# LibrePPTX

Une bibliothèque Node.js permettant de convertir des fichiers PowerPoint (PPTX) en différents formats (HTML, PDF, FODP) en utilisant LibreOffice.

## Prérequis

- Node.js 14.x ou supérieur
- LibreOffice installé et accessible dans le PATH

## Installation

```bash
npm install librepptx
```

## Fonctionnalités principales

- Conversion de fichiers PPTX vers HTML (avec ressources zippées)
- Conversion de fichiers PPTX vers PDF
- Conversion de fichiers PPTX vers FODP (Format OpenDocument Flat)
- Conversion de fichiers FODP vers PPTX
- Gestion d'erreurs avancée
- Options de configuration flexibles

## Utilisation de base

```javascript
const { convertPptxToHtml, convertPptxToPdf, convertPptxToFodp, convertFodpToPptx } = require('librepptx');

// Conversion PPTX vers HTML (avec ressources zippées)
try {
  const htmlZipPath = await convertPptxToHtml('/chemin/vers/presentation.pptx', '/chemin/sortie');
  console.log('Fichier HTML zippé créé:', htmlZipPath);
} catch (error) {
  console.error('Erreur de conversion:', error.message);
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