import path from 'path';
import fs from 'fs';
import { convertPptxToHtml } from './index';

async function testConversion() {
  try {
    // Chemin du fichier de test
    const inputFile = path.resolve(__dirname, '../test-files/test.pptx');
    
    // Dossier de sortie
    const outputDir = path.resolve(__dirname, '../output');
    
    // S'assurer que le dossier de sortie existe
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    console.log('Fichier d\'entrée:', inputFile);
    console.log('Dossier de sortie:', outputDir);
    
    // Convertir le fichier PPTX en HTML
    console.log('Début de la conversion...');
    const zipFile = await convertPptxToHtml(inputFile, outputDir);
    
    console.log('Conversion terminée!');
    console.log('Fichier ZIP généré:', zipFile);
    
    // Instructions pour le test
    console.log('\nPour tester:');
    console.log('1. Extraire le contenu du ZIP dans un dossier');
    console.log('2. Ouvrir le fichier HTML dans un navigateur');
    
  } catch (error) {
    console.error('Erreur lors du test:', error);
  }
}

testConversion(); 