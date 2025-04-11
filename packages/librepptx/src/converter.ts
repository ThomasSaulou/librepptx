import { XMLParser } from 'fast-xml-parser';
import * as fs from 'fs';
import * as path from 'path';
import { convertPptxToFodp } from './index';
import { ConversionOptions, ConversionResult } from './types';
import { logger } from './utils';

/**
 * Interface pour la représentation d'une présentation
 */
export interface Presentation {
  title: string;
  slides: Slide[];
  metadata?: {
    author?: string;
    created?: string;
    modified?: string;
    description?: string;
    [key: string]: any;
  };
}

/**
 * Interface pour la représentation d'une diapositive
 */
export interface Slide {
  id: string;
  title?: string;
  elements: SlideElement[];
  background?: {
    color?: string;
    image?: string;
  };
}

/**
 * Types d'éléments pouvant être présents sur une diapositive
 */
export type SlideElement = TextElement | ImageElement | ShapeElement;

/**
 * Interface pour un élément de texte
 */
export interface TextElement {
  type: 'text';
  id: string;
  text: string;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  style?: {
    fontFamily?: string;
    fontSize?: number;
    color?: string;
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
    align?: 'left' | 'center' | 'right' | 'justify';
  };
}

/**
 * Interface pour un élément d'image
 */
export interface ImageElement {
  type: 'image';
  id: string;
  src: string;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  alt?: string;
}

/**
 * Interface pour un élément de forme
 */
export interface ShapeElement {
  type: 'shape';
  id: string;
  shapeType: string;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  style?: {
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
  };
  text?: string;
}

/**
 * Convertit un fichier PPTX en FODP en utilisant LibreOffice
 * 
 * @param inputPath Chemin du fichier PPTX d'entrée
 * @param options Options de conversion
 * @returns Résultat de la conversion avec le chemin du fichier FODP généré
 */
export async function convertPptxToFodpFile(
  inputPath: string,
  options: ConversionOptions = {}
): Promise<string> {
  // Utiliser la fonction existante pour convertir PPTX en FODP
  const result = await convertPptxToFodp(inputPath, options);
  
  if (typeof result === 'string') {
    return result;
  }
  
  // La propriété success peut ne pas être définie même si la conversion a réussi
  // Le fait d'avoir une outputPath est suffisant
  if (result.outputPath && fs.existsSync(result.outputPath)) {
    return result.outputPath;
  }
  
  throw new Error(`La conversion vers FODP a échoué: ${result.outputPath}`);
}

/**
 * Convertit un fichier FODP en structure JSON
 * 
 * @param fodpPath Chemin du fichier FODP
 * @returns Objet représentant la présentation
 */
export async function convertFodpToJson(fodpPath: string): Promise<Presentation> {
  try {
    // Vérifier que le fichier existe
    if (!fs.existsSync(fodpPath)) {
      throw new Error(`Le fichier FODP n'existe pas: ${fodpPath}`);
    }
    
    // Configurer le parser XML
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      isArray: (name) => [
        'slide', 
        'page', 
        'draw:page', 
        'draw:frame', 
        'draw:custom-shape',
        'draw:shape',
        'text:p',
        'text:span'
      ].includes(name),
      processEntities: true,
      htmlEntities: true,
      trimValues: true,
      allowBooleanAttributes: true,
      parseTagValue: true,
      parseAttributeValue: true
    });
    
    // Lire et parser le fichier FODP
    const xmlData = fs.readFileSync(fodpPath, 'utf8');
    console.log(`Taille du fichier FODP: ${xmlData.length} caractères`);
    
    // Afficher les 200 premiers caractères pour vérifier le format
    console.log('Aperçu du fichier FODP:');
    console.log(xmlData.substring(0, 200));
    
    const result = parser.parse(xmlData);
    
    logger.debug('Analyse XML réussie, construction de la structure JSON...');
    
    // Extraire les informations de la présentation
    const presentation: Presentation = {
      title: extractPresentationTitle(result),
      slides: extractSlides(result),
      metadata: extractMetadata(result)
    };
    
    return presentation;
  } catch (error) {
    logger.error(`Erreur lors de la conversion FODP en JSON: ${error}`);
    console.error(`Erreur détaillée:`, error);
    
    // En cas d'erreur, retourner une présentation minimale
    return {
      title: 'Erreur de conversion',
      slides: [{
        id: 'slide-error',
        title: 'Erreur lors de la conversion',
        elements: []
      }]
    };
  }
}

/**
 * Convertit un fichier PPTX directement en structure JSON
 * 
 * @param inputPath Chemin du fichier PPTX d'entrée
 * @param options Options de conversion
 * @returns Objet représentant la présentation
 */
