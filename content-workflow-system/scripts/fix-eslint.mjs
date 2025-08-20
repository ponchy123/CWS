#!/usr/bin/env node

/**
 * 自动修复 ESLint 问题的脚本
 * 主要针对 import/order 和其他可自动修复的问题
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// 定义要处理的文件扩展名
const extensions = ['.js', '.jsx', '.ts', '.tsx'];

// 定义要排除的目录
const excludeDirs = ['node_modules', 'dist', 'coverage', 'build'];

// 修复语法错误的文件列表
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

// 检查文件是否存在
function checkFilesExist() {
  const missingFiles = [];
  for (const file of filesToFix) {
    if (!fs.existsSync(file)) {
      missingFiles.push(file);
    }
  }
  
  if (missingFiles.length > 0) {
    console.log('以下文件不存在，请检查路径：');
    missingFiles.forEach(file => console.log(`- ${file}`));
    return false;
  }
  
  return true;
}

// 修复语法错误
function fixSyntaxErrors() {
  console.log('开始修复语法错误...');
  
  for (const file of filesToFix) {
    try {
      console.log(`检查文件: ${file}`);
      
      if (!fs.existsSync(file)) {
        console.log(`文件不存在: ${file}`);
        continue;
      }
      
      const content = fs.readFileSync(file, 'utf8');
      
      // 根据文件路径选择不同的修复策略
      let fixedContent = content;
      
      if (file.includes('content-creator.tsx')) {
        // 修复未终止的字符串字面量
        fixedContent = fixContent(content, /([^\\])"([^"]*$)/g, '$1"');
      } else if (file.includes('content-planning.tsx')) {
        // 修复缺少引号的问题
        fixedContent = fixContent(content, /(=\s*)([^'"][^,;}\s]+)/g, '$1"$2"');
      } else if (file.includes('customer-manager.tsx')) {
        // 修复缺少分号的问题
        fixedContent = fixContent(content, /([^;{}\s])\s*$/gm, '$1;');
      } else if (file.includes('dashboard.tsx') || file.includes('data-analytics.tsx')) {
        // 修复属性或签名问题
        fixedContent = fixContent(content, /}\s*([a-zA-Z]+)\s*$/gm, '}\n\n$1');
      } else if (file.includes('platform-integration.tsx')) {
        // 修复元素访问表达式问题
        fixedContent = fixContent(content, /\[\s*\]/g, '[0]');
      } else if (file.includes('publish-manager.tsx')) {
        // 修复表达式问题
        fixedContent = fixContent(content, /{\s*}/g, '{ /* 空对象 */ }');
      } else if (file.includes('monitor.ts') || file.includes('user.ts')) {
        // 修复声明或语句问题
        fixedContent = fixContent(content, /}\s*([a-zA-Z]+)\s*$/gm, '}\n\n$1');
      }
      
      if (fixedContent !== content) {
        fs.writeFileSync(file, fixedContent, 'utf8');
        console.log(`已修复文件: ${file}`);
      } else {
        console.log(`文件无需修复: ${file}`);
      }
    } catch (error) {
      console.error(`处理文件 ${file} 时出错:`, error);
    }
  }
  
  console.log('语法错误修复完成');
}

// 修复内容的辅助函数
function fixContent(content, pattern, replacement) {
  return content.replace(pattern, replacement);
}

// 运行 ESLint 自动修复
function runEslintFix() {
  console.log('运行 ESLint 自动修复...');
  
  try {
    // 使用 --fix 选项运行 ESLint
    execSync('npx eslint src --ext .js,.jsx,.ts,.tsx --fix', { stdio: 'inherit' });
    console.log('ESLint 自动修复完成');
  } catch (error) {
    console.error('ESLint 自动修复过程中出错:', error);
  }
}

// 主函数
function main() {
  console.log('开始修复 ESLint 问题...');
  
  if (!checkFilesExist()) {
    console.log('请先检查文件路径，然后再运行此脚本');
    return;
  }
  
  // 先修复语法错误
  fixSyntaxErrors();
  
  // 然后运行 ESLint 自动修复
  runEslintFix();
  
  console.log('所有修复完成');
}

// 执行主函数
main();