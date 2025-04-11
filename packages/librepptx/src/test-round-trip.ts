import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import { convertPptxToJson } from './converter';
import { convertJsonToPptx } from './json-to-pptx';
import { TextElement, Slide } from './converter';

console.log('=== Test de conversion complète (aller-retour) ===');
console.log('PPTX original → JSON → Modification → PPTX modifié');

// Chemin vers un fichier PPTX de test
const testPptxPath = path.join(__dirname, '../test-files/test.pptx');

// Répertoire de sortie pour les tests
const testOutputDir = path.join(__dirname, '../test-output/round-trip-test');

// S'assurer que le répertoire de sortie existe
if (!fs.existsSync(testOutputDir)) {
  fs.mkdirSync(testOutputDir, { recursive: true });
}

console.log(`Fichier de test PPTX: ${testPptxPath}`);
console.log(`Le fichier existe: ${fs.existsSync(testPptxPath)}`);
console.log(`Répertoire de sortie: ${testOutputDir}`);

// Fonction principale de test
async function runRoundTripTest() {
  try {
    // Étape 1: Convertir PPTX original en JSON
    console.log('\n1) Conversion PPTX original → JSON...');
    const jsonResult = await convertPptxToJson(testPptxPath, {
      outputDir: testOutputDir,
      verbose: true
    });
    
    console.log('Conversion réussie!');
    console.log('Titre de la présentation:', jsonResult.title);
    console.log('Nombre de diapositives:', jsonResult.slides.length);
    
    // Sauvegarder le JSON initial
    const initialJsonPath = path.join(testOutputDir, 'initial.json');
    fs.writeFileSync(initialJsonPath, JSON.stringify(jsonResult, null, 2), 'utf8');
    console.log(`JSON initial sauvegardé: ${initialJsonPath}`);
    
    // Étape 2: Modifier le JSON
    console.log('\n2) Modification du JSON...');
    const modifiedJson = JSON.parse(JSON.stringify(jsonResult)); // Copie profonde
    
    // Modification du titre de la présentation
    modifiedJson.title = 'Présentation modifiée par le test d\'aller-retour';
    
    // Ajouter un élément texte à chaque diapositive
    modifiedJson.slides.forEach((slide: Slide, index: number) => {
      const textElement: TextElement = {
        type: 'text',
        id: `text-added-${Date.now()}-${index}`,
        text: `Ce texte a été ajouté par le test d'aller-retour (Diapo ${index + 1})`,
        position: {
          x: 100,
          y: 350,
          width: 400,
          height: 50
        },
        style: {
          fontFamily: 'Arial',
          fontSize: 16,
          color: '#FF0000',
          bold: true,
          italic: false
        }
      };
      
      slide.elements.push(textElement);
      console.log(`Élément texte ajouté à la diapositive ${index + 1}`);
    });
    
    // Sauvegarder le JSON modifié
    const modifiedJsonPath = path.join(testOutputDir, 'modified.json');
    fs.writeFileSync(modifiedJsonPath, JSON.stringify(modifiedJson, null, 2), 'utf8');
    console.log(`JSON modifié sauvegardé: ${modifiedJsonPath}`);
    
    // Étape 3: Convertir le JSON modifié en nouveau PPTX
    console.log('\n3) Conversion JSON modifié → PPTX...');
    const pptxResult = await convertJsonToPptx(modifiedJson, {
      outputDir: testOutputDir,
      outputFileName: 'final',
      keepTempFiles: true // Garder les fichiers intermédiaires pour débogage
    });
    
    console.log('Conversion réussie!');
    console.log(`Fichier PPTX final généré: ${pptxResult.outputPath}`);
    console.log(`Taille du fichier PPTX: ${fs.statSync(pptxResult.outputPath).size} octets`);
    
    // Copier le fichier PPTX original pour comparaison
    const originalCopyPath = path.join(testOutputDir, 'original.pptx');
    fs.copyFileSync(testPptxPath, originalCopyPath);
    console.log(`Copie du PPTX original: ${originalCopyPath}`);
    
    // Résumé du test
    console.log('\n=== Résumé du test d\'aller-retour ===');
    console.log('1. PPTX original:', testPptxPath);
    console.log('2. Conversion en JSON:', initialJsonPath);
    console.log('3. JSON modifié:', modifiedJsonPath);
    console.log('4. PPTX final:', pptxResult.outputPath);
    
    console.log('\nVous pouvez maintenant comparer les fichiers PPTX original et final:');
    console.log(`- Original: ${originalCopyPath}`);
    console.log(`- Final (modifié): ${pptxResult.outputPath}`);
    
    // Tenter d'ouvrir les fichiers avec l'application par défaut (selon l'OS)
    try {
      if (process.platform === 'darwin') { // macOS
        console.log('\nTentative d\'ouverture des deux fichiers PPTX...');
        execSync(`open "${originalCopyPath}"`);
        execSync(`open "${pptxResult.outputPath}"`);
      } else if (process.platform === 'win32') { // Windows
        console.log('\nTentative d\'ouverture des deux fichiers PPTX...');
        execSync(`start "" "${originalCopyPath}"`);
        execSync(`start "" "${pptxResult.outputPath}"`);
      } else { // Linux ou autres
        console.log('\nVous pouvez ouvrir les fichiers manuellement pour les comparer.');
      }
    } catch (error) {
      console.log('Impossible d\'ouvrir automatiquement les fichiers.');
    }
    
    console.log('\n=== Test d\'aller-retour terminé avec succès! ===');
  } catch (error) {
    console.error('\nErreur lors du test d\'aller-retour:');
    console.error(error);
  }
}

// Exécuter le test
runRoundTripTest(); 