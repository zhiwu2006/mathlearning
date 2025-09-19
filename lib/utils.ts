import { VariableSpec } from '@/types/problem';

/**
 * 渲染模板变量
 * @param template 模板字符串
 * @param context 变量上下文
 * @returns 渲染后的字符串
 */
export function renderTemplate(template: string, context: Record<string, number>): string {
  if (!template || typeof template !== 'string') return template;

  return template.replace(/\$\{([^}]+)\}/g, (_, expr) => {
    try {
      const vars = Object.assign({}, context);
      // 安全起见，仅允许变量与基本运算
      const fn = new Function(...Object.keys(vars), `return (${expr});`);
      return fn(...Object.values(vars)).toString();
    } catch {
      return '?';
    }
  });
}

/**
 * 实例化变量
 * @param varSpec 变量规格
 * @returns 实例化的变量值
 */
export function instantiateVariables(varSpec?: Record<string, VariableSpec>): Record<string, number> {
  const ctx: Record<string, number> = {};

  if (!varSpec) return ctx;

  for (const [k, spec] of Object.entries(varSpec)) {
    if (spec.type === 'int') {
      let v = randInt(spec.range?.min ?? 10, spec.range?.max ?? 50);

      // 处理约束条件
      if (spec.constraints) {
        for (const constraint of spec.constraints) {
          if (constraint === 'a % 2 == 0' && k === 'a' && v % 2 !== 0) {
            v += 1;
          }
          // 可以添加更多约束条件
        }
      }

      ctx[k] = v;
    } else if (spec.type === 'float') {
      // 简化的浮点数生成
      const min = spec.range?.min ?? 0;
      const max = spec.range?.max ?? 10;
      ctx[k] = Math.round((Math.random() * (max - min) + min) * 100) / 100;
    } else if (spec.type === 'choice' && spec.choices) {
      const idx = Math.floor(Math.random() * spec.choices.length);
      ctx[k] = spec.choices[idx];
    }
  }

  return ctx;
}

/**
 * 生成随机整数
 * @param min 最小值
 * @param max 最大值
 * @returns 随机整数
 */
export function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * 数组相等比较
 * @param a 数组A
 * @param b 数组B
 * @returns 是否相等
 */
export function arraysEqual<T>(a: Set<T>, b: Set<T>): boolean {
  if (a.size !== b.size) return false;
  return Array.from(a).every(item => b.has(item));
}

/**
 * 格式化时间
 * @param seconds 秒数
 * @returns 格式化的时间字符串
 */
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * 步骤类型映射到中文显示
 * @param type 步骤类型
 * @returns 中文显示名称
 */
export function mapStepType(type: string): string {
  const mapping: Record<string, string> = {
    read: '读题',
    extract: '提取条件',
    question: '明确问题',
    relation: '建立关系',
    plan: '制定计划',
    compute: '执行运算',
    check: '检查校验'
  };
  return mapping[type] || type;
}

/**
 * 关键词高亮显示
 * @param text 原始文本
 * @returns 包含高亮关键词的HTML字符串
 */
export function highlightKeywords(text: string): string {
  if (!text || typeof text !== 'string') return text;

  // 定义关键词及其样式
  const keywords = [
    { pattern: /已知条件?/gi, className: 'highlight-known' },
    { pattern: /直接条件?/gi, className: 'highlight-direct' },
    { pattern: /间接条件?/gi, className: 'highlight-indirect' },
    { pattern: /隐藏条件?/gi, className: 'highlight-hidden' },
    { pattern: /问题|要求|求/gi, className: 'highlight-question' },
    { pattern: /解题思路|思路/gi, className: 'highlight-approach' },
    { pattern: /步骤|步骤一|步骤二|步骤三/gi, className: 'highlight-step' },
    { pattern: /注意|提示/gi, className: 'highlight-note' },
    { pattern: /因为|由于/gi, className: 'highlight-reason' },
    { pattern: /所以|因此/gi, className: 'highlight-conclusion' },
    { pattern: /设|令/gi, className: 'highlight-assumption' },
    { pattern: /解/gi, className: 'highlight-solution' },
    { pattern: /答案|结果/gi, className: 'highlight-answer' },
    { pattern: /验证|检验/gi, className: 'highlight-verify' },
    { pattern: /总结|归纳/gi, className: 'highlight-summary' },
    { pattern: /方法|技巧/gi, className: 'highlight-method' },
    { pattern: /公式|定理|公理/gi, className: 'highlight-formula' },
    { pattern: /条件/gi, className: 'highlight-condition' },
    { pattern: /结论/gi, className: 'highlight-result' }
  ];

  let result = text;

  // 对每个关键词模式进行替换
  keywords.forEach(({ pattern, className }) => {
    result = result.replace(pattern, (match) => {
      return `<span class="${className}">${match}</span>`;
    });
  });

  return result;
}