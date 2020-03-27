const path = require('path')

module.exports = {
	entry: './src/index.js',
/*	entry: {
		index: './src/index.js'
	},*/
	output: {
		path: path.resolve(__dirname, 'dist'),
		filename: 'bundle.js'
	},
	mode: 'development',
	module: {
		// 配置rule.enforce可以修改顺序，顺序为pre > inline > normal > post
		rules: [
			// {
			// 	test: /\.js$/,
			// 	use: ['./loaders/loader.js', './loaders/loader2.js'], 
			// },
			{
				test: /\.js$/,
				use: './loaders/loader.js', 
				enforce: 'pre'
			},
			{
				test: /\.js$/,
				use: './loaders/loader2.js'
			}
		]
	}
}