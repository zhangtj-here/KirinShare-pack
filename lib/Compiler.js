const path = require('path')
const fs = require('fs')

class Compiler {
	constructor(config) {
		// console.log(config)
		this.config = config
		this.entry = config.entry
		// 获取端口路径
		this.root = process.cwd()
	}

	getSource(path) {
		return fs.readFileSync(path, 'utf-8')
	}

	depAnalyse(modulePath) {
		let source = this.getSource(modulePath)
		console.log(source)
	}

	start() {
		// 开始打包了！

		// 依赖的分析
		// __dirname 表示的是执行的js所在的目录，而非入口文件所在的目录
		this.depAnalyse(path.resolve(this.root,this.entry))
	}
}


module.exports = Compiler