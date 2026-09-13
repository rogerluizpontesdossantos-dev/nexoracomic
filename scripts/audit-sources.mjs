#!/usr/bin/env node

/**
 * Comprehensive source audit script for NexoraComic articles
 * Analyzes source quality, URL patterns, and categorization
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read articles.ts
const articlesPath = join(__dirname, '../lib/articles.ts');
const articlesContent = readFileSync(articlesPath, 'utf-8');

// Patterns for suspicious URLs
const suspiciousPatterns = [
  /\/subjects\//,          // Generic subject pages (e.g., nature.com/subjects/quantum-physics)
  /\/$/,                   // URLs ending with / (homepages)
  /\/category\//,          // Category pages
  /\/tag\//,               // Tag pages
  /www\.(nature|ieee|science)\.com\/[^\/]*$/, // Homepage only
];

// Official domain patterns (more likely to be legitimate)
const officialDomains = [
  'nasa.gov',
  'esa.int',
  'stsci.edu',
  'cern.ch',
  'noaa.gov',
  'nist.gov',
  'unesco.org',
  'nvidia.com',
  'microsoft.com',
  'apple.com',
  'google.com',
  'anthropic.com',
  'openai.com',
  'sony.com',
  'playstation.com',
  'xbox.com',
  'nintendo.com',
  'disney.com',
  'marvel.com',
  'dc.com',
  'starwars.com',
  'netflix.com',
  'hbo.com',
  'rockstargames.com',
  'ea.com',
  'square-enix.com',
  'cdprojektred.com',
  'ubisoft.com',
];

const results = {
  totalArticles: 0,
  articlesWithSources: 0,
  articlesWithoutSources: 0,
  totalSources: 0,
  sourceTypes: {},
  suspiciousUrls: [],
  officialDomainUrls: [],
  needsReview: [],
};

// Extract article blocks
const idMatches = articlesContent.match(/^\s*id:\s*['"](\d+)['"]/gm) || [];
results.totalArticles = idMatches.length;

// Extract sources arrays and analyze
const sourcesMatches = articlesContent.match(/sources:\s*\[[\s\S]*?\]/g) || [];
results.articlesWithSources = sourcesMatches.length;
results.articlesWithoutSources = results.totalArticles - results.articlesWithSources;

sourcesMatches.forEach((sourcesBlock) => {
  // Extract individual source objects
  const sourceObjects = sourcesBlock.match(/\{\s*title:[\s\S]*?\}/g) || [];
  
  sourceObjects.forEach((source) => {
    results.totalSources++;
    
    // Extract type
    const typeMatch = source.match(/type:\s*['"]([^'"]+)['"]/);
    if (typeMatch) {
      const type = typeMatch[1];
      results.sourceTypes[type] = (results.sourceTypes[type] || 0) + 1;
    }
    
    // Extract URL
    const urlMatch = source.match(/url:\s*['"]([^'"]+)['"]/);
    if (urlMatch) {
      const url = urlMatch[1];
      
      // Check for official domains
      const isOfficial = officialDomains.some(domain => url.includes(domain));
      if (isOfficial) {
        results.officialDomainUrls.push(url);
      }
      
      // Check for suspicious patterns
      const isSuspicious = suspiciousPatterns.some(pattern => pattern.test(url));
      if (isSuspicious) {
        results.suspiciousUrls.push(url);
      }
      
      // Check for future-dated content (2026+)
      if (url.includes('2026') || url.includes('2027')) {
        results.needsReview.push({ url, reason: 'Future-dated URL' });
      }
    }
  });
});

// Print results
console.log('\n=== Source Audit Report ===\n');
console.log(`Total articles audited: ${results.totalArticles}`);
console.log(`Articles with sources field: ${results.articlesWithSources}`);
console.log(`Articles WITHOUT sources field: ${results.articlesWithoutSources}`);
console.log(`Total sources found: ${results.totalSources}`);
console.log('\n--- Source Types ---\n');
Object.entries(results.sourceTypes).forEach(([type, count]) => {
  console.log(`  ${type}: ${count}`);
});
console.log(`\n--- URL Quality ---\n`);
console.log(`Official domain URLs: ${results.officialDomainUrls.length}`);
console.log(`Suspicious/generic URLs: ${results.suspiciousUrls.length}`);
console.log(`URLs needing review (future-dated): ${results.needsReview.length}`);

if (results.suspiciousUrls.length > 0) {
  console.log('\n--- Suspicious/Generic URLs (may need review) ---\n');
  results.suspiciousUrls.slice(0, 10).forEach(url => console.log(`  ⚠️  ${url}`));
  if (results.suspiciousUrls.length > 10) {
    console.log(`  ... and ${results.suspiciousUrls.length - 10} more`);
  }
}

if (results.needsReview.length > 0) {
  console.log('\n--- URLs Needing Review (future-dated or questionable) ---\n');
  results.needsReview.slice(0, 10).forEach(({ url, reason }) => console.log(`  ⚠️  ${url} (${reason})`));
  if (results.needsReview.length > 10) {
    console.log(`  ... and ${results.needsReview.length - 10} more`);
  }
}

console.log('\n=== Summary ===\n');
console.log(`Articles: ${((results.articlesWithSources / results.totalArticles) * 100).toFixed(1)}% com fontes`);
console.log(`Official sources: ${results.officialDomainUrls.length}`);
console.log(`Suspicious URLs: ${results.suspiciousUrls.length}`);
console.log(`Articles without sources: ${results.articlesWithoutSources}`);
console.log(`\nNOTE: This is a pattern-based audit. Manual verification of URLs is recommended.`);
