// .eslint.config.js（ESLint v9+ 扁平配置，修正 react-refresh 重复注册问题）
import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";
import prettierPlugin from "eslint-plugin-prettier";
import prettierConfig from "eslint-config-prettier";
import reactPlugin from "eslint-plugin-react"; // 导入 react 插件

export default [
  // 全局忽略配置
  { ignores: ["dist/", "build/", "node_modules/"] },
  // 基础配置：reactRefresh.configs.vite 已自动注册 react-refresh 插件，无需手动再注册
  js.configs.recommended,
  ...tseslint.configs.recommended,
  reactHooks.configs["recommended-latest"],
  reactRefresh.configs.vite, // 该预设内部已注册 react-refresh 插件
  prettierConfig,
  // 项目核心配置
  {
    files: ["**/*.{ts,tsx}"],
    plugins: {
      "@typescript-eslint": tseslint.plugin,
      "prettier": prettierPlugin,
      "react": reactPlugin, // 仅保留无重复的插件注册
      // 关键：删除下面这行重复注册的 react-refresh，解决报错
      // "react-refresh": reactRefresh,
    },
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parser: tseslint.parser,
      parserOptions: {
        ecmaFeatures: {
          jsx: true // 启用 JSX 解析
        }
      }
    },
    rules: {
      // 保留你的所有有效原有规则
      "@typescript-eslint/no-unused-vars": "warn",
      "prettier/prettier": "error",
      "react-refresh/only-export-components": "warn",
      "quotes": "off",
      "@typescript-eslint/quotes": "off",

      "react/jsx-wrap-multilines": [
        "error",
        {
          "declaration": "parens-new-line",
          "assignment": "parens-new-line",
          "return": "parens-new-line",
          "arrow": "parens-new-line",
          "condition": "parens-new-line",
          "logical": "parens-new-line",
          "prop": "parens-new-line"
        }
      ],
      "react/jsx-indent": ["error", 2, { "indentLogicalExpressions": true }],
      "react/jsx-indent-props": ["error", 2],
    }
  }
];