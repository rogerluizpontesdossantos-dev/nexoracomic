const fs = require('fs');
const path = require('path');

// Read the articles.ts file
const articlesPath = path.join(__dirname, '../lib/articles.ts');
const content = fs.readFileSync(articlesPath, 'utf-8');

// Extract article objects using regex
const articleRegex = /{\s*id:\s*'([^']+)',[\s\S]*?slug:\s*'([^']+)',[\s\S]*?title:\s*'([^']+)',[\s\S]*?category:\s*{[\s\S]*?slug:\s*'([^']+)',[\s\S]*?}[\s\S]*?featuredImage:\s*'([^']+)',[\s\S]*?imageAlt:\s*'([^']+)',[\s\S]*?},/g;

const articles = [];
let match;
let articleIdCounter = 0;

while ((match = articleRegex.exec(content)) !== null) {
  articles.push({
    id: match[1],
    slug: match[2],
    title: match[3],
    category: match[4],
    featuredImage: match[5],
    imageAlt: match[6]
  });
  articleIdCounter++;
}

// Analyze images
const audit = {
  totalArticles: articles.length,
  blackHoleM87Count: 0,
  blackHoleM87Occurrences: [],
  wikimediaImages: [],
  unsplashImages: [],
  topicFallbacks: [],
  suspiciousUrls: [],
  otherImages: []
};

articles.forEach(article => {
  const imageUrl = article.featuredImage;
  
  // Check for Black_Hole_M87_croped.jpg
  if (imageUrl.includes('Black_Hole_M87') || imageUrl.includes('black_hole_m87')) {
    audit.blackHoleM87Count++;
    audit.blackHoleM87Occurrences.push({
      articleId: article.id,
      title: article.title,
      category: article.category,
      slug: article.slug,
      currentImage: imageUrl,
      imageAlt: article.imageAlt
    });
  }
  // Check for Wikimedia Commons
  else if (imageUrl.includes('wikimedia.org')) {
    audit.wikimediaImages.push({
      articleId: article.id,
      title: article.title,
      category: article.category,
      slug: article.slug,
      currentImage: imageUrl,
      imageAlt: article.imageAlt
    });
  }
  // Check for Unsplash
  else if (imageUrl.includes('unsplash.com')) {
    audit.unsplashImages.push({
      articleId: article.id,
      title: article.title,
      category: article.category,
      slug: article.slug,
      currentImage: imageUrl,
      imageAlt: article.imageAlt
    });
  }
  // Check for /topics/ fallbacks
  else if (imageUrl.includes('/topics/')) {
    audit.topicFallbacks.push({
      articleId: article.id,
      title: article.title,
      category: article.category,
      slug: article.slug,
      currentImage: imageUrl,
      imageAlt: article.imageAlt
    });
  }
  // Check for suspicious patterns (hash-based URLs, etc.)
  else if (imageUrl.includes('upload.wikimedia.org/wikipedia/commons/') && 
           (imageUrl.match(/[a-f0-9]{32}/) || imageUrl.includes('thumb/') === false && imageUrl.includes('commons/') === false)) {
    audit.suspiciousUrls.push({
      articleId: article.id,
      title: article.title,
      category: article.category,
      slug: article.slug,
      currentImage: imageUrl,
      imageAlt: article.imageAlt,
      reason: 'Potential hash-based or malformed URL'
    });
  }
  else {
    audit.otherImages.push({
      articleId: article.id,
      title: article.title,
      category: article.category,
      slug: article.slug,
      currentImage: imageUrl,
      imageAlt: article.imageAlt
    });
  }
});

// Write audit results
const auditPath = path.join(__dirname, '_task8_audit.json');
fs.writeFileSync(auditPath, JSON.stringify(audit, null, 2));

console.log('Task 8 Audit Complete:');
console.log(`Total Articles: ${audit.totalArticles}`);
console.log(`Black_Hole_M87 occurrences: ${audit.blackHoleM87Count}`);
console.log(`Wikimedia Commons images: ${audit.wikimediaImages.length}`);
console.log(`Unsplash images: ${audit.unsplashImages.length}`);
console.log(`/topics/ fallbacks: ${audit.topicFallbacks.length}`);
console.log(`Suspicious URLs: ${audit.suspiciousUrls.length}`);
console.log(`Other images: ${audit.otherImages.length}`);
console.log(`\nAudit saved to: ${auditPath}`);
