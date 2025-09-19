'use client';

import { ProblemSet, Item } from '@/types/problem';
import { getProblemTypes } from '@/lib/problemTypes';

interface ProblemSelectorProps {
  problemSet: ProblemSet;
  currentItemIndex: number;
  onProblemSelect: (index: number) => void;
  filteredIndices?: number[];
  showTypeFilter?: boolean;
}

export default function ProblemSelector({
  problemSet,
  currentItemIndex,
  onProblemSelect,
  filteredIndices,
  showTypeFilter = false,
}: ProblemSelectorProps) {
  const getProblemPreview = (item: Item) => {
    // 获取题目前20个字符作为预览
    const preview = item.stem.text.substring(0, 30);
    return preview.length < item.stem.text.length ? preview + '...' : preview;
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'E':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'M':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'H':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getDifficultyText = (difficulty: string) => {
    switch (difficulty) {
      case 'E':
        return '简单';
      case 'M':
        return '中等';
      case 'H':
        return '困难';
      default:
        return '未知';
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
            <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
          </svg>
          题目选择
        </h3>
        <span className="text-sm text-gray-500">
          共 {filteredIndices ? filteredIndices.length : problemSet.items.length} 题
        </span>
      </div>

      <div className="space-y-2 max-h-64 overflow-y-auto">
        {(filteredIndices || problemSet.items.map((_, i) => i)).map((index) => {
          const item = problemSet.items[index];
          const problemTypes = getProblemTypes(item);
          return (
          <button
            key={item.id}
            onClick={() => onProblemSelect(index)}
            className={`
              w-full text-left p-3 rounded-lg border transition-all duration-200
              ${index === currentItemIndex
                ? 'border-blue-500 bg-blue-50 shadow-sm'
                : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
              }
            `}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`
                    inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border
                    ${getDifficultyColor(item.taxonomy.difficulty)}
                  `}>
                    {getDifficultyText(item.taxonomy.difficulty)}
                  </span>
                  <span className="text-xs text-gray-500">
                    题目 {index + 1}
                  </span>
                </div>
                <div className="text-sm text-gray-700 font-medium leading-relaxed">
                  {getProblemPreview(item)}
                </div>
                <div className="flex items-center gap-2 mt-2">
                  {problemTypes.slice(0, 2).map((type, typeIndex) => (
                    <span
                      key={typeIndex}
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${type.color}`}
                    >
                      {type.icon} {type.name}
                    </span>
                  ))}
                  {problemTypes.length > 2 && (
                    <span className="text-xs text-gray-500">
                      +{problemTypes.length - 2}
                    </span>
                  )}
                </div>
              </div>

              {index === currentItemIndex && (
                <div className="flex-shrink-0">
                  <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>
          </button>
          );
        })}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span>简单</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <span>中等</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span>困难</span>
            </div>
          </div>
          <div>
            点击切换题目
          </div>
        </div>
      </div>
    </div>
  );
}