export async function convertPptxToJson(
  inputPath: string,
  options: ConversionOptions = {}
): Promise<Presentation> {
  // Étape 1: Convertir PPTX en FODP
  const fodpPath = await convertPptxToFodpFile(inputPath, options);
  
  // Étape 2: Convertir FODP en JSON
  return convertFodpToJson(fodpPath);
}

/**
 * Extrait le titre de la présentation à partir du document XML
 */
function extractPresentationTitle(xmlDoc: any): string {
  try {
    // Chercher le titre dans différents endroits possibles du document XML
    if (xmlDoc.office && xmlDoc.office['document-content'] && 
        xmlDoc.office['document-content'].office && 
        xmlDoc.office['document-content'].office.body &&
        xmlDoc.office['document-content'].office.body.office.presentation) {
      
      const presentation = xmlDoc.office['document-content'].office.body.office.presentation;
      
      // Chercher dans les propriétés du document
      if (presentation['@_draw:name']) {
        return presentation['@_draw:name'];
      }
    }
    
    // Si aucun titre n'est trouvé, utiliser un titre par défaut
    return 'Présentation sans titre';
  } catch (error) {
    logger.warn(`Impossible d'extraire le titre de la présentation: ${error}`);
    return 'Présentation sans titre';
  }
}

/**
 * Extrait les métadonnées de la présentation à partir du document XML
 */
function extractMetadata(xmlDoc: any): Presentation['metadata'] {
  const metadata: Presentation['metadata'] = {};
  
  try {
    // Chercher les métadonnées dans différents endroits possibles
    if (xmlDoc.office && xmlDoc.office['document-meta'] && 
        xmlDoc.office['document-meta'].office && 
        xmlDoc.office['document-meta'].office.meta) {
      
      const meta = xmlDoc.office['document-meta'].office.meta;
      
      // Extraire les métadonnées courantes
      if (meta['dc:creator']) metadata.author = meta['dc:creator'];
      if (meta['dc:description']) metadata.description = meta['dc:description'];
      if (meta['dc:date']) metadata.created = meta['dc:date'];
      if (meta['meta:creation-date']) metadata.created = meta['meta:creation-date'];
      if (meta['dc:modified']) metadata.modified = meta['dc:modified'];
      if (meta['meta:editing-duration']) metadata.editingDuration = meta['meta:editing-duration'];
      
      // Extraire toutes les autres métadonnées
      Object.keys(meta).forEach(key => {
        if (!metadata[key] && key !== '@_' && !key.startsWith('@_')) {
          metadata[key] = meta[key];
        }
      });
    }
  } catch (error) {
    logger.warn(`Impossible d'extraire les métadonnées de la présentation: ${error}`);
  }
  
  return metadata;
}

/**
 * Extrait les diapositives à partir du document XML
 */
