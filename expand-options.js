/**
 * 题目选项扩充工具
 * 将所有单选题扩充到四个选项，添加合理的干扰项
 */

const fs = require('fs');
const path = require('path');

// 干扰项生成策略
const distractorStrategies = {
  // 数值计算类干扰项
  arithmetic: {
    generate: (correctAnswer, context) => {
      const num = parseFloat(correctAnswer);
      if (isNaN(num)) return [];

      return [
        (num + 1).toString(),
        (num - 1).toString(),
        (num * 2).toString(),
        (num / 2).toString(),
        (num + 10).toString(),
        (num - 10).toString(),
        Math.round(num * 1.5).toString(),
        Math.round(num * 0.5).toString()
      ];
    }
  },

  // 数列类干扰项
  sequence: {
    generate: (correctAnswer, context) => {
      const num = parseFloat(correctAnswer);
      if (isNaN(num)) return [];

      return [
        (num + 2).toString(),
        (num - 2).toString(),
        (num + 3).toString(),
        (num - 3).toString(),
        (num * 3).toString(),
        (num / 3).toString()
      ];
    }
  },

  // 周期类干扰项
  periodic: {
    generate: (correctAnswer, context) => {
      const num = parseFloat(correctAnswer);
      if (isNaN(num)) return [];

      return [
        (num + 1).toString(),
        (num - 1).toString(),
        (num + context.periodLength || 1).toString(),
        (num - context.periodLength || 1).toString(),
        (context.periodLength || 1).toString(),
        '0'
      ];
    }
  },

  // 文本类干扰项
  text: {
    generate: (correctAnswer, context) => {
      const textDistractors = [
        '不一定', '可能', '也许', '大概', '基本',
        '部分', '全部', '有时', '经常', '很少',
        '增加', '减少', '不变', '相等', '不同',
        '第一', '第二', '第三', '第四', '最后',
        '最大', '最小', '中间', '平均', '总和'
      ];

      return textDistractors.filter(t => t !== correctAnswer);
    }
  },

  // 数学概念类干扰项
  concepts: {
    generate: (correctAnswer, context) => {
      const conceptDistractors = {
        '周长': ['面积', '体积', '表面积', '边长'],
        '面积': ['周长', '体积', '表面积', '半径'],
        '体积': ['面积', '周长', '表面积', '容量'],
        '和': ['差', '积', '商', '平均值'],
        '差': ['和', '积', '商', '余数'],
        '积': ['和', '差', '商', '倍数'],
        '商': ['和', '差', '积', '余数'],
        '倍数': ['约数', '因数', '质数', '合数'],
        '质数': ['合数', '偶数', '奇数', '因数'],
        '偶数': ['奇数', '质数', '合数', '自然数'],
        '奇数': ['偶数', '质数', '合数', '整数']
      };

      const distractors = conceptDistractors[correctAnswer] || [];
      return distractors.filter(d => d !== correctAnswer);
    }
  }
};

// 根据步骤类型和内容选择策略
function selectStrategy(stepType, stepPrompt, correctAnswer) {
  const prompt = stepPrompt.toLowerCase();

  // 数值计算相关
  if (prompt.includes('计算') || prompt.includes('等于') || prompt.includes('多少') || /^\d+$/.test(correctAnswer)) {
    if (prompt.includes('数列') || prompt.includes('规律') || prompt.includes('第几个')) {
      return distractorStrategies.sequence;
    }
    if (prompt.includes('周期') || prompt.includes('重复')) {
      return distractorStrategies.periodic;
    }
    return distractorStrategies.arithmetic;
  }

  // 数学概念相关
  if (prompt.includes('周长') || prompt.includes('面积') || prompt.includes('体积') ||
      prompt.includes('和') || prompt.includes('差') || prompt.includes('积') || prompt.includes('商') ||
      prompt.includes('倍数') || prompt.includes('质数') || prompt.includes('偶数') || prompt.includes('奇数')) {
    return distractorStrategies.concepts;
  }

  // 默认使用文本策略
  return distractorStrategies.text;
}

// 生成干扰项
function generateDistractors(correctOption, existingOptions, context) {
  const strategy = selectStrategy(context.stepType, context.stepPrompt, correctOption.text);
  const possibleDistractors = strategy.generate(correctOption.text, context);

  // 过滤掉已存在的选项
  const existingTexts = existingOptions.map(opt => opt.text);
  const availableDistractors = possibleDistractors.filter(d => !existingTexts.includes(d));

  // 随机选择干扰项
  const selectedDistractors = [];
  const neededCount = 4 - existingOptions.length;

  for (let i = 0; i < neededCount && i < availableDistractors.length; i++) {
    const randomIndex = Math.floor(Math.random() * availableDistractors.length);
    const distractor = availableDistractors.splice(randomIndex, 1)[0];

    selectedDistractors.push({
      id: `${context.stepId}o${existingOptions.length + i + 1}`,
      text: distractor,
      correct: false,
      feedback: generateFeedback(distractor, correctOption.text, context)
    });
  }

  return selectedDistractors;
}

