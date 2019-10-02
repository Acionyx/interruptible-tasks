import pkg from "./package.json";
import { terser } from "rollup-plugin-terser";
import babel from "rollup-plugin-babel";

const output = [
  {
    file: pkg.main.replace(".es5.", `.${process.env.BABEL_ENV}.`),
    format: "cjs"
  }
];

if (process.env.BABEL_ENV === "es5") {
  output.push(
    ...[
      {
        file: pkg.module,
        format: "es" // the preferred format
      },
      {
        file: pkg.browser,
        format: "iife",
        name: "InterruptibleTasks" // the global which can be used in a browser
      }
    ]
  );
}

export default {
  input: "src/index.js",
  output,
  external: [...Object.keys(pkg.dependencies || {})],
  plugins: [
    babel({
      exclude: "node_modules/**"
    }),
    terser() // minifies generated bundles
  ]
};
