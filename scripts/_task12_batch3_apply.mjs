import fs from 'fs';

// ID -> array of { title, url, type } | null = keep
const replacements = {
  22: [
    { title: 'Apple - ARKit Developer Documentation', url: 'https://developer.apple.com/documentation/ARKit', type: 'company' },
    { title: 'Stanford Virtual Human Interaction Lab', url: 'https://vhil.stanford.edu/', type: 'university' },
    { title: 'Google - ARCore Developer Overview', url: 'https://developers.google.com/ar/develop', type: 'company' },
  ],
  23: [
    { title: 'Google - Machine Learning Crash Course', url: 'https://developers.google.com/machine-learning/crash-course', type: 'company' },
    { title: 'MIT - Introduction to Machine Learning', url: 'https://ocw.mit.edu/courses/6-036-introduction-to-machine-learning-fall-2020/', type: 'university' },
    { title: 'LeCun, Bengio & Hinton - Deep Learning (Nature, 2015)', url: 'https://www.nature.com/articles/nature14539', type: 'journal' },
  ],
  24: null,
  25: [
    { title: 'Autodesk Maya - 3D Animation and CGI Software', url: 'https://www.autodesk.com/products/maya/overview', type: 'company' },
    { title: 'Pixar - Technology Libraries and Research', url: 'https://graphics.pixar.com/', type: 'company' },
    { title: 'Pixar RenderMan - Official Product Site', url: 'https://renderman.pixar.com/', type: 'company' },
  ],
  26: [
    { title: 'Nielsen The Gauge - Streaming vs Total TV Time', url: 'https://www.nielsen.com/insights/2022/streaming-claims-more-than-one-third-of-total-tv-time-in-june-and-hits-fourth-straight-monthly-viewing-record/', type: 'publication' },
    { title: 'Nielsen - OTA + OTT: The New TV Bundle', url: 'https://www.nielsen.com/insights/2022/ota-ott-the-new-tv-bundle/', type: 'publication' },
  ],
  27: [
    { title: 'Epic Games - Unreal Engine 5 Documentation', url: 'https://dev.epicgames.com/documentation/en-us/unreal-engine', type: 'company' },
    { title: 'Unity - Manual / Documentation', url: 'https://docs.unity3d.com/Manual/index.html', type: 'company' },
    { title: 'NVIDIA - RTX Ray Tracing Developer Resources', url: 'https://developer.nvidia.com/rtx/ray-tracing', type: 'company' },
  ],
  28: [
    { title: 'NVIDIA GeForce NOW - Official Site', url: 'https://www.nvidia.com/geforce-now/', type: 'company' },
    { title: 'Xbox Cloud Gaming', url: 'https://www.xbox.com/play', type: 'company' },
    { title: 'arXiv - Network Anatomy and Real-Time Measurement of Nvidia GeForce NOW Cloud Gaming', url: 'https://arxiv.org/abs/2401.06366', type: 'journal' },
  ],
  29: [
    { title: 'Jafleh et al. - The Role of Wearable Devices in Chronic Disease Monitoring (Cureus, 2024, via PMC/NIH)', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11461032/', type: 'journal' },
    { title: 'IEEE SA - IEEE 11073-20601 Health Informatics Standard', url: 'https://standards.ieee.org/ieee/11073.20601/9300/', type: 'publication' },
    { title: 'FDA - Digital Health Center of Excellence', url: 'https://www.fda.gov/medical-devices/digital-health-center-excellence', type: 'agency' },
  ],
  30: [
    { title: 'NHTSA - Automated Vehicle Safety', url: 'https://www.nhtsa.gov/vehicle-safety/automated-vehicle-safety', type: 'agency' },
    { title: 'SAE International - J3016 Levels of Driving Automation', url: 'https://www.sae.org/standards/j3016_202104-taxonomy-definitions-terms-related-driving-automation-systems-road-motor-vehicles/', type: 'other' },
    { title: 'Waymo Safety Report', url: 'https://waymo.com/safety/', type: 'company' },
  ],
  31: [
    { title: 'NVIDIA Developer - DLSS', url: 'https://developer.nvidia.com/rtx/dlss', type: 'company' },
    { title: 'NVIDIA - DLSS Technology', url: 'https://www.nvidia.com/en-us/geforce/technologies/dlss/', type: 'company' },
    { title: 'NVIDIA GTC - AI Breakthroughs and Keynotes', url: 'https://www.nvidia.com/gtc/', type: 'company' },
  ],
};

const remaining = new Set(Object.keys(replacements).filter(k => replacements[k]));
const applied = [];

while (remaining.size > 0) {
  const t = fs.readFileSync('lib/articles.ts', 'utf8');
  let idRe = / {4}id: '(\d+)',/g;
  const positions = [];
  let m;
  while ((m = idRe.exec(t)) !== null) positions.push({ id: parseInt(m[1]), index: m.index });
  positions.push({ id: null, index: t.length });
  let appliedOne = false;
  for (let k = 0; k < positions.length - 1; k++) {
    const id = positions[k].id;
    if (!remaining.has(String(id))) continue;
    const srcs = replacements[String(id)];
    const region = t.slice(positions[k].index, positions[k + 1].index);
    const mSrc = region.match(/ {4}sources: \[[\s\S]*?\n {4}\]\r?\n/);
    if (!mSrc) { console.log('WARN no sources block for', id); remaining.delete(String(id)); continue; }
    if (srcs.every(s => mSrc[0].includes(s.url))) { applied.push(id); remaining.delete(String(id)); appliedOne = true; break; }
    const nl = mSrc[0].includes('\r\n') ? '\r\n' : '\n';
    const block = ['    sources: ['];
    srcs.forEach((s, idx) => {
      const comma = idx < srcs.length - 1 ? ',' : '';
      block.push('      {');
      block.push(`        title: '${s.title.replace(/'/g, "\\'")}',`);
      block.push(`        url: '${s.url}',`);
      block.push(`        type: '${s.type}'`);
      block.push(`      }${comma}`);
    });
    block.push('    ]');
    const absStart = positions[k].index + mSrc.index;
    fs.writeFileSync('lib/articles.ts', t.slice(0, absStart) + block.join(nl) + t.slice(absStart + mSrc[0].length));
    applied.push(id);
    remaining.delete(String(id));
    appliedOne = true;
    break;
  }
  if (!appliedOne) break;
}
console.log('applied for ids:', applied.join(','));
if (remaining.size) console.log('NOT applied:', [...remaining].join(','));
