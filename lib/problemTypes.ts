import { Item } from '@/types/problem';

export interface ProblemType {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
}

export const PROBLEM_TYPES: ProblemType[] = [
  {
    id: 'arithmetic',
    name: '计算题',
    description: '基础四则运算、复杂计算',
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: '🔢'
  },
  {
    id: 'word-problem',
    name: '应用题',
    description: '实际生活中的数学应用',
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: '📝'
  },
  {
    id: 'geometry',
    name: '几何题',
    description: '图形、面积、周长计算',
    color: 'bg-purple-100 text-purple-800 border-purple-200',
    icon: '📐'
  },
  {
    id: 'sequence',
    name: '数列题',
    description: '等差数列、规律探索',
    color: 'bg-orange-100 text-orange-800 border-orange-200',
    icon: '📊'
  },
  {
    id: 'tree-planting',
    name: '植树问题',
    description: '点与段的关系、间隔问题',
    color: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    icon: '🌳'
  },
  {
    id: 'competition',
    name: '竞赛题',
    description: '数学竞赛、奥数题',
    color: 'bg-red-100 text-red-800 border-red-200',
    icon: '🏆'
  },
  {
    id: 'number-theory',
    name: '数论题',
    description: '整除、余数、质数相关',
    color: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    icon: '🔢'
  },
  {
    id: 'logic',
    name: '逻辑题',
    description: '逻辑推理、思维训练',
    color: 'bg-pink-100 text-pink-800 border-pink-200',
    icon: '🧠'
  }
];

export function classifyProblem(item: Item): string[] {
  const types: string[] = [];
  const concepts = item.taxonomy.concepts.map(c => c.toLowerCase());
  const skills = item.taxonomy.skills.map(s => s.toLowerCase());
  const id = item.id.toLowerCase();

  // 根据题目ID前缀分类
  if (id.includes('arithmetic') || id.includes('pdf-extracted') || id.includes('enhanced')) {
    if (concepts.some(c => c.includes('计算') || c.includes('运算'))) {
      types.push('arithmetic');
    }
  }

  if (id.includes('tree-planting')) {
    types.push('tree-planting');
  }

  if (id.includes('arithmetic-seq')) {
    types.push('sequence');
  }

  if (id.includes('hualuogeng') || id.includes('preliminary')) {
    types.push('competition');
  }

  // 根据概念分类
  if (concepts.some(c => c.includes('几何') || c.includes('图形') || c.includes('面积') || c.includes('周长'))) {
    types.push('geometry');
  }

  if (concepts.some(c => c.includes('数列') || c.includes('等差') || c.includes('规律'))) {
    types.push('sequence');
  }

  if (concepts.some(c => c.includes('植树') || c.includes('间隔') || c.includes('株距'))) {
    types.push('tree-planting');
  }

  if (concepts.some(c => c.includes('整除') || c.includes('质数') || c.includes('余数'))) {
    types.push('number-theory');
  }

  if (concepts.some(c => c.includes('逻辑') || c.includes('推理'))) {
    types.push('logic');
  }

  if (concepts.some(c => c.includes('应用') || skills.some(s => s.includes('实际') || s.includes('应用')))) {
    types.push('word-problem');
  }

  // 如果没有匹配到任何分类，默认为计算题
  if (types.length === 0) {
    if (concepts.some(c => c.includes('计算') || c.includes('运算'))) {
      types.push('arithmetic');
    } else {
      types.push('word-problem'); // 默认分类
    }
  }

  return Array.from(new Set(types)); // 去重
}

export function getProblemTypes(item: Item): ProblemType[] {
  const typeIds = classifyProblem(item);
  return PROBLEM_TYPES.filter(type => typeIds.includes(type.id));
}

export function getProblemTypeColor(typeId: string): string {
  const type = PROBLEM_TYPES.find(t => t.id === typeId);
  return type?.color || 'bg-gray-100 text-gray-800 border-gray-200';
}

export function getProblemTypeName(typeId: string): string {
  const type = PROBLEM_TYPES.find(t => t.id === typeId);
  return type?.name || '未知题型';
}