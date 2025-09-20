'use client';

import { useState, useEffect } from 'react';
import { learningProgressManager, LearningStats } from '@/lib/learningProgress';

interface LearningStatsPanelProps {
  problemIds: string[];
  isVisible: boolean;
  onToggle: () => void;
}

export default function LearningStatsPanel({
  problemIds,
  isVisible,
  onToggle,
}: LearningStatsPanelProps) {
  const [stats, setStats] = useState<LearningStats | null>(null);

  useEffect(() => {
    if (isVisible && problemIds.length > 0) {
      const learningStats = learningProgressManager.getLearningStats(problemIds);
      setStats(learningStats);
    }
  }, [isVisible, problemIds]);

  if (!isVisible || !stats) return null;

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'unfamiliar':
        return 'bg-red-500';
      case 'unlearned':
        return 'bg-gray-400';
      case 'learned':
        return 'bg-blue-500';
      case 'familiar':
        return 'bg-green-500';
      default:
        return 'bg-gray-400';
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-lg animate-slide-in">
      <div className="p-6">
        {/* 标题区域 */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            📊 学习进度统计
          </h3>
          <button
            onClick={onToggle}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        {/* 总体进度 */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">总体完成度</span>
            <span className="text-sm font-bold text-blue-600">
              {stats.completionRate.toFixed(1)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-500"
              style={{ width: `${stats.completionRate}%` }}
            />
          </div>
          <div className="flex justify-between mt-1 text-xs text-gray-500">
            <span>{stats.totalProblems - stats.unlearnedCount} 已完成</span>
            <span>{stats.totalProblems} 总题目</span>
          </div>
        </div>

        {/* 学习状态分布 */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-3">学习状态分布</h4>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-red-700">不熟悉</span>
                <span className="text-lg font-bold text-red-600">
                  {stats.unfamiliarCount}
                </span>
              </div>
              <div className="text-xs text-red-600 mt-1">
                需要加强练习
              </div>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">未学习</span>
                <span className="text-lg font-bold text-gray-600">
                  {stats.unlearnedCount}
                </span>
              </div>
              <div className="text-xs text-gray-600 mt-1">
                等待学习
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-blue-700">已学习</span>
                <span className="text-lg font-bold text-blue-600">
                  {stats.learnedCount}
                </span>
              </div>
              <div className="text-xs text-blue-600 mt-1">
                基础掌握
              </div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-green-700">熟悉</span>
                <span className="text-lg font-bold text-green-600">
                  {stats.familiarCount}
                </span>
              </div>
              <div className="text-xs text-green-600 mt-1">
                熟练掌握
              </div>
            </div>
          </div>
        </div>

        {/* 学习统计 */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <div className="text-sm font-medium text-orange-700">平均重做次数</div>
                <div className="text-lg font-bold text-orange-600">
                  {stats.averageRetryCount.toFixed(1)}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <div className="text-sm font-medium text-purple-700">总学习时间</div>
                <div className="text-lg font-bold text-purple-600">
                  {formatTime(stats.totalStudyTime)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 智能推荐提示 */}
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <div className="text-sm font-medium text-indigo-800 mb-1">智能学习建议</div>
              <div className="text-sm text-indigo-700">
                {stats.unfamiliarCount > 0 ? (
                  <span>
                    您有 <span className="font-bold text-red-600">{stats.unfamiliarCount}</span> 道不熟悉的题目，
                    建议优先练习这些题目以提高掌握程度。
                  </span>
                ) : stats.unlearnedCount > 0 ? (
                  <span>
                    您还有 <span className="font-bold text-gray-600">{stats.unlearnedCount}</span> 道题目未学习，
                    建议按顺序学习新内容。
                  </span>
                ) : (
                  <span>
                    恭喜！您已完成所有题目的学习，可以继续练习巩固知识。
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}