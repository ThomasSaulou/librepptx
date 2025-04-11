/**
 * Types d'éléments supportés dans les diapositives
 */
export type SlideElementType = 'text' | 'image' | 'shape' | 'connector' | 'table' | 'chart' | 'video' | 'audio' | 'unknown';

/**
 * Interface de base pour tous les éléments de diapositive
 */
export interface BaseSlideElement {
  /**
   * Type d'élément
   */
  type: SlideElementType;
  
  /**
   * Position X en pixels
   */
  x: number;
  
  /**
   * Position Y en pixels
   */
  y: number;
  
  /**
   * Largeur en pixels
   */
  width: number;
  
  /**
   * Hauteur en pixels
   */
  height: number;
  
  /**
   * Rotation en degrés
   */
  rotation?: number;
  
  /**
   * Identifiant unique de l'élément
   */
  id?: string;
  
  /**
   * Style de l'élément (couleurs, bordures, etc.)
   */
  style?: {
    backgroundColor?: string;
    color?: string;
    borderColor?: string;
    borderWidth?: number;
    borderStyle?: string;
    opacity?: number;
    [key: string]: any;
  };
}

/**
 * Élément texte dans une diapositive
 */
export interface TextElement extends BaseSlideElement {
  type: 'text';
  
  /**
   * Contenu textuel
   */
  text: string;
  
  /**
   * Style de texte
   */
  textStyle?: {
    fontFamily?: string;
    fontSize?: number;
    fontWeight?: string;
    fontStyle?: string;
    textDecoration?: string;
    alignment?: 'left' | 'center' | 'right' | 'justify';
    verticalAlignment?: 'top' | 'middle' | 'bottom';
    lineHeight?: number;
    [key: string]: any;
  };
}

/**
 * Élément image dans une diapositive
 */
export interface ImageElement extends BaseSlideElement {
  type: 'image';
  
  /**
   * Source de l'image (URL ou base64)
   */
  src: string;
  
  /**
   * Alt texte
   */
  alt?: string;
  
  /**
   * L'image est-elle en base64
   */
  isBase64?: boolean;
}

/**
 * Élément forme dans une diapositive
 */
export interface ShapeElement extends BaseSlideElement {
  type: 'shape';
  
  /**
   * Type de forme
   */
  shapeType: string;
  
  /**
   * Texte à l'intérieur de la forme
   */
  text?: string;
  
  /**
   * Chemin SVG pour formes personnalisées
   */
  path?: string;
}

/**
 * Diapositive dans une présentation
 */
export interface Slide {
  /**
   * Identifiant de la diapositive
   */
  id: string;
  
  /**
   * Titre de la diapositive
   */
  title?: string;
  
  /**
   * Éléments dans la diapositive
   */
  elements: (TextElement | ImageElement | ShapeElement | BaseSlideElement)[];
  
  /**
   * Notes de la diapositive
   */
  notes?: string;
  
  /**
   * Style de fond de la diapositive
   */
  background?: {
    color?: string;
    image?: string;
    isBase64?: boolean;
  };
}

/**
 * Présentation complète
 */
export interface Presentation {
  /**
   * Titre de la présentation
   */
  title?: string;
  
  /**
   * Auteur de la présentation
   */
  author?: string;
  
  /**
   * Date de création
   */
  creationDate?: string;
  
  /**
   * Diapositives de la présentation
   */
  slides: Slide[];
  
  /**
   * Thème de la présentation
   */
  theme?: {
    colors?: string[];
    fonts?: {
      heading?: string;
      body?: string;
    };
  };
  
  /**
   * Taille des diapositives
   */
  size?: {
    width: number;
    height: number;
  };
}

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