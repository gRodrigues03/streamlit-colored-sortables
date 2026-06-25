import react from "@vitejs/plugin-react-swc";
import {defineConfig} from "vite";

export default defineConfig({
  plugins: [react()],
  define: {
    "process.env.NODE_ENV": '"production"',
  },
  build: {
    outDir: "dist",
    target: "chrome109",
    sourcemap: false,
    minify: "terser",
    lib: {
      entry: "./src/index.tsx",
      formats: ["es"],
      fileName: "index16",
    },
    rollupOptions: {
      external: ['react', 'react-dom', 'react-dom/client', 'react/jsx-runtime']
    }
  },
});