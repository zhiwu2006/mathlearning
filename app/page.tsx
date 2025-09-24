'use client';

import { useState, useEffect } from 'react';
import MathTrainer from '@/components/MathTrainer';
import { ProblemSet } from '@/types/problem';
import { testProblemSet } from '@/lib/test-data';
import { ProblemDataManager } from '@/lib/problemDataManager';

export default function Home() {
  const [problemSet, setProblemSet] = useState<ProblemSet | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 加载题库的优先级：本地存储 → 自动加载所有题库 → 测试数据
    const loadProblemSet = async () => {
      try {
        console.log('开始加载题库...');

        // 1. 首先尝试从本地存储加载
        const storedData = ProblemDataManager.loadFromStorage();
        if (storedData) {
          console.log('从本地存储加载题库成功');
          setProblemSet(storedData);
          setLoading(false);
          return;
        }

        // 2. 如果本地没有，尝试自动加载所有题库
        console.log('本地存储无数据，尝试自动加载所有题库...');
        const mergedData = await ProblemDataManager.loadAllProblemSets();

        if (mergedData) {
          console.log('多题库加载和合并成功:', {
            总题数: mergedData.items.length,
            标签: mergedData.metadata.tags,
            版本: mergedData.version
          });

          // 验证数据格式
          if (!mergedData || !mergedData.items || !Array.isArray(mergedData.items)) {
            throw new Error('合并后的题库数据格式不正确');
          }

          // 保存到本地存储
          ProblemDataManager.saveToStorage(mergedData);
          setProblemSet(mergedData);
        } else {
          throw new Error('无法加载任何题库文件');
        }
      } catch (error) {
        console.error('加载题库失败:', error);
        setError(error instanceof Error ? error.message : '未知错误');

        // 3. 最后使用测试数据作为备选
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