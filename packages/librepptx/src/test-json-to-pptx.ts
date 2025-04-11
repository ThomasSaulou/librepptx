import * as fs from 'fs';
import * as path from 'path';
import { convertPptxToJson } from './converter';
import { convertJsonToPptx } from './json-to-pptx';

console.log('=== Test de conversion PPTX vers JSON puis JSON vers PPTX (aller-retour) ===');

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
    // Étape 1: Convertir PPTX en JSON
    console.log('\n1) Conversion PPTX -> JSON...');
    const jsonResult = await convertPptxToJson(testPptxPath, {
      outputDir: testOutputDir,
      verbose: true
    });
    
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
    }
    
    // Sauvegarder le résultat JSON dans un fichier
    const jsonOutputPath = path.join(testOutputDir, 'presentation-aller.json');
    fs.writeFileSync(jsonOutputPath, JSON.stringify(jsonResult, null, 2), 'utf8');
    console.log(`\nFichier JSON sauvegardé: ${jsonOutputPath}`);
    
    // Étape 2: Modifier le JSON (optionnel)
    console.log('\n2) Modification du JSON...');
    const modifiedJson = { ...jsonResult };
    
    // Exemple de modification: ajouter un titre à la présentation
    modifiedJson.title = 'Présentation modifiée';
    
    // Exemple de modification: ajouter un élément texte à la première diapositive
    if (modifiedJson.slides.length > 0) {
      modifiedJson.slides[0].elements.push({
        type: 'text',
        id: `text-${Date.now()}`,
        text: 'Cet élément a été ajouté par le test de conversion inverse',
        position: {
          x: 200,
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
    
    // Sauvegarder le JSON modifié
    const modifiedJsonPath = path.join(testOutputDir, 'presentation-modifiee.json');
    fs.writeFileSync(modifiedJsonPath, JSON.stringify(modifiedJson, null, 2), 'utf8');
    console.log(`JSON modifié sauvegardé: ${modifiedJsonPath}`);
    
    // Étape 3: Convertir le JSON modifié en PPTX
    console.log('\n3) Conversion JSON -> PPTX...');
    const pptxResult = await convertJsonToPptx(modifiedJson, {
      outputDir: testOutputDir,
      outputFileName: 'presentation-retour',
      verbose: true,
      keepTempFiles: true // Garder les fichiers FODP intermédiaires pour débogage
    });
    
    console.log('Conversion réussie!');
    console.log(`Fichier PPTX généré: ${pptxResult.outputPath}`);
    console.log(`Taille du fichier PPTX: ${fs.statSync(pptxResult.outputPath).size} octets`);
    
    console.log('\n=== Test aller-retour terminé avec succès! ===');
    console.log('Vous pouvez maintenant ouvrir le fichier PPTX généré pour vérifier le résultat.');
    console.log(`Chemin du fichier PPTX: ${pptxResult.outputPath}`);
  } catch (error) {
    console.error('\nErreur lors des tests:');
    console.error(error);
  }
}

// Exécuter le test
runTest(); 