'use client';

import { useState } from 'react';
import MathTrainer from '@/components/MathTrainer';
import { testProblemSet } from '@/lib/test-data';

export default function TestPage() {
  const [problemSet, setProblemSet] = useState(testProblemSet);

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        <h1 className="text-2xl font-bold text-blue-600 mb-4">测试页面</h1>
        <p className="text-gray-600 mb-6">这是用于测试的简化版本</p>
        <MathTrainer problemSet={problemSet} />
      </div>
    </main>
  );
}