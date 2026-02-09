#!/usr/bin/env node
/**
 * xAI Grok Imagine image generation wrapper
 * Usage: node scripts/grok-imagen.mjs --prompt "..." --output path.png [--image input.png] [--aspect 16:9] [--count 1]
 *
 * --image: Optional input image for image-to-image editing (base64-encoded automatically)
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { dirname, resolve } from 'path';
import { parseArgs } from './lib/parse-args.mjs';
import { getXaiApiKey } from './lib/api-keys.mjs';

const API_URL = 'https://api.x.ai/v1/images/generations';
const MODEL = 'grok-imagine-image';

async function generateImage({ prompt, output, image, aspect = '16:9', count = '1' }) {
  const apiKey = getXaiApiKey();
  const n = parseInt(count, 10);

  console.log(`Generating image with Grok Imagine...`);
  console.log(`  Prompt: "${prompt.slice(0, 100)}..."`);
  console.log(`  Aspect: ${aspect}, Count: ${n}`);
  if (image) console.log(`  Input image: ${image}`);

  const body = {
    model: MODEL,
    prompt,
    n,
    response_format: 'b64_json',
  };

  // Image-to-image: base64-encode local file and attach as image_url
  if (image) {
    const imagePath = resolve(image);
    const imageBuffer = readFileSync(imagePath);
    const base64 = imageBuffer.toString('base64');
    const ext = image.split('.').pop().toLowerCase();
    const mime = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
    body.image_url = `data:${mime};base64,${base64}`;
  }

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Grok Imagine API error (${response.status}): ${error}`);
  }

  const data = await response.json();

  if (!data.data || data.data.length === 0) {
    throw new Error('No images returned from API');
  }

  data.data.forEach((item, i) => {
    const outputPath = data.data.length === 1
      ? resolve(output)
      : resolve(output.replace(/\.(png|jpg|jpeg|webp)$/i, `-${i + 1}.$1`));

    mkdirSync(dirname(outputPath), { recursive: true });

    if (item.b64_json) {
      const buffer = Buffer.from(item.b64_json, 'base64');
      writeFileSync(outputPath, buffer);
      console.log(`Saved: ${outputPath} (${(buffer.length / 1024).toFixed(1)} KB)`);
    } else if (item.url) {
      console.log(`Image URL returned — downloading...`);
      downloadAndSave(item.url, outputPath);
    }
  });

  console.log('Done.');
}

async function downloadAndSave(url, outputPath) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Download failed: ${response.status}`);
  const buffer = Buffer.from(await response.arrayBuffer());
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, buffer);
  console.log(`Downloaded: ${outputPath} (${(buffer.length / 1024).toFixed(1)} KB)`);
}

const args = parseArgs(process.argv.slice(2));

if (!args.prompt) {
  console.error('Usage: node scripts/grok-imagen.mjs --prompt "..." --output path.png [--image input.png] [--aspect 16:9] [--count 1]');
  process.exit(1);
}

if (!args.output) {
  args.output = `scripts/output/grok-imagen-${Date.now()}.png`;
}

generateImage(args).catch((err) => {
  console.error('Image generation failed:', err.message);
  process.exit(1);
});
