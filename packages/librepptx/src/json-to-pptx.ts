import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import { Presentation, Slide, SlideElement, TextElement, ImageElement, ShapeElement } from './converter';
import { ConversionOptions, ConversionResult } from './types';
import { logger } from './utils';

/**
 * Structure de base d'un document FODP (OpenDocument Presentation)
 */
const FODP_TEMPLATE = `<?xml version="1.0" encoding="UTF-8"?>
<office:document xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0"
                xmlns:style="urn:oasis:names:tc:opendocument:xmlns:style:1.0"
                xmlns:text="urn:oasis:names:tc:opendocument:xmlns:text:1.0"
                xmlns:table="urn:oasis:names:tc:opendocument:xmlns:table:1.0"
                xmlns:draw="urn:oasis:names:tc:opendocument:xmlns:drawing:1.0"
                xmlns:fo="urn:oasis:names:tc:opendocument:xmlns:xsl-fo-compatible:1.0"
                xmlns:xlink="http://www.w3.org/1999/xlink"
                xmlns:dc="http://purl.org/dc/elements/1.1/"
                xmlns:meta="urn:oasis:names:tc:opendocument:xmlns:meta:1.0"
                xmlns:number="urn:oasis:names:tc:opendocument:xmlns:datastyle:1.0"
                xmlns:presentation="urn:oasis:names:tc:opendocument:xmlns:presentation:1.0"
                xmlns:svg="urn:oasis:names:tc:opendocument:xmlns:svg-compatible:1.0"
                xmlns:chart="urn:oasis:names:tc:opendocument:xmlns:chart:1.0"
                xmlns:dr3d="urn:oasis:names:tc:opendocument:xmlns:dr3d:1.0"
                xmlns:math="http://www.w3.org/1998/Math/MathML"
                xmlns:form="urn:oasis:names:tc:opendocument:xmlns:form:1.0"
                xmlns:script="urn:oasis:names:tc:opendocument:xmlns:script:1.0"
                xmlns:ooo="http://openoffice.org/2004/office"
                xmlns:ooow="http://openoffice.org/2004/writer"
                xmlns:oooc="http://openoffice.org/2004/calc"
                xmlns:dom="http://www.w3.org/2001/xml-events"
                xmlns:xforms="http://www.w3.org/2002/xforms"
                xmlns:xsd="http://www.w3.org/2001/XMLSchema"
                xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
                office:version="1.2"
                office:mimetype="application/vnd.oasis.opendocument.presentation">
  <office:meta>
    <dc:title>{TITLE}</dc:title>
    <meta:creation-date>{CREATION_DATE}</meta:creation-date>
    <dc:creator>{AUTHOR}</dc:creator>
    <meta:generator>LibrePPTX Converter</meta:generator>
  </office:meta>
  <office:settings>
    <!-- Paramètres de base -->
  </office:settings>
  <office:styles>
    <!-- Styles par défaut -->
    <style:style style:name="dp1" style:family="drawing-page">
      <style:drawing-page-properties presentation:background-visible="true" presentation:background-objects-visible="true"/>
    </style:style>
    <style:style style:name="DefaultTextStyle" style:family="paragraph">
      <style:paragraph-properties fo:text-align="start"/>
      <style:text-properties fo:font-size="18pt" fo:font-family="Arial"/>
    </style:style>
  </office:styles>
  <office:automatic-styles>
    <!-- Styles automatiques générés -->
    <style:style style:name="TextBox" style:family="graphic">
      <style:graphic-properties draw:fill="none" draw:stroke="none"/>
      <style:text-properties fo:font-family="Arial" fo:font-size="18pt"/>
    </style:style>
    <style:style style:name="ShapeBox" style:family="graphic">
      <style:graphic-properties draw:fill="solid" draw:fill-color="#e6e6e6" draw:stroke="solid" draw:stroke-color="#000000" draw:stroke-width="0.02cm"/>
    </style:style>
    <style:style style:name="ImageFrame" style:family="graphic">
      <style:graphic-properties draw:fill="none" draw:stroke="none"/>
    </style:style>
  </office:automatic-styles>
  <office:master-styles>
    <!-- Style maître pour les diapositives -->
    <style:master-page style:name="DefaultMaster" style:page-layout-name="PM1" draw:style-name="dp1">
      <draw:frame presentation:style-name="DefaultTitle" draw:layer="layout" svg:width="25cm" svg:height="3cm" svg:x="1cm" svg:y="1cm">
        <draw:text-box/>
      </draw:frame>
    </style:master-page>
  </office:master-styles>
  <office:body>
    <office:presentation>
      {SLIDES}
    </office:presentation>
  </office:body>
</office:document>`;

