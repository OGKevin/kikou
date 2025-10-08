import { FlatCompat } from "@eslint/eslintrc";
import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import pluginReact from "eslint-plugin-react";
import type { Linter } from "eslint";

const compat = new FlatCompat({
  baseDirectory: import.meta.dirname,
});

const eslintConfig: Linter.Config[] = [
  {
    files: ["src/**/*.{js,ts,jsx,tsx}"],
    ignores: ["**/__tests__/**", "**/*.test.{js,ts,jsx,tsx}"],
    languageOptions: {
      globals: globals.browser,
    },
    ...js.configs.recommended,
  },
  ...tseslint.configs.recommended,
  pluginReact.configs.flat.recommended,
  ...compat.config({
    extends: ["next"],
    settings: {
      next: {
        rootDir: "src/",
      },
    },
    rules: {
      "no-else-return": "error",
      "padding-line-between-statements": [
        "error",
        { blankLine: "always", prev: ["const", "let", "var"], next: "*" },
        {
          blankLine: "always",
          prev: "*",
          next: ["if", "for", "while", "switch", "try"],
        },
        {
          blankLine: "always",
          prev: ["if", "for", "while", "switch", "try"],
          next: "*",
        },
        {
          blankLine: "any",
          prev: ["const", "let", "var"],
          next: ["const", "let", "var"],
        },
      ],
      "@next/next/no-img-element": "off",
    },
  }),
].map((config) => ({
  ...config,
  files: (config as any).files || ["src/**/*.{js,ts,jsx,tsx}"],
  ignores: (config as any).ignores || [
    "**/__tests__/**",
    "**/*.test.{js,ts,jsx,tsx}",
  ],
}));

export default eslintConfig;