function extractSlides(xmlDoc: any): Slide[] {
  const slides: Slide[] = [];
  
  try {
    // Afficher la structure complète du document pour le débogage
    console.log('Structure du document XML:');
    console.log(JSON.stringify(Object.keys(xmlDoc), null, 2));
    
    if (xmlDoc.office) {
      console.log('Office trouvé!');
      console.log('Contenu Office:', Object.keys(xmlDoc.office));
    }
    
    // Recherche des diapositives dans différentes structures possibles
    let drawPages: any[] = [];
    
    // Structure 1: Format standard FODP
    if (xmlDoc.office && 
        xmlDoc.office['document-content'] && 
        xmlDoc.office['document-content'].office && 
        xmlDoc.office['document-content'].office.body &&
        xmlDoc.office['document-content'].office.body.office &&
        xmlDoc.office['document-content'].office.body.office.presentation) {
      
      const presentation = xmlDoc.office['document-content'].office.body.office.presentation;
      
      if (presentation['draw:page']) {
        console.log('Pages trouvées dans presentation[draw:page]');
        drawPages = Array.isArray(presentation['draw:page']) 
          ? presentation['draw:page'] 
          : [presentation['draw:page']];
      }
    }
    
    // Structure 2: Format alternatif
    if (drawPages.length === 0 && 
        xmlDoc.office && 
        xmlDoc.office['document-content'] && 
        xmlDoc.office['document-content']['office:body'] &&
        xmlDoc.office['document-content']['office:body']['office:presentation']) {
      
      const presentation = xmlDoc.office['document-content']['office:body']['office:presentation'];
      
      if (presentation['draw:page']) {
        console.log('Pages trouvées dans presentation[draw:page] (format alternatif)');
        drawPages = Array.isArray(presentation['draw:page']) 
          ? presentation['draw:page'] 
          : [presentation['draw:page']];
      } else if (presentation['draw:page']) {
        console.log('Pages trouvées dans presentation[draw:page] (format alternatif)');
        drawPages = Array.isArray(presentation['draw:page']) 
          ? presentation['draw:page'] 
          : [presentation['draw:page']];
      }
    }
    
    // Structure 3: Recherche directe de draw:page
    if (drawPages.length === 0) {
      console.log('Recherche directe de draw:page dans le document');
      const findDrawPages = (obj: any, path = ''): any[] => {
        let result: any[] = [];
        
        if (!obj || typeof obj !== 'object') return result;
        
        if (obj['draw:page']) {
          console.log(`draw:page trouvé à ${path}.draw:page`);
          return Array.isArray(obj['draw:page']) ? obj['draw:page'] : [obj['draw:page']];
        }
        
        for (const key in obj) {
          if (obj.hasOwnProperty(key) && typeof obj[key] === 'object') {
            const found = findDrawPages(obj[key], `${path}.${key}`);
            if (found.length > 0) {
              result = found;
              break;
            }
          }
        }
        
        return result;
      };
      
      drawPages = findDrawPages(xmlDoc);
    }
    
    // Si aucune diapositive n'est trouvée, essayer une autre approche
    if (drawPages.length === 0) {
      console.log('Aucune diapositive trouvée avec les méthodes standard, création d\'une diapositive vide');
      // Créer au moins une diapositive vide
      slides.push({
        id: 'slide-1',
        title: 'Diapositive introuvable',
        elements: []
      });
      return slides;
    }
    
    console.log(`${drawPages.length} diapositives trouvées!`);
    
    // Traiter chaque diapositive
    drawPages.forEach((page, index) => {
      const slide: Slide = {
        id: page['@_draw:id'] || page['@_draw:name'] || `slide-${index + 1}`,
        title: extractSlideTitle(page),
        elements: extractSlideElements(page),
        background: extractSlideBackground(page)
      };
      
      slides.push(slide);
    });
  } catch (error) {
    console.error(`Erreur lors de l'extraction des diapositives:`, error);
    logger.warn(`Impossible d'extraire les diapositives: ${error}`);
    
    // Si une erreur se produit, créer au moins une diapositive vide
    slides.push({
      id: 'slide-error',
      title: 'Erreur lors de l\'extraction',
      elements: []
    });
  }
  
  return slides;
}

/**
 * Extrait le titre d'une diapositive
 */
function extractSlideTitle(slide: any): string | undefined {
  try {
    // Chercher dans les propriétés de la diapositive
    if (slide['@_draw:name']) {
      return slide['@_draw:name'];
    }
    
    // Chercher dans les éléments de type titre
    if (slide['draw:frame']) {
      const frames = Array.isArray(slide['draw:frame']) ? slide['draw:frame'] : [slide['draw:frame']];
      
      for (const frame of frames) {
        if (frame['@_presentation:class'] === 'title' && frame['draw:text-box']) {
          // Extraire le texte du titre
          const textBox = frame['draw:text-box'];
          if (textBox['text:p']) {
            const textP = textBox['text:p'];
            if (typeof textP === 'string') {
              return textP;
            } else if (textP['#text']) {
              return textP['#text'];
            }
          }
        }
      }
    }
    
    return undefined;
  } catch (error) {
    logger.warn(`Impossible d'extraire le titre de la diapositive: ${error}`);
    return undefined;
  }
}

/**
 * Extrait les éléments d'une diapositive
 */
function extractSlideElements(slide: any): SlideElement[] {
  const elements: SlideElement[] = [];
  
  try {
    // Chercher les éléments dans les frames
    if (slide['draw:frame']) {
      const frames = Array.isArray(slide['draw:frame']) ? slide['draw:frame'] : [slide['draw:frame']];
      
      frames.forEach((frame, index) => {
        const element = convertFrameToElement(frame, index);
        if (element) {
          elements.push(element);
        }
      });
    }
    
    // Chercher les formes
    if (slide['draw:shape'] || slide['draw:custom-shape']) {
      const shapes = [];
      
      if (slide['draw:shape']) {
        const shapeElements = Array.isArray(slide['draw:shape']) ? slide['draw:shape'] : [slide['draw:shape']];
        shapes.push(...shapeElements);
      }
      
      if (slide['draw:custom-shape']) {
        const customShapes = Array.isArray(slide['draw:custom-shape']) ? slide['draw:custom-shape'] : [slide['draw:custom-shape']];
        shapes.push(...customShapes);
      }
      
      shapes.forEach((shape, index) => {
        const element = convertShapeToElement(shape, index + elements.length);
        if (element) {
          elements.push(element);
        }
      });
    }
  } catch (error) {
    logger.warn(`Impossible d'extraire les éléments de la diapositive: ${error}`);
  }
  
  return elements;
}

/**
 * Extrait les informations d'arrière-plan d'une diapositive
 */
