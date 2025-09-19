'use client';

interface SummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  problemSet: {
    items: Array<{
      id: string;
      scoring: {
        total: number;
      };
      taxonomy: {
        difficulty: string;
        concepts: string[];
      };
    }>;
    metadata: {
      gradeBand: string;
      subject: string;
      tags: string[];
    };
  };
  totalScore: number;
  totalTime: number;
  telemetryEntries: Array<{
    stepId: string;
    correct: boolean;
    retries: number;
    elapsed: number;
  }>;
}

export default function SummaryModal({
  isOpen,
  onClose,
  problemSet,
  totalScore,
  totalTime,
  telemetryEntries,
}: SummaryModalProps) {
  if (!isOpen) return null;

  // 计算统计数据
  const maxPossibleScore = problemSet.items.reduce((sum, item) => sum + item.scoring.total, 0);
  const scorePercentage = (totalScore / maxPossibleScore) * 100;
  const totalAttempts = telemetryEntries.length;
  const correctAttempts = telemetryEntries.filter(entry => entry.correct).length;
  const accuracy = totalAttempts > 0 ? (correctAttempts / totalAttempts) * 100 : 0;
  const avgTimePerStep = totalAttempts > 0 ? totalTime / totalAttempts : 0;

  // 按难度统计
  const difficultyStats = problemSet.items.reduce((acc, item) => {
    const difficulty = item.taxonomy.difficulty;
    if (!acc[difficulty]) acc[difficulty] = { count: 0, total: 0 };
    acc[difficulty].count++;
    acc[difficulty].total += item.scoring.total;
    return acc;
  }, {} as Record<string, { count: number; total: number }>);

  // 评级
  const getGrade = (percentage: number) => {
    if (percentage >= 90) return { grade: 'A', color: 'text-green-600', bgColor: 'bg-green-100', text: '优秀' };
    if (percentage >= 80) return { grade: 'B', color: 'text-blue-600', bgColor: 'bg-blue-100', text: '良好' };
    if (percentage >= 70) return { grade: 'C', color: 'text-yellow-600', bgColor: 'bg-yellow-100', text: '中等' };
    if (percentage >= 60) return { grade: 'D', color: 'text-orange-600', bgColor: 'bg-orange-100', text: '及格' };
    return { grade: 'F', color: 'text-red-600', bgColor: 'bg-red-100', text: '需要努力' };
  };

  const gradeInfo = getGrade(scorePercentage);

  // 格式化时间
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}分${secs}秒`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* 背景遮罩 */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 animate-fadeIn"
        onClick={onClose}
      />

      {/* 弹窗内容 */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden animate-scaleIn">
        {/* 头部 */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-3xl font-bold">🎉 学习完成！</h2>
            <button
              onClick={onClose}
              className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="flex items-center gap-4">
            <div className={`w-20 h-20 ${gradeInfo.bgColor} rounded-full flex items-center justify-center`}>
              <span className={`text-4xl font-bold ${gradeInfo.color}`}>{gradeInfo.grade}</span>
            </div>
            <div>
              <div className="text-lg opacity-90">综合评分</div>
              <div className="text-3xl font-bold">{totalScore.toFixed(1)} / {maxPossibleScore.toFixed(1)}</div>
              <div className="text-lg opacity-90">{gradeInfo.text}</div>
            </div>
          </div>
        </div>

        {/* 统计数据 */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{scorePercentage.toFixed(1)}%</div>
              <div className="text-sm text-gray-600">正确率</div>
            </div>
            <div className="bg-green-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{formatTime(totalTime)}</div>
              <div className="text-sm text-gray-600">总用时</div>
            </div>
            <div className="bg-purple-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">{correctAttempts}/{totalAttempts}</div>
              <div className="text-sm text-gray-600">正确/总步骤</div>
            </div>
            <div className="bg-orange-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">{avgTimePerStep.toFixed(0)}秒</div>
              <div className="text-sm text-gray-600">平均用时</div>
            </div>
          </div>

          {/* 难度分析 */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">难度分析</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.entries(difficultyStats).map(([difficulty, stats]) => {
                const difficultyText = {
                  'E': '简单',
                  'M': '中等',
                  'H': '困难'
                }[difficulty] || difficulty;

                const difficultyColor = {
                  'E': 'bg-green-100 text-green-800',
                  'M': 'bg-yellow-100 text-yellow-800',
                  'H': 'bg-red-100 text-red-800'
                }[difficulty] || 'bg-gray-100 text-gray-800';

                return (
                  <div key={difficulty} className="bg-gray-50 rounded-lg p-4">
                    <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${difficultyColor} mb-2`}>
                      {difficultyText}
                    </div>
                    <div className="text-sm text-gray-600">
                      {stats.count} 题 · 总分 {stats.total}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 学习建议 */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">学习建议</h3>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              {scorePercentage >= 90 && (
                <div className="text-yellow-800">
                  <div className="font-medium mb-1">🌟 表现优秀！</div>
                  <div className="text-sm">你的数学基础很扎实，可以尝试更具挑战性的题目。</div>
                </div>
              )}
              {scorePercentage >= 80 && scorePercentage < 90 && (
                <div className="text-yellow-800">
                  <div className="font-medium mb-1">👍 表现良好！</div>
                  <div className="text-sm">继续保持，稍加练习就能达到优秀水平。</div>
                </div>
              )}
              {scorePercentage >= 70 && scorePercentage < 80 && (
                <div className="text-yellow-800">
                  <div className="font-medium mb-1">📖 还需努力！</div>
                  <div className="text-sm">建议多练习基础题目，巩固知识点。</div>
                </div>
              )}
              {scorePercentage >= 60 && scorePercentage < 70 && (
                <div className="text-yellow-800">
                  <div className="font-medium mb-1">⚠️ 需要加强！</div>
                  <div className="text-sm">建议从基础题目开始，逐步提高难度。</div>
                </div>
              )}
              {scorePercentage < 60 && (
                <div className="text-yellow-800">
                  <div className="font-medium mb-1">📚 基础需要巩固！</div>
                  <div className="text-sm">建议重新学习基础概念，多做基础练习。</div>
                </div>
              )}
            </div>
          </div>

          {/* 底部按钮 */}
          <div className="flex justify-center gap-4">
            <button
              onClick={onClose}
              className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all transform hover:scale-105 shadow-lg font-medium"
            >
              查看详情
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}