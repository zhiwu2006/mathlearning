'use client';

import React, { useState } from 'react';
import { ProblemType, PROBLEM_TYPES } from '@/lib/problemTypes';

interface ProblemTypeFilterProps {
  selectedTypes: string[];
  onTypeChange: (types: string[]) => void;
  showAll?: boolean;
}

export default function ProblemTypeFilter({
  selectedTypes,
  onTypeChange,
  showAll = true
}: ProblemTypeFilterProps) {
  const handleTypeToggle = (typeId: string) => {
    if (typeId === 'all') {
      // 如果选择"全部"，则清空其他选择
      onTypeChange([]);
    } else {
      const newSelected = selectedTypes.includes(typeId)
        ? selectedTypes.filter(t => t !== typeId)
        : [...selectedTypes.filter(t => t !== 'all'), typeId];

      // 如果选择了所有类型，则相当于选择"全部"
      if (newSelected.length === PROBLEM_TYPES.length) {
        onTypeChange([]);
      } else {
        onTypeChange(newSelected);
      }
    }
  };

  const isAllSelected = selectedTypes.length === 0 || selectedTypes.length === PROBLEM_TYPES.length;
  const isIndeterminate = selectedTypes.length > 0 && selectedTypes.length < PROBLEM_TYPES.length;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <svg className="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 0l-2 2a1 1 0 101.414 1.414L8 10.414l1.293 1.293a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          题型筛选
        </h3>
        <span className="text-sm text-gray-500">
          {selectedTypes.length === 0 ? '全部题型' : `已选 ${selectedTypes.length} 种题型`}
        </span>
      </div>

      <div className="space-y-3">
        {showAll && (
          <button
            onClick={() => handleTypeToggle('all')}
            className={`
              w-full flex items-center gap-3 p-3 rounded-lg border transition-all duration-200
              ${isAllSelected
                ? 'border-purple-500 bg-purple-50 shadow-sm'
                : 'border-gray-200 hover:border-purple-300 hover:bg-gray-50'
              }
            `}
          >
            <div className="flex items-center justify-center w-5 h-5 rounded border-2 border-gray-300">
              {isAllSelected && (
                <div className="w-3 h-3 rounded bg-purple-600"></div>
              )}
              {isIndeterminate && (
                <div className="w-3 h-0.5 bg-purple-600"></div>
              )}
            </div>
            <span className="font-medium text-gray-800">全部题型</span>
            <span className="text-sm text-gray-500 ml-auto">{PROBLEM_TYPES.length}种</span>
          </button>
        )}

        <div className="grid grid-cols-1 gap-2 max-h-96 overflow-y-auto">
          {PROBLEM_TYPES.map((type) => (
            <button
              key={type.id}
              onClick={() => handleTypeToggle(type.id)}
              className={`
                w-full flex items-center gap-3 p-3 rounded-lg border transition-all duration-200
                ${selectedTypes.includes(type.id)
                  ? 'border-purple-500 bg-purple-50 shadow-sm'
                  : 'border-gray-200 hover:border-purple-300 hover:bg-gray-50'
                }
              `}
            >
              <div className="flex items-center justify-center w-5 h-5 rounded border-2 border-gray-300">
                {selectedTypes.includes(type.id) && (
                  <div className="w-3 h-3 rounded bg-purple-600"></div>
                )}
              </div>
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className="text-lg">{type.icon}</span>
                <div className="text-left min-w-0">
                  <div className="font-medium text-gray-800 truncate">{type.name}</div>
                  <div className="text-xs text-gray-500 truncate">{type.description}</div>
                </div>
              </div>
              <div className={`
                px-2 py-1 rounded text-xs font-medium border
                ${type.color}
              `}>
                {type.name.charAt(0)}
              </div>
            </button>
          ))}
        </div>
      </div>

      {selectedTypes.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex flex-wrap gap-2">
            <span className="text-sm text-gray-500">已选题型:</span>
            {selectedTypes.map((typeId) => {
              const type = PROBLEM_TYPES.find(t => t.id === typeId);
              return (
                <span
                  key={typeId}
                  className={`
                    inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border
                    ${type?.color || 'bg-gray-100 text-gray-800 border-gray-200'}
                  `}
                >
                  {type?.icon} {type?.name}
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}