/**
 * Classe de base pour toutes les erreurs de librepptx
 */
export class LibrepptxError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'LibrepptxError';
  }
}

/**
 * Erreur lorsque LibreOffice n'est pas correctement installé ou accessible
 */
export class LibreOfficeNotFoundError extends LibrepptxError {
  constructor(message: string = 'LibreOffice executable not found. Please ensure LibreOffice is installed and available in the PATH.') {
    super(message);
    this.name = 'LibreOfficeNotFoundError';
  }
}

/**
 * Erreur lorsque le fichier d'entrée est invalide ou n'existe pas
 */
export class InvalidInputFileError extends LibrepptxError {
  constructor(filePath: string, reason: string = 'file not found or not accessible') {
    super(`Invalid input file: ${filePath} (${reason})`);
    this.name = 'InvalidInputFileError';
  }
}

/**
 * Erreur lorsque le fichier de sortie n'a pas pu être généré
 */
export class OutputGenerationError extends LibrepptxError {
  constructor(message: string) {
    super(`Failed to generate output: ${message}`);
    this.name = 'OutputGenerationError';
  }
}

/**
 * Erreur lorsque LibreOffice échoue pendant la conversion
 */
export class ConversionError extends LibrepptxError {
  exitCode?: number;
  stderr?: string;

  constructor(message: string, exitCode?: number, stderr?: string) {
    super(`Conversion failed: ${message}`);
    this.name = 'ConversionError';
    this.exitCode = exitCode;
    this.stderr = stderr;
  }
}

/**
 * Erreur lorsque le format demandé n'est pas supporté
 */
export class UnsupportedFormatError extends LibrepptxError {
  constructor(format: string) {
    super(`Unsupported format: ${format}`);
    this.name = 'UnsupportedFormatError';
  }
}

/**
 * Erreur lors du traitement des fichiers temporaires
 */
export class TempFileError extends LibrepptxError {
  constructor(message: string) {
    super(`Temporary file error: ${message}`);
    this.name = 'TempFileError';
  }
} 