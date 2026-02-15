import { defineConfig } from 'rolldown';

const libName = 'bench';

export default defineConfig(() => {
	return [
		// ['esm', 'js']
		['commonjs', 'js']
	].map(([format, fileExt]) => ({
		external: ['jstat', '@riim/event'],

		input: 'src/index.ts',

		output: {
			file: `dist/${libName}.${fileExt}`,
			format,
			name: libName
		}
	}));
});
