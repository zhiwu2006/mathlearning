'use client';

interface ControlButtonsProps {
  onShowHint: () => void;
  onConfirm: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onReset: () => void;
  hasNext: boolean;
  hasPrevious: boolean;
  confirmDisabled: boolean;
  showHintButton: boolean;
  showNextButton: boolean;
}

export default function ControlButtons({
  onShowHint,
  onConfirm,
  onNext,
  onPrevious,
  onReset,
  hasNext,
  hasPrevious,
  confirmDisabled,
  showHintButton,
  showNextButton,
}: ControlButtonsProps) {
  return (
    <div className="flex flex-wrap gap-3 mt-6">
      {/* 提示按钮 */}
      {showHintButton && (
        <button
          onClick={onShowHint}
          disabled={confirmDisabled}
          className={`
            px-4 py-2 rounded-lg border text-sm font-medium transition-colors
            ${confirmDisabled
              ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
              : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
            }
          `}
        >
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            需要提示
          </div>
        </button>
      )}

      {/* 确认按钮 */}
      <button
        onClick={onConfirm}
        disabled={confirmDisabled}
        className={`
          px-4 py-2 rounded-lg border text-sm font-medium transition-colors
          ${confirmDisabled
            ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
            : 'bg-blue-500 text-white border-blue-500 hover:bg-blue-600'
          }
        `}
      >
        确认
      </button>

      {/* 下一步按钮 */}
      {showNextButton && (
        <button
          onClick={onNext}
          className="px-4 py-2 rounded-lg bg-green-500 text-white border border-green-500 text-sm font-medium hover:bg-green-600 transition-colors"
        >
          下一步 →
        </button>
      )}

      {/* 上一步按钮 */}
      {hasPrevious && (
        <button
          onClick={onPrevious}
          className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 border border-gray-200 text-sm font-medium hover:bg-gray-200 transition-colors"
        >
          ← 上一步
        </button>
      )}

      {/* 重置按钮 */}
      <button
        onClick={(e) => {
          console.log('重做本题按钮被点击了 - ControlButtons');
          e.preventDefault();
          e.stopPropagation();
          onReset();
        }}
        className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 border border-gray-200 text-sm font-medium hover:bg-gray-200 transition-colors relative z-50 cursor-pointer"
        style={{ position: 'relative', pointerEvents: 'auto' }}
        type="button"
      >
        重试此步
      </button>
    </div>
  );
}