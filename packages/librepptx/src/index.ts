import { spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import AdmZip from 'adm-zip';
import { exec } from 'child_process';
import rimraf from 'rimraf';
import { 
  ConversionOptions, 
  ConversionResult,
  LogLevel,
  SupportedInputFormat,
  SupportedOutputFormat
} from './types';
import { 
  LibrepptxError, 
  ConversionError, 
  InvalidInputFileError, 
  OutputGenerationError,
  UnsupportedFormatError,
  LibreOfficeNotFoundError
} from './errors';
import {
  logger,
  verifyLibreOfficeInstallation,
  createTempDir,
  cleanupTempDir,
  measureExecutionTime,
  execPromise as execPromiseUtil,
  fsExists,
  fsReadDir,
  fsMkdir,
  fsCopyFile,
  fsUnlink,
  fsStat,
  fsRmDir,
  checkLibreOfficeInstallation,
  ensureDirectoryExists,
  createTempDirectory,
  safeRemoveDirectory,
  copyFile,
  fileExistsWithContent,
  getFilesWithExtension,
  logError,
  logDebug
} from './utils';

// Exports pour utilisation publique
export * from './types';
export * from './errors';
export { 
  setLogLevel, 
  getLogLevel, 
  checkLibreOfficeInstallation 
} from './utils';

/**
 * Convertit un fichier PPTX en HTML avec options avancées
 * 
 * @param inputPath Chemin du fichier PPTX d'entrée
 * @param options Options de conversion
 * @returns Résultat de la conversion avec le chemin du fichier HTML généré
 */
export async function convertPptxToHtml(
  inputPath: string, 
  options: ConversionOptions | string = {}
): Promise<string | ConversionResult> {
  // Rétrocompatibilité : si options est une string, c'est le outputDir
  if (typeof options === 'string') {
    options = { outputDir: options };
  }
  
  options = {
    ...options,
    format: 'html',
    htmlOptions: {
      createZip: true,
      ...(options.htmlOptions || {})
    }
  };
  
  return convertFile(inputPath, options);
}

/**
 * Convertit un fichier PPTX en PDF
 * 
 * @param inputPath Chemin du fichier PPTX d'entrée
 * @param options Options de conversion
 * @returns Résultat de la conversion avec le chemin du fichier PDF généré
 */
export async function convertPptxToPdf(
  inputPath: string,
  options: ConversionOptions = {}
): Promise<string | ConversionResult> {
  options = {
    ...options,
    format: 'pdf'
  };
  
  return convertFile(inputPath, options);
}

/**
 * Convertit un fichier PPTX en format OpenDocument Flat (FODP)
 * 
 * @param inputPath Chemin du fichier PPTX d'entrée
 * @param options Options de conversion
 * @returns Résultat de la conversion avec le chemin du fichier FODP généré
 */
export async function convertPptxToFodp(
  inputPath: string,
  options: ConversionOptions = {}
): Promise<string | ConversionResult> {
  options = {
    ...options,
    format: 'fodp'
  };
  
  return convertFile(inputPath, options);
}

/**
 * Convertit un fichier OpenDocument Flat (FODP) en PPTX
 * 
 * @param inputPath Chemin du fichier FODP d'entrée
 * @param options Options de conversion
 * @returns Résultat de la conversion avec le chemin du fichier PPTX généré
 */
export async function convertFodpToPptx(
  inputPath: string,
  options: ConversionOptions = {}
): Promise<string | ConversionResult> {
  options = {
    ...options,
    format: 'pptx'
  };
  
  return convertFile(inputPath, options, 'fodp');
}

/**
 * Fonction principale de conversion pour tous les formats
 * 
 * @param inputPath Chemin du fichier d'entrée
 * @param options Options de conversion
 * @param inputFormat Format du fichier d'entrée (par défaut pptx)
 * @returns Résultat de la conversion
 */
async function convertFile(
  inputPath: string,
  options: ConversionOptions,
  inputFormat: SupportedInputFormat = 'pptx'
): Promise<string | ConversionResult> {
  logger.info(`Starting conversion from ${inputFormat} to ${options.format}`);
  
  // Vérifier que LibreOffice est installé
  try {
    await verifyLibreOfficeInstallation();
  } catch (error) {
    if (error instanceof LibreOfficeNotFoundError) {
      logger.error(`LibreOffice not found: ${error.message}`);
    }
    throw error;
  }
  
  // Vérifier que le fichier d'entrée existe
  if (!fsExists(inputPath)) {
    throw new InvalidInputFileError(inputPath);
  }
  
  // Obtenir des infos sur le fichier d'entrée
  let fileStats;
  try {
    fileStats = await fsStat(inputPath);
    logger.debug(`Input file size: ${fileStats.size} bytes`);
  } catch (error) {
    throw new InvalidInputFileError(inputPath, 'could not read file stats');
  }
  
  // Préparer les dossiers de sortie
  const outputDir = options.outputDir || path.dirname(inputPath);
  await fsMkdir(outputDir, { recursive: true });
  
  // Créer un nom de fichier de sortie si non spécifié
  const outputFileName = options.outputFileName || 
    `${path.basename(inputPath, path.extname(inputPath))}_converted_${Date.now()}`;
  
  // Variables pour mesurer le temps
  const startTime = new Date();
  
  // Dossier temporaire pour la conversion
  let tempDir = '';
  try {
    // Créer un dossier temporaire
    tempDir = await createTempDir();
    logger.debug(`Created temp directory: ${tempDir}`);
    
    // Copier le fichier dans le dossier temporaire avec un nom simple
    const tempInputFileName = `input.${inputFormat}`;
    const tempInputPath = path.join(tempDir, tempInputFileName);
    await fsCopyFile(inputPath, tempInputPath);
    logger.debug(`Copied input file to: ${tempInputPath}`);
    
    // Préparer la commande LibreOffice
    const outputFormat = options.format as SupportedOutputFormat;
    
    // Conversion avec LibreOffice
    const conversionResult = await executeLibreOfficeConversion(
      tempInputPath, 
      tempDir, 
      outputFormat
    );
    
    // Traitement des fichiers générés selon le format
    let result: ConversionResult;
    
    if (outputFormat === 'html' && options.htmlOptions?.createZip) {
      result = await processHtmlOutput(
        tempDir, 
        outputDir, 
        outputFileName, 
        conversionResult.outputFileName,
        options
      );
    } else {
      // Traitement standard pour les autres formats (pdf, fodp, pptx)
      const finalOutputPath = path.join(outputDir, `${outputFileName}.${outputFormat}`);
      await fsCopyFile(
        path.join(tempDir, conversionResult.outputFileName), 
        finalOutputPath
      );
      
      result = {
        outputPath: finalOutputPath,
        format: outputFormat,
        conversionInfo: {
          startTime,
          endTime: new Date(),
          duration: new Date().getTime() - startTime.getTime()
        }
      };
    }
    
    // Nettoyer le dossier temporaire sauf si demandé explicitement de le garder
    if (!options.keepTempFiles) {
      await cleanupTempDir(tempDir);
    }
    
    logger.info(`Conversion completed successfully in ${result.conversionInfo?.duration}ms`);
    
    // En mode rétrocompatibilité, renvoyer juste le chemin du fichier
    if ('htmlOptions' in options && options.htmlOptions?.createZip) {
      return result.outputPath;
    }
    
    return result;
  } catch (error) {
    // Nettoyer le dossier temporaire en cas d'erreur
    if (tempDir && fsExists(tempDir) && !options.keepTempFiles) {
      await cleanupTempDir(tempDir).catch(e => {
        logger.error(`Failed to clean up temp directory: ${e.message}`);
      });
    }
    
    if (error instanceof LibrepptxError) {
      throw error;
    } else {
      logger.error(`Conversion error: ${error instanceof Error ? error.message : String(error)}`);
      throw new ConversionError(`Unexpected error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

/**
 * Exécute la conversion avec LibreOffice
 */
async function executeLibreOfficeConversion(
  inputPath: string,
  outputDir: string,
  format: SupportedOutputFormat
): Promise<{ outputFileName: string, stdOutput: string, exitCode: number }> {
  // Simplifier le format pour LibreOffice si besoin
  const libreOfficeFormat = format === 'html' ? 'html' : format;
  
  return new Promise((resolve, reject) => {
    logger.debug(`Starting LibreOffice conversion to ${format}`);
    
    const args = [
      '--headless',
      '--convert-to',
      libreOfficeFormat,
      '--outdir',
      outputDir,
      inputPath
    ];
    
    logger.debug(`LibreOffice command: soffice ${args.join(' ')}`);
    
    // Déterminer quelle commande utiliser (soffice ou libreoffice)
    let libreOfficeCommand = 'soffice';
    
    // Essayer de détecter si libreoffice est disponible
    try {
      execPromiseUtil('libreoffice --version').then(() => {
        libreOfficeCommand = 'libreoffice';
      }).catch(() => {
        // Garder soffice comme commande par défaut
      });
    } catch (error) {
      // Ignorer l'erreur et garder soffice comme commande par défaut
    }
    
    logger.debug(`Using command: ${libreOfficeCommand}`);
    
    const process = spawn(libreOfficeCommand, args);
    let stdout = '';
    let stderr = '';
    
    process.stdout.on('data', (data) => {
      const output = data.toString();
      stdout += output;
      logger.debug(`LibreOffice output: ${output.trim()}`);
    });
    
    process.stderr.on('data', (data) => {
      const output = data.toString();
      stderr += output;
      logger.warn(`LibreOffice error: ${output.trim()}`);
    });
    
    process.on('close', async (code) => {
      logger.debug(`LibreOffice process exited with code ${code}`);
      
      // S'assurer que le code est un nombre (gérer le cas où il est null)
      const exitCode = code !== null ? code : -1;
      
      if (exitCode !== 0) {
        return reject(new ConversionError(
          `LibreOffice process exited with code ${exitCode}`, 
          exitCode, 
          stderr
        ));
      }
      
      try {
        // Trouver le fichier de sortie généré
        const files = await fsReadDir(outputDir);
        logger.debug(`Files in output directory: ${files.join(', ')}`);
        
        // Chercher le fichier qui correspond à notre format, y compris input.{format}
        let outputFile = files.find(file => file.endsWith(`.${format}`));
        
        // Si le format est HTML, vérifier aussi l'extension .htm
        if (!outputFile && format === 'html') {
          outputFile = files.find(file => file.endsWith('.htm'));
        }
        
        if (!outputFile) {
          logger.error(`Could not find output file in format ${format}. Files in directory: ${files.join(', ')}`);
          return reject(new OutputGenerationError(
            `Could not find output file in format ${format}`
          ));
        }
        
        return resolve({
          outputFileName: outputFile,
          stdOutput: stdout,
          exitCode
        });
      } catch (error) {
        reject(new OutputGenerationError(
          `Failed to process output files: ${error instanceof Error ? error.message : String(error)}`
        ));
      }
    });
    
    process.on('error', (error) => {
      reject(new LibreOfficeNotFoundError(
        `Failed to spawn LibreOffice process: ${error.message}`
      ));
    });
  });
}

/**
 * Traitement spécifique pour les sorties HTML
 */
async function processHtmlOutput(
  tempDir: string,
  outputDir: string,
  outputFileName: string,
  htmlFileName: string,
  options: ConversionOptions
): Promise<ConversionResult> {
  const htmlPath = path.join(tempDir, htmlFileName);
  
  // Vérifier que le fichier HTML existe
  if (!fsExists(htmlPath)) {
    throw new OutputGenerationError(`HTML file not generated: ${htmlPath}`);
  }
  
  // Créer un zip contenant le HTML et les ressources
  const zipPath = path.join(outputDir, `${outputFileName}.zip`);
  const zip = new AdmZip();
  
  // Ajouter le fichier HTML principal
  zip.addLocalFile(htmlPath);
  
  // Chercher le dossier de ressources HTML (généralement nom_fichier_html_files)
  const resourceDirName = htmlFileName.replace('.html', '') + '_html_files';
  const resourceDir = path.join(tempDir, resourceDirName);
  
  // Liste des fichiers additionnels
  const additionalFiles: string[] = [];
  
  // Ajouter les ressources si elles existent
  if (fsExists(resourceDir)) {
    const files = await fsReadDir(resourceDir);
    
    files.forEach((file: string) => {
      const filePath = path.join(resourceDir, file);
      // Ajouter au zip dans un sous-dossier html_files
      zip.addLocalFile(filePath, 'html_files');
      additionalFiles.push(filePath);
    });
  }
  
  // Écrire le zip
  zip.writeZip(zipPath);
  
  // Si l'option createZip n'est pas activée, on devrait faire une autre opération
  // mais comme elle est activée par défaut, on laisse comme ça pour l'instant
  
  return {
    outputPath: zipPath,
    additionalFiles,
    format: 'html',
    conversionInfo: {
      startTime: new Date(),
      endTime: new Date(),
      duration: 0 // sera calculé par le code appelant
    }
  };
}

/**
 * Converts a PPTX file to the specified format using LibreOffice
 */
export async function convertPPTX(inputFile: string, options: ConversionOptions): Promise<ConversionResult> {
  console.log(`Starting conversion of file: ${inputFile}`);
  
  // Validate input file
  if (!fs.existsSync(inputFile)) {
    throw new Error(`Input file does not exist: ${inputFile}`);
  }

  const stats = fs.statSync(inputFile);
  console.log(`Input file size: ${stats.size} bytes`);
  
  if (stats.size === 0) {
    throw new Error(`Input file is empty: ${inputFile}`);
  }

  // Create output directory if it doesn't exist
  const outputDir = options.outputDir || path.join(process.cwd(), 'converted');
  console.log(`Output directory: ${outputDir}`);
  
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Determine output format
  const outputFormat = options.format || 'html';
  console.log(`Output format: ${outputFormat}`);

  // Create temporary directory with shorter path to avoid LibreOffice path length issues
  const tmpDir = path.join(os.tmpdir(), `lo-convert-${Date.now()}`);
  console.log(`Using temporary directory: ${tmpDir}`);
  fs.mkdirSync(tmpDir, { recursive: true });

  // Copy input file to temp directory with simplified name
  const tempInputFile = path.join(tmpDir, 'input.pptx');
  fs.copyFileSync(inputFile, tempInputFile);

  let outputFile;
  let resultPath;

  try {
    // LibreOffice conversion command
    // Note: Using different HTML filters to handle conversion failures
    let filterOption = '';
    
    // Use specific filters based on format to avoid SfxBaseModel::impl_store errors
    if (outputFormat === 'html') {
      // Try with the standard HTML filter first (some LibreOffice versions work better with this)
      filterOption = '';  // Default filter
    } else if (outputFormat === 'pdf') {
      filterOption = ':writer_pdf_Export';
    } else if (outputFormat === 'fodp') {
      filterOption = '';  // Default filter for FODP
    }

    // Prepare output path
    const outputFilename = path.basename(inputFile, path.extname(inputFile));
    const tempOutputDir = path.join(tmpDir, 'output');
    fs.mkdirSync(tempOutputDir, { recursive: true });
    
    // Build the LibreOffice command
    const libreOfficeCommand = `soffice --headless --convert-to ${outputFormat}${filterOption} --outdir "${tempOutputDir}" "${tempInputFile}"`;
    console.log(`Executing LibreOffice command: ${libreOfficeCommand}`);
    
    // Execute LibreOffice conversion
    const { stdout, stderr } = await execPromiseUtil(libreOfficeCommand);
    console.log('LibreOffice stdout:', stdout);
    
    if (stderr) {
      console.warn('LibreOffice stderr:', stderr);
    }

    // Check if output file exists based on format
    const expectedExtension = `.${outputFormat}`;
    const expectedOutputFile = path.join(tempOutputDir, `input${expectedExtension}`);
    
    if (!fs.existsSync(expectedOutputFile)) {
      console.log('First conversion attempt failed, trying alternate filter...');
      
      // Fallback to alternative filter if the first conversion fails
      let altFilterOption = '';
      if (outputFormat === 'html') {
        // Try with specific HTML filter as fallback
        altFilterOption = ':HTML (StarWriter)';
      }
      
      const altCommand = `soffice --headless --convert-to ${outputFormat}${altFilterOption} --outdir "${tempOutputDir}" "${tempInputFile}"`;
      console.log(`Executing alternative LibreOffice command: ${altCommand}`);
      
      const { stdout: altStdout, stderr: altStderr } = await execPromiseUtil(altCommand);
      console.log('Alternative conversion stdout:', altStdout);
      
      if (altStderr) {
        console.warn('Alternative conversion stderr:', altStderr);
      }
      
      // Check again if output file exists
      if (!fs.existsSync(expectedOutputFile)) {
        // Last resort - try with htm extension instead of html
        if (outputFormat === 'html') {
          const htmCommand = `soffice --headless --convert-to htm --outdir "${tempOutputDir}" "${tempInputFile}"`;
          console.log(`Executing htm conversion command: ${htmCommand}`);
          
          await execPromiseUtil(htmCommand);
          
          const htmOutputFile = path.join(tempOutputDir, 'input.htm');
          if (fs.existsSync(htmOutputFile)) {
            // Rename htm to html
            fs.renameSync(htmOutputFile, expectedOutputFile);
          }
        }
      }
    }

    // Verify output file exists
    if (!fs.existsSync(expectedOutputFile)) {
      throw new Error(`Conversion failed: Output file not found after conversion attempts`);
    }

    // Handle HTML specific processing (copying assets, etc.)
    if (outputFormat === 'html') {
      // Copy the HTML file and its assets to the output directory
      const finalOutputDir = path.join(outputDir, outputFilename);
      if (!fs.existsSync(finalOutputDir)) {
        fs.mkdirSync(finalOutputDir, { recursive: true });
      }

      // Copy HTML file
      const finalHtmlPath = path.join(finalOutputDir, `${outputFilename}.html`);
      fs.copyFileSync(expectedOutputFile, finalHtmlPath);
      outputFile = finalHtmlPath;

      // Check for associated assets directory
      const assetsDir = path.join(tempOutputDir, 'input_html_files');
      if (fs.existsSync(assetsDir)) {
        const finalAssetsDir = path.join(finalOutputDir, `${outputFilename}_html_files`);
        copyDirSync(assetsDir, finalAssetsDir);
      }

      resultPath = finalOutputDir;
    } else {
      // For other formats, just copy the file to the output directory
      outputFile = path.join(outputDir, `${outputFilename}.${outputFormat}`);
      fs.copyFileSync(expectedOutputFile, outputFile);
      resultPath = outputFile;
    }

    // Clean up temp directory
    try {
      rimraf.sync(tmpDir);
    } catch (error: unknown) {
      console.warn(`Failed to clean up temporary directory: ${(error as Error).message}`);
    }

    return {
      outputPath: resultPath,
      format: outputFormat,
      conversionInfo: {
        startTime: new Date(),
        endTime: new Date(),
        duration: 0
      }
    };
  } catch (error: any) {
    // Clean up temp directory
    try {
      rimraf.sync(tmpDir);
    } catch (cleanupError: unknown) {
      console.warn(`Failed to clean up temporary directory: ${(cleanupError as Error).message}`);
    }

    console.error(`Conversion error: ${error.message}`);
    throw new Error(`Failed to convert PPTX file: ${error.message}`);
  }
}

// Helper function to copy directories recursively
function copyDirSync(src: string, dest: string) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  
  const entries = fs.readdirSync(src, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// Promise wrapper for exec
function execPromise(command: string): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    exec(command, { maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
      if (error) {
        reject(error);
        return;
      }
      resolve({ stdout, stderr });
    });
  });
}

/**
 * Creates a ZIP archive containing all generated files
 */
export async function createZipFromConvertedFiles(
  outputDir: string,
  zipFilePath: string
): Promise<string> {
  try {
    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
      throw new Error(`Output directory does not exist: ${outputDir}`);
    }
    
    // Create a new ZIP file
    const zip = new AdmZip();
    
    // Add all files from the output directory
    addDirectoryToZip(zip, outputDir, '');
    
    // Write the ZIP file
    zip.writeZip(zipFilePath);
    
    // Check if ZIP file was created successfully
    if (!fs.existsSync(zipFilePath)) {
      throw new Error(`Failed to create ZIP file: ${zipFilePath}`);
    }
    
    // Return the path to the created ZIP file
    return zipFilePath;
  } catch (error) {
    logError('Failed to create ZIP archive', error);
    throw new Error(`Failed to create ZIP archive: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Recursively adds a directory and its contents to a ZIP archive
 */
function addDirectoryToZip(zip: AdmZip, dirPath: string, zipPath: string): void {
  // Read directory contents
  const entries = fs.readdirSync(dirPath);
  
  // Process each entry
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry);
    const entryZipPath = zipPath ? path.join(zipPath, entry) : entry;
    
    // Get entry stats
    const stats = fs.statSync(fullPath);
    
    if (stats.isDirectory()) {
      // Recursively add subdirectory
      addDirectoryToZip(zip, fullPath, entryZipPath);
    } else {
      // Add file
      zip.addLocalFile(fullPath, path.dirname(entryZipPath));
    }
  }
} 