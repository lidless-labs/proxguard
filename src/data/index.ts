/**
 * Sample Configuration Data
 * Three pre-built config sets for testing the audit engine.
 */
export { insecureSample } from './insecure';
export { partialSample } from './partial';
export { hardenedSample } from './hardened';

export type SampleType = 'insecure' | 'partial' | 'hardened';

import type { ConfigFileType } from '../types';
import { insecureSample } from './insecure';
import { partialSample } from './partial';
import { hardenedSample } from './hardened';

/** Get a sample config set by name */
export function getSample(type: SampleType): Record<ConfigFileType, string> {
  switch (type) {
    case 'insecure':
      return insecureSample;
    case 'partial':
      return partialSample;
    case 'hardened':
      return hardenedSample;
  }
}
