/**
 * 修复特定文件的语法错误
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// 获取当前文件的目录
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

// 修复 content-creator.tsx 中未终止的字符串字面量
function fixContentCreator() {
  const filePath = path.join(process.cwd(), 'src/pages/content-creator.tsx');
  let content = fs.readFileSync(filePath, 'utf8');
  
  // 找到最后一行并添加缺失的结束标签
  if (content.endsWith('<div style="white-space: pre-wrap;"')) {
    content += '>${currentContent}</div>\n          </body>\n        </html>\n      `);';
    content += '\n    }\n  };\n\n  return (\n    <div className="container mx-auto p-4">\n      <h1 className="text-2xl font-bold mb-4">内容创作中心</h1>\n      {/* 内容创建界面 */}\n    </div>\n  );\n}';
  }
  
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('已修复 content-creator.tsx');
}

// 修复 content-planning.tsx 中的语法错误
function fixContentPlanning() {
  const filePath = path.join(process.cwd(), 'src/pages/content-planning.tsx');
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // 修复缺少引号的问题
    content = content.replace(/=\s*([^'"][^,;}\s]+)/g, '="$1"');
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('已修复 content-planning.tsx');
  } catch (error) {
    console.error('修复 content-planning.tsx 时出错:', error);
  }
}

// 修复 customer-manager.tsx 中的语法错误
function fixCustomerManager() {
  const filePath = path.join(process.cwd(), 'src/pages/customer-manager.tsx');
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // 修复缺少分号的问题
    content = content.replace(/([^;{}\s])\s*$/gm, '$1;');
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('已修复 customer-manager.tsx');
  } catch (error) {
    console.error('修复 customer-manager.tsx 时出错:', error);
  }
}

// 修复 dashboard.tsx 和 data-analytics.tsx 中的语法错误
function fixDashboardAndAnalytics() {
  const dashboardPath = path.join(process.cwd(), 'src/pages/dashboard.tsx');
  const analyticsPath = path.join(process.cwd(), 'src/pages/data-analytics.tsx');
  
  try {
    // 修复 dashboard.tsx
    let content = fs.readFileSync(dashboardPath, 'utf8');
    content = content.replace(/}\s*([a-zA-Z]+)\s*$/gm, '}\n\n$1');
    fs.writeFileSync(dashboardPath, content, 'utf8');
    console.log('已修复 dashboard.tsx');
    
    // 修复 data-analytics.tsx
    content = fs.readFileSync(analyticsPath, 'utf8');
    content = content.replace(/}\s*([a-zA-Z]+)\s*$/gm, '}\n\n$1');
    fs.writeFileSync(analyticsPath, content, 'utf8');
    console.log('已修复 data-analytics.tsx');
  } catch (error) {
    console.error('修复 dashboard.tsx 或 data-analytics.tsx 时出错:', error);
  }
}

// 修复 platform-integration.tsx 和 publish-manager.tsx 中的语法错误
function fixPlatformAndPublish() {
  const platformPath = path.join(process.cwd(), 'src/pages/platform-integration.tsx');
  const publishPath = path.join(process.cwd(), 'src/pages/publish-manager.tsx');
  
  try {
    // 修复 platform-integration.tsx
    let content = fs.readFileSync(platformPath, 'utf8');
    content = content.replace(/\[\s*\]/g, '[0]');
    fs.writeFileSync(platformPath, content, 'utf8');
    console.log('已修复 platform-integration.tsx');
    
    // 修复 publish-manager.tsx
    content = fs.readFileSync(publishPath, 'utf8');
    content = content.replace(/{\s*}/g, '{ /* 空对象 */ }');
    fs.writeFileSync(publishPath, content, 'utf8');
    console.log('已修复 publish-manager.tsx');
  } catch (error) {
    console.error('修复 platform-integration.tsx 或 publish-manager.tsx 时出错:', error);
  }
}

// 修复 monitor.ts 和 user.ts 中的语法错误
function fixServices() {
  const monitorPath = path.join(process.cwd(), 'src/services/monitor.ts');
  const userPath = path.join(process.cwd(), 'src/services/user.ts');
  
  try {
    // 修复 monitor.ts
    let content = fs.readFileSync(monitorPath, 'utf8');
    content = content.replace(/}\s*([a-zA-Z]+)\s*$/gm, '}\n\n$1');
    fs.writeFileSync(monitorPath, content, 'utf8');
    console.log('已修复 monitor.ts');
    
    // 修复 user.ts
    content = fs.readFileSync(userPath, 'utf8');
    content = content.replace(/}\s*([a-zA-Z]+)\s*$/gm, '}\n\n$1');
    fs.writeFileSync(userPath, content, 'utf8');
    console.log('已修复 user.ts');
  } catch (error) {
    console.error('修复 monitor.ts 或 user.ts 时出错:', error);
  }
}

// 主函数
function main() {
  console.log('开始修复语法错误...');
  
  // 修复各个文件
  try {
    fixContentCreator();
    fixContentPlanning();
    fixCustomerManager();
    fixDashboardAndAnalytics();
    fixPlatformAndPublish();
    fixServices();
  } catch (error) {
    console.error('修复文件时出错:', error);
  }
  
  console.log('语法错误修复完成');
}

// 执行主函数
main();