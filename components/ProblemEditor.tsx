'use client';

import { useState, useEffect } from 'react';
import { ProblemSet, Item, Step, Option } from '@/types/problem';

interface ProblemEditorProps {
  problemSet: ProblemSet;
  onProblemSetUpdate: (updatedProblemSet: ProblemSet) => void;
  onClose: () => void;
  isOpen: boolean;
}

export default function ProblemEditor({ problemSet, onProblemSetUpdate, onClose, isOpen }: ProblemEditorProps) {
  const [editingProblem, setEditingProblem] = useState<Item | null>(null);
  const [editingStep, setEditingStep] = useState<Step | null>(null);
  const [editingOption, setEditingOption] = useState<Option | null>(null);
  const [showStepEditor, setShowStepEditor] = useState(false);
  const [showOptionEditor, setShowOptionEditor] = useState(false);
  const [newProblemId, setNewProblemId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  // 过滤题目
  const filteredProblems = problemSet.items.filter(item =>
    item.stem.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 删除题目
  const handleDeleteProblem = (problemId: string) => {
    if (window.confirm('确定要删除这道题目吗？此操作不可撤销。')) {
      const updatedItems = problemSet.items.filter(item => item.id !== problemId);
      const updatedProblemSet = {
        ...problemSet,
        items: updatedItems
      };
      onProblemSetUpdate(updatedProblemSet);
    }
  };

  // 开始编辑题目
  const handleEditProblem = (problem: Item) => {
    setEditingProblem({ ...problem });
  };

  // 保存题目编辑
  const handleSaveProblem = () => {
    if (!editingProblem) return;

    const updatedItems = problemSet.items.map(item =>
      item.id === editingProblem.id ? editingProblem : item
    );

    const updatedProblemSet = {
      ...problemSet,
      items: updatedItems
    };

    onProblemSetUpdate(updatedProblemSet);
    setEditingProblem(null);
  };

  // 添加新题目
  const handleAddProblem = () => {
    if (!newProblemId.trim()) {
      alert('请输入题目ID');
      return;
    }

    // 检查ID是否已存在
    if (problemSet.items.some(item => item.id === newProblemId)) {
      alert('题目ID已存在，请使用不同的ID');
      return;
    }

    const newProblem: Item = {
      id: newProblemId,
      stem: {
        text: "新题目的题干内容",
        variables: {}
      },
      taxonomy: {
        concepts: ["新概念"],
        skills: ["新技能"],
        difficulty: "E"
      },
      steps: [
        {
          id: "step-1",
          type: "question",
          prompt: "请输入问题...",
          options: [
            {
              id: "option-1",
              text: "选项A",
              correct: true,
              feedback: "正确！"
            },
            {
              id: "option-2",
              text: "选项B",
              correct: false,
              feedback: "错误！"
            }
          ]
        }
      ],
      transitions: [
        {
          fromStep: "step-1",
          onCorrect: "",
          onWrong: "step-1",
          maxRetries: 2
        }
      ],
      scoring: {
        total: 10,
        perStep: {
          "step-1": {
            score: 10,
            penaltyPerRetry: 0.5,
            minScore: 1
          }
        }
      },
      answer: {
        final: "答案",
        unit: "单位",
        rationale: "解题思路"
      }
    };

    const updatedProblemSet = {
      ...problemSet,
      items: [...problemSet.items, newProblem]
    };

    onProblemSetUpdate(updatedProblemSet);
    setNewProblemId('');
  };

  // 添加步骤
  const handleAddStep = () => {
    if (!editingProblem) return;

    const newStep: Step = {
      id: `step-${editingProblem.steps.length + 1}`,
      type: "question",
      prompt: "新步骤的问题",
      options: [
        {
          id: "option-1",
          text: "选项A",
          correct: true,
          feedback: "正确！"
        }
      ]
    };

    setEditingProblem({
      ...editingProblem,
      steps: [...editingProblem.steps, newStep]
    });
  };

  // 删除步骤
  const handleDeleteStep = (stepId: string) => {
    if (!editingProblem) return;

    const updatedSteps = editingProblem.steps.filter(step => step.id !== stepId);
    const updatedTransitions = editingProblem.transitions.filter(t => t.fromStep !== stepId);

    setEditingProblem({
      ...editingProblem,
      steps: updatedSteps,
      transitions: updatedTransitions
    });
  };

  // 编辑步骤
  const handleEditStep = (step: Step) => {
    setEditingStep({ ...step });
    setShowStepEditor(true);
  };

  // 保存步骤编辑
  const handleSaveStep = () => {
    if (!editingProblem || !editingStep) return;

    const updatedSteps = editingProblem.steps.map(step =>
      step.id === editingStep.id ? editingStep : step
    );

    setEditingProblem({
      ...editingProblem,
      steps: updatedSteps
    });

    setShowStepEditor(false);
    setEditingStep(null);
  };

  // 添加选项
  const handleAddOption = () => {
    if (!editingStep) return;

    const newOption: Option = {
      id: `option-${editingStep.options.length + 1}`,
      text: "新选项",
      correct: false,
      feedback: "反馈信息"
    };

    setEditingStep({
      ...editingStep,
      options: [...editingStep.options, newOption]
    });
  };

  // 删除选项
  const handleDeleteOption = (optionId: string) => {
    if (!editingStep) return;

    const updatedOptions = editingStep.options.filter(option => option.id !== optionId);
    setEditingStep({
      ...editingStep,
      options: updatedOptions
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* 背景遮罩 */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 animate-fadeIn"
        onClick={onClose}
      />

      {/* 编辑器内容 */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden animate-scaleIn">
        {/* 头部 */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">📝 题目编辑器</h2>
            <button
              onClick={onClose}
              className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="mt-2 text-blue-100">
            管理和编辑数学题库
          </p>
        </div>

        <div className="p-6">
          {/* 搜索和添加区域 */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <input
                type="text"
                placeholder="搜索题目..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="新题目ID"
                value={newProblemId}
                onChange={(e) => setNewProblemId(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <button
                onClick={handleAddProblem}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                添加题目
              </button>
            </div>
          </div>

          {/* 题目列表 */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-4">题目列表 ({filteredProblems.length}道题)</h3>
            <div className="grid gap-4 max-h-64 overflow-y-auto">
              {filteredProblems.map((problem, index) => (
                <div key={problem.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                        <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">{problem.id}</span>
                        <span className={`text-xs px-2 py-1 rounded ${
                          problem.taxonomy.difficulty === 'E' ? 'bg-green-100 text-green-800' :
                          problem.taxonomy.difficulty === 'M' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {problem.taxonomy.difficulty === 'E' ? '简单' :
                           problem.taxonomy.difficulty === 'M' ? '中等' : '困难'}
                        </span>
                      </div>
                      <p className="text-gray-800 mb-2 line-clamp-2">{problem.stem.text}</p>
                      <div className="flex flex-wrap gap-1 mb-2">
                        {problem.taxonomy.concepts.map((concept, i) => (
                          <span key={i} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            {concept}
                          </span>
                        ))}
                      </div>
                      <div className="text-xs text-gray-500">
                        {problem.steps.length} 个步骤
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => handleEditProblem(problem)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="编辑题目"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDeleteProblem(problem.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="删除题目"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 题目编辑区域 */}
          {editingProblem && (
            <div className="border-t pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">编辑题目: {editingProblem.id}</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditingProblem(null)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleSaveProblem}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    保存题目
                  </button>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* 基本信息 */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">题干</label>
                    <textarea
                      value={editingProblem.stem.text}
                      onChange={(e) => setEditingProblem({
                        ...editingProblem,
                        stem: { ...editingProblem.stem, text: e.target.value }
                      })}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={4}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">难度</label>
                    <select
                      value={editingProblem.taxonomy.difficulty}
                      onChange={(e) => setEditingProblem({
                        ...editingProblem,
                        taxonomy: {
                          ...editingProblem.taxonomy,
                          difficulty: e.target.value as 'E' | 'M' | 'H'
                        }
                      })}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="E">简单</option>
                      <option value="M">中等</option>
                      <option value="H">困难</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">概念标签 (用逗号分隔)</label>
                    <input
                      type="text"
                      value={editingProblem.taxonomy.concepts.join(', ')}
                      onChange={(e) => setEditingProblem({
                        ...editingProblem,
                        taxonomy: {
                          ...editingProblem.taxonomy,
                          concepts: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                        }
                      })}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* 步骤管理 */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium">步骤管理</h4>
                    <button
                      onClick={handleAddStep}
                      className="px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                    >
                      添加步骤
                    </button>
                  </div>

                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {editingProblem.steps.map((step, index) => (
                      <div key={step.id} className="border border-gray-200 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">步骤 {index + 1}: {step.type}</span>
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleEditStep(step)}
                              className="p-1 text-blue-600 hover:bg-blue-50 rounded text-sm"
                              title="编辑步骤"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDeleteStep(step.id)}
                              className="p-1 text-red-600 hover:bg-red-50 rounded text-sm"
                              title="删除步骤"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{step.prompt}</p>
                        <div className="text-xs text-gray-500">
                          {step.options.length} 个选项
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 步骤编辑弹窗 */}
      {showStepEditor && editingStep && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="bg-blue-600 text-white p-4">
              <h3 className="text-lg font-semibold">编辑步骤: {editingStep.id}</h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">步骤类型</label>
                  <select
                    value={editingStep.type}
                    onChange={(e) => setEditingStep({
                      ...editingStep,
                      type: e.target.value as any
                    })}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="extract">提取条件</option>
                    <option value="question">明确问题</option>
                    <option value="relation">建立关系</option>
                    <option value="plan">制定计划</option>
                    <option value="compute">执行运算</option>
                    <option value="check">检查校验</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">问题提示</label>
                  <textarea
                    value={editingStep.prompt}
                    onChange={(e) => setEditingStep({
                      ...editingStep,
                      prompt: e.target.value
                    })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-medium text-gray-700">选项</label>
                    <button
                      onClick={handleAddOption}
                      className="px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                    >
                      添加选项
                    </button>
                  </div>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {editingStep.options.map((option, index) => (
                      <div key={option.id} className="flex items-center gap-2 p-2 border border-gray-200 rounded">
                        <input
                          type="checkbox"
                          checked={option.correct}
                          onChange={(e) => {
                            const updatedOptions = editingStep.options.map(opt =>
                              opt.id === option.id ? { ...opt, correct: e.target.checked } : opt
                            );
                            setEditingStep({ ...editingStep, options: updatedOptions });
                          }}
                          className="w-4 h-4 text-blue-600"
                        />
                        <input
                          type="text"
                          value={option.text}
                          onChange={(e) => {
                            const updatedOptions = editingStep.options.map(opt =>
                              opt.id === option.id ? { ...opt, text: e.target.value } : opt
                            );
                            setEditingStep({ ...editingStep, options: updatedOptions });
                          }}
                          className="flex-1 p-1 border border-gray-300 rounded text-sm"
                          placeholder="选项文本"
                        />
                        <input
                          type="text"
                          value={option.feedback}
                          onChange={(e) => {
                            const updatedOptions = editingStep.options.map(opt =>
                              opt.id === option.id ? { ...opt, feedback: e.target.value } : opt
                            );
                            setEditingStep({ ...editingStep, options: updatedOptions });
                          }}
                          className="flex-1 p-1 border border-gray-300 rounded text-sm"
                          placeholder="反馈信息"
                        />
                        <button
                          onClick={() => handleDeleteOption(option.id)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-2 mt-6">
                <button
                  onClick={() => {
                    setShowStepEditor(false);
                    setEditingStep(null);
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleSaveStep}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  保存步骤
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}