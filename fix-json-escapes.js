/**
 * 修复JSON文件中的转义字符问题
 */

const fs = require('fs');
const path = require('path');

function fixJsonEscapes(filePath) {
  console.log(`修复文件: ${filePath}`);

  try {
    let content = fs.readFileSync(filePath, 'utf8');

    // 统计修复次数
    let fixes = 0;

    // 修复多余的反斜杠（但在正确的JSON转义中保留）
    // 修复 \\\" -> \\" (保留正确的JSON字符串转义)
    content = content.replace(/\\\\\\"/g, '\\"');
    fixes++;

    // 修复 \\n -> \n (保留正确的JSON转义)
    content = content.replace(/\\\\n/g, '\\n');
    fixes++;

    // 修复 \\\" -> \" (保留正确的JSON转义)
    content = content.replace(/\\\\\\"/g, '\\"');
    fixes++;

    // 修复 \\" -> " (去掉多余的反斜杠)
    content = content.replace(/\\\\"/g, '"');
    fixes++;

    // 修复 \\ -> \ (去掉多余的反斜杠，但在正确位置保留)
    content = content.replace(/\\\\(?!["\\n])/g, '\\');
    fixes++;

    // 验证修复后的JSON是否有效
    try {
      JSON.parse(content);
      console.log(`  JSON格式验证通过，修复了 ${fixes} 处问题`);

      // 保存修复后的文件
      const fileName = path.basename(filePath, '.json');
      const fixedFileName = `${fileName}-fixed.json`;
      const fixedPath = path.join(path.dirname(filePath), fixedFileName);

      fs.writeFileSync(fixedPath, content, 'utf8');
      console.log(`  修复完成，保存为: ${fixedFileName}`);

      return fixedPath;
    } catch (parseError) {
      console.error(`  修复后JSON仍然无效: ${parseError.message}`);
      return null;
    }

  } catch (error) {
    console.error(`  读取文件失败: ${error.message}`);
    return null;
  }
}

function main() {
  const dataDir = path.join(__dirname, 'data');
  const files = fs.readdirSync(dataDir);

  const problemFiles = files.filter(file =>
    file.endsWith('.json') &&
    !file.includes('expanded') &&
    !file.includes('fixed')
  );

  console.log('开始修复JSON文件转义字符问题...\n');

  problemFiles.forEach(file => {
    const filePath = path.join(dataDir, file);
    fixJsonEscapes(filePath);
    console.log('---');
  });

  console.log('JSON修复完成！');
}

// 如果直接运行此脚本
if (require.main === module) {
  main();
}

module.exports = { fixJsonEscapes };