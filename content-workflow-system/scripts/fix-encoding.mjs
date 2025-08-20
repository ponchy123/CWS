/**
 * 修复文件编码问题并检查重复文件
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// 获取当前文件的目录
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

// 要修复的文件列表
const filesToFix = [
  'src/pages/content-creator.tsx',
  'src/pages/content-planning.tsx',
  'src/pages/customer-manager.tsx',
  'src/pages/dashboard.tsx',
  'src/pages/data-analytics.tsx',
  'src/pages/platform-integration.tsx',
  'src/pages/publish-manager.tsx',
  'src/services/monitor.ts',
  'src/services/user.ts'
];

// 修复文件编码
function fixFileEncoding(filePath) {
  const fullPath = path.join(rootDir, filePath);
  try {
    // 读取文件内容
    let content = fs.readFileSync(fullPath, 'utf8');
    
    // 修复常见的中文乱码
    content = content.replace(/鐭ヤ箮/g, '知乎');
    content = content.replace(/B绔?/g, 'B站');
    content = content.replace(/鍏紬鍙?/g, '公众号');
    content = content.replace(/灏忕孩涔?/g, '小红书');
    content = content.replace(/鎶栭煶/g, '抖音');
    content = content.replace(/鏍囬鐢熸垚鍣?/g, '标题生成器');
    content = content.replace(/澶х翰鍔╂墜/g, '大纲助手');
    content = content.replace(/鍐呭鎵╁啓/g, '内容扩写');
    content = content.replace(/SEO浼樺寲/g, 'SEO优化');
    content = content.replace(/澶氬钩鍙伴€傞厤/g, '多平台适配');
    content = content.replace(/鎯呮劅鍒嗘瀽/g, '情感分析');
    content = content.replace(/鎴愬姛/g, '成功');
    content = content.replace(/閿欒/g, '错误');
    content = content.replace(/璇疯緭鍏?/g, '请输入');
    content = content.replace(/鑽夌/g, '草稿');
    content = content.replace(/淇濆瓨/g, '保存');
    content = content.replace(/澶辫触/g, '失败');
    content = content.replace(/鍔犺浇/g, '加载');
    content = content.replace(/鍐呭/g, '内容');
    content = content.replace(/妯℃澘/g, '模板');
    content = content.replace(/鍘嗗彶/g, '历史');
    content = content.replace(/鐗堟湰/g, '版本');
    content = content.replace(/鍒嗘瀽/g, '分析');
    content = content.replace(/棰勮/g, '预览');

    // 修复 UI 组件与图表类名中的乱码
    content = content.replace(/B站utton/g, 'Button');
    content = content.replace(/B站adge/g, 'Badge');
    content = content.replace(/B站arChart3/g, 'BarChart3');
    content = content.replace(/B站arChart/g, 'BarChart');
    content = content.replace(/B站ar/g, 'Bar');

    // 修复颜色值乱码
    content = content.replace(/#3B站82F6/g, '#3B82F6');
    content = content.replace(/#F59E0B站/g, '#F59E0B');

    // 修复常见中文字段名乱码
    content = content.replace(/闃呰閲\?/g, '阅读量');
    content = content.replace(/浜掑姩閲\?/g, '互动量');
    
    // 保存修复后的内容
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`已修复 ${filePath} 的编码问题`);
    return true;
  } catch (error) {
    console.error(`修复 ${filePath} 时出错:`, error);
    return false;
  }
}

// 检查文件内容相似度
function checkFileSimilarity(fileA, fileB) {
  try {
    const contentA = fs.readFileSync(path.join(rootDir, fileA), 'utf8');
    const contentB = fs.readFileSync(path.join(rootDir, fileB), 'utf8');
    
    // 简单的相似度检查 - 计算相同行的百分比
    const linesA = contentA.split('\n');
    const linesB = contentB.split('\n');
    
    let sameLines = 0;
    for (const lineA of linesA) {
      if (lineA.trim() && linesB.some(lineB => lineB.trim() === lineA.trim())) {
        sameLines++;
      }
    }
    
    const similarity = (sameLines / Math.max(linesA.length, linesB.length)) * 100;
    return similarity;
  } catch (error) {
    console.error(`比较 ${fileA} 和 ${fileB} 时出错:`, error);
    return 0;
  }
}

// 查找可能的重复文件
function findDuplicateFiles() {
  console.log('开始检查重复文件...');
  
  // 获取所有源代码文件
  const allFiles = [];
  
  function scanDir(dir) {
    const entries = fs.readdirSync(path.join(rootDir, dir), { withFileTypes: true });
    
    for (const entry of entries) {
      const entryPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        scanDir(entryPath);
      } else if (entry.isFile() && /\.(js|jsx|ts|tsx|css|scss)$/.test(entry.name)) {
        allFiles.push(entryPath);
      }
    }
  }
  
  scanDir('src');
  
  // 检查文件相似度
  const potentialDuplicates = [];
  
  for (let i = 0; i < allFiles.length; i++) {
    for (let j = i + 1; j < allFiles.length; j++) {
      const fileA = allFiles[i];
      const fileB = allFiles[j];
      
      // 跳过不同类型的文件比较
      if (path.extname(fileA) !== path.extname(fileB)) {
        continue;
      }
      
      const similarity = checkFileSimilarity(fileA, fileB);
      
      if (similarity > 70) {  // 相似度阈值
        potentialDuplicates.push({
          fileA,
          fileB,
          similarity: similarity.toFixed(2)
        });
      }
    }
  }
  
  // 输出结果
  if (potentialDuplicates.length > 0) {
    console.log('发现可能的重复文件:');
    potentialDuplicates.forEach(dup => {
      console.log(`${dup.fileA} 和 ${dup.fileB} 的相似度为 ${dup.similarity}%`);
    });
  } else {
    console.log('未发现重复文件');
  }
  
  return potentialDuplicates;
}

// 检查lib和utils目录中的重复功能
function checkDuplicateFunctionality() {
  console.log('检查lib和utils目录中的重复功能...');
  
  const libDir = path.join(rootDir, 'src/lib');
  const utilsDir = path.join(rootDir, 'src/utils');
  
  // 确保目录存在
  if (!fs.existsSync(libDir) || !fs.existsSync(utilsDir)) {
    console.log('lib或utils目录不存在，跳过检查');
    return [];
  }
  
  const libFiles = fs.readdirSync(libDir).filter(file => /\.(js|ts)$/.test(file));
  const utilsFiles = fs.readdirSync(utilsDir).filter(file => /\.(js|ts)$/.test(file));
  
  // 检查同名文件
  const sameNameFiles = [];
  
  for (const libFile of libFiles) {
    if (utilsFiles.includes(libFile)) {
      sameNameFiles.push({
        libFile: path.join('src/lib', libFile),
        utilsFile: path.join('src/utils', libFile)
      });
    }
  }
  
  // 输出结果
  if (sameNameFiles.length > 0) {
    console.log('发现lib和utils目录中的同名文件:');
    sameNameFiles.forEach(pair => {
      console.log(`${pair.libFile} 和 ${pair.utilsFile}`);
      const similarity = checkFileSimilarity(pair.libFile, pair.utilsFile);
      console.log(`相似度: ${similarity.toFixed(2)}%`);
    });
  } else {
    console.log('未发现lib和utils目录中的同名文件');
  }
  
  return sameNameFiles;
}

// 检查components目录中的重复组件
function checkDuplicateComponents() {
  console.log('检查components目录中的重复组件...');
  
  const componentsDir = path.join(rootDir, 'src/components');
  
  // 确保目录存在
  if (!fs.existsSync(componentsDir)) {
    console.log('components目录不存在，跳过检查');
    return [];
  }
  
  // 获取所有组件文件
  const componentFiles = [];
  
  function scanComponentsDir(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const entryPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        scanComponentsDir(entryPath);
      } else if (entry.isFile() && /\.(jsx|tsx)$/.test(entry.name)) {
        componentFiles.push(entryPath);
      }
    }
  }
  
  scanComponentsDir(componentsDir);
  
  // 检查组件相似度
  const potentialDuplicates = [];
  
  for (let i = 0; i < componentFiles.length; i++) {
    for (let j = i + 1; j < componentFiles.length; j++) {
      const fileA = componentFiles[i];
      const fileB = componentFiles[j];
      
      const similarity = checkFileSimilarity(
        path.relative(rootDir, fileA),
        path.relative(rootDir, fileB)
      );
      
      if (similarity > 70) {  // 相似度阈值
        potentialDuplicates.push({
          fileA: path.relative(rootDir, fileA),
          fileB: path.relative(rootDir, fileB),
          similarity: similarity.toFixed(2)
        });
      }
    }
  }
  
  // 输出结果
  if (potentialDuplicates.length > 0) {
    console.log('发现可能的重复组件:');
    potentialDuplicates.forEach(dup => {
      console.log(`${dup.fileA} 和 ${dup.fileB} 的相似度为 ${dup.similarity}%`);
    });
  } else {
    console.log('未发现重复组件');
  }
  
  return potentialDuplicates;
}

// 主函数
function main() {
  console.log('开始修复编码问题并检查重复文件...');
  
  // 修复文件编码
  for (const file of filesToFix) {
    fixFileEncoding(file);
  }
  
  // 检查重复文件
  const duplicateFiles = findDuplicateFiles();
  
  // 检查lib和utils目录中的重复功能
  const duplicateFunctionality = checkDuplicateFunctionality();
  
  // 检查components目录中的重复组件
  const duplicateComponents = checkDuplicateComponents();
  
  // 总结
  console.log('\n===== 检查结果汇总 =====');
  console.log(`已修复 ${filesToFix.length} 个文件的编码问题`);
  console.log(`发现 ${duplicateFiles.length} 对可能的重复文件`);
  console.log(`发现 ${duplicateFunctionality.length} 对lib和utils目录中的同名文件`);
  console.log(`发现 ${duplicateComponents.length} 对可能的重复组件`);
  
  if (duplicateFiles.length === 0 && duplicateFunctionality.length === 0 && duplicateComponents.length === 0) {
    console.log('未发现需要合并删除的重复文件');
  }
}

// 执行主函数
main();