import { XMLParser } from 'fast-xml-parser';
import * as fs from 'fs';
import * as path from 'path';
import { convertPptxToFodp } from './index';
import { convertFodpToJson, convertPptxToJson, Presentation } from './converter';

console.log('=== Test de conversion PPTX vers JSON ===');

// Chemin vers un fichier PPTX de test
const testPptxPath = path.join(__dirname, '../test-files/test.pptx');

// Répertoire de sortie pour les tests
const testOutputDir = path.join(__dirname, '../test-output');

// S'assurer que le répertoire de sortie existe
if (!fs.existsSync(testOutputDir)) {
  fs.mkdirSync(testOutputDir, { recursive: true });
}

console.log(`Fichier de test PPTX: ${testPptxPath}`);
console.log(`Le fichier existe: ${fs.existsSync(testPptxPath)}`);
console.log(`Répertoire de sortie: ${testOutputDir}`);

// Fonction principale de test
async function runTest() {
  try {
    // Étape 1: Convertir PPTX en FODP
    console.log('\n1) Conversion PPTX -> FODP...');
    const fodpResult = await convertPptxToFodp(testPptxPath, {
      outputDir: testOutputDir,
      verbose: true
    });
    
    let fodpPath = '';
    if (typeof fodpResult === 'string') {
      fodpPath = fodpResult;
    } else {
      fodpPath = fodpResult.outputPath;
    }
    
    console.log(`Conversion réussie! Fichier FODP généré: ${fodpPath}`);
    console.log(`Taille du fichier FODP: ${fs.statSync(fodpPath).size} octets`);
    
    // Étape 2: Convertir FODP en JSON
    console.log('\n2) Conversion FODP -> JSON...');
    const jsonResult = await convertFodpToJson(fodpPath);
    
    // Afficher un aperçu du résultat JSON
    console.log('Conversion réussie!');
    console.log('\nAperçu de la structure JSON:');
    console.log('Titre de la présentation:', jsonResult.title);
    console.log('Nombre de diapositives:', jsonResult.slides.length);
    
    // Afficher les détails de la première diapositive
    if (jsonResult.slides.length > 0) {
      const firstSlide = jsonResult.slides[0];
      console.log('\nPremière diapositive:');
      console.log('- ID:', firstSlide.id);
      console.log('- Titre:', firstSlide.title || '(pas de titre)');
      console.log('- Nombre d\'éléments:', firstSlide.elements.length);
      
      // Afficher le type des éléments
      if (firstSlide.elements.length > 0) {
        console.log('- Types d\'éléments:');
        const elementTypes: Record<string, number> = {};
        firstSlide.elements.forEach(element => {
          elementTypes[element.type] = (elementTypes[element.type] || 0) + 1;
        });
        
        Object.entries(elementTypes).forEach(([type, count]) => {
          console.log(`  * ${type}: ${count}`);
        });
      }
    }
    
    // Sauvegarder le résultat JSON dans un fichier
    const jsonOutputPath = path.join(testOutputDir, 'presentation.json');
    fs.writeFileSync(jsonOutputPath, JSON.stringify(jsonResult, null, 2), 'utf8');
    console.log(`\nFichier JSON sauvegardé: ${jsonOutputPath}`);
    
    // Étape 3: Test de la fonction combinée (directement de PPTX à JSON)
    console.log('\n3) Test de conversion directe PPTX -> JSON...');
    const directJsonResult = await convertPptxToJson(testPptxPath, {
      outputDir: testOutputDir,
      verbose: true
    });
    
    console.log('Conversion directe réussie!');
    console.log('Titre de la présentation:', directJsonResult.title);
    console.log('Nombre de diapositives:', directJsonResult.slides.length);
    
    // Comparer les résultats
    const isEquivalent = JSON.stringify(jsonResult) === JSON.stringify(directJsonResult);
    console.log('\nLes résultats sont identiques:', isEquivalent);
    
    console.log('\n=== Test terminé avec succès! ===');
  } catch (error) {
    console.error('\nErreur lors des tests:');
    console.error(error);
  }
}

// Exécuter le test
runTest();
