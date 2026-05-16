export default {
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  dts: true,
  clean: true,
  outDir: "dist",
  platform: "neutral",
  target: "es2022",
  splitting: false,
  sourcemap: false,
};
