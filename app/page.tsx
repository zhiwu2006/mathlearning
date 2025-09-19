'use client';

import { useState, useEffect } from 'react';
import MathTrainer from '@/components/MathTrainer';
import { ProblemSet } from '@/types/problem';
import { testProblemSet } from '@/lib/test-data';

export default function Home() {
  const [problemSet, setProblemSet] = useState<ProblemSet | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 加载示例题库
    const loadProblemSet = async () => {
      try {
        console.log('开始加载题库...');
        const response = await fetch('/data/complete-math-problems.json');
        console.log('响应状态:', response.status);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('题库数据加载成功:', data);
        setProblemSet(data);
      } catch (error) {
        console.error('加载题库失败:', error);
        setError(error instanceof Error ? error.message : '未知错误');
        // 使用测试数据作为备选
        console.log('使用测试数据作为备选...');
        setProblemSet(testProblemSet);
      } finally {
        setLoading(false);
      }
    };

    loadProblemSet();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">正在加载数学练习系统...</p>
          {error && (
            <div className="mt-4 p-3 bg-yellow-100 border border-yellow-300 rounded text-sm text-yellow-800">
              警告: {error}，将使用测试数据
            </div>
          )}
        </div>
      </div>
    );
  }

  if (!problemSet) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center text-red-600">
          <p>题库加载失败，请检查网络连接</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <MathTrainer problemSet={problemSet} />
    </main>
  );
}