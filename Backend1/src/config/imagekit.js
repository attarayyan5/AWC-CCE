// src/config/imagekit.js
// ImageKit SDK initialization - server-side only

import ImageKit from 'imagekit';
import { config } from './index.js';
import logger from '../utils/logger.js';

let imagekit = null;

if (config.imagekit.privateKey && config.imagekit.publicKey && config.imagekit.urlEndpoint) {
  imagekit = new ImageKit({
    publicKey: config.imagekit.publicKey,
    privateKey: config.imagekit.privateKey,
    urlEndpoint: config.imagekit.urlEndpoint,
  });
  logger.info('ImageKit SDK initialized');
} else {
  logger.warn('ImageKit credentials not configured. Document upload will be unavailable.');
}

export { imagekit };
export default imagekit;
