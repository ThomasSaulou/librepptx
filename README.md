# LibrePPTX

Une bibliothèque Node.js pour convertir et manipuler des fichiers PowerPoint (PPTX) en utilisant LibreOffice.

## Fonctionnalités

- Conversion de fichiers PPTX en HTML, PDF et FODP (Format OpenDocument Presentation)
- Conversion de fichiers FODP en PPTX
- Création automatique d'archives ZIP pour les sorties HTML avec toutes les ressources
- Utilisation de LibreOffice en mode headless pour des conversions rapides
- API simple et facile à utiliser

## Prérequis

- Node.js 14.0.0 ou supérieur
- LibreOffice installé et accessible dans le PATH

### Installation de LibreOffice

#### macOS
```bash
brew install libreoffice
```

#### Linux (Debian/Ubuntu)
```bash
sudo apt-get update
sudo apt-get install libreoffice
```

#### Windows
Téléchargez et installez LibreOffice depuis [le site officiel](https://www.libreoffice.org/download/download/).

## Installation

```bash
npm install librepptx
```

## Utilisation

### Conversion de PPTX en HTML

```javascript
const { convertPptxToHtml } = require('librepptx');

async function convertMyPresentation() {
  try {
    const htmlPath = await convertPptxToHtml('presentation.pptx', {
      outputDir: './output',
      htmlOptions: {
        createZip: true // Créer un fichier ZIP avec tous les assets
      }
    });
    
    console.log(`Présentation convertie avec succès: ${htmlPath}`);
  } catch (error) {
    console.error('Erreur lors de la conversion:', error);
  }
}

convertMyPresentation();
```

### Conversion de PPTX en PDF

```javascript
const { convertPptxToPdf } = require('librepptx');

async function convertToFPdf() {
  try {
    const pdfPath = await convertPptxToPdf('presentation.pptx', {
      outputDir: './output'
    });
    
    console.log(`PDF généré: ${pdfPath}`);
  } catch (error) {
    console.error('Erreur lors de la conversion:', error);
  }
}

convertToFPdf();
```

### Vérifier si LibreOffice est installé

```javascript
const { checkLibreOfficeInstallation } = require('librepptx');

async function checkLibreOffice() {
  try {
    const isInstalled = await checkLibreOfficeInstallation();
    console.log('LibreOffice est bien installé!');
  } catch (error) {
    console.error('LibreOffice n\'est pas installé ou n\'est pas accessible:', error.message);
  }
}

checkLibreOffice();
```

## Options de conversion

L'objet options accepte les propriétés suivantes:

```javascript
{
  // Répertoire de sortie (par défaut: répertoire du fichier d'entrée)
  outputDir: './output', 
  
  // Format de sortie 
  format: 'html', // 'html', 'pdf', 'fodp' ou 'pptx'
  
  // Nom du fichier de sortie sans extension (par défaut: nom_original_timestamp)
  outputFileName: 'ma_presentation',
  
  // Conserver les fichiers temporaires (pour débogage)
  keepTempFiles: false,
  
  // Afficher les logs détaillés
  verbose: false,
  
  // Options spécifiques au format HTML
  htmlOptions: {
    // Créer un ZIP contenant le HTML et ressources
    createZip: true,
    
    // Inclure les styles dans le HTML
    embedStyles: false
  },
  
  // Options spécifiques au format PDF
  pdfOptions: {
    // Qualité de l'export (1-100)
    quality: 90
  }
}
```

## Contribuer

Les contributions sont les bienvenues ! N'hésitez pas à ouvrir une issue ou soumettre une pull request.

## Licence

MIT 