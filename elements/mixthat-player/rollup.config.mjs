import resolve from '@rollup/plugin-node-resolve';
import { terser } from 'rollup-plugin-terser';
import filesize from 'rollup-plugin-filesize';
import minifyHTML from 'rollup-plugin-minify-html-literals';
import license from 'rollup-plugin-license';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const licenseConfig = {
  sourcemap: true,
  cwd: process.cwd(), // The default

  banner: {
    commentStyle: 'regular', // The default

    content: {
      file: join(__dirname, 'COPYRIGHT'),
      encoding: 'utf-8', // Default is utf-8
    },
  },

  thirdParty: {
    includePrivate: true, // Default is false.
    // multipleVersions: true, // Default is false.
    output: {
      file: join(__dirname, 'dist', 'dependencies.txt'),
      encoding: 'utf-8', // Default is utf-8.
    },
  },
};

export default [
  // {
  //   input: 'mixthat-player.js',
  //   watch: {
  //     include: 'src/**',
  //   },
  //   output: [
  //     {
  //       file: 'dist/mixthat-player.js',
  //       format: 'es',
  //       sourcemap: true,
  //     },
  //   ],
  //   external: ['lit'],
  //   preserveSymlinks: true,
  //   plugins: [
  //     resolve(),
  //     minifyHTML.default(),
  //     filesize({
  //       showGzippedSize: true,
  //       showBrotliSize: false,
  //       showMinifiedSize: false,
  //     }),
  //     ...(process.env.NODE_ENV !== 'development'
  //       ? [
  //           terser({
  //             // ecma: 2020,
  //             // module: true,
  //             warnings: true,
  //           }),
  //         ]
  //       : []),
  //     license(licenseConfig),
  //   ],
  //   preserveEntrySignatures: 'strict',
  // },

  {
    input: 'entry.js',
    watch: {
      include: 'src/**',
    },
    output: [
      {
        file: 'dist/element.js',
        format: 'es',
        sourcemap: true,
      },
    ],
    preserveSymlinks: true,
    plugins: [
      resolve(),
      minifyHTML.default(),
      filesize({
        showGzippedSize: true,
        showBrotliSize: false,
        showMinifiedSize: false,
      }),
      ...(process.env.NODE_ENV !== 'development'
        ? [
            terser({
              // ecma: 2020,
              // module: true,
              warnings: true,
            }),
          ]
        : []),
      license(licenseConfig),
    ],
    preserveEntrySignatures: 'strict',
  },
];
