import js from "@eslint/js"
import typescript from "@typescript-eslint/eslint-plugin"
import typescriptParser from "@typescript-eslint/parser"
import * as globals from "globals"

export default [
  js.configs.recommended,
  {
    files: ["**/*.ts", "**/*.tsx", "**/*.js", "**/*.jsx"],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        project: "./tsconfig.json",
      },
      globals: {
        HTMLRewriter: "readonly",
        onmessage: "readonly",
        postMessage: "readonly",
        NEOCODE_WORKER_PATH: "readonly",
        ResolveMessage: "readonly",
        NEOCODE_VERSION: "readonly",
        NEOCODE_CHANNEL: "readonly",
        crypto: "readonly",
        btoa: "readonly",
        fetch: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        setInterval: "readonly",
        clearInterval: "readonly",
        console: "readonly",
        queueMicrotask: "readonly",
      },
    },
    plugins: {
      "@typescript-eslint": typescript,
    },
    rules: {
      ...typescript.configs.recommended.rules,
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-namespace": "off",
      "@typescript-eslint/ban-ts-comment": "off",
      "@typescript-eslint/no-empty-object-type": "off",
      "@typescript-eslint/no-this-alias": "off",
      "@typescript-eslint/no-require-imports": "off",
      "@typescript-eslint/no-unused-expressions": "off",
      "no-console": "off",
      "prefer-const": "off",
      "no-var": "error",
      "no-empty": "off",
      "no-case-declarations": "off",
      "no-constant-condition": "off",
      "no-useless-escape": "off",
      "no-redeclare": "off",
      "no-fallthrough": "off",
      "no-global-assign": "off",
      "no-control-regex": "off",
      "no-async-promise-executor": "off",
    },
  },
  {
    files: ["**/*.cjs", "**/*.cts"],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.bun,
        Bun: "readonly",
        Buffer: "readonly",
        process: "readonly",
        require: "readonly",
        setImmediate: "readonly",
        NodeJS: "readonly",
        BunFetchRequestInit: "readonly",
        Timer: "readonly",
      },
    },
  },
  {
    files: ["**/*.test.ts", "**/*.test.tsx"],
    rules: {
      "no-console": "off",
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
  {
    ignores: ["node_modules/**", "dist/**", "build/**", "coverage/**", "*.lock"],
  },
]