// 生成反馈信息
function generateFeedback(distractor, correctAnswer, context) {
  const stepPrompt = context.stepPrompt.toLowerCase();

  if (/^\d+$/.test(distractor) && /^\d+$/.test(correctAnswer)) {
    const diff = Math.abs(parseInt(distractor) - parseInt(correctAnswer));
    if (diff === 1) {
      return `很接近了！再仔细检查一下计算过程`;
    } else if (diff <= 5) {
      return `不对，但思路是对的，可能是计算出现了小错误`;
    } else {
      return `错误。请重新理解题目要求并仔细计算`;
    }
  }

  if (stepPrompt.includes('周期') || stepPrompt.includes('重复')) {
    return `错误。注意观察周期规律和位置对应关系`;
  }

  if (stepPrompt.includes('数列') || stepPrompt.includes('规律')) {
    return `错误。重新分析数列的变化规律`;
  }

  return `错误。请重新理解题目内容`;
}

// 处理单个步骤的选项
function expandStepOptions(step, stepIndex, item) {
  if (!step.options || step.multipleSelect) {
    return step; // 跳过多选题或无选项的步骤
  }

  const currentOptions = [...step.options];
  const correctOption = currentOptions.find(opt => opt.correct);

  if (!correctOption) {
    console.warn(`步骤 ${step.id} 没有正确答案选项`);
    return step;
  }

  // 如果已经有4个或更多选项，不处理
  if (currentOptions.length >= 4) {
    return step;
  }

  const context = {
    stepId: step.id,
    stepType: step.type,
    stepPrompt: step.prompt,
    itemConcepts: item.taxonomy.concepts,
    itemSkills: item.taxonomy.skills,
    periodLength: extractPeriodLength(item.stem.text)
  };

  // 生成新的干扰项
  const newDistractors = generateDistractors(correctOption, currentOptions, context);

  // 添加新选项
  const expandedOptions = [...currentOptions, ...newDistractors];

  // 打乱选项顺序（确保正确选项不在固定位置）
  const shuffledOptions = shuffleOptions(expandedOptions);

  return {
    ...step,
    options: shuffledOptions
  };
}

// 提取周期长度（用于周期问题）
function extractPeriodLength(stemText) {
  const match = stemText.match(/周期[长长]度[是为]?(\d+)/);
  return match ? parseInt(match[1]) : null;
}

// 打乱选项顺序
function shuffleOptions(options) {
  const correctOption = options.find(opt => opt.correct);
  const incorrectOptions = options.filter(opt => !opt.correct);

  // 打乱错误选项
  for (let i = incorrectOptions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [incorrectOptions[i], incorrectOptions[j]] = [incorrectOptions[j], incorrectOptions[i]];
  }

  // 将正确选项插入到随机位置
  const correctPosition = Math.floor(Math.random() * 4);
  const result = [...incorrectOptions];
  result.splice(correctPosition, 0, correctOption);

  return result;
}

// 处理单个题目
function expandItemOptions(item) {
  const expandedSteps = item.steps.map((step, index) =>
    expandStepOptions(step, index, item)
  );

  return {
    ...item,
    steps: expandedSteps
  };
}

// 处理整个题库
function expandProblemSet(problemSet) {
  const expandedItems = problemSet.items.map(item => expandItemOptions(item));

  return {
    ...problemSet,
    items: expandedItems,
    metadata: {
      ...problemSet.metadata,
      tags: [...problemSet.metadata.tags, '选项扩充', '四选项标准化'],
      expandedAt: new Date().toISOString(),
      expansionVersion: '1.0.0'
    }
  };
}

// 主函数
function main() {
  const dataDir = path.join(__dirname, 'data');
  const files = fs.readdirSync(dataDir);

  const problemFiles = files.filter(file =>
    file.endsWith('.json') &&
    file !== 'periodic-problems-simple.json' && // 跳过简单版本
    !file.includes('expanded') // 跳过已扩充的文件
  );

  problemFiles.forEach(file => {
    const filePath = path.join(dataDir, file);
    console.log(`处理文件: ${file}`);

    try {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

      if (data.items && Array.isArray(data.items)) {
        console.log(`  原始题目数量: ${data.items.length}`);

        // 统计选项数量
        let totalSteps = 0;
        let stepsWithOptions = 0;
        let stepsToExpand = 0;

        data.items.forEach(item => {
          if (item.steps && Array.isArray(item.steps)) {
            item.steps.forEach(step => {
              totalSteps++;
              if (step.options && Array.isArray(step.options) && !step.multipleSelect) {
                stepsWithOptions++;
                if (step.options.length < 4) {
                  stepsToExpand++;
                }
              }
            });
          }
        });

        console.log(`  总步骤数: ${totalSteps}`);
        console.log(`  有选项的步骤: ${stepsWithOptions}`);
        console.log(`  需要扩充的步骤: ${stepsToExpand}`);

        if (stepsToExpand > 0) {
          // 执行选项扩充
          const expandedData = expandProblemSet(data);

          // 保存扩充后的文件
          const fileName = path.basename(file, '.json');
          const outputFileName = `${fileName}-expanded.json`;
          const outputPath = path.join(dataDir, outputFileName);

          fs.writeFileSync(outputPath, JSON.stringify(expandedData, null, 2), 'utf8');
          console.log(`  扩充完成，保存为: ${outputFileName}`);
        } else {
          console.log(`  所有步骤都已达到4个选项，跳过扩充`);
        }
      } else {
        console.log(`  文件格式不正确，跳过`);
      }
    } catch (error) {
      console.error(`  处理文件失败:`, error.message);
    }

    console.log('---');
  });

  console.log('选项扩充完成！');
}

// 如果直接运行此脚本
if (require.main === module) {
  main();
}

module.exports = {
  expandProblemSet,
  expandItemOptions,
  expandStepOptions,
  generateDistractors
};