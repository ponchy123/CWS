/**
 * 修复剩余的编码和语法问题
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// 获取当前文件的目录
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

// 修复 content-creator.tsx 中的剩余问题
function fixContentCreator() {
  const filePath = path.join(rootDir, 'src/pages/content-creator.tsx');
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // 修复状态管理注释后的乱码
    content = content.replace(/\/\/ 状态管理鐞?/, '// 状态管理');
    
    // 修复 handleAIAssist 函数中的乱码
    content = content.replace(/case '鏍囬鐢熸垚鍣?:/, "case '标题生成器':");
    content = content.replace(/内容鎵╁啓/, '内容扩写');
    content = content.replace(/澶х翰鐢熸垚完成/, '大纲生成完成');
    
    // 修复 handleContentChange 函数中的乱码
    content = content.replace(/保持默认值鍊硷紝因为API返回的凜ontentAnalysis娌℃湁seo瀛楁/, '保持默认值，因为API返回的ContentAnalysis没有seo字段');
    
    // 修复 handlePreview 函数中的乱码
    content = content.replace(/打开预览绐楀彛/, '打开预览窗口');
    
    // 修复 useState 声明中的语法错误
    content = content.replace(/\/\/ 状态管理\s+const \[, setLoading\] = useState\(false\);/, '// 状态管理\n  const [loading, setLoading] = useState(false);');
    
    // 修复其他可能的乱码
    content = content.replace(/瀵煎叆API鏈嶅姟/, '导入API服务');
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('已修复 content-creator.tsx 的剩余问题');
    return true;
  } catch (error) {
    console.error('修复 content-creator.tsx 时出错:', error);
    return false;
  }
}

// 检查所有文件中的未终止字符串字面量
function checkForUnterminatedStrings() {
  const filesToCheck = [
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
  
  for (const file of filesToCheck) {
    const filePath = path.join(rootDir, file);
    try {
      let content = fs.readFileSync(filePath, 'utf8');
      
      // 检查未终止的字符串字面量
      const lines = content.split('\n');
      let fixedContent = '';
      let inString = false;
      let stringDelimiter = '';
      
      for (let i = 0; i < lines.length; i++) {
        let line = lines[i];
        
        // 如果不在字符串中，检查这一行是否开始了一个字符串
        if (!inString) {
          const singleQuoteIndex = line.indexOf("'");
          const doubleQuoteIndex = line.indexOf('"');
          const backTickIndex = line.indexOf('`');
          
          if (singleQuoteIndex !== -1 || doubleQuoteIndex !== -1 || backTickIndex !== -1) {
            let indices = [
              singleQuoteIndex !== -1 ? singleQuoteIndex : Infinity,
              doubleQuoteIndex !== -1 ? doubleQuoteIndex : Infinity,
              backTickIndex !== -1 ? backTickIndex : Infinity
            ];
            
            const minIndex = Math.min(...indices);
            if (minIndex !== Infinity) {
              const delimiter = indices.indexOf(minIndex) === 0 ? "'" : indices.indexOf(minIndex) === 1 ? '"' : '`';
              
              // 检查这个字符串是否在这一行结束
              const restOfLine = line.substring(minIndex + 1);
              const closingIndex = restOfLine.indexOf(delimiter);
              
              if (closingIndex === -1) {
                // 字符串没有在这一行结束
                inString = true;
                stringDelimiter = delimiter;
                
                // 修复这一行，添加结束分隔符
                line += stringDelimiter;
              }
            }
          }
        } else {
          // 如果在字符串中，检查这一行是否结束了字符串
          const closingIndex = line.indexOf(stringDelimiter);
          
          if (closingIndex === -1) {
            // 字符串没有在这一行结束，添加结束分隔符
            line += stringDelimiter;
            inString = false;
            stringDelimiter = '';
          } else {
            // 字符串在这一行结束
            inString = false;
            stringDelimiter = '';
          }
        }
        
        fixedContent += line + '\n';
      }
      
      // 如果内容有变化，保存修复后的内容
      if (fixedContent !== content) {
        fs.writeFileSync(filePath, fixedContent, 'utf8');
        console.log(`已修复 ${file} 中的未终止字符串字面量`);
      }
    } catch (error) {
      console.error(`检查 ${file} 时出错:`, error);
    }
  }
}

// 主函数
function main() {
  console.log('开始修复剩余问题...');
  
  // 修复 content-creator.tsx 中的剩余问题
  fixContentCreator();
  
  // 检查所有文件中的未终止字符串字面量
  checkForUnterminatedStrings();
  
  console.log('剩余问题修复完成');
}

// 执行主函数
main();