/**
 * Convertit un objet JSON de présentation en fichier FODP
 * 
 * @param presentation Objet JSON de la présentation
 * @param options Options de conversion
 * @returns Chemin du fichier FODP généré
 */
export async function convertJsonToFodp(
  presentation: Presentation,
  options: ConversionOptions = {}
): Promise<string> {
  try {
    logger.info('Conversion JSON -> FODP: Début');
    
    // Préparer le répertoire de sortie
    const outputDir = options.outputDir || path.join(process.cwd(), 'output');
    await fs.promises.mkdir(outputDir, { recursive: true });
    
    // Générer un nom de fichier pour le FODP
    const outputFileName = options.outputFileName || `presentation-${Date.now()}`;
    const fodpPath = path.join(outputDir, `${outputFileName}.fodp`);
    
    logger.debug(`Répertoire de sortie: ${outputDir}`);
    logger.debug(`Fichier FODP cible: ${fodpPath}`);
    
    // Construire le contenu XML du FODP
    const xmlContent = buildFodpFromJson(presentation);
    
    // Écrire le contenu dans le fichier FODP
    await fs.promises.writeFile(fodpPath, xmlContent, 'utf8');
    
    logger.info(`Fichier FODP généré avec succès: ${fodpPath}`);
    
    return fodpPath;
  } catch (error: any) {
    logger.error(`Erreur lors de la conversion JSON -> FODP: ${error.message}`);
    throw error;
  }
}

/**
 * Convertit un objet JSON de présentation en fichier PPTX via FODP
 * 
 * @param presentation Objet JSON de la présentation
 * @param options Options de conversion
 * @returns Résultat de la conversion avec le chemin du fichier PPTX généré
 */
export async function convertJsonToPptx(
  presentation: Presentation,
  options: ConversionOptions = {}
): Promise<ConversionResult> {
  try {
    const startTime = new Date();
    logger.info('Conversion JSON -> PPTX: Début');
    
    // 1. Convertir JSON en FODP
    const fodpPath = await convertJsonToFodp(presentation, options);
    logger.debug(`Fichier FODP intermédiaire généré: ${fodpPath}`);
    
    // 2. Préparer le chemin de sortie pour le PPTX
    const outputDir = options.outputDir || path.join(process.cwd(), 'output');
    const outputFileName = options.outputFileName || `presentation-${Date.now()}`;
    const pptxPath = path.join(outputDir, `${outputFileName}.pptx`);
    
    // 3. Convertir FODP en PPTX à l'aide de LibreOffice
    logger.debug('Conversion FODP -> PPTX via LibreOffice...');
    
    try {
      // Commande pour convertir FODP en PPTX avec LibreOffice
      const libreOfficeCommand = `soffice --headless --convert-to pptx:"Impress MS PowerPoint 2007 XML" "${fodpPath}" --outdir "${outputDir}"`;
      logger.debug(`Commande LibreOffice: ${libreOfficeCommand}`);
      
      const result = execSync(libreOfficeCommand, { encoding: 'utf8' });
      logger.debug(`Résultat de la conversion: ${result}`);
      
    } catch (error: any) {
      logger.error(`Erreur lors de l'exécution de LibreOffice: ${error.message}`);
      throw new Error(`Échec de la conversion FODP -> PPTX: ${error.message}`);
    }
    
    // Vérifier que le fichier PPTX a bien été créé
    if (!fs.existsSync(pptxPath)) {
      throw new Error(`Le fichier PPTX n'a pas été généré: ${pptxPath}`);
    }
    
    // Supprimer le fichier FODP intermédiaire si demandé
    if (!options.keepTempFiles) {
      await fs.promises.unlink(fodpPath);
      logger.debug(`Fichier FODP intermédiaire supprimé: ${fodpPath}`);
    }
    
    const endTime = new Date();
    const duration = endTime.getTime() - startTime.getTime();
    
    logger.info(`Conversion JSON -> PPTX réussie: ${pptxPath}`);
    
    return {
      success: true,
      outputPath: pptxPath,
      format: 'pptx',
      conversionInfo: {
        startTime,
        endTime,
        duration
      }
    };
  } catch (error: any) {
    logger.error(`Erreur lors de la conversion JSON -> PPTX: ${error.message}`);
    throw error;
  }
}

/**
 * Construit le contenu XML du fichier FODP à partir de l'objet JSON
 * 
 * @param presentation Objet JSON de la présentation
 * @returns Contenu XML du fichier FODP
 */
