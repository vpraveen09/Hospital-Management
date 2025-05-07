import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import path from 'path'
import frappeui from 'frappe-ui/vite'

export default defineConfig({
	server: {
		watch: {
			ignored: ['**/node_modules/**', '**/dist/**'], // Ignore unnecessary files
		},
	},
	plugins: [
		frappeui(),
		vue({
			script: {
				propsDestructure: true,
			},
		}),
		vueJsx(),
		{
			name: 'transform-index.html',
			transformIndexHtml(html, context) {
				if (!context.server) {
					return html.replace(
						/<\/body>/,
						`
			  <script>
				  {% for key in boot %}
				  window["{{ key }}"] = {{ boot[key] | tojson }};
				  {% endfor %}
			  </script>
			  </body>
			  `
					)
				}
				return html
			},
		},
	],
	resolve: {
		alias: {
			'@': path.resolve(__dirname, 'src'),
		},
		extensions: ['.js', '.ts', '.vue', '.json'], // Include '.vue' in the list
	},
	build: {
		//   outDir: '../axe_product/public/frontend',
		outDir: path.resolve(__dirname, "../axe_product/public/frontend"),
		emptyOutDir: true,
		//   rollupOptions: {
		// 	input: path.resolve(__dirname, './public/index.html'), // Explicitly specify the input file
		//   },
		commonjsOptions: {
			include: [/tailwind.config.js/, /node_modules/],
		},
		sourcemap: false,
	},
	optimizeDeps: {
		include: [
			'feather-icons',
			'showdown',
			'tailwind.config.js',
			'engine.io-client',
			'prosemirror-state',
			'dayjs',
			'dayjs/plugin/advancedFormat'
		],
	},
})
