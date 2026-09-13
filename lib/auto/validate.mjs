// validate.mjs — validacao editorial pura (sem efeitos colaterais). Usado pelo
// pipeline ANTES de qualquer escrita em lib/articles.ts.
export const VALID_CATEGORIES = new Set(['ciencia','tecnologia','espaco','futuro','inteligencia-artificial','games','filmes-series','quadrinhos','curiosidades']);
const AGG = new Set(['msn.com','global.msn.com','bing.com','www.bing.com','bing.com.br','news.google.com','feedly.com']);
const BAD = [/\[object Object\]/i,/lorem ipsum/i,/\btest article\b/i,/\bsample (text|post)\b/i,/\b(?:undefined|NaN)\b/i,/\b(?:ReferenceError|TypeError|SyntaxError)\b/i,/\berror (?:generating|occurred|generation)\b/i,/\bchatgpt\b/i,/\bclaude\b/i];
const FAKE = [/example\.com/i,/your-domain/i,/your-url/i,/sample\.com/i,/\/lorem-ipsum/i];
export const MIN_CONTENT_LENGTH = 300;
export const MAX_TITLE_LENGTH = 200;
export const VALID_CLASSIFICATIONS = new Set(['confirmed','rumor','speculation']);

function dom(u){try{return new URL(u).hostname.replace(/^www\./,'').toLowerCase()}catch{return ''}}
export function isAggregatorUrl(u){const d=dom(u||'');return d? AGG.has(d)||d.endsWith('.msn.com'):false}
export function isValidHttpUrl(u){if(!u||typeof u!=='string')return false;try{const x=new URL(u);return x.protocol==='http:'||x.protocol==='https:'}catch{return false}}
export function isFakeUrl(u){return FAKE.some(r=>r.test(u||''))}
export function normalizeSlug(s){return String(s||'').toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu,'').replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'')}
export function slugIsWellFormed(s){return typeof s==='string'&&s.length>0&&/^[a-z0-9]+(-[a-z0-9]+)*$/.test(s)}
export function isValidNumericId(i){return typeof i==='string'&&/^\d+$/.test(i)}
export function scanBadContent(v){const o=[];for(const r of BAD){if(r.test(v||''))o.push(String(r))}return o}

export function validateArticle(a){
  const e=[];const w=[];
  if(!a||typeof a!=='object')return{ok:false,errors:['artigo nao e objeto'],warnings:w};
  if(!a.id)e.push('id ausente');else if(!isValidNumericId(String(a.id)))e.push('id invalido (nao numerico): '+String(a.id));
  const t=String(a.title||'');
  if(!t.trim())e.push('titulo vazio');else if(t.length>MAX_TITLE_LENGTH)e.push('titulo longo ('+t.length+')');else{const h=scanBadContent(t);if(h.length)e.push('titulo tem '+h.join(','))}
  const s=String(a.slug||'');if(!s.trim())e.push('slug vazio');else if(!slugIsWellFormed(s))e.push('slug malformado: '+s);
  const ex=String(a.excerpt||'');if(!ex.trim())e.push('excerpt vazio');else if(ex.length<30)e.push('excerpt curto');
  const c=String(a.content||'');if(!c.trim())e.push('conteudo vazio');else if(c.length<MIN_CONTENT_LENGTH)e.push('conteudo curto ('+c.length+')');else if(c.trim()[0]==='{'||c.trim()[0]==='[')e.push('conteudo parece JSON');else{const h=scanBadContent(c);if(h.length)e.push('conteudo tem '+h.join(','))}
  const cat=String((a.category&&a.category.slug)||'');if(!cat)e.push('categoria ausente');else if(!VALID_CATEGORIES.has(cat))e.push('categoria inexistente: '+cat);
  if(!Array.isArray(a.tags)||a.tags.length===0)e.push('tags ausentes');
  if(!a.publishedAt)e.push('publishedAt ausente');else if(isNaN(new Date(a.publishedAt).getTime()))e.push('publishedAt invalido');
  const im=a.featuredImage;if(!im)e.push('featuredImage ausente');else if(!isValidHttpUrl(im))e.push('featuredImage nao e URL: '+im);else if(isFakeUrl(im))e.push('featuredImage falsa: '+im);
  const src=Array.isArray(a.sources)?a.sources:[];
  if(src.length===0)e.push('sem fontes (nao publicar)');else{const v=src.filter(x=>x&&isValidHttpUrl(x.url)&&!isFakeUrl(x.url)&&String(x.title||'').trim());if(v.length===0)e.push('nenhuma fonte valida');else if(v.every(x=>isAggregatorUrl(x.url)))e.push('apenas fonte agregadora (sem fonte original)')}
  const cls=a.meta&&a.meta.classification;if(cls&&!VALID_CLASSIFICATIONS.has(cls))e.push('classificacao invalida: '+cls);
  if(a.meta&&!a.meta.pautaUrl)w.push('meta sem pautaUrl');
  return{ok:e.length===0,errors:e,warnings:w};
}
export function validateArticleAgainstCatalog(a,list,cats){
  const e=[];const L=Array.isArray(list)?list:[];
  const cat=a.category&&a.category.slug;if(cat&&!cats.has(cat))e.push('categoria inexistente: '+cat);
  const id=String(a.id||'');const h=L.find(x=>String(x.id)===id);if(h)e.push('ID duplicado: '+id+' (existe em '+h.slug+')');
  const ns=normalizeSlug(a.slug||'');const hs=L.find(x=>normalizeSlug(x.slug||'')===ns);if(hs)e.push('slug duplicado: '+a.slug+' (existe em '+hs.slug+')');
  return{ok:e.length===0,errors:e};
}

export function validateCatalog(L){
  const e=[];const list=Array.isArray(L)?L:[];if(!list.length)return{ok:false,errors:['catalogo vazio'],count:0};
  const ids=new Map();for(const a of list){const i=String(a&&a.id);if(!ids.has(i))ids.set(i,[]);ids.get(i).push(a&&a.slug)}
  for(const[i,sl]of ids){if(!isValidNumericId(i))e.push('id nao numerico: '+i);if(sl.length>1)e.push('ID duplicado '+i+' ('+sl.length+'x)')}
  const st=new Map();for(const a of list){const s=normalizeSlug(a&&a.slug||'');if(!st.has(s))st.set(s,[]);st.get(s).push(a&&a.id)}
  for(const[s,il]of st){if(il.length>1)e.push('slug duplicado '+s+' ('+il.join(',')+')')}
  for(const a of list){if(!a||!String(a.title||'').trim())e.push('artigo sem titulo');if(!a||!a.category||!a.category.slug)e.push('artigo sem categoria')}
  return{ok:e.length===0,errors:e,count:list.length};
}

export function validateRumorVsFact(a){
  const e=[];const cls=a.meta&&a.meta.classification;
  if(cls&&cls!=='confirmed'){const v=/confirm(ou|ado|ada|a)|anunci(ou|ado)|oficialmente/i.test(String(a.title||''));if(v)e.push('rumor tratado como confirmacao no titulo')}
  return{ok:e.length===0,errors:e};
}

function toks(t){return String(t||'').toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu,'').replace(/[^a-z0-9\s]/g,' ').split(/\s+/).filter(w=>w.length>2)}
function jac(a,b){if(!a.length||!b.length)return 0;const A=new Set(a),B=new Set(b);let i=0;A.forEach(t=>{if(B.has(t))i++});return i/(new Set([...A,...B]).size)}
export function checkDedupe(n,existing,opt={}){
  const ct=opt.contentThreshold??0.6,tt=opt.titleThreshold??0.34,ut=opt.urlThreshold??true;
  const nu=String((n.meta&&n.meta.pautaUrl)||(n.sources&&n.sources[0]&&n.sources[0].url)||n.url||'');
  const nt=toks(n.title||''),nc=toks(n.content||'');
  for(const a of (Array.isArray(existing)?existing:[])){
    const au=String(a.sources&&a.sources[0]&&a.sources[0].url||a.url||'');const at=toks(a.title||''),ac=toks(a.content||'');
    if(ut&&nu&&au&&nu.toLowerCase()===au.toLowerCase())return{blocked:true,reason:'URL ja publicada',matchedId:a.id};
    const cs=jac(nc,ac);if(nc.length&&ac.length&&cs>=ct)return{blocked:true,reason:'possivel duplicacao por conteudo ('+cs.toFixed(2)+')',matchedId:a.id};
    const ts=jac(nt,at);if(nt.length&&at.length&&ts>=tt)return{blocked:true,reason:'possivel duplicacao por evento/titulo ('+ts.toFixed(2)+')',matchedId:a.id};
  }
  return{blocked:false};
}