function buildFodpFromJson(presentation: Presentation): string {
  // Métadonnées de base
  const title = escapeXml(presentation.title || 'Présentation');
  const author = escapeXml(presentation.metadata?.author || 'Utilisateur');
  const creationDate = presentation.metadata?.created || new Date().toISOString();
  
  // Construire les diapositives
  const slidesXml = presentation.slides.map((slide, index) => {
    return buildSlideXml(slide, index);
  }).join('\n');
  
  // Remplacer les placeholders dans le template
  let fodpContent = FODP_TEMPLATE
    .replace('{TITLE}', title)
    .replace('{AUTHOR}', author)
    .replace('{CREATION_DATE}', creationDate)
    .replace('{SLIDES}', slidesXml);
  
  return fodpContent;
}

/**
 * Construit le XML pour une diapositive
 * 
 * @param slide Objet JSON de la diapositive
 * @param index Index de la diapositive
 * @returns XML de la diapositive
 */
function buildSlideXml(slide: Slide, index: number): string {
  const slideId = slide.id || `slide-${index + 1}`;
  const slideTitle = escapeXml(slide.title || `Diapositive ${index + 1}`);
  const backgroundColor = slide.background?.color || '#FFFFFF';
  
  // Construire les éléments de la diapositive
  const elementsXml = slide.elements.map((element, elemIndex) => {
    return buildElementXml(element, elemIndex);
  }).join('\n');
  
  // Structure XML de la diapositive
  return `
    <draw:page draw:name="${slideTitle}" draw:style-name="dp1" draw:id="${slideId}">
      <draw:rect draw:style-name="background" draw:layer="layout" svg:width="28cm" svg:height="21cm" svg:x="0cm" svg:y="0cm">
        <svg:title>Background</svg:title>
        <draw:fill>
          <draw:fill-color svg:color="${backgroundColor}"/>
        </draw:fill>
      </draw:rect>
      ${elementsXml}
    </draw:page>
  `;
}

/**
 * Construit le XML pour un élément de diapositive
 * 
 * @param element Objet JSON de l'élément
 * @param index Index de l'élément
 * @returns XML de l'élément
 */
function buildElementXml(element: SlideElement, index: number): string {
  switch (element.type) {
    case 'text':
      return buildTextElementXml(element, index);
    case 'image':
      return buildImageElementXml(element, index);
    case 'shape':
      return buildShapeElementXml(element, index);
    default:
      return '';
  }
}

/**
 * Construit le XML pour un élément texte
 * 
 * @param element Élément texte
 * @param index Index de l'élément
 * @returns XML de l'élément texte
 */
function buildTextElementXml(element: TextElement, index: number): string {
  const x = `${(element.position.x / 100)}cm`;
  const y = `${(element.position.y / 100)}cm`;
  const width = `${(element.position.width / 100)}cm`;
  const height = `${(element.position.height / 100)}cm`;
  const text = escapeXml(element.text);
  
  // Styles de texte
  const fontFamily = element.style?.fontFamily || 'Arial';
  const fontSize = `${element.style?.fontSize || 18}pt`;
  const color = element.style?.color || '#000000';
  const fontWeight = element.style?.bold ? 'bold' : 'normal';
  const fontStyle = element.style?.italic ? 'italic' : 'normal';
  const textDecoration = element.style?.underline ? 'underline' : 'none';
  const textAlign = element.style?.align || 'left';
  
  return `
    <draw:frame draw:style-name="TextBox" draw:layer="layout" svg:width="${width}" svg:height="${height}" svg:x="${x}" svg:y="${y}" draw:id="${element.id}">
      <draw:text-box>
        <text:p text:style-name="TextStyle${index}">
          <text:span text:style-name="TextSpanStyle${index}">${text}</text:span>
        </text:p>
      </draw:text-box>
    </draw:frame>
    
    <style:style style:name="TextStyle${index}" style:family="paragraph">
      <style:paragraph-properties fo:text-align="${textAlign}"/>
    </style:style>
    
    <style:style style:name="TextSpanStyle${index}" style:family="text">
      <style:text-properties fo:font-family="${fontFamily}" fo:font-size="${fontSize}" fo:color="${color}" fo:font-weight="${fontWeight}" fo:font-style="${fontStyle}" style:text-underline-style="${textDecoration == 'underline' ? 'solid' : 'none'}" style:text-underline-width="auto" style:text-underline-color="font-color"/>
    </style:style>
  `;
}

/**
 * Construit le XML pour un élément image
 * 
 * @param element Élément image
 * @param index Index de l'élément
 * @returns XML de l'élément image
 */
