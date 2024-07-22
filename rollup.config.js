import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import terser from '@rollup/plugin-terser';

export default [
	// browser-friendly UMD build
	{
		input: 'src/main.js',
		output: {
			name: 'WebSerialReceiptPrinter',
			file: 'dist/webserial-receipt-printer.umd.js',
			sourcemap: true,
			format: 'umd'
		},
		plugins: [
			resolve(), 
			commonjs(),
            terser() 
		]
	},

	{
		input: 'src/main.js',
		output: { 
			file: 'dist/webserial-receipt-printer.esm.js', 
			sourcemap: true,
			format: 'es' 
		},
		plugins: [
			resolve(),
			commonjs(),
            terser()
		]
	}
];