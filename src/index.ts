// Exports pour utilisation publique
export * from './types';
export * from './errors';
export { 
  setLogLevel, 
  getLogLevel, 
  checkLibreOfficeInstallation 
} from './utils';
export {
  convertPptxToJson,
  convertFodpToJson,
  JsonConversionOptions
} from './converter'; 