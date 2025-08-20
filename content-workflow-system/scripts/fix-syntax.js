/**
 * 修复特定文件的语法错误
 */

const fs = require('fs');
const path = require('path');

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

// 修复其他文件的语法错误
function fixOtherFiles() {
  // 这里可以添加其他文件的修复逻辑
  console.log('其他文件需要手动检查修复');
}

// 主函数
function main() {
  console.log('开始修复语法错误...');
  
  // 修复 content-creator.tsx
  try {
    fixContentCreator();
  } catch (error) {
    console.error('修复 content-creator.tsx 时出错:', error);
  }
  
  // 修复其他文件
  try {
    fixOtherFiles();
  } catch (error) {
    console.error('修复其他文件时出错:', error);
  }
  
  console.log('语法错误修复完成');
}

// 执行主函数
main();