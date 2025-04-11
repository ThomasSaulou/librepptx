import { convertPptxToJson, JsonConversionOptions } from './converter';
import * as path from 'path';
import * as fs from 'fs/promises';

async function testJsonConversion() {
  try {
    console.log('Début du test de conversion en JSON...');
    
    // Créer un répertoire de test
    const testDir = path.join(__dirname, '../test-output/json');
    console.log(`Création du répertoire de test: ${testDir}`);
    await fs.mkdir(testDir, { recursive: true });

    // Chemin du fichier PPTX à convertir
    const inputFile = path.join(__dirname, '../test-files/test.pptx');
    console.log('Fichier d\'entrée:', inputFile);
    
    // Vérifier que le fichier PPTX existe
    try {
      const stats = await fs.stat(inputFile);
      console.log(`Le fichier PPTX existe, taille: ${stats.size} octets`);
    } catch (error) {
      console.error(`Erreur: Le fichier PPTX n'existe pas ou n'est pas accessible: ${inputFile}`);
      return;
    }

    // Convertir PPTX en JSON
    console.log('Début de la conversion PPTX → JSON...');
    const options: JsonConversionOptions = { outputDir: testDir };
    const presentation = await convertPptxToJson(inputFile, options);
    
    // Enregistrer le JSON dans un fichier
    const jsonPath = path.join(testDir, 'presentation.json');
    console.log(`Enregistrement du JSON dans: ${jsonPath}`);
    await fs.writeFile(jsonPath, JSON.stringify(presentation, null, 2));
    
    console.log(`JSON généré: ${jsonPath}`);
    console.log(`Nombre de diapositives: ${presentation.slides.length}`);
    
    // Afficher un résumé de chaque diapositive
    presentation.slides.forEach((slide, index) => {
      console.log(`\nDiapositive ${index + 1}:`);
      console.log(`- ID: ${slide.id}`);
      console.log(`- Nombre d'éléments: ${slide.elements.length}`);
      
      // Résumé des éléments par type
      const elementsByType = slide.elements.reduce((acc, element) => {
        acc[element.type] = (acc[element.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      console.log('- Éléments par type:');
      Object.entries(elementsByType).forEach(([type, count]) => {
        console.log(`  * ${type}: ${count}`);
      });
      
      // Afficher le texte des éléments textuels
      const textElements = slide.elements.filter(element => element.type === 'text');
      if (textElements.length > 0) {
        console.log('- Éléments textuels:');
        textElements.forEach((element, idx) => {
          const textEl = element as any; // Pour éviter les erreurs TypeScript
          console.log(`  * Texte ${idx + 1}: ${textEl.text.substring(0, 50)}${textEl.text.length > 50 ? '...' : ''}`);
        });
      }
    });

    console.log('\nLe test de conversion en JSON a réussi!');
  } catch (error) {
    console.error('Erreur lors du test:', error);
    console.error(error);
  }
}

// Exécuter le test
console.log('Démarrage du test de conversion PPTX en JSON...');
testJsonConversion().catch(error => {
  console.error('Erreur non gérée:', error);
}); 