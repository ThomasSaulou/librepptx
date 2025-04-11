import express, { Request, Response } from 'express';
import multer from 'multer';
import cors from 'cors';
import path from 'path';
import fs from 'fs/promises';
import { createWriteStream, existsSync } from 'fs';
import archiver from 'archiver';
import { convertPptxToHtml } from '../../../packages/librepptx/src';

const app = express();
const port = process.env.PORT || 3000;

// Configuration de multer pour le stockage des fichiers
const storage = multer.diskStorage({
  destination: (_req: Request, _file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) => {
    const uploadDir = path.join(__dirname, '../../uploads');
    fs.mkdir(uploadDir, { recursive: true })
      .then(() => cb(null, uploadDir))
      .catch(err => cb(err, uploadDir));
  },
  filename: (_req: Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ 
  storage,
  fileFilter: (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    if (file.mimetype === 'application/vnd.openxmlformats-officedocument.presentationml.presentation') {
      cb(null, true);
    } else {
      cb(new Error('Seuls les fichiers .pptx sont acceptés'));
    }
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Chemin absolu vers le dossier public
const publicPath = path.join(__dirname, '../public');
console.log('Chemin public:', publicPath);

// Servir les fichiers statiques
app.use(express.static(publicPath));

// Route de test
app.get('/test', (_req: Request, res: Response) => {
  const testHtmlPath = path.join(publicPath, 'test.html');
  console.log('Chemin test.html:', testHtmlPath);
  res.sendFile(testHtmlPath);
});

// Endpoint de conversion
app.post('/convert/pptx-to-html', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Aucun fichier n\'a été uploadé' });
    }

    console.log('1. Fichier reçu:', req.file);
    const inputPath = req.file.path;
    const outputDir = path.join(__dirname, '../../converted', path.basename(inputPath, '.pptx'));
    console.log('2. Chemin de sortie:', outputDir);

    // Convertir le fichier
    console.log('3. Début de la conversion...');
    const htmlPath = await convertPptxToHtml(inputPath, { outputDir });
    console.log('4. Conversion terminée, fichier HTML:', htmlPath);

    // Vérifier que le fichier HTML existe
    if (!existsSync(htmlPath)) {
      throw new Error(`Le fichier HTML de sortie n'existe pas: ${htmlPath}`);
    }

    // Vérifier le contenu du dossier de sortie
    const outputFiles = await fs.readdir(outputDir);
    console.log('5. Fichiers générés:', outputFiles);

    if (outputFiles.length === 0) {
      throw new Error('Le dossier de sortie est vide après la conversion');
    }

    // Créer un zip contenant le HTML et les ressources
    const zipPath = path.join(__dirname, '../../converted', `${path.basename(inputPath, '.pptx')}.zip`);
    console.log('6. Création du ZIP:', zipPath);
    
    const output = createWriteStream(zipPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    // Ajouter des logs pour l'archivage
    archive.on('entry', (entry) => {
      console.log('7. Ajout au ZIP:', entry.name);
    });

    output.on('close', async () => {
      console.log('8. ZIP créé avec succès');
      
      // Vérifier la taille du ZIP
      const stats = await fs.stat(zipPath);
      console.log('9. Taille du ZIP:', stats.size, 'bytes');

      // Nettoyer les fichiers temporaires
      await fs.unlink(inputPath);
      await fs.rm(outputDir, { recursive: true, force: true });

      // Envoyer le zip au client
      res.download(zipPath, async (err) => {
        if (err) {
          console.error('Erreur lors de l\'envoi du fichier:', err);
        }
        // Nettoyer le zip après l'envoi
        await fs.unlink(zipPath).catch(console.error);
      });
    });

    archive.on('error', (err) => {
      console.error('Erreur lors de la création du ZIP:', err);
      throw err;
    });

    archive.on('warning', (err) => {
      console.warn('Avertissement lors de la création du ZIP:', err);
    });

    archive.pipe(output);
    console.log('10. Ajout des fichiers au ZIP depuis:', outputDir);
    archive.directory(outputDir, false);
    await archive.finalize();

  } catch (error) {
    console.error('Erreur lors de la conversion:', error);
    res.status(500).json({ error: 'Erreur lors de la conversion du fichier' });
  }
});

// Démarrer le serveur
app.listen(port, () => {
  console.log(`Serveur démarré sur le port ${port}`);
  console.log(`Page de test disponible sur http://localhost:${port}/test`);
}); 