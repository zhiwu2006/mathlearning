'use client';

import { useState, useEffect, useCallback } from 'react';
import { ProblemSet, Item, Step, Option, TelemetryEntry } from '@/types/problem';
import { renderTemplate, instantiateVariables, randInt, arraysEqual, mapStepType } from '@/lib/utils';
import StemPanel from './StemPanel';
import StepOptions from './StepOptions';
import FeedbackPanel from './FeedbackPanel';
import ControlButtons from './ControlButtons';
import TelemetryPanel from './TelemetryPanel';
import ProblemSelector from './ProblemSelector';
import SummaryModal from './SummaryModal';
import QuestionImporter from './QuestionImporter';
import ProblemEditor from './ProblemEditor';
import ProblemTypeFilter from './ProblemTypeFilter';
import { classifyProblem } from '@/lib/problemTypes';

interface MathTrainerProps {
  problemSet: ProblemSet;
}

export default function MathTrainer({ problemSet }: MathTrainerProps) {
  // 应用状态
  const [state, setState] = useState({
    itemIdx: 0,
    stepIdx: 0,
    vars: {} as Record<string, number>,
    retries: {} as Record<string, number>,
    score: 0,
    startTime: new Date(),
    stepStart: new Date(),
    path: [] as TelemetryEntry[],
  });

  // UI状态
  const [feedback, setFeedback] = useState<{
    isVisible: boolean;
    isCorrect?: boolean;
    message: string;
    type?: 'feedback' | 'hint';
  }>({ isVisible: false, message: '' });

  const [selectedOptions, setSelectedOptions] = useState<Set<string>>(new Set());
  const [showNextButton, setShowNextButton] = useState(false);
  const [confirmDisabled, setConfirmDisabled] = useState(false);
  const [showProblemSelector, setShowProblemSelector] = useState(false);
  const [autoAdvanceTimer, setAutoAdvanceTimer] = useState<NodeJS.Timeout | null>(null);
  const [completedProblems, setCompletedProblems] = useState<Set<number>>(new Set());
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [autoAdvanceCountdown, setAutoAdvanceCountdown] = useState(0);
  const [showImporter, setShowImporter] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [selectedProblemTypes, setSelectedProblemTypes] = useState<string[]>([]);
  const [showTypeFilter, setShowTypeFilter] = useState(false);
  const [currentProblemSet, setCurrentProblemSet] = useState(problemSet);

  // 计算筛选后的题目索引
  const getFilteredProblemIndices = () => {
    if (selectedProblemTypes.length === 0) {
      return problemSet.items.map((_, index) => index);
    }

    return problemSet.items
      .map((item, index) => ({ item, index }))
      .filter(({ item }) => {
        const problemTypes = classifyProblem(item);
        return selectedProblemTypes.some(typeId => problemTypes.includes(typeId));
      })
      .map(({ index }) => index);
  };

  const filteredIndices = getFilteredProblemIndices();

  // 调整当前题目索引以适应筛选后的列表
  const getCurrentFilteredIndex = () => {
    return filteredIndices.indexOf(state.itemIdx);
  };

  const currentItem = problemSet.items[state.itemIdx];
  const currentStep = currentItem?.steps[state.stepIdx];

  // 处理题目导入
  const handleImport = useCallback((newProblemSet: ProblemSet) => {
    setCurrentProblemSet(newProblemSet);
    // 重置状态
    setState(prev => ({
      ...prev,
      itemIdx: 0,
      stepIdx: 0,
      vars: instantiateVariables(newProblemSet.items[0].stem.variables),
      retries: {},
      score: 0,
      startTime: new Date(),
      stepStart: new Date(),
      path: [],
    }));
    setCompletedProblems(new Set());
    setFeedback({ isVisible: false, message: '' });
    setShowNextButton(false);
    setSelectedOptions(new Set());
  }, []);

  // 处理题目编辑
  const handleProblemSetUpdate = useCallback((updatedProblemSet: ProblemSet) => {
    setCurrentProblemSet(updatedProblemSet);
    // 如果当前题目被删除了，跳转到第一题
    if (state.itemIdx >= updatedProblemSet.items.length) {
      setState(prev => ({
        ...prev,
        itemIdx: 0,
        stepIdx: 0,
        vars: instantiateVariables(updatedProblemSet.items[0].stem.variables),
        retries: {},
        score: 0,
        startTime: new Date(),
        stepStart: new Date(),
        path: [],
      }));
    } else {
      // 重新初始化当前题目的变量
      const currentItem = updatedProblemSet.items[state.itemIdx];
      setState(prev => ({
        ...prev,
        vars: instantiateVariables(currentItem.stem.variables),
        stepIdx: 0,
        retries: {},
        score: 0,
        stepStart: new Date(),
        path: [],
      }));
    }
    setCompletedProblems(new Set());
    setFeedback({ isVisible: false, message: '' });
    setShowNextButton(false);
    setSelectedOptions(new Set());
  }, [state.itemIdx]);

  // 初始化变量
  useEffect(() => {
    const vars = instantiateVariables(currentItem.stem.variables);
    setState(prev => ({ ...prev, vars }));
  }, [currentItem]);

  // 计时器
  useEffect(() => {
    const timer = setInterval(() => {
      setState(prev => ({ ...prev }));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // 清理自动前进计时器
  useEffect(() => {
    return () => {
      if (autoAdvanceTimer) {
        clearTimeout(autoAdvanceTimer);
      }
    };
  }, [autoAdvanceTimer]);

  // 倒计时效果
  useEffect(() => {
    let countdownTimer: NodeJS.Timeout;
    if (autoAdvanceCountdown > 0) {
      countdownTimer = setTimeout(() => {
        setAutoAdvanceCountdown(prev => prev - 1);
      }, 1000);
    }
    return () => {
      if (countdownTimer) clearTimeout(countdownTimer);
    };
  }, [autoAdvanceCountdown]);

  // 记录遥测数据
  const logTelemetry = useCallback((entry: Omit<TelemetryEntry, 't'>) => {
    const telemetryEntry: TelemetryEntry = {
      t: Date.now(),
      ...entry,
    };

    setState(prev => ({
      ...prev,
      path: [...prev.path, telemetryEntry],
    }));
  }, []);

  // 渲染当前步骤
  const renderStep = useCallback(() => {
    if (!currentStep) return;

    setFeedback({ isVisible: false, message: '' });
    setShowNextButton(false);
    setConfirmDisabled(false);
    setSelectedOptions(new Set());
  }, [currentStep]);

  useEffect(() => {
    renderStep();
  }, [currentStep, renderStep]);

  // 处理选项选择
  const handleOptionSelect = useCallback((selectedIds: Set<string>) => {
    setSelectedOptions(selectedIds);
  }, []);

  // 显示提示
  const handleShowHint = useCallback(() => {
    if (!currentStep?.hints || currentStep.hints.length === 0) return;

    const retry = state.retries[currentStep.id] || 0;
    const hintIndex = Math.min(retry, currentStep.hints.length - 1);
    const hint = currentStep.hints[hintIndex];

    setFeedback({
      isVisible: true,
      message: hint,
      type: 'hint',
    });

    logTelemetry({
      stepId: currentStep.id,
      selection: Array.from(selectedOptions),
      retries: retry,
      elapsed: Math.round((Date.now() - state.stepStart.getTime()) / 1000),
    });
  }, [currentStep, state.retries, selectedOptions, state.stepStart, logTelemetry]);

  // 确认答案
  const handleConfirm = useCallback(() => {
    if (!currentStep || selectedOptions.size === 0) {
      setFeedback({
        isVisible: true,
        isCorrect: undefined, // 使用undefined而不是false，这样不会显示错误样式
        message: '请先选择一个选项再确认',
        type: 'hint' // 使用提示类型而不是错误类型
      });
      return;
    }

    const correctIds = currentStep.options.filter(o => o.correct).map(o => o.id);
    const isMultiple = !!currentStep.multipleSelect;
    const isCorrect = isMultiple
      ? arraysEqual(new Set(selectedOptions), new Set(correctIds))
      : (correctIds.length === 1 && selectedOptions.has(correctIds[0]));

    // 更新重试次数
    const stepId = currentStep.id;
    const retries = { ...state.retries, [stepId]: (state.retries[stepId] || 0) + (isCorrect ? 0 : 1) };

    // 计算分数
    const scoringRule = currentItem.scoring.perStep[stepId];
    let newScore = state.score;

    if (scoringRule && isCorrect) {
      const retry = state.retries[stepId] || 0;
      const penalty = Math.min((retry * (scoringRule.penaltyPerRetry || 0)) / 100, 1);
      const gain = Math.max((scoringRule.score || 0) * (1 - penalty), scoringRule.minScore || 0);
      newScore += gain;
    }

    setState(prev => ({
      ...prev,
      retries,
      score: newScore,
    }));

    // 生成反馈信息
    let feedbackMessage = '';
    if (!isCorrect) {
      const chosenOptions = currentStep.options.filter(o => selectedOptions.has(o.id));
      feedbackMessage = chosenOptions.map(o => o.feedback).filter(Boolean).join('；');
    } else {
      const correctOptions = currentStep.options.filter(o => selectedOptions.has(o.id));
      feedbackMessage = correctOptions.map(o => o.feedback).filter(Boolean)[0] || '做得好！';
    }

    setFeedback({
      isVisible: true,
      isCorrect,
      message: feedbackMessage || (isCorrect ? '正确' : '再想想'),
    });

    // 记录遥测数据
    const elapsed = Math.round((Date.now() - state.stepStart.getTime()) / 1000);
    logTelemetry({
      stepId: currentStep.id,
      correct: isCorrect,
      selection: Array.from(selectedOptions),
      retries: state.retries[stepId] || 0,
      elapsed,
    });

    // 处理路由
    const transition = currentItem.transitions.find(t => t.fromStep === stepId);
    if (transition) {
      const nextStepId = isCorrect ? transition.onCorrect : transition.onWrong;
      const maxRetries = transition.maxRetries ?? 2;

      setConfirmDisabled(true);
      setShowNextButton(true);

      // 如果超过最大重试次数且答案错误，显示额外提示
      if (!isCorrect && retries[stepId] > maxRetries) {
        // 可以在这里添加更详细的提示
        setFeedback(prev => ({
          ...prev,
          message: prev.message + '\n\n小贴士：仔细检查题目中的关键信息。',
        }));
      }

      // 如果回答正确，设置2秒后自动进入下一题
      if (isCorrect) {
        // 清除之前的计时器
        if (autoAdvanceTimer) {
          clearTimeout(autoAdvanceTimer);
        }

        setAutoAdvanceCountdown(2); // 设置2秒倒计时

        const timer = setTimeout(() => {
          setAutoAdvanceCountdown(0);
          handleNext();
        }, 2000);

        setAutoAdvanceTimer(timer);
      }
    }
  }, [currentStep, selectedOptions, state, currentItem, logTelemetry]);

  // 下一步
  const handleNext = useCallback(() => {
    // 清除自动前进计时器
    if (autoAdvanceTimer) {
      clearTimeout(autoAdvanceTimer);
      setAutoAdvanceTimer(null);
    }
    setAutoAdvanceCountdown(0);

    const transition = currentItem.transitions.find(t => t.fromStep === currentStep?.id);
    if (transition) {
      const nextStepId = selectedOptions.size > 0 ?
        (currentStep?.options.find(o => selectedOptions.has(o.id) && o.correct)?.correct ? transition.onCorrect : transition.onWrong)
        : transition.onCorrect;

      if (nextStepId) {
        const nextStepIndex = currentItem.steps.findIndex(s => s.id === nextStepId);
        if (nextStepIndex >= 0) {
          setState(prev => ({
            ...prev,
            stepIdx: nextStepIndex,
            stepStart: new Date(),
          }));
          return;
        }
      }
    }

    // 检查是否当前题目已经完成（所有步骤都已完成）
    if (state.stepIdx >= currentItem.steps.length - 1) {
      // 标记当前题目为已完成
      const newCompletedProblems = new Set(completedProblems);
      newCompletedProblems.add(state.itemIdx);
      setCompletedProblems(newCompletedProblems);

      // 检查是否所有题目都已完成
      if (newCompletedProblems.size === currentProblemSet.items.length) {
        setShowSummaryModal(true);
        return;
      }

      // 如果有下一题，自动跳转到下一题
      const nextItemIndex = state.itemIdx + 1;
      if (nextItemIndex < currentProblemSet.items.length) {
        // 直接调用切换题目的逻辑，避免循环依赖
        const newItem = currentProblemSet.items[nextItemIndex];
        const vars = instantiateVariables(newItem.stem.variables);

        setState(prev => ({
          ...prev,
          itemIdx: nextItemIndex,
          stepIdx: 0,
          vars,
          retries: {},
          score: prev.score, // 保持分数
          stepStart: new Date(),
        }));

        setFeedback({ isVisible: false, message: '' });
        setShowNextButton(false);
        setSelectedOptions(new Set());
        return;
      }
    }

    // 默认：前进到下一步
    setState(prev => ({
      ...prev,
      stepIdx: Math.min(prev.stepIdx + 1, currentItem.steps.length - 1),
      stepStart: new Date(),
    }));
  }, [currentItem, currentStep, selectedOptions, autoAdvanceTimer, completedProblems, problemSet.items.length]);

  // 上一步
  const handlePrevious = useCallback(() => {
    setState(prev => ({
      ...prev,
      stepIdx: Math.max(0, prev.stepIdx - 1),
      stepStart: new Date(),
    }));
  }, []);

  // 重置题目
  const handleReset = useCallback(() => {
    console.log('重做本题按钮被点击了');
    const vars = instantiateVariables(currentItem.stem.variables);
    setState(prev => ({
      ...prev,
      stepIdx: 0,
      vars,
      retries: {},
      score: 0,
      startTime: new Date(),
      stepStart: new Date(),
      path: [],
    }));
    console.log('重置feedback状态');
    setFeedback({ isVisible: false, message: '' });
    setShowNextButton(false);
    setConfirmDisabled(false);
    console.log('重置selectedOptions');
    setSelectedOptions(new Set());
    // 清除自动前进计时器
    if (autoAdvanceTimer) {
      clearTimeout(autoAdvanceTimer);
      setAutoAdvanceTimer(null);
    }
    setAutoAdvanceCountdown(0);
  }, [currentItem, autoAdvanceTimer]);

  // 切换题目
  const handleProblemSelect = useCallback((index: number) => {
    const newItem = problemSet.items[index];
    const vars = instantiateVariables(newItem.stem.variables);

    setState(prev => ({
      ...prev,
      itemIdx: index,
      stepIdx: 0,
      vars,
      retries: {},
      score: 0,
      startTime: new Date(),
      stepStart: new Date(),
      path: [],
    }));

    setFeedback({ isVisible: false, message: '' });
    setShowNextButton(false);
    setConfirmDisabled(false);
    setSelectedOptions(new Set());
    setShowProblemSelector(false);
    // 清除自动前进计时器
    if (autoAdvanceTimer) {
      clearTimeout(autoAdvanceTimer);
      setAutoAdvanceTimer(null);
    }
    setAutoAdvanceCountdown(0);
  }, [problemSet, autoAdvanceTimer]);

  // 处理题型筛选
  const handleTypeFilterChange = useCallback((types: string[]) => {
    setSelectedProblemTypes(types);

    // 如果当前题目不在筛选结果中，切换到筛选后的第一个题目
    const newFilteredIndices = getFilteredProblemIndices();
    if (types.length > 0 && !newFilteredIndices.includes(state.itemIdx)) {
      if (newFilteredIndices.length > 0) {
        handleProblemSelect(newFilteredIndices[0]);
      }
    }
  }, [state.itemIdx, handleProblemSelect, getFilteredProblemIndices]);

  // 计算总时间
  const totalTime = Math.floor((Date.now() - state.startTime.getTime()) / 1000);

  if (!currentItem) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="text-center text-gray-500">
          题目加载失败或已完成所有题目
        </div>
      </div>
    );
  }

  const totalSteps = currentItem.steps.length;
  const hasPrevious = state.stepIdx > 0;
  const hasNext = state.stepIdx < totalSteps - 1;

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6">
      {/* 页面标题 */}
      <header className="mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-blue-600">分步引导数学练习</h1>
            <p className="text-sm text-gray-600 mt-1">
              {currentProblemSet.metadata.gradeBand} · {currentProblemSet.metadata.subject}
            </p>
          </div>
          <div className="flex flex-wrap gap-3 sm:gap-4 items-center">
            {/* 编辑按钮 */}
            <button
              onClick={() => setShowEditor(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-blue-500 text-white rounded-lg hover:from-indigo-600 hover:to-blue-600 transition-all transform hover:scale-105 shadow-md"
              title="编辑题目"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              <span className="text-sm font-medium">编辑题目</span>
            </button>

            {/* 题型筛选按钮 */}
            <button
              onClick={() => setShowTypeFilter(!showTypeFilter)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all transform hover:scale-105 shadow-md ${
                selectedProblemTypes.length > 0
                  ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-600 hover:to-red-600'
                  : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600'
              }`}
              title="按题型筛选"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              <span className="text-sm font-medium">
                题型筛选 {selectedProblemTypes.length > 0 && `(${selectedProblemTypes.length})`}
              </span>
            </button>

            {/* 导入按钮 */}
            <button
              onClick={() => setShowImporter(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all transform hover:scale-105 shadow-md"
              title="导入题目"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <span className="text-sm font-medium">导入题目</span>
            </button>

            <div className="flex flex-wrap gap-3 sm:gap-4 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-green-500"></span>
                <span>正确</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-500"></span>
                <span>错误</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-amber-500"></span>
                <span>提示</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* 左侧：题干和进度 */}
        <StemPanel
          problemSet={currentProblemSet}
          currentItem={currentItem}
          vars={state.vars}
          currentStepIndex={state.stepIdx}
          totalSteps={totalSteps}
        />

        {/* 右侧：工作区域 */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 shadow-sm">
          {currentStep ? (
            <>
              {/* 步骤标题 */}
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-4 sm:mb-6">
                <div className="text-sm sm:text-base text-gray-600 font-medium">
                  {mapStepType(currentStep.type)}
                </div>
                <div className="text-xs sm:text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                  步骤 {state.stepIdx + 1} / {totalSteps}
                </div>
              </div>

              {/* 问题提示 */}
              <div className="text-lg sm:text-xl mb-6 sm:mb-6 leading-relaxed bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border border-blue-100">
                {renderTemplate(currentStep.prompt, state.vars)}
              </div>

              {/* 选项 */}
              <StepOptions
                step={currentStep}
                vars={state.vars}
                onOptionSelect={handleOptionSelect}
                disabled={confirmDisabled}
                selectedOptions={selectedOptions}
              />

              {/* 反馈信息 */}
              <FeedbackPanel
                isVisible={feedback.isVisible}
                isCorrect={feedback.isCorrect}
                message={feedback.message}
                type={feedback.type}
                countdown={autoAdvanceCountdown}
              />

              {/* 控制按钮 */}
              <ControlButtons
                onShowHint={handleShowHint}
                onConfirm={handleConfirm}
                onNext={handleNext}
                onPrevious={handlePrevious}
                onReset={handleReset}
                hasNext={hasNext}
                hasPrevious={hasPrevious}
                confirmDisabled={confirmDisabled}
                showHintButton={!!currentStep.hints?.length}
                showNextButton={showNextButton}
              />

              {/* 分数和时间 */}
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mt-6 pt-6 border-t border-gray-200">
                <div className="text-center sm:text-left">
                  <div className="text-sm text-gray-600">当前得分</div>
                  <div className="text-lg font-bold text-blue-600">
                    {state.score.toFixed(1)}<span className="text-sm text-gray-600"> / {currentItem.scoring.total}</span>
                  </div>
                </div>
                <div className="text-center sm:text-right">
                  <div className="text-sm text-gray-600">用时</div>
                  <div className="text-lg font-medium text-gray-800">
                    ⏱️ {Math.floor(totalTime / 60)}:{(totalTime % 60).toString().padStart(2, '0')}
                  </div>
                </div>
              </div>

              {/* 遥测面板 */}
              <TelemetryPanel
                entries={state.path}
                score={state.score}
                totalTime={totalTime}
              />
            </>
          ) : (
            <div className="text-center py-8 sm:py-12">
              <div className="animate-scaleIn mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-green-600 mb-4">🎉 恭喜完成！</h2>
              <div className="text-lg sm:text-xl mb-6 text-gray-700">
                你的得分：<span className="font-bold text-blue-600 text-2xl">{state.score.toFixed(1)}</span>
                <span className="text-gray-600"> / {currentItem.scoring.total}</span>
              </div>
              <div className="mb-6 text-sm text-gray-500">
                用时：{Math.floor(totalTime / 60)}:{(totalTime % 60).toString().padStart(2, '0')}
              </div>
              <button
                onClick={handleReset}
                className="px-6 sm:px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all transform hover:scale-105 shadow-lg"
              >
                重新开始
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 底部题目选择区域 */}
      <div className="mt-6 sm:mt-8">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <button
            onClick={() => setShowProblemSelector(!showProblemSelector)}
            className="w-full flex items-center justify-between gap-3 px-6 py-4 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
              </svg>
              <div className="text-left">
                <div className="font-medium text-gray-800">题目选择</div>
                <div className="text-sm text-gray-500">
                  当前：题目 {state.itemIdx + 1} · 共 {currentProblemSet.items.length} 题
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">
                {showProblemSelector ? '收起' : '展开'}
              </span>
              <svg className={`w-5 h-5 text-gray-500 transition-transform ${showProblemSelector ? 'rotate-180' : ''}`} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>
          </button>

          {showProblemSelector && (
            <div className="border-t border-gray-200 animate-slide-in">
              <ProblemSelector
                problemSet={problemSet}
                currentItemIndex={state.itemIdx}
                onProblemSelect={handleProblemSelect}
                filteredIndices={filteredIndices}
                showTypeFilter={selectedProblemTypes.length > 0}
              />
            </div>
          )}
        </div>
      </div>

      {/* 题型筛选弹窗 */}
      {showTypeFilter && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <svg className="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 0l-2 2a1 1 0 101.414 1.414L8 10.414l1.293 1.293a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                题型筛选
              </h3>
              <button
                onClick={() => setShowTypeFilter(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <ProblemTypeFilter
                selectedTypes={selectedProblemTypes}
                onTypeChange={handleTypeFilterChange}
              />
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    setSelectedProblemTypes([]);
                    setShowTypeFilter(false);
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  清除筛选
                </button>
                <button
                  onClick={() => setShowTypeFilter(false)}
                  className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  确定
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 总结弹窗 */}
      <SummaryModal
        isOpen={showSummaryModal}
        onClose={() => setShowSummaryModal(false)}
        problemSet={currentProblemSet}
        totalScore={state.score}
        totalTime={totalTime}
        telemetryEntries={state.path.filter(entry => entry.stepId && entry.correct !== undefined).map(entry => ({
          stepId: entry.stepId!,
          correct: entry.correct!,
          retries: entry.retries || 0,
          elapsed: entry.elapsed || 0,
        }))}
      />

      {/* 题目导入弹窗 */}
      <QuestionImporter
        isOpen={showImporter}
        onClose={() => setShowImporter(false)}
        onImport={handleImport}
      />

      {/* 题目编辑弹窗 */}
      <ProblemEditor
        problemSet={currentProblemSet}
        onProblemSetUpdate={handleProblemSetUpdate}
        onClose={() => setShowEditor(false)}
        isOpen={showEditor}
      />
    </div>
  );
}