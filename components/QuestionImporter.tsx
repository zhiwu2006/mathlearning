'use client';

import { useState, useRef, useEffect } from 'react';
import { ProblemSet } from '@/types/problem';
import { ProblemDataManager } from '@/lib/problemDataManager';

interface QuestionImporterProps {
  onImport: (problemSet: ProblemSet) => void;
  onClose: () => void;
  isOpen: boolean;
}

export default function QuestionImporter({ onImport, onClose, isOpen }: QuestionImporterProps) {
  const [importData, setImportData] = useState('');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [storageStats, setStorageStats] = useState({ totalItems: 0, tags: [] as string[] });
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 获取存储状态
  useEffect(() => {
    if (isOpen) {
      const stats = ProblemDataManager.getStorageStats();
      setStorageStats(stats);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const validateJson = (data: any): string[] => {
    const errors: string[] = [];

    // 基本结构验证
    if (!data.version) errors.push('缺少 version 字段');
    if (!data.locale) errors.push('缺少 locale 字段');
    if (!data.metadata) errors.push('缺少 metadata 对象');
    if (!Array.isArray(data.items)) errors.push('items 必须是数组');

    // Metadata 验证
    if (data.metadata) {
      if (!data.metadata.gradeBand) errors.push('metadata.gradeBand 不能为空');
      if (!data.metadata.subject) errors.push('metadata.subject 不能为空');
    }

    // Items 验证
    if (Array.isArray(data.items)) {
      data.items.forEach((item: any, index: number) => {
        const prefix = `第${index + 1}题`;

        if (!item.id) errors.push(`${prefix}: 缺少 id 字段`);
        if (!item.stem) errors.push(`${prefix}: 缺少 stem 对象`);
        if (!item.taxonomy) errors.push(`${prefix}: 缺少 taxonomy 对象`);
        if (!Array.isArray(item.steps)) errors.push(`${prefix}: steps 必须是数组`);
        if (!Array.isArray(item.transitions)) errors.push(`${prefix}: transitions 必须是数组`);
        if (!item.scoring) errors.push(`${prefix}: 缺少 scoring 对象`);

        // Stem 验证
        if (item.stem) {
          if (!item.stem.text) errors.push(`${prefix}: stem.text 不能为空`);
        }

        // Steps 验证
        if (Array.isArray(item.steps)) {
          item.steps.forEach((step: any, stepIndex: number) => {
            const stepPrefix = `${prefix} - 第${stepIndex + 1}步`;

            if (!step.id) errors.push(`${stepPrefix}: 缺少 id 字段`);
            if (!step.type) errors.push(`${stepPrefix}: 缺少 type 字段`);
            if (!step.prompt) errors.push(`${stepPrefix}: 缺少 prompt 字段`);
            if (!Array.isArray(step.options)) errors.push(`${stepPrefix}: options 必须是数组`);

            // Options 验证
            if (Array.isArray(step.options)) {
              step.options.forEach((option: any, optionIndex: number) => {
                const optionPrefix = `${stepPrefix} - 选项${optionIndex + 1}`;

                if (!option.id) errors.push(`${optionPrefix}: 缺少 id 字段`);
                if (option.text === undefined) errors.push(`${optionPrefix}: 缺少 text 字段`);
                if (typeof option.correct !== 'boolean') errors.push(`${optionPrefix}: correct 必须是布尔值`);
              });
            }
          });
        }

        // Transitions 验证
        if (Array.isArray(item.transitions)) {
          item.transitions.forEach((transition: any, transIndex: number) => {
            const transPrefix = `${prefix} - 转换${transIndex + 1}`;

            if (!transition.fromStep) errors.push(`${transPrefix}: 缺少 fromStep 字段`);
            if (transition.onCorrect === undefined) errors.push(`${transPrefix}: 缺少 onCorrect 字段`);
            if (transition.onWrong === undefined) errors.push(`${transPrefix}: 缺少 onWrong 字段`);
          });
        }

        // Scoring 验证
        if (item.scoring) {
          if (typeof item.scoring.total !== 'number') errors.push(`${prefix}: scoring.total 必须是数字`);
          if (!item.scoring.perStep) errors.push(`${prefix}: 缺少 scoring.perStep 对象`);
        }
      });
    }

    return errors;
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        setImportData(content);
        validateAndImport(content);
      } catch (error) {
        setValidationErrors(['文件读取失败']);
      }
    };
    reader.readAsText(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (!file || !file.name.endsWith('.json')) {
      setValidationErrors(['请上传 JSON 文件']);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        setImportData(content);
        validateAndImport(content);
      } catch (error) {
        setValidationErrors(['文件读取失败']);
      }
    };
    reader.readAsText(file);
  };

  const validateAndImport = (content: string) => {
    try {
      const data = JSON.parse(content);
      const errors = validateJson(data);

      if (errors.length > 0) {
        setValidationErrors(errors);
      } else {
        // 添加默认值
        if (!data.$schema) data.$schema = "http://json-schema.org/draft-07/schema#";
        if (!data.id) data.id = `imported-${Date.now()}`;
        if (!data.version) data.version = "1.0.0";
        if (!data.locale) data.locale = "zh-CN";
        if (!data.metadata.createdAt) data.metadata.createdAt = new Date().toISOString();
        if (!data.metadata.author) data.metadata.author = "Imported";

        const newItemsCount = data.items.length;
        onImport(data);
        setValidationErrors([]);
        setSuccessMessage(`成功导入 ${newItemsCount} 道题目！已与现有题目合并。`);
        setImportData('');

        // 2秒后自动关闭
        setTimeout(() => {
          onClose();
          setSuccessMessage('');
        }, 2000);
      }
    } catch (error) {
      setValidationErrors(['JSON 格式错误']);
    }
  };

  const handleImport = () => {
    if (!importData.trim()) {
      setValidationErrors(['请输入 JSON 数据']);
      return;
    }
    validateAndImport(importData);
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
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">📚 题目导入</h2>
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
            支持 JSON 格式的题目文件导入（合并模式，不会覆盖原有题目）
          </p>
          {storageStats.totalItems > 0 && (
            <p className="mt-1 text-blue-200 text-sm">
              本地已存储 {storageStats.totalItems} 道题目，下次启动将自动加载
            </p>
          )}
        </div>

        <div className="p-6">
          {/* 拖拽上传区域 */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center mb-6 transition-colors ${
              isDragging
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-blue-400'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="text-lg font-medium text-gray-700 mb-2">
              拖拽 JSON 文件到此处
            </p>
            <p className="text-sm text-gray-500 mb-4">
              或者点击下方按钮选择文件
            </p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              选择文件
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>

          {/* 手动输入区域 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              或直接粘贴 JSON 数据：
            </label>
            <textarea
              value={importData}
              onChange={(e) => setImportData(e.target.value)}
              placeholder="在此粘贴 JSON 格式的题目数据..."
              className="w-full h-64 p-4 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* 成功信息 */}
          {successMessage && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <h3 className="text-lg font-medium text-green-800 mb-2">✅ 导入成功</h3>
              <p className="text-sm text-green-700">{successMessage}</p>
            </div>
          )}

          {/* 错误信息 */}
          {validationErrors.length > 0 && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <h3 className="text-lg font-medium text-red-800 mb-2">⚠️ 验证错误</h3>
              <ul className="text-sm text-red-700 space-y-1">
                {validationErrors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </div>
          )}

          {/* 按钮组 */}
          <div className="flex justify-between items-center">
            <button
              onClick={() => {
                window.open('/examples/sample-question-format.json', '_blank');
              }}
              className="px-4 py-2 text-blue-600 hover:text-blue-800 transition-colors"
            >
              查看格式示例
            </button>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleImport}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                导入题目
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}