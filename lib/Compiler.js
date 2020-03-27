const path = require('path')
const fs = require('fs')
const parser = require('@babel/parser')
const traverse = require('@babel/traverse').default
const generator = require('@babel/generator').default

class Compiler {
	constructor(config) {
		// console.log(config)
		this.config = config
		this.entry = config.entry
		// 获取端口路径
		this.root = process.cwd()
		// 初始化一个空对象，用来存放所有的模块
		this.modules = {}
	}

	getSource(path) {
		return fs.readFileSync(path, 'utf-8')
	}

	depAnalyse(modulePath) {
		let self = this
		let source = this.getSource(modulePath)
		// 将读取到的代码生成抽象语法树
		let ast = parser.parse(source)
		let dependencies = []
		// 将抽象语法树中对应的内容替换
		traverse(ast, {
			CallExpression(p) {
				// console.log(p.node.callee.name)
				if (p.node.callee.name === 'require') {
					// 修改require
					p.node.callee.name = "__webpack_require__"
					// 修改路径
					let oldPath = p.node.arguments[0].value
					oldPath = './' + path.join('./src', oldPath)
					// 避免windows出行反斜杠\
					p.node.arguments[0].value = oldPath.replace(/\\+/g, '/')
					// console.log(p.node.arguments[0].value)
					// 将改文件的所有依赖添加到dependencies中
					dependencies.push(p.node.arguments[0].value)
					// 递归调用所有依赖
					// self.depAnalyse(path.resolve(self.root,p.node.arguments[0].value))
				}
			}
		})
		// 将替换好的抽象语法树转变回代码
		let sourceCode = generator(ast).code


		let modulePathRelative = path.relative(this.root, modulePath)
		modulePathRelative = './' + modulePathRelative.replace(/\\+/g, '/')
		this.modules[modulePathRelative] = sourceCode 
		// console.log(sourceCode)
		// console.log(ast.program.body)
		// 递归加载所有依赖
		dependencies.forEach(dep => this.depAnalyse(path.resolve(this.root, dep)))
	}

	start() {
		// 开始打包了！

		// 依赖的分析
		// __dirname 表示的是执行的js所在的目录，而非入口文件所在的目录
		this.depAnalyse(path.resolve(this.root,this.entry))
		console.log(this.modules)
	}
}


module.exports = Compiler