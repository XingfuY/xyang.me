#!/usr/bin/env node
/**
 * Shared API key extraction for Google AI Studio and xAI Grok.
 * Reads from context/info.txt.
 */

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const INFO_PATH = resolve(__dirname, '..', '..', 'context', 'info.txt');

function readInfoFile() {
  return readFileSync(INFO_PATH, 'utf-8');
}

export function getGoogleApiKey() {
  const content = readInfoFile();
  const match = content.match(/API Keys?:\s*(\S+)/i);
  if (!match) throw new Error('Google API key not found in context/info.txt');
  return match[1];
}

export function getXaiApiKey() {
  const content = readInfoFile();
  const match = content.match(/xAI GroK API Keys?:\s*(\S+)/i);
  if (!match) throw new Error('xAI Grok API key not found in context/info.txt');
  return match[1];
}
