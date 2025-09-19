'use client';

import { ProblemSet, Item } from '@/types/problem';
import { renderTemplate, mapStepType, highlightKeywords } from '@/lib/utils';
import ProgressBar from './ProgressBar';

interface StemPanelProps {
  problemSet: ProblemSet;
  currentItem: Item;
  vars: Record<string, number>;
  currentStepIndex: number;
  totalSteps: number;
}

export default function StemPanel({
  problemSet,
  currentItem,
  vars,
  currentStepIndex,
  totalSteps,
}: StemPanelProps) {
  const renderedText = highlightKeywords(renderTemplate(currentItem.stem.text, vars));

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-lg animate-fadeInUp">
      {/* 标题区域 */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
            <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
          </svg>
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-800">数学题目</h2>
          <p className="text-sm text-gray-500">
            {problemSet.metadata.gradeBand} · {problemSet.metadata.subject}
          </p>
        </div>
      </div>

      {/* 题目内容 */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 mb-4 border border-blue-100">
        <div
          className="text-xl leading-relaxed font-medium text-gray-900"
          dangerouslySetInnerHTML={{ __html: renderedText }}
        />
      </div>

      {/* 变量信息 */}
      {Object.keys(vars).length > 0 && (
        <div className="bg-gray-50 rounded-lg p-3 mb-4 border border-gray-200">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
            </svg>
            <span className="font-medium">变量值：</span>
            {Object.entries(vars).map(([k, v], index) => (
              <span key={k} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200 ml-1">
                {k} = {v}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 标签 */}
      <div className="flex flex-wrap gap-2 mb-6">
        {problemSet.metadata.tags.map((tag, index) => (
          <span
            key={index}
            className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-800 border border-indigo-200 animate-scaleIn"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M17.707 9.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-7-7A.997.997 0 012 10V5a3 3 0 013-3h5c.256 0 .512.098.707.293l7 7zM5 6a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
            </svg>
            {tag}
          </span>
        ))}
      </div>

      {/* 进度和题目信息 */}
      <div className="border-t border-gray-200 pt-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
            </svg>
            <span className="text-sm font-medium text-gray-700">解题进度</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">答案单位：</span>
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-cyan-100 to-blue-100 text-cyan-800 border border-cyan-200">
              {currentItem.answer.unit || '无'}
            </span>
          </div>
        </div>

        {/* 使用增强的进度条 */}
        <ProgressBar
          current={currentStepIndex + 1}
          total={totalSteps}
          label=""
          showPercentage={false}
          className="mb-3"
        />

        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
          <div className="text-sm text-gray-600 font-medium">
            第 {currentStepIndex + 1} 步，共 {totalSteps} 步
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span>难度：</span>
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${
              currentItem.taxonomy.difficulty === 'E'
                ? 'bg-green-100 text-green-800 border-green-200'
                : currentItem.taxonomy.difficulty === 'M'
                  ? 'bg-yellow-100 text-yellow-800 border-yellow-200'
                  : 'bg-red-100 text-red-800 border-red-200'
            }`}>
              {currentItem.taxonomy.difficulty === 'M' ? '中等' : currentItem.taxonomy.difficulty === 'E' ? '简单' : '困难'}
            </span>
          </div>
        </div>

        {/* 题目概念标签 */}
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="text-xs text-gray-500 mb-2">主要概念：</div>
          <div className="flex flex-wrap gap-1">
            {currentItem.taxonomy.concepts.map((concept, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-50 text-blue-700 border border-blue-200"
              >
                {concept}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}