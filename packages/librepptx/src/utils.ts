import { spawn, exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';
import util from 'util';
import { LogLevel } from './types';
import { LibreOfficeNotFoundError } from './errors';
import { promisify } from 'util';

// Promisified functions
const execPromiseInternal = promisify(exec);
export const execPromise = execPromiseInternal;
export const fsExists = fs.existsSync;
export const fsReadDir = fs.promises.readdir;
export const fsMkdir = fs.promises.mkdir;
export const fsCopyFile = fs.promises.copyFile;
export const fsUnlink = fs.promises.unlink;
export const fsStat = fs.promises.stat;
export const fsRmDir = fs.promises.rm;

// Current log level (can be modified at runtime)
let currentLogLevel: LogLevel = LogLevel.INFO;

/**
 * Configure le niveau de journalisation
 */
export function setLogLevel(level: LogLevel): void {
  currentLogLevel = level;
}

/**
 * Obtient le niveau de journalisation actuel
 */
export function getLogLevel(): LogLevel {
  return currentLogLevel;
}

/**
 * Fonctions de journalisation avec niveaux
 */
export const logger = {
  error: (message: string, ...args: any[]): void => {
    if (currentLogLevel >= LogLevel.ERROR) {
      console.error(`[ERROR] ${message}`, ...args);
    }
  },
  
  warn: (message: string, ...args: any[]): void => {
    if (currentLogLevel >= LogLevel.WARN) {
      console.warn(`[WARN] ${message}`, ...args);
    }
  },
  
  info: (message: string, ...args: any[]): void => {
    if (currentLogLevel >= LogLevel.INFO) {
      console.info(`[INFO] ${message}`, ...args);
    }
  },
  
  debug: (message: string, ...args: any[]): void => {
    if (currentLogLevel >= LogLevel.DEBUG) {
      console.debug(`[DEBUG] ${message}`, ...args);
    }
  },
  
  trace: (message: string, ...args: any[]): void => {
    if (currentLogLevel >= LogLevel.TRACE) {
      console.trace(`[TRACE] ${message}`, ...args);
    }
  }
};

/**
 * Checks if LibreOffice is installed and accessible
 * @returns Promise that resolves with true if LibreOffice is installed, or rejects with an error
 */
export async function checkLibreOfficeInstallation(): Promise<boolean> {
  try {
    // Try to execute LibreOffice using 'libreoffice' command
    await execPromiseInternal('libreoffice --version').catch(async () => {
      // If 'libreoffice' command fails, try with 'soffice'
      await execPromiseInternal('soffice --version');
    });
    return true;
  } catch (error) {
    throw new Error('LibreOffice is not installed or not in the PATH. Please install LibreOffice and make sure it is accessible from the command line.');
  }
}

/**
 * Vérifie si LibreOffice est installé et accessible, et lance une erreur si ce n'est pas le cas
 */
export async function verifyLibreOfficeInstallation(): Promise<void> {
  const isInstalled = await checkLibreOfficeInstallation();
  if (!isInstalled) {
    throw new LibreOfficeNotFoundError();
  }
}

/**
 * Crée un dossier temporaire avec un nom unique
 */
export async function createTempDir(prefix: string = 'librepptx-'): Promise<string> {
  const tmpDir = path.join(os.tmpdir(), `${prefix}${Date.now()}-${Math.random().toString(36).substring(2, 8)}`);
  await fsMkdir(tmpDir, { recursive: true });
  logger.debug(`Created temp directory: ${tmpDir}`);
  return tmpDir;
}

/**
 * Nettoie un dossier temporaire
 */
export async function cleanupTempDir(tempDir: string, force: boolean = true): Promise<void> {
  if (fsExists(tempDir)) {
    logger.debug(`Cleaning up temp directory: ${tempDir}`);
    await fsRmDir(tempDir, { recursive: true, force });
  }
}

/**
 * Mesure le temps d'exécution d'une fonction
 */
export async function measureExecutionTime<T>(fn: () => Promise<T>): Promise<{ result: T, duration: number }> {
  const startTime = Date.now();
  const result = await fn();
  const endTime = Date.now();
  const duration = endTime - startTime;
  
  return { result, duration };
}

/**
 * Attends un certain temps en millisecondes
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Convertit une extension de fichier en format LibreOffice
 */
export function extensionToLibreOfficeFormat(extension: string): string {
  const normalizedExtension = extension.toLowerCase().replace('.', '');
  
  const formatMap: { [key: string]: string } = {
    'pptx': 'pptx',
    'ppt': 'pptx',
    'fodp': 'fodp',
    'odp': 'odp',
    'html': 'html',
    'htm': 'html',
    'pdf': 'pdf'
  };
  
  return formatMap[normalizedExtension] || normalizedExtension;
}

/**
 * Ensures a directory exists, creates it if it doesn't
 * @param dirPath Path to the directory
 */
export function ensureDirectoryExists(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * Generates a unique filename based on a base name and timestamp
 * @param baseName Base filename
 * @param extension File extension (without dot)
 * @returns Unique filename
 */
export function generateUniqueFilename(baseName: string, extension: string): string {
  const timestamp = Date.now();
  const sanitizedBaseName = baseName.replace(/[^a-zA-Z0-9]/g, '_');
  return `${timestamp}-${sanitizedBaseName}.${extension}`;
}

/**
 * Checks if a file exists and has content
 * @param filePath Path to the file
 * @returns True if file exists and has content, false otherwise
 */
export function fileExistsWithContent(filePath: string): boolean {
  if (!fs.existsSync(filePath)) {
    return false;
  }
  
  const stats = fs.statSync(filePath);
  return stats.size > 0;
}

/**
 * Gets all files in a directory with a specific extension
 * @param dirPath Directory path
 * @param extension File extension to filter by (without dot)
 * @returns Array of file paths
 */
export function getFilesWithExtension(dirPath: string, extension: string): string[] {
  if (!fs.existsSync(dirPath)) {
    return [];
  }
  
  const files = fs.readdirSync(dirPath);
  const ext = extension.startsWith('.') ? extension : `.${extension}`;
  
  return files
    .filter(file => path.extname(file).toLowerCase() === ext.toLowerCase())
    .map(file => path.join(dirPath, file));
}

/**
 * Creates a temporary directory
 * @param baseDir Base directory where to create the temp dir
 * @param prefix Prefix for the directory name
 * @returns Path to the created temporary directory
 */
export function createTempDirectory(baseDir: string, prefix = 'temp_'): string {
  ensureDirectoryExists(baseDir);
  const tempDirName = `${prefix}${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
  const tempDirPath = path.join(baseDir, tempDirName);
  ensureDirectoryExists(tempDirPath);
  return tempDirPath;
}

/**
 * Safely removes a directory and its contents
 * @param dirPath Path to the directory
 */
export function safeRemoveDirectory(dirPath: string): void {
  if (fs.existsSync(dirPath)) {
    const files = fs.readdirSync(dirPath);
    
    for (const file of files) {
      const filePath = path.join(dirPath, file);
      if (fs.statSync(filePath).isDirectory()) {
        safeRemoveDirectory(filePath);
      } else {
        fs.unlinkSync(filePath);
      }
    }
    
    fs.rmdirSync(dirPath);
  }
}

/**
 * Copies a file from source to destination
 * @param sourcePath Source file path
 * @param destPath Destination file path
 */
export function copyFile(sourcePath: string, destPath: string): void {
  fs.copyFileSync(sourcePath, destPath);
}

/**
 * Logs an error message
 * @param message Error message
 * @param error Error object (optional)
 */
export function logError(message: string, error?: any): void {
  console.error(`[LibrePPTX Error] ${message}`);
  if (error) {
    if (typeof error === 'object' && error.message) {
      console.error(`Details: ${error.message}`);
    } else {
      console.error(`Details:`, error);
    }
  }
}

/**
 * Logs a debug message (only when debug is enabled)
 * @param message Debug message
 * @param data Additional data to log
 */
export function logDebug(message: string, data?: any): void {
  if (process.env.DEBUG === 'true' || process.env.DEBUG === '1') {
    console.log(`[LibrePPTX Debug] ${message}`);
    if (data !== undefined) {
      console.log(data);
    }
  }
} 