function buildImageElementXml(element: ImageElement, index: number): string {
  const x = `${(element.position.x / 100)}cm`;
  const y = `${(element.position.y / 100)}cm`;
  const width = `${(element.position.width / 100)}cm`;
  const height = `${(element.position.height / 100)}cm`;
  const alt = escapeXml(element.alt || '');
  
  // L'URL de l'image doit être absolue ou relative au document FODP
  const imageHref = element.src;
  
  return `
    <draw:frame draw:style-name="ImageFrame" draw:layer="layout" svg:width="${width}" svg:height="${height}" svg:x="${x}" svg:y="${y}" draw:id="${element.id}">
      <draw:image xlink:href="${imageHref}" xlink:type="simple" xlink:show="embed" xlink:actuate="onLoad">
        <svg:title>${alt}</svg:title>
      </draw:image>
    </draw:frame>
  `;
}

/**
 * Construit le XML pour un élément forme
 * 
 * @param element Élément forme
 * @param index Index de l'élément
 * @returns XML de l'élément forme
 */
function buildShapeElementXml(element: ShapeElement, index: number): string {
  const x = `${(element.position.x / 100)}cm`;
  const y = `${(element.position.y / 100)}cm`;
  const width = `${(element.position.width / 100)}cm`;
  const height = `${(element.position.height / 100)}cm`;
  
  const fillColor = element.style?.fill || '#e6e6e6';
  const strokeColor = element.style?.stroke || '#000000';
  const strokeWidth = `${(element.style?.strokeWidth || 1) / 100}cm`;
  
  // Texte contenu dans la forme, s'il y en a
  const text = element.text ? escapeXml(element.text) : '';
  const textElement = text ? `
    <draw:text-box>
      <text:p>
        <text:span>${text}</text:span>
      </text:p>
    </draw:text-box>
  ` : '';

  // XML pour différents types de formes
  switch (element.shapeType.toLowerCase()) {
    case 'rectangle':
      return `
        <draw:rect draw:style-name="ShapeBox${index}" draw:layer="layout" svg:width="${width}" svg:height="${height}" svg:x="${x}" svg:y="${y}" draw:id="${element.id}">
          ${textElement}
        </draw:rect>
        
        <style:style style:name="ShapeBox${index}" style:family="graphic">
          <style:graphic-properties draw:fill="solid" draw:fill-color="${fillColor}" draw:stroke="solid" draw:stroke-color="${strokeColor}" draw:stroke-width="${strokeWidth}"/>
        </style:style>
      `;
      
    case 'ellipse':
    case 'circle':
      return `
        <draw:ellipse draw:style-name="ShapeBox${index}" draw:layer="layout" svg:width="${width}" svg:height="${height}" svg:x="${x}" svg:y="${y}" draw:id="${element.id}">
          ${textElement}
        </draw:ellipse>
        
        <style:style style:name="ShapeBox${index}" style:family="graphic">
          <style:graphic-properties draw:fill="solid" draw:fill-color="${fillColor}" draw:stroke="solid" draw:stroke-color="${strokeColor}" draw:stroke-width="${strokeWidth}"/>
        </style:style>
      `;
      
    case 'triangle':
      // Pour un triangle, on utilise un polygone régulier à 3 côtés
      return `
        <draw:regular-polygon draw:style-name="ShapeBox${index}" draw:layer="layout" svg:width="${width}" svg:height="${height}" svg:x="${x}" svg:y="${y}" draw:id="${element.id}" draw:corners="3">
          ${textElement}
        </draw:regular-polygon>
        
        <style:style style:name="ShapeBox${index}" style:family="graphic">
          <style:graphic-properties draw:fill="solid" draw:fill-color="${fillColor}" draw:stroke="solid" draw:stroke-color="${strokeColor}" draw:stroke-width="${strokeWidth}"/>
        </style:style>
      `;
      
    default:
      // Par défaut, on utilise un rectangle
      return `
        <draw:rect draw:style-name="ShapeBox${index}" draw:layer="layout" svg:width="${width}" svg:height="${height}" svg:x="${x}" svg:y="${y}" draw:id="${element.id}">
          ${textElement}
        </draw:rect>
        
        <style:style style:name="ShapeBox${index}" style:family="graphic">
          <style:graphic-properties draw:fill="solid" draw:fill-color="${fillColor}" draw:stroke="solid" draw:stroke-color="${strokeColor}" draw:stroke-width="${strokeWidth}"/>
        </style:style>
      `;
  }
}

/**
 * Échappe les caractères spéciaux XML
 * 
 * @param text Texte à échapper
 * @returns Texte échappé
 */
function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
} 