function extractSlideBackground(slide: any): Slide['background'] | undefined {
  try {
    const background: Slide['background'] = {};
    
    // Chercher la couleur d'arrière-plan
    if (slide['@_draw:style-name']) {
      const styleName = slide['@_draw:style-name'];
      // TODO: Extraire la couleur depuis les styles
      // Nécessite de parcourir les styles dans le document
    }
    
    // Chercher l'image d'arrière-plan
    if (slide['draw:g'] && slide['draw:g']['draw:image']) {
      const image = slide['draw:g']['draw:image'];
      if (image['@_xlink:href']) {
        background.image = image['@_xlink:href'];
      }
    }
    
    return Object.keys(background).length > 0 ? background : undefined;
  } catch (error) {
    logger.warn(`Impossible d'extraire l'arrière-plan de la diapositive: ${error}`);
    return undefined;
  }
}

/**
 * Convertit un frame en élément de diapositive
 */
function convertFrameToElement(frame: any, index: number): SlideElement | null {
  try {
    // Extraire les coordonnées et dimensions
    const position = {
      x: parseFloat(frame['@_svg:x'] || '0'),
      y: parseFloat(frame['@_svg:y'] || '0'),
      width: parseFloat(frame['@_svg:width'] || '0'),
      height: parseFloat(frame['@_svg:height'] || '0')
    };
    
    // Gérer les différents types d'éléments
    if (frame['draw:text-box']) {
      return convertTextBoxToElement(frame, position, index);
    } else if (frame['draw:image']) {
      return convertImageToElement(frame, position, index);
    }
    
    return null;
  } catch (error) {
    logger.warn(`Impossible de convertir le frame en élément: ${error}`);
    return null;
  }
}

/**
 * Convertit un text-box en élément de texte
 */
function convertTextBoxToElement(frame: any, position: TextElement['position'], index: number): TextElement {
  let text = '';
  let style: TextElement['style'] = {};
  
  // Extraire le texte
  if (frame['draw:text-box']['text:p']) {
    const textP = frame['draw:text-box']['text:p'];
    
    if (typeof textP === 'string') {
      text = textP;
    } else if (textP['#text']) {
      text = textP['#text'];
    } else if (Array.isArray(textP)) {
      text = textP.map(p => {
        if (typeof p === 'string') return p;
        if (p['#text']) return p['#text'];
        return '';
      }).join('\n');
    }
  }
  
  // Extraire le style
  if (frame['@_draw:style-name']) {
    // TODO: Extraire le style depuis les styles dans le document
    // Nécessite de parcourir les styles
  }
  
  return {
    type: 'text',
    id: frame['@_draw:id'] || `text-${index}`,
    text,
    position,
    style
  };
}

/**
 * Convertit une image en élément d'image
 */
function convertImageToElement(frame: any, position: ImageElement['position'], index: number): ImageElement {
  const image = frame['draw:image'];
  
  return {
    type: 'image',
    id: frame['@_draw:id'] || `image-${index}`,
    src: image['@_xlink:href'] || '',
    position,
    alt: frame['@_draw:name'] || `Image ${index}`
  };
}

/**
 * Convertit une forme en élément de forme
 */
function convertShapeToElement(shape: any, index: number): ShapeElement {
  try {
    // Extraire les coordonnées et dimensions
    const position = {
      x: parseFloat(shape['@_svg:x'] || '0'),
      y: parseFloat(shape['@_svg:y'] || '0'),
      width: parseFloat(shape['@_svg:width'] || '0'),
      height: parseFloat(shape['@_svg:height'] || '0')
    };
    
    // Déterminer le type de forme
    let shapeType = 'rectangle';
    if (shape['@_draw:shape-type']) {
      shapeType = shape['@_draw:shape-type'];
    } else if (shape['draw:enhanced-geometry'] && shape['draw:enhanced-geometry']['@_draw:type']) {
      shapeType = shape['draw:enhanced-geometry']['@_draw:type'];
    }
    
    // Extraire le style
    const style: ShapeElement['style'] = {};
    if (shape['@_draw:style-name']) {
      // TODO: Extraire le style depuis les styles dans le document
    }
    
    // Extraire le texte
    let text;
    if (shape['text:p']) {
      const textP = shape['text:p'];
      if (typeof textP === 'string') {
        text = textP;
      } else if (textP['#text']) {
        text = textP['#text'];
      }
    }
    
    return {
      type: 'shape',
      id: shape['@_draw:id'] || `shape-${index}`,
      shapeType,
      position,
      style,
      text
    };
  } catch (error) {
    logger.warn(`Impossible de convertir la forme en élément: ${error}`);
    return {
      type: 'shape',
      id: `shape-${index}`,
      shapeType: 'rectangle',
      position: { x: 0, y: 0, width: 0, height: 0 }
    };
  }
}
