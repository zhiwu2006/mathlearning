# Math Learning System - 数学学习系统

[![Version](https://img.shields.io/badge/version-0.1.0-blue.svg)](https://github.com/zhiwu2006/mathlearning)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Tech Stack](https://img.shields.io/badge/tech-Next.js%20%7C%20React%20%7C%20TypeScript%20%7C%20Tailwind%20CSS-orange.svg)](https://github.com/zhiwu2006/mathlearning)

一个智能化的数学学习系统，提供分步引导式的问题解决体验，支持题型分类筛选和关键词高亮显示。

## 🌟 核心特性

### 🎯 智能题型分类
- **8种题型分类**：计算题、应用题、几何题、数列题、植树问题、竞赛题、数论题、逻辑题
- **自动分类系统**：基于题目概念和技能自动识别题型
- **筛选功能**：支持按题型筛选题目，专注特定类型练习

### 🔍 智能关键词高亮
- **20种关键词类型**：覆盖解题全流程的关键词汇
- **多场景应用**：题目描述、选项文本、反馈提示全面高亮
- **视觉效果**：渐变背景、阴影效果、色彩编码

### 📚 分步引导学习
- **结构化解题步骤**：读题 → 提取条件 → 明确问题 → 建立关系 → 制定计划 → 执行运算 → 检查校验
- **实时反馈**：即时验证答案，提供详细解释
- **进度追踪**：记录学习进度和成绩统计

### 🎨 现代化界面
- **响应式设计**：完美适配桌面和移动设备
- **流畅动画**：丰富的交互动画和过渡效果
- **直观操作**：简洁明了的用户界面

## 🚀 快速开始

### 环境要求
- Node.js 18.0+
- npm 或 yarn

### 安装步骤

1. **克隆项目**
   ```bash
   git clone https://github.com/zhiwu2006/mathlearning.git
   cd mathlearning
   ```

2. **安装依赖**
   ```bash
   npm install
   ```

3. **启动开发服务器**
   ```bash
   npm run dev
   ```

4. **访问应用**

   打开浏览器访问 [http://localhost:3000](http://localhost:3000)

### 构建生产版本

```bash
# 构建项目
npm run build

# 启动生产服务器
npm start
```

## 📋 项目结构

```
mathlearning/
├── app/                    # Next.js App Router
│   ├── globals.css        # 全局样式文件
│   ├── layout.tsx         # 应用布局
│   └── page.tsx          # 主页面
├── components/            # React 组件
│   ├── StemPanel.tsx     # 题目显示面板
│   ├── StepOptions.tsx   # 选项选择组件
│   ├── FeedbackPanel.tsx # 反馈面板
│   ├── MathTrainer.tsx   # 主训练器组件
│   ├── ProblemSelector.tsx # 题目选择器
│   ├── ProblemTypeFilter.tsx # 题型筛选器
│   └── ...              # 其他组件
├── lib/                  # 工具库
│   ├── utils.ts          # 工具函数
│   ├── problemTypes.ts   # 题型分类系统
│   └── ...              # 其他库文件
├── types/               # TypeScript 类型定义
│   └── problem.ts       # 题目相关类型
├── data/               # 数据文件
│   └── problems.json    # 题目数据
├── public/             # 静态资源
├── package.json        # 项目配置
├── next.config.mjs     # Next.js 配置
├── tailwind.config.ts  # Tailwind CSS 配置
└── tsconfig.json       # TypeScript 配置
```

## 🎯 核心功能详解

### 题型分类系统

系统支持8种数学题型，每种都有独特的图标和颜色标识：

| 题型 | 图标 | 颜色 | 描述 |
|------|------|------|------|
| 计算题 | 🔢 | 蓝色 | 基础四则运算、复杂计算 |
| 应用题 | 📝 | 绿色 | 实际生活中的数学应用 |
| 几何题 | 📐 | 紫色 | 图形、面积、周长计算 |
| 数列题 | 📊 | 橙色 | 等差数列、规律探索 |
| 植树问题 | 🌳 | 翠绿 | 点与段的关系、间隔问题 |
| 竞赛题 | 🏆 | 红色 | 数学竞赛、奥数题 |
| 数论题 | 🔢 | 靛蓝 | 整除、余数、质数相关 |
| 逻辑题 | 🧠 | 粉色 | 逻辑推理、思维训练 |

### 关键词高亮系统

系统自动识别并高亮20种关键词类型，帮助用户快速理解题目结构：

| 关键词类型 | 样式 | 应用场景 |
|------------|------|----------|
| 已知条件 | 🔵 蓝色渐变 | 题目给定的已知信息 |
| 直接条件 | 🟢 绿色渐变 | 明确直接的条件 |
| 间接条件 | 🟠 橙色渐变 | 需要推理的条件 |
| 隐藏条件 | 🟣 紫色渐变 | 隐含的条件 |
| 问题/要求 | 🔴 红色渐变 | 题目要求解决的内容 |
| 解题思路 | 🔵 青色渐变 | 解题方法指导 |
| 步骤 | 🟢 绿色渐变 | 解题步骤标识 |
| 因为/由于 | 🔵 靛蓝渐变 | 原因说明 |
| 所以/因此 | 🟢 青绿渐变 | 结论引导 |
| 验证/检验 | 🔵 青色渐变 | 验证过程 |

## 💡 使用指南

### 基本操作流程

1. **选择题目**
   - 点击"选择题目"按钮浏览所有题目
   - 使用题型筛选器专注特定类型
   - 点击题目卡片开始练习

2. **解题过程**
   - 仔细阅读题目（关键词已高亮显示）
   - 按照步骤提示选择正确选项
   - 查看即时反馈和解释

3. **进度管理**
   - 系统自动记录完成状态
   - 查看学习统计和成绩
   - 支持重做和复习

### 高级功能

- **题型筛选**：点击筛选按钮选择特定题型
- **题目导入**：支持导入自定义题目
- **题目编辑**：内置题目编辑器
- **数据管理**：完整的CRUD操作

## 🛠️ 技术栈

- **前端框架**：Next.js 14.2.5 (App Router)
- **UI库**：React 18 + TypeScript
- **样式框架**：Tailwind CSS 3.4.1
- **构建工具**：Next.js 内置 Webpack
- **开发工具**：ESLint + Prettier

## 📦 开发命令

```bash
# 开发服务器
npm run dev

# 构建生产版本
npm run build

# 启动生产服务器
npm start

# 代码检查
npm run lint

# 类型检查
npx tsc --noEmit
```

## 🔧 配置说明

### 环境变量
项目支持以下环境变量（可选）：

```env
# 应用配置
NEXT_PUBLIC_APP_NAME=Math Learning System
NEXT_PUBLIC_APP_VERSION=0.1.0

# 开发配置
NEXT_PUBLIC_DEV_MODE=true
```

### 自定义配置
- `tailwind.config.ts`：自定义Tailwind CSS配置
- `next.config.mjs`：Next.js特定配置
- `tsconfig.json`：TypeScript编译选项

## 📊 数据格式

### 题目数据结构
```typescript
interface ProblemSet {
  metadata: {
    gradeBand: string;
    subject: string;
    version: string;
  };
  items: Item[];
}

interface Item {
  id: string;
  stem: {
    text: string;
    variables?: Record<string, VariableSpec>;
  };
  steps: Step[];
  taxonomy: {
    concepts: string[];
    skills: string[];
  };
}
```

## 🤝 贡献指南

我们欢迎所有形式的贡献！请按照以下步骤：

1. **Fork项目**
2. **创建特性分支** (`git checkout -b feature/AmazingFeature`)
3. **提交更改** (`git commit -m 'Add some AmazingFeature'`)
4. **推送分支** (`git push origin feature/AmazingFeature`)
5. **创建Pull Request**

### 开发规范
- 使用TypeScript进行类型安全开发
- 遵循ESLint代码规范
- 编写清晰的组件和函数注释
- 确保所有功能都有相应的测试

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🙏 致谢

感谢所有为这个项目做出贡献的开发者和教育工作者。

## 📞 联系我们

- **项目地址**：[https://github.com/zhiwu2006/mathlearning](https://github.com/zhiwu2006/mathlearning)
- **问题反馈**：[GitHub Issues](https://github.com/zhiwu2006/mathlearning/issues)
- **功能建议**：[GitHub Discussions](https://github.com/zhiwu2006/mathlearning/discussions)

## 🎯 路线图

### v0.2 (计划中)
- [ ] 用户认证系统
- [ ] 学习进度云同步
- [ ] 更多数学题型支持
- [ ] 移动端应用

### v0.3 (长期计划)
- [ ] AI智能解题助手
- [ ] 个性化学习路径
- [ ] 多语言支持
- [ ] 离线模式

---

**开始你的数学学习之旅吧！** 🚀📚✨