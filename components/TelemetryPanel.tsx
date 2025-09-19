'use client';

import { TelemetryEntry } from '@/types/problem';
import { formatTime } from '@/lib/utils';

interface TelemetryPanelProps {
  entries: TelemetryEntry[];
  score: number;
  totalTime: number;
}

export default function TelemetryPanel({ entries, score, totalTime }: TelemetryPanelProps) {
  return (
    <div className="border-t pt-4">
      <div className="text-xs text-gray-500 mb-2">作答记录</div>
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 max-h-32 overflow-y-auto">
        <div className="space-y-2">
          {/* 分数和时间显示 */}
          <div className="flex justify-between items-center text-xs">
            <div className="flex items-center gap-2">
              <span className="text-gray-600">分值:</span>
              <span className="font-bold text-blue-600">{score.toFixed(1)}</span>
            </div>
            <div className="flex items-center gap-2">
              <span>⏱️</span>
              <span>{formatTime(totalTime)}</span>
            </div>
          </div>

          {/* 作答记录 */}
          <div className="space-y-1 text-xs font-mono text-gray-600">
            {entries.slice().reverse().map((entry, index) => (
              <div key={index} className="border-b border-gray-200 pb-1 last:border-0">
                {entry.stepId && (
                  <div>
                    <span className="text-gray-500">步骤:</span>
                    <span className="ml-1">{entry.stepId}</span>
                  </div>
                )}
                {entry.correct !== undefined && (
                  <div>
                    <span className="text-gray-500">结果:</span>
                    <span className={`ml-1 ${entry.correct ? 'text-green-600' : 'text-red-600'}`}>
                      {entry.correct ? '✓ 正确' : '✗ 错误'}
                    </span>
                  </div>
                )}
                {entry.selection && entry.selection.length > 0 && (
                  <div>
                    <span className="text-gray-500">选择:</span>
                    <span className="ml-1">[{entry.selection.join(', ')}]</span>
                  </div>
                )}
                {entry.retries !== undefined && entry.retries > 0 && (
                  <div>
                    <span className="text-gray-500">重试:</span>
                    <span className="ml-1 text-amber-600">{entry.retries} 次</span>
                  </div>
                )}
                {entry.elapsed !== undefined && (
                  <div>
                    <span className="text-gray-500">用时:</span>
                    <span className="ml-1">{entry.elapsed}s</span>
                  </div>
                )}
                {entry.done && (
                  <div>
                    <span className="text-green-600 font-medium">✓ 本题完成</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}