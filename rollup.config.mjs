import typescript from 'rollup-plugin-typescript2';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import del from 'rollup-plugin-delete';
import copy from 'rollup-plugin-copy';

export default {
  input: 'src/index.ts', // 入口文件
  output: [
    {
      file: 'dist/main.js', // 打包输出的文件
      format: 'cjs', // 输出格式，可以是 'esm'、'cjs'、'iife' 等
      sourcemap: true, // 是否生成 sourcemap 文件
    },
  ],
  external: ['systeminformation', 'regedit', 'argparse', 'frida'], // 这里指定了要排除的模块
  plugins: [
    resolve(), // 用于解析第三方模块
    commonjs(), // 处理 CommonJS 模块
    typescript(), // TypeScript 编译插件
    del({ targets: 'dist/*' }),
    copy({
      targets: [
        {
          src: 'node_modules/regedit/vbs/**/*',
          dest: 'dist/vbs',
        },
      ],
    }),
  ],
};
