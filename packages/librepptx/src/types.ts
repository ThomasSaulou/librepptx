/**
 * Options pour la conversion de fichiers
 */
export interface ConversionOptions {
  /**
   * Répertoire de sortie pour les fichiers générés
   * Si non spécifié, le répertoire du fichier d'entrée sera utilisé
   */
  outputDir?: string;
  
  /**
   * Format de sortie désiré
   */
  format?: 'html' | 'pdf' | 'fodp' | 'pptx';
  
  /**
   * Nom du fichier de sortie (sans extension)
   * Si non spécifié, un nom sera généré automatiquement
   */
  outputFileName?: string;
  
  /**
   * Si vrai, conserve les fichiers temporaires après la conversion
   * Utile pour le débogage
   */
  keepTempFiles?: boolean;
  
  /**
   * Si vrai, les messages de log sont détaillés
   */
  verbose?: boolean;
  
  /**
   * Options spécifiques au format HTML
   */
  htmlOptions?: {
    /**
     * Si vrai, crée un fichier ZIP contenant le HTML et ses ressources
     */
    createZip?: boolean;
    
    /**
     * Si vrai, inclut les feuilles de style dans le HTML
     */
    embedStyles?: boolean;
  };
  
  /**
   * Options spécifiques au format PDF
   */
  pdfOptions?: {
    /**
     * Qualité de l'export (1-100)
     */
    quality?: number;
  };
}

/**
 * Résultat de la conversion
 */
export interface ConversionResult {
  /**
   * Indique si la conversion a réussi
   */
  success?: boolean;
  
  /**
   * Chemin du fichier principal généré
   */
  outputPath: string;
  
  /**
   * Chemins des fichiers supplémentaires générés (par exemple, ressources HTML)
   */
  additionalFiles?: string[];
  
  /**
   * Format du fichier de sortie
   */
  format: string;
  
  /**
   * Informations sur le processus de conversion
   */
  conversionInfo?: {
    startTime: Date;
    endTime: Date;
    duration: number; // en millisecondes
    libreOfficeVersion?: string;
  };
}

/**
 * Types de formats supportés
 */
export type SupportedInputFormat = 'pptx' | 'fodp';
export type SupportedOutputFormat = 'html' | 'pdf' | 'fodp' | 'pptx';

/**
 * Niveau de log
 */
export enum LogLevel {
  NONE = 0,
  ERROR = 1,
  WARN = 2,
  INFO = 3,
  DEBUG = 4,
  TRACE = 5
} 