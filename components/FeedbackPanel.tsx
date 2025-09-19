'use client';

import { highlightKeywords } from '@/lib/utils';

interface FeedbackPanelProps {
  isVisible: boolean;
  isCorrect?: boolean;
  message: string;
  type?: 'feedback' | 'hint';
  countdown?: number;
}

export default function FeedbackPanel({
  isVisible,
  isCorrect,
  message,
  type = 'feedback',
  countdown = 0,
}: FeedbackPanelProps) {
  if (!isVisible) return null;

  const baseClasses = "mt-4 p-4 rounded-lg border relative overflow-hidden";

  const typeClasses = {
    feedback: isCorrect
      ? "border-green-200 bg-gradient-to-r from-green-50 to-green-100 text-green-800"
      : "border-red-200 bg-gradient-to-r from-red-50 to-red-100 text-red-800",
    hint: "border-amber-200 bg-gradient-to-r from-amber-50 to-amber-100 text-amber-800 border-l-4 border-l-amber-400",
  };

  const icon = {
    feedback: isCorrect ? (
      <div className="animate-scaleIn">
        <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
      </div>
    ) : (
      <div className="animate-bounce-subtle">
        <svg className="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
        </svg>
      </div>
    ),
    hint: (
      <div className="animate-pulse-slow">
        <svg className="w-6 h-6 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
        </svg>
      </div>
    ),
  };

  return (
    <div className={`${baseClasses} ${typeClasses[type]} animate-slide-in`}>
      {/* 装饰性背景 */}
      <div className={`absolute inset-0 opacity-10 ${
        isCorrect ? 'bg-green-500' : type === 'hint' ? 'bg-amber-500' : 'bg-red-500'
      }`} />

      <div className="relative flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          {icon[type]}
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div className="text-base font-semibold">
              {type === 'hint' ? '💡 提示' : (isCorrect ? '🎉 正确！' : '🤔 再想想')}
            </div>
            {countdown > 0 && (
              <div className="flex items-center gap-2 text-sm">
                <div className="animate-pulse text-green-600">⏱️</div>
                <span className="font-mono bg-green-100 text-green-800 px-2 py-1 rounded">
                  {countdown}s
                </span>
              </div>
            )}
          </div>
          <div
            className="text-sm mt-1 leading-relaxed"
            dangerouslySetInnerHTML={{
              __html: message.split('\n').map((line, index) =>
                highlightKeywords(line) + (index < message.split('\n').length - 1 ? '<br />' : '')
              ).join('')
            }}
          />
        </div>

        {/* 装饰性元素 */}
        {type === 'feedback' && isCorrect && (
          <div className="absolute -top-2 -right-2 flex gap-1">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
          </div>
        )}
      </div>
    </div>
  );
}