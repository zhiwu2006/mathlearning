/**
 * 题目数据管理模块
 * 负责题目的保存、加载和合并操作
 */

import { ProblemSet } from '@/types/problem';

const STORAGE_KEY = 'math-learning-problem-set';
const BACKUP_KEY = 'math-learning-problem-set-backup';

export class ProblemDataManager {
  /**
   * 保存题目数据到本地存储
   */
  static saveToStorage(problemSet: ProblemSet): void {
    if (typeof window === 'undefined') return;

    try {
      // 创建备份
      const currentData = localStorage.getItem(STORAGE_KEY);
      if (currentData) {
        localStorage.setItem(BACKUP_KEY, currentData);
      }

      // 保存新数据
      localStorage.setItem(STORAGE_KEY, JSON.stringify(problemSet));
      console.log('题目数据已保存到本地存储');
    } catch (error) {
      console.error('保存题目数据失败:', error);
    }
  }

  /**
   * 从本地存储加载题目数据
   */
  static loadFromStorage(): ProblemSet | null {
    if (typeof window === 'undefined') return null;

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        console.log('从本地存储加载题目数据成功');
        return data;
      }
    } catch (error) {
      console.error('从本地存储加载题目数据失败:', error);
    }

    return null;
  }

  /**
   * 从备份恢复数据
   */
  static restoreFromBackup(): ProblemSet | null {
    if (typeof window === 'undefined') return null;

    try {
      const backup = localStorage.getItem(BACKUP_KEY);
      if (backup) {
        const data = JSON.parse(backup);
        localStorage.setItem(STORAGE_KEY, backup);
        console.log('从备份恢复题目数据成功');
        return data;
      }
    } catch (error) {
      console.error('从备份恢复题目数据失败:', error);
    }

    return null;
  }

  /**
   * 合并两个题目集
   */
  static mergeProblemSets(original: ProblemSet, newSet: ProblemSet): ProblemSet {
    // 创建合并后的题目列表
    const existingIds = new Set(original.items.map(item => item.id));
    const newItems = newSet.items.filter(item => !existingIds.has(item.id));

    // 如果没有新题目，返回原来的 ProblemSet
    if (newItems.length === 0) {
      console.log('没有新的题目需要合并');
      return original;
    }

    // 合并 metadata 标签
    const mergedTags = Array.from(new Set([...original.metadata.tags, ...newSet.metadata.tags]));

    const mergedSet: ProblemSet = {
      ...original,
      metadata: {
        ...original.metadata,
        tags: mergedTags,
        // 更新时间戳
        createdAt: new Date().toISOString(),
      },
      items: [...original.items, ...newItems],
    };

    console.log(`成功合并 ${newItems.length} 道新题目，总题数: ${mergedSet.items.length}`);
    return mergedSet;
  }

  /**
   * 获取存储的题目统计信息
   */
  static getStorageStats(): { totalItems: number; tags: string[]; lastUpdated?: string } {
    if (typeof window === 'undefined') {
      return { totalItems: 0, tags: [] };
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        return {
          totalItems: data.items?.length || 0,
          tags: data.metadata?.tags || [],
          lastUpdated: data.metadata?.createdAt,
        };
      }
    } catch (error) {
      console.error('获取存储统计信息失败:', error);
    }

    return { totalItems: 0, tags: [] };
  }

  /**
   * 清除所有存储的题目数据
   */
  static clearStorage(): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(BACKUP_KEY);
      console.log('已清除所有题目数据');
    } catch (error) {
      console.error('清除题目数据失败:', error);
    }
  }

  /**
   * 导出题目数据
   */
  static exportData(): string {
    if (typeof window === 'undefined') return '';

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return stored;
      }
    } catch (error) {
      console.error('导出题目数据失败:', error);
    }

    return '';
  }

  /**
   * 导入题目数据
   */
  static importData(jsonData: string): boolean {
    if (typeof window === 'undefined') return false;

    try {
      const data = JSON.parse(jsonData);
      if (data.items && Array.isArray(data.items)) {
        localStorage.setItem(STORAGE_KEY, jsonData);
        console.log('导入题目数据成功');
        return true;
      }
    } catch (error) {
      console.error('导入题目数据失败:', error);
    }

    return false;
  }
}