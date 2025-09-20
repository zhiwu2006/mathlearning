/**
 * 学习进度管理模块
 */

export interface LearningProgress {
  problemId: string;
  status: 'unlearned' | 'learned' | 'familiar' | 'unfamiliar';
  retryCount: number;
  firstAccessed?: Date;
  lastAccessed?: Date;
  timeSpent: number; // 学习时间（秒）
  correctCount: number; // 答对次数
  incorrectCount: number; // 答错次数
}

export interface LearningStats {
  totalProblems: number;
  unlearnedCount: number;
  learnedCount: number;
  familiarCount: number;
  unfamiliarCount: number;
  completionRate: number; // 完成率
  averageRetryCount: number; // 平均重做次数
  totalStudyTime: number; // 总学习时间
}

// 题目优先级类型
export type ProblemPriority = 'high' | 'medium' | 'low';

/**
 * 学习状态管理类
 */
export class LearningProgressManager {
  private progress: Map<string, LearningProgress> = new Map();
  private storageKey = 'math-learning-progress';

  constructor() {
    // 只在客户端环境中加载本地存储
    if (typeof window !== 'undefined') {
      this.loadFromStorage();
    }
  }

  /**
   * 从本地存储加载进度数据
   */
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const data = JSON.parse(stored);
        this.progress = new Map(data);
      }
    } catch (error) {
      console.error('Failed to load learning progress:', error);
    }
  }

  /**
   * 保存进度数据到本地存储
   */
  private saveToStorage(): void {
    // 只在客户端环境中保存到本地存储
    if (typeof window === 'undefined') return;

    try {
      const data = Array.from(this.progress.entries());
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save learning progress:', error);
    }
  }

  /**
   * 获取题目的学习进度
   */
  getProgress(problemId: string): LearningProgress {
    if (!this.progress.has(problemId)) {
      const newProgress: LearningProgress = {
        problemId,
        status: 'unlearned',
        retryCount: 0,
        timeSpent: 0,
        correctCount: 0,
        incorrectCount: 0,
      };
      this.progress.set(problemId, newProgress);
      this.saveToStorage();
      return newProgress;
    }
    return this.progress.get(problemId)!;
  }

  /**
   * 更新题目访问记录
   */
  updateAccess(problemId: string): void {
    const progress = this.getProgress(problemId);
    const now = new Date();

    if (!progress.firstAccessed) {
      progress.firstAccessed = now;
    }

    // 计算时间间隔（简单实现）
    if (progress.lastAccessed) {
      const timeDiff = (now.getTime() - progress.lastAccessed.getTime()) / 1000;
      progress.timeSpent += Math.min(timeDiff, 300); // 最多5分钟
    }

    progress.lastAccessed = now;
    this.saveToStorage();
  }

  /**
   * 增加重做次数
   */
  incrementRetry(problemId: string): void {
    const progress = this.getProgress(problemId);
    progress.retryCount += 1;

    // 如果重做次数超过2次，标记为不熟悉
    if (progress.retryCount >= 2) {
      progress.status = 'unfamiliar';
    }

    this.saveToStorage();
  }

  /**
   * 更新答题结果
   */
  updateAnswerResult(problemId: string, isCorrect: boolean): void {
    const progress = this.getProgress(problemId);

    if (isCorrect) {
      progress.correctCount += 1;
      // 如果之前是未学习，现在标记为已学习
      if (progress.status === 'unlearned') {
        progress.status = 'learned';
      }
      // 如果答对次数足够多，标记为熟悉
      if (progress.correctCount >= 2 && progress.status !== 'familiar') {
        progress.status = 'familiar';
      }
    } else {
      progress.incorrectCount += 1;
      // 答错时可能降低熟悉度
      if (progress.status === 'familiar') {
        progress.status = 'learned';
      }
    }

    this.saveToStorage();
  }

  /**
   * 计算题目优先级
   */
  getProblemPriority(problemId: string): ProblemPriority {
    const progress = this.getProgress(problemId);

    // 不熟悉的题目最高优先级
    if (progress.status === 'unfamiliar') {
      return 'high';
    }

    // 未学习的题目中等优先级
    if (progress.status === 'unlearned') {
      return 'medium';
    }

    // 已学习的题目根据错误率调整优先级
    const totalAttempts = progress.correctCount + progress.incorrectCount;
    if (totalAttempts > 0) {
      const errorRate = progress.incorrectCount / totalAttempts;
      if (errorRate > 0.3) return 'medium'; // 错误率高于30%提升优先级
    }

    return 'low';
  }

  /**
   * 获取学习统计信息
   */
  getLearningStats(problemIds: string[]): LearningStats {
    const stats: LearningStats = {
      totalProblems: problemIds.length,
      unlearnedCount: 0,
      learnedCount: 0,
      familiarCount: 0,
      unfamiliarCount: 0,
      completionRate: 0,
      averageRetryCount: 0,
      totalStudyTime: 0,
    };

    let totalRetries = 0;
    let totalStudyTime = 0;

    problemIds.forEach(id => {
      const progress = this.getProgress(id);

      switch (progress.status) {
        case 'unlearned':
          stats.unlearnedCount += 1;
          break;
        case 'learned':
          stats.learnedCount += 1;
          break;
        case 'familiar':
          stats.familiarCount += 1;
          break;
        case 'unfamiliar':
          stats.unfamiliarCount += 1;
          break;
      }

      totalRetries += progress.retryCount;
      totalStudyTime += progress.timeSpent;
    });

    stats.completionRate = ((stats.totalProblems - stats.unlearnedCount) / stats.totalProblems) * 100;
    stats.averageRetryCount = stats.totalProblems > 0 ? totalRetries / stats.totalProblems : 0;
    stats.totalStudyTime = totalStudyTime;

    return stats;
  }

  /**
   * 按优先级排序题目索引
   */
  getPrioritizedProblemIndices(problemIds: string[]): number[] {
    const problemsWithPriority = problemIds.map((id, index) => ({
      index,
      id,
      priority: this.getProblemPriority(id),
      retryCount: this.getProgress(id).retryCount,
      status: this.getProgress(id).status,
    }));

    // 按优先级排序，相同优先级按重做次数排序
    problemsWithPriority.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];

      if (priorityDiff !== 0) {
        return priorityDiff;
      }

      // 相同优先级，重做次数多的优先
      return b.retryCount - a.retryCount;
    });

    return problemsWithPriority.map(p => p.index);
  }

  /**
   * 重置学习进度
   */
  resetProgress(problemId?: string): void {
    if (problemId) {
      // 重置单个题目
      this.progress.delete(problemId);
    } else {
      // 重置所有进度
      this.progress.clear();
    }
    this.saveToStorage();
  }

  /**
   * 导出学习进度数据
   */
  exportProgress(): string {
    return JSON.stringify(Array.from(this.progress.entries()), null, 2);
  }

  /**
   * 导入学习进度数据
   */
  importProgress(data: string): boolean {
    try {
      const parsed = JSON.parse(data);
      this.progress = new Map(parsed);
      this.saveToStorage();
      return true;
    } catch (error) {
      console.error('Failed to import learning progress:', error);
      return false;
    }
  }
}

// 创建全局实例
export const learningProgressManager = new LearningProgressManager();