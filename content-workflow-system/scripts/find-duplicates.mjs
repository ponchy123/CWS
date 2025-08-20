import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const projectRoot = path.resolve(process.cwd(), 'content-workflow-system');

const IGNORED_DIRS = new Set([
  'node_modules',
  'dist',
  'build',
  '.git',
  'coverage',
  'playwright-report',
  'test-results',
  '.vite',
  '.turbo',
]);

// 用于重复检测与引用解析的文件类型
const CODE_EXTS = new Set(['.ts', '.tsx', '.js', '.jsx', '.css', '.scss', '.json', '.html']);
const ASSET_EXTS = new Set([
  '.svg',
  '.png',
  '.jpg',
  '.jpeg',
  '.webp',
  '.avif',
  '.gif',
  '.ico',
  '.bmp',
  '.mp3',
  '.wav',
  '.mp4',
  '.webm',
  '.woff',
  '.woff2',
  '.ttf',
  '.eot',
]);
const DECL_EXTS = new Set(['.d.ts']);
const ALL_TRACK_EXTS = new Set([...CODE_EXTS, ...ASSET_EXTS, ...DECL_EXTS]);

const RESOLVE_EXTS = ['.ts', '.tsx', '.js', '.jsx', '.json', '.css', '.scss'];

function posixRel(p) {
  return p.split(path.sep).join('/');
}

function isIgnoredPath(fp) {
  const parts = fp.split(path.sep);
  return parts.some((seg) => IGNORED_DIRS.has(seg));
}

function* walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const fp = path.join(dir, e.name);
    if (isIgnoredPath(fp)) continue;
    if (e.isDirectory()) {
      yield* walk(fp);
    } else if (e.isFile()) {
      yield fp;
    }
  }
}

function readText(fp) {
  try {
    return fs.readFileSync(fp, 'utf8');
  } catch {
    return '';
  }
}

function sha1(content) {
  return crypto.createHash('sha1').update(content).digest('hex');
}

