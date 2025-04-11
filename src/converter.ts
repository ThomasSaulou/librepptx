import * as fs from 'fs';
import * as path from 'path';
import { XMLParser } from 'fast-xml-parser';
import { 
  Presentation, 
  Slide, 
  TextElement, 
  ImageElement, 
  ShapeElement, 
  BaseSlideElement,
  ConversionOptions
} from './types';
import { spawn } from 'child_process';
import { promisify } from 'util';
import { exec } from 'child_process';

// Constantes pour la conversion d'unités
const CM_TO_PIXELS = 37.795; // 1 cm = 37.795 pixels

// Fonctions de log simplifiées pour éviter l'importation circulaire
const logger = {
  info: (message: string) => console.log(`[INFO] ${message}`),
  error: (message: string) => console.error(`[ERROR] ${message}`),
  debug: (message: string) => console.log(`[DEBUG] ${message}`),
  warn: (message: string) => console.warn(`[WARN] ${message}`)
};

// Fonction simplifiée pour convertir PPTX en FODP
async function convertPptxToFodp(pptxPath: string, options: ConversionOptions = {}): Promise<string> {
  const outputDir = options.outputDir || path.dirname(pptxPath);
  const outputFileName = options.outputFileName || 
    `${path.basename(pptxPath, path.extname(pptxPath))}_converted_${Date.now()}`;
  const outputPath = path.join(outputDir, `${outputFileName}.fodp`);
  
  // Vérifier que le fichier existe
  if (!fs.existsSync(pptxPath)) {
    throw new Error(`Le fichier PPTX n'existe pas: ${pptxPath}`);
  }
  
  // Créer le répertoire de sortie
  fs.mkdirSync(outputDir, { recursive: true });
  
  // Exécuter LibreOffice pour la conversion
  const execPromise = promisify(exec);
  const libreOfficeCommand = `soffice --headless --convert-to fodp --outdir "${outputDir}" "${pptxPath}"`;
  
  try {
    logger.info(`Exécution de la commande: ${libreOfficeCommand}`);
    await execPromise(libreOfficeCommand);
    
    // Vérifier si le fichier existe
    if (!fs.existsSync(outputPath)) {
      throw new Error(`La conversion a échoué: le fichier de sortie n'existe pas (${outputPath})`);
    }
    
    return outputPath;
  } catch (error: any) {
    throw new Error(`Conversion en FODP échouée: ${error.message}`);
  }
}

/**
 * Options pour la conversion en JSON
 */
export interface JsonConversionOptions extends ConversionOptions {
  /**
   * Si true, inclut les images en base64 dans le JSON
   */
  includeImagesAsBase64?: boolean;
  
  /**
   * Si true, extrait les images dans un dossier séparé
   */
  extractImages?: boolean;
  
  /**
   * Dossier où extraire les images
   */
  imagesOutputDir?: string;
}

/**
 * Convertit un attribut SVG en valeur numérique en pixels
 * @param value Valeur de l'attribut (ex: "10.5cm")
 * @returns Valeur en pixels
 */
function convertSvgValueToPixels(value: string | undefined): number {
  if (!value) return 0;
  
  // Enlever les unités et convertir en nombre
  if (value.endsWith('cm')) {
    const cm = parseFloat(value.substring(0, value.length - 2));
    return cm * CM_TO_PIXELS;
  } else if (value.endsWith('mm')) {
    const mm = parseFloat(value.substring(0, value.length - 2));
    return (mm / 10) * CM_TO_PIXELS;
  } else if (value.endsWith('pt')) {
    const pt = parseFloat(value.substring(0, value.length - 2));
    return pt * 1.33; // approximation pt -> px
  } else if (value.endsWith('px')) {
    return parseFloat(value.substring(0, value.length - 2));
  } else {
    // Supposer que c'est déjà en pixels ou un nombre sans unité
    return parseFloat(value);
  }
}

/**
 * Extrait le texte des nœuds de texte de manière récursive
 * @param textNodes Nœuds de texte
 * @returns Texte extrait
 */
function extractTextContent(textNodes: any): string {
  if (!textNodes) return '';
  
  // Si c'est une chaîne simple
  if (typeof textNodes === 'string') return textNodes;
  
  // Si c'est un tableau, concaténer tous les textes
  if (Array.isArray(textNodes)) {
    return textNodes.map(node => extractTextContent(node)).join('');
  }
  
  // Si c'est un objet, extraire le texte du nœud '#text' s'il existe
  if (textNodes['#text']) {
    return textNodes['#text'];
  }
  
  // Parcourir récursivement tous les enfants
  let result = '';
  for (const key in textNodes) {
    if (key !== '@_xmlns' && key !== '@_xml:space') {
      result += extractTextContent(textNodes[key]);
    }
  }
  
  return result;
}

/**
 * Traite un élément text-box pour en extraire le contenu et le style
 * @param textBox Élément text-box
 * @returns Contenu textuel et style
 */
function processTextBox(textBox: any): { text: string, textStyle: any } {
  let text = '';
  let textStyle: any = {};
  
  if (!textBox) return { text, textStyle };
  
  // Extraire le texte des paragraphes
  if (textBox['text:p']) {
    const paragraphs = Array.isArray(textBox['text:p']) 
      ? textBox['text:p'] 
      : [textBox['text:p']];
    
    text = paragraphs.map(paragraph => {
      // Extraire le texte du paragraphe
      const paragraphText = extractTextContent(paragraph);
      
      // Essayer d'extraire le style
      if (paragraph['@_text:style-name']) {
        // TODO: Récupérer les styles à partir des références
      }
      
      return paragraphText;
    }).join('\n');
  }
  
  // Extraire le style à partir des attributs
  // TODO: Traitement avancé des styles
  
  return { text, textStyle };
}

/**
 * Traite un élément draw:frame pour en extraire les informations
 * @param frame Élément draw:frame
 * @returns Élément de diapositive
 */
function processFrame(frame: any): BaseSlideElement | null {
  if (!frame) return null;
  
  // Extraire les attributs de base
  const x = convertSvgValueToPixels(frame['@_svg:x']);
  const y = convertSvgValueToPixels(frame['@_svg:y']);
  const width = convertSvgValueToPixels(frame['@_svg:width']);
  const height = convertSvgValueToPixels(frame['@_svg:height']);
  const id = frame['@_draw:name'] || frame['@_draw:id'] || `frame-${Math.random().toString(36).substring(2, 11)}`;
  
  // Déterminer le type d'élément
  if (frame['draw:text-box']) {
    // C'est un text-box
    const { text, textStyle } = processTextBox(frame['draw:text-box']);
    
    const textElement: TextElement = {
      type: 'text',
      x,
      y,
      width,
      height,
      id,
      text,
      textStyle
    };
    
    return textElement;
  } else if (frame['draw:image']) {
    // C'est une image
    const image = frame['draw:image'];
    const href = image['@_xlink:href'] || '';
    
    const imageElement: ImageElement = {
      type: 'image',
      x,
      y,
      width,
      height,
      id,
      src: href,
      isBase64: href.startsWith('data:')
    };
    
    return imageElement;
  } else {
    // Type par défaut si on ne peut pas déterminer
    return {
      type: 'unknown',
      x,
      y,
      width,
      height,
      id
    };
  }
}

/**
 * Traite un élément draw:custom-shape pour en extraire les informations
 * @param shape Élément draw:custom-shape
 * @returns Élément de forme
 */
function processCustomShape(shape: any): ShapeElement | null {
  if (!shape) return null;
  
  // Extraire les attributs de base
  const x = convertSvgValueToPixels(shape['@_svg:x']);
  const y = convertSvgValueToPixels(shape['@_svg:y']);
  const width = convertSvgValueToPixels(shape['@_svg:width']);
  const height = convertSvgValueToPixels(shape['@_svg:height']);
  const id = shape['@_draw:name'] || shape['@_draw:id'] || `shape-${Math.random().toString(36).substring(2, 11)}`;
  
  // Déterminer le type de forme à partir de draw:enhanced-geometry
  let shapeType = 'rect'; // Par défaut
  let path = '';
  
  if (shape['draw:enhanced-geometry']) {
    const geometry = shape['draw:enhanced-geometry'];
    shapeType = geometry['@_draw:type'] || 'rect';
    path = geometry['@_draw:enhanced-path'] || '';
  }
  
  // Extraire le texte s'il y en a
  let text = '';
  if (shape['text:p']) {
    text = extractTextContent(shape['text:p']);
  }
  
  const shapeElement: ShapeElement = {
    type: 'shape',
    x,
    y,
    width,
    height,
    id,
    shapeType,
    path,
    text
  };
  
  return shapeElement;
}

/**
 * Traite une page (slide) pour en extraire les éléments
 * @param page Élément draw:page
 * @returns Slide avec ses éléments
 */
function processPage(page: any): Slide {
  const id = page['@_draw:name'] || `slide-${Math.random().toString(36).substring(2, 11)}`;
  const elements: (TextElement | ImageElement | ShapeElement | BaseSlideElement)[] = [];
  
  // Traiter les éléments draw:frame
  if (page['draw:frame']) {
    const frames = Array.isArray(page['draw:frame']) ? page['draw:frame'] : [page['draw:frame']];
    
    frames.forEach(frame => {
      const element = processFrame(frame);
      if (element) elements.push(element);
    });
  }
  
  // Traiter les éléments draw:custom-shape
  if (page['draw:custom-shape']) {
    const shapes = Array.isArray(page['draw:custom-shape']) ? page['draw:custom-shape'] : [page['draw:custom-shape']];
    
    shapes.forEach(shape => {
      const element = processCustomShape(shape);
      if (element) elements.push(element);
    });
  }
  
  // Traiter d'autres types d'éléments ici...
  
  // Extraire les notes de présentation
  let notes = '';
  if (page['presentation:notes'] && 
      page['presentation:notes']['draw:frame'] && 
      page['presentation:notes']['draw:frame']['draw:text-box']) {
    notes = extractTextContent(page['presentation:notes']['draw:frame']['draw:text-box']);
  }
  
  return {
    id,
    elements,
    notes
  };
}

/**
 * Convertit un fichier FODP en structure JSON
 * @param fodpPath Chemin vers le fichier FODP
 * @param options Options de conversion
 * @returns Présentation au format JSON
 */
export async function convertFodpToJson(fodpPath: string, options: JsonConversionOptions = {}): Promise<Presentation> {
  // Lire le fichier FODP
  const fodpContent = fs.readFileSync(fodpPath, 'utf-8');
  
  // Configurer le parser XML
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    isArray: (name: string, jpath: string, isLeafNode: boolean, isAttribute: boolean) => {
      // Certains éléments sont toujours des tableaux même s'il n'y en a qu'un
      if (['draw:page', 'draw:frame', 'draw:custom-shape', 'text:p'].includes(name)) {
        return true;
      }
      return false;
    }
  });
  
  // Parser le XML
  const parsedXml = parser.parse(fodpContent);
  
  if (!parsedXml['office:document']) {
    throw new Error('Format FODP invalide: la structure office:document est manquante');
  }
  
  const document = parsedXml['office:document'];
  
  // Extraire les métadonnées
  const meta = document['office:meta'] || {};
  const title = meta['dc:title'] || '';
  const author = meta['dc:creator'] || meta['meta:initial-creator'] || '';
  const creationDate = meta['meta:creation-date'] || '';
  
  // Extraire les diapositives
  const body = document['office:body'] || {};
  const presentation = body['office:presentation'] || {};
  
  if (!presentation['draw:page'] || presentation['draw:page'].length === 0) {
    throw new Error('Aucune diapositive trouvée dans le fichier FODP');
  }
  
  // Traiter chaque page (diapositive)
  const slides: Slide[] = [];
  for (const page of presentation['draw:page']) {
    const slide = processPage(page);
    slides.push(slide);
  }
  
  // Créer la structure de présentation
  const result: Presentation = {
    title,
    author,
    creationDate,
    slides,
  };
  
  return result;
}

/**
 * Convertit un fichier PPTX directement en structure JSON
 * @param pptxPath Chemin vers le fichier PPTX
 * @param options Options de conversion
 * @returns Présentation au format JSON
 */
export async function convertPptxToJson(pptxPath: string, options: JsonConversionOptions = {}): Promise<Presentation> {
  try {
    // Étape 1: Convertir PPTX en FODP
    logger.info('Conversion du PPTX en FODP...');
    const fodpPath = await convertPptxToFodp(pptxPath, options);
    
    if (!fodpPath || !fs.existsSync(fodpPath)) {
      throw new Error('La conversion en FODP a échoué: fichier de sortie manquant');
    }
    
    // Étape 2: Convertir FODP en JSON
    logger.info('Conversion du FODP en JSON...');
    const presentation = await convertFodpToJson(fodpPath, options);
    
    return presentation;
  } catch (error: any) {
    logger.error(`Erreur lors de la conversion PPTX → JSON: ${error.message}`);
    throw error;
  }
} 