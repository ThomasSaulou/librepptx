import { convertPptxToHtml, convertPptxToPdf, convertPptxToFodp, ConversionResult } from './index';
import path from 'path';
import fs from 'fs/promises';

async function testConversion() {
  try {
    // Créer un répertoire de test
    const testDir = path.join(__dirname, '../test-output');
    await fs.mkdir(testDir, { recursive: true });

    // Chemin du fichier PPTX à convertir
    const inputFile = path.join(__dirname, '../test-files/test.pptx');

    console.log('Début des tests de conversion...');
    console.log('Fichier d\'entrée:', inputFile);

    // Test de conversion en HTML
    console.log('\n1. Test de conversion en HTML:');
    const htmlResult = await convertPptxToHtml(inputFile, { outputDir: testDir });
    const htmlPath = typeof htmlResult === 'string' ? htmlResult : htmlResult.outputPath;
    console.log(`HTML généré: ${htmlPath}`);
    
    // Vérifier la structure du HTML généré
    const htmlDir = path.dirname(htmlPath);
    const files = await fs.readdir(htmlDir);
    console.log('Fichiers générés:', files);

    // Test de conversion en PDF
    console.log('\n2. Test de conversion en PDF:');
    const pdfResult = await convertPptxToPdf(inputFile, { outputDir: testDir });
    const pdfPath = typeof pdfResult === 'string' ? pdfResult : pdfResult.outputPath;
    console.log(`PDF généré: ${pdfPath}`);

    // Test de conversion en FODP
    console.log('\n3. Test de conversion en FODP:');
    const fodpResult = await convertPptxToFodp(inputFile, { outputDir: testDir });
    const fodpPath = typeof fodpResult === 'string' ? fodpResult : fodpResult.outputPath;
    console.log(`FODP généré: ${fodpPath}`);

    console.log('\nTous les tests de conversion ont réussi!');
  } catch (error) {
    console.error('Erreur lors des tests:', error);
  }
}

// Exécuter les tests
testConversion(); 