// 去注释+压缩空白
function stripCommentsAndWhitespace(text) {
  let t = text.replace(/\/\*[\s\S]*?\*\//g, '');
  t = t.replace(/(^|[^:])\/\/.*$/gm, '$1');
  t = t.replace(/\r\n/g, '\n');
  t = t.replace(/\s+/g, '');
  return t;
}

// 扫描全项目文件（排除忽略目录）
const allFilesAbs = Array.from(walk(projectRoot));
const trackedFilesAbs = allFilesAbs.filter((fp) => ALL_TRACK_EXTS.has(path.extname(fp)));
const trackedRel = trackedFilesAbs.map((fp) => posixRel(path.relative(projectRoot, fp)));

// 建立索引 rel -> abs
const filesIndex = new Map();
for (let i = 0; i < trackedFilesAbs.length; i++) {
  filesIndex.set(trackedRel[i], trackedFilesAbs[i]);
}

// ========== 重复检测 ==========
function duplicateReport() {
  const basenameMap = new Map();
  const rawHashMap = new Map();
  const normHashMap = new Map();

  for (const rel of trackedRel) {
    const abs = filesIndex.get(rel);
    const base = path.basename(rel);
    const raw = readText(abs);

    // basename
    if (!basenameMap.has(base)) basenameMap.set(base, []);
    basenameMap.get(base).push(rel);

    // 内容哈希
    const rawHash = sha1(raw);
    const normHash = sha1(stripCommentsAndWhitespace(raw));
    if (!rawHashMap.has(rawHash)) rawHashMap.set(rawHash, []);
    rawHashMap.get(rawHash).push(rel);

    if (!normHashMap.has(normHash)) normHashMap.set(normHash, []);
    normHashMap.get(normHash).push(rel);
  }

  const basenameDuplicates = [];
  for (const [name, paths] of basenameMap.entries()) {
    if (paths.length > 1) {
      const uniqueDirs = new Set(paths.map((p) => p.split('/').slice(0, -1).join('/')));
      if (uniqueDirs.size > 1) {
        basenameDuplicates.push({ name, count: paths.length, paths });
      }
    }
  }

  const exactContentDuplicates = [];
  for (const [h, paths] of rawHashMap.entries()) {
    if (paths.length > 1) {
      exactContentDuplicates.push({ hash: h, count: paths.length, paths });
    }
  }

  const nearContentDuplicates = [];
  for (const [h, paths] of normHashMap.entries()) {
    if (paths.length > 1) {
      // 过滤 exact 中已出现的完整相同组
      const alreadyExact = exactContentDuplicates.some((g) => {
        if (g.paths.length !== paths.length) return false;
        const setA = new Set(g.paths);
        return paths.every((p) => setA.has(p));
      });
      if (!alreadyExact) {
        nearContentDuplicates.push({ hash: h, count: paths.length, paths });
      }
    }
  }

  return {
    scannedFiles: trackedRel.length,
    basenameDuplicates: basenameDuplicates.sort((a, b) => b.count - a.count).slice(0, 300),
    exactContentDuplicates: exactContentDuplicates.sort((a, b) => b.count - a.count).slice(0, 300),
    nearContentDuplicates: nearContentDuplicates.sort((a, b) => b.count - a.count).slice(0, 300),
  };
}

// ========== 未引用文件检测 ==========

// 入口候选
const entryCandidates = [
  'index.html',
  'src/main.tsx',
  'src/main.ts',
  'src/index.tsx',
  'src/index.ts',
];

// 仅用于未引用判断的候选集合（排除 d.ts 和部分不应计为“未引用”的测试文件）
function isCountAsUnused(rel) {
  if (rel.includes('__tests__')) return false;
  if (/\.test\.(ts|tsx|js|jsx)$/.test(rel)) return false;
  if (rel.endsWith('.d.ts')) return false; // 类型声明单独处理
  return true;
}

// 解析某文件中的引用路径
function parseReferences(rel, content) {
  const refs = new Set();

  const push = (s) => {
    if (!s) return;
    const trimmed = s.trim();
    if (!trimmed) return;
    // 排除外链与协议
    if (/^(data:|https?:|mailto:|tel:)/.test(trimmed)) return;
    refs.add(trimmed);
  };

  // import/export
  const importExportRe = /(?:import|export)\s+(?:[^'"]*?from\s*)?['"]([^'"]+)['"]/g;
  let m;
  while ((m = importExportRe.exec(content))) push(m[1]);

  // require()
  const requireRe = /require\(\s*['"]([^'"]+)['"]\s*\)/g;
  while ((m = requireRe.exec(content))) push(m[1]);

  // dynamic import()
  const dynImportRe = /import\(\s*['"]([^'"]+)['"]\s*\)/g;
  while ((m = dynImportRe.exec(content))) push(m[1]);

  // new URL('...', import.meta.url)
  const newUrlRe = /new\s+URL\(\s*['"]([^'"]+)['"]\s*,\s*import\.meta\.url\s*\)/g;
  while ((m = newUrlRe.exec(content))) push(m[1]);

  // url(...) in css/strings
  const urlFuncRe = /url\(\s*['"]?([^'")]+)['"]?\s*\)/g;
  while ((m = urlFuncRe.exec(content))) push(m[1]);

  // src|href in html/jsx
  const srcHrefRe = /\b(?:src|href)=['"]([^'"]+)['"]/g;
  while ((m = srcHrefRe.exec(content))) push(m[1]);

  return refs;
}

// 将引用规范化并解析为项目内实际文件rel路径
function tryResolve(fromRel, spec) {
  // 去除 query/hash
  const clean = spec.split('?')[0].split('#')[0];

  // @/ 别名
  const aliasPrefix = '@/';
  if (clean.startsWith(aliasPrefix)) {
    const candidate = path.posix.join('src', clean.slice(aliasPrefix.length));
    const resolved = resolveWithExts(candidate);
    if (resolved) return resolved;
  }

  // 绝对路径：映射到 public（Vite 语义）
  if (clean.startsWith('/')) {
    const inPublic = posixRel(path.join('public', clean.slice(1)));
    if (filesIndex.has(inPublic)) return inPublic;
    const rootPath = clean.slice(1);
    if (filesIndex.has(rootPath)) return rootPath;
  }

  // 相对路径
  if (clean.startsWith('./') || clean.startsWith('../')) {
    const baseDir = path.posix.dirname(fromRel);
    const joined = path.posix.join(baseDir, clean);
    const resolved = resolveWithExts(joined);
    if (resolved) return resolved;
  }

  // 其他（裸模块名等）忽略
  return null;
}

function resolveWithExts(relPathNoExtMaybe) {
  // 完整匹配
  if (filesIndex.has(relPathNoExtMaybe)) return relPathNoExtMaybe;

  // 追加常用扩展
  for (const ext of RESOLVE_EXTS) {
    const p = relPathNoExtMaybe + ext;
    if (filesIndex.has(p)) return p;
  }

  // index 解析
  for (const ext of RESOLVE_EXTS) {
    const p = path.posix.join(relPathNoExtMaybe, 'index' + ext);
    if (filesIndex.has(p)) return p;
  }
  return null;
}

function buildReachableSet() {
  const exists = (rel) => filesIndex.has(rel);
  const entries = entryCandidates.filter(exists);

  const visited = new Set();
  const q = [];

  for (const e of entries) {
    visited.add(e);
    q.push(e);
  }

  while (q.length) {
    const cur = q.shift();
    const abs = filesIndex.get(cur);
    const ext = path.extname(cur);
    if (!abs) continue;

    // 仅在代码/HTML文件中解析引用
    if (!CODE_EXTS.has(ext)) continue;

    const content = readText(abs);
    const specs = parseReferences(cur, content);

    for (const s of specs) {
      const resolved = tryResolve(cur, s);
      if (!resolved) continue;
      if (!filesIndex.has(resolved)) continue;
      if (!visited.has(resolved)) {
        visited.add(resolved);
        q.push(resolved);
      }
    }
  }

  return visited;
}

// ========== 分组工具 ==========
function groupForPath(rel) {
  if (rel.startsWith('public/')) return 'public';
  if (rel.startsWith('server/')) return 'server';
  if (rel.startsWith('src/components/ui/')) return 'src/components/ui';
  if (rel.startsWith('src/components/pwa/')) return 'src/components/pwa';
  if (rel.startsWith('src/components/monitoring/')) return 'src/components/monitoring';
  if (rel.startsWith('src/components/search/')) return 'src/components/search';
  if (rel.startsWith('src/components/optimized/')) return 'src/components/optimized';
  if (rel.startsWith('src/components/')) return 'src/components/other';
  if (rel.startsWith('src/hooks/')) return 'src/hooks';
  if (rel.startsWith('src/lib/')) return 'src/lib';
  if (rel.startsWith('src/services/')) return 'src/services';
  if (rel.startsWith('src/store/')) return 'src/store';
  if (rel.startsWith('src/utils/')) return 'src/utils';
  if (rel.startsWith('src/types/')) return 'src/types';
  if (rel.startsWith('src/')) return 'src/other';
  return 'other';
}

function groupList(list) {
  const map = new Map();
  for (const rel of list) {
    const g = groupForPath(rel);
    if (!map.has(g)) map.set(g, []);
    map.get(g).push(rel);
  }
  const arr = [];
  for (const [group, files] of map.entries()) {
    arr.push({ group, count: files.length, files: files.sort() });
  }
  arr.sort((a, b) => b.count - a.count || a.group.localeCompare(b.group));
  return arr;
}

(function main() {
  // 重复报告（全项目、限定扩展）
  const dup = duplicateReport();

  // 未引用文件（以入口出发的可达集合）
  const reachable = buildReachableSet();

  const unused = [];
  for (const rel of trackedRel) {
    if (!isCountAsUnused(rel)) continue;
    if (!reachable.has(rel)) {
      unused.push(rel);
    }
  }

  // 类型声明单独统计
  const declUnused = [];
  for (const rel of trackedRel) {
    if (!rel.endsWith('.d.ts')) continue;
    if (!reachable.has(rel)) declUnused.push(rel);
  }

  const groupedUnused = groupList(unused);
  const groupedDeclUnused = groupList(declUnused);

  const report = {
    projectRoot: posixRel(projectRoot),
    scannedFiles: dup.scannedFiles,
    basenameDuplicates: dup.basenameDuplicates,
    exactContentDuplicates: dup.exactContentDuplicates,
    nearContentDuplicates: dup.nearContentDuplicates,
    unreachableSummary: {
      totalUnused: unused.length,
      samples: unused.slice(0, 200),
    },
    unreachableDeclSummary: {
      totalUnusedDecl: declUnused.length,
      samples: declUnused.slice(0, 100),
    },
    groupedUnused,
    groupedDeclUnused,
    notes: [
      '未引用=从入口(index.html/src/main.tsx/ts/src/index.tsx/ts)递归解析未能到达；对动态路径与运行时拼接可能存在漏报或误报，请人工复核。',
      '绝对路径(/xx)按Vite语义映射到public/xx；@/映射到src/。',
      '近似重复通过去注释+压缩空白哈希识别，逻辑等价但实现不同不在此列。',
      'tests/__tests__与*.test.*未计入未引用列表。',
      'server 为后端代码，通常不会被前端入口引用，如需清理请单独确认。',
      '配置文件（tailwind/vite/tsconfig等）不参与打包但对开发构建必需，勿误删。',
    ],
  };

  console.log('=== Project Duplicate & Unused Grouped Report ===');
  console.log(JSON.stringify(report, null, 2));
})();