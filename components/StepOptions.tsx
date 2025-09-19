'use client';

import { Step, Option as OptionType } from '@/types/problem';
import { renderTemplate, highlightKeywords } from '@/lib/utils';
import { useState, useEffect } from 'react';

interface StepOptionsProps {
  step: Step;
  vars: Record<string, number>;
  onOptionSelect: (selectedIds: Set<string>) => void;
  disabled?: boolean;
  selectedOptions?: Set<string>;
}

export default function StepOptions({
  step,
  vars,
  onOptionSelect,
  disabled = false,
  selectedOptions,
}: StepOptionsProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(selectedOptions || new Set());
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // 当外部selectedOptions变化时，更新内部状态
  useEffect(() => {
    if (selectedOptions) {
      setSelectedIds(selectedOptions);
    }
  }, [selectedOptions]);

  const handleOptionClick = (option: OptionType) => {
    if (disabled) return;

    const newSelected = new Set(selectedIds);

    if (step.multipleSelect) {
      if (newSelected.has(option.id)) {
        newSelected.delete(option.id);
      } else {
        newSelected.add(option.id);
      }
    } else {
      // 单选：清除之前的选择
      newSelected.clear();
      newSelected.add(option.id);
    }

    setSelectedIds(newSelected);
    onOptionSelect(newSelected);
  };

  return (
    <div className="space-y-2 sm:space-y-3">
      {step.options.map((option, index) => {
        const isSelected = selectedIds.has(option.id);
        const isHovered = hoveredId === option.id;

        return (
          <div
            key={option.id}
            data-id={option.id}
            className={`
              relative border rounded-lg sm:rounded-xl p-3 sm:p-4 cursor-pointer transition-all duration-300 ease-out
              transform hover:scale-[1.01] sm:hover:scale-[1.02] hover:shadow-md
              ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
              ${isSelected
                ? 'border-blue-500 bg-gradient-to-r from-blue-50 to-blue-100 shadow-sm'
                : isHovered && !disabled
                  ? 'border-blue-300 bg-blue-50/50'
                  : 'border-gray-200 bg-white hover:border-blue-300'
              }
              ${step.multipleSelect && isSelected ? 'ring-2 ring-blue-200/50' : ''}
            `}
            onClick={() => handleOptionClick(option)}
            onMouseEnter={() => !disabled && setHoveredId(option.id)}
            onMouseLeave={() => setHoveredId(null)}
            style={{
              transitionDelay: isSelected ? '0ms' : `${index * 50}ms`,
              animation: 'fadeInUp 0.5s ease-out',
              animationDelay: `${index * 100}ms`,
              animationFillMode: 'both'
            }}
          >
            {/* 选项标识符 */}
            <div className="absolute top-3 sm:top-4 left-3 sm:left-4 text-xs sm:text-sm font-medium text-gray-500">
              {String.fromCharCode(65 + index)}
            </div>

            <div className="flex items-start gap-3 sm:gap-4 ml-6 sm:ml-8">
              {/* 选择框 */}
              <div className={`
                flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 rounded border-2 flex items-center justify-center mt-0.5
                transition-all duration-200 ease-out
                ${isSelected
                  ? 'border-blue-500 bg-blue-500 text-white scale-110'
                  : isHovered && !disabled
                    ? 'border-blue-400 bg-blue-50'
                    : 'border-gray-300 bg-white'
                }
                ${step.multipleSelect ? 'rounded-md' : 'rounded-full'}
              `}>
                {isSelected && (
                  <div className="animate-scaleIn">
                    {step.multipleSelect ? (
                      <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="currentColor" viewBox="0 0 20 20">
                        <circle cx="10" cy="10" r="3" />
                      </svg>
                    )}
                  </div>
                )}
              </div>

              {/* 选项文本 */}
              <div className="flex-1 min-w-0">
                <div
                  className="text-gray-900 font-medium leading-relaxed text-sm sm:text-base"
                  dangerouslySetInnerHTML={{
                    __html: highlightKeywords(renderTemplate(option.text, vars))
                  }}
                />
              </div>
            </div>

            {/* 装饰性元素 */}
            {isSelected && (
              <div className="absolute -top-1 -right-1 w-6 h-6 sm:w-8 sm:h-8 bg-blue-500 rounded-full flex items-center justify-center animate-pulse">
                <svg className="w-3 h-3 sm:w-4 sm:h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}