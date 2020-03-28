const path = require('path')
const fs = require('fs')
const parser = require('@babel/parser')
const traverse = require('@babel/traverse').default
const generator = require('@babel/generator').default
const ejs = require('ejs')

class Compiler {
	constructor(config) {
		// console.log(config)
		this.config = config
		this.entry = config.entry
		// 获取端口路径
		this.root = process.cwd()
		// 初始化一个空对象，用来存放所有的模块
		this.modules = {}
		this.rules = config.module.rules
	}

	getSource(path) {
		return fs.readFileSync(path, 'utf-8')
	}

	depAnalyse(modulePath) {
		let self = this
		let source = this.getSource(modulePath)

		let readAndCallLoader = (use, obj) => {
			let loaderPath = path.join(this.root, use)
			let loader = require(loaderPath)
			source = loader.call(obj, source)
		}

		// 读取rules规则,进行倒叙遍历
		for (let i = this.rules.length - 1; i >= 0; i--) {
			// console.log(this.rules[i])
			let {test, use} = this.rules[i]
			// 匹配modulePath是否匹配规则,如果符合规则，就要倒叙遍历获取所有的loader
			if (test.test(modulePath)) {

				if (Array.isArray(use)) {
					for (let j = use.length - 1; j >= 0; j--) {
						readAndCallLoader(use[j])
					}
				} else if (typeof use === 'string') {
					readAndCallLoader(use)
				} else if (use instanceof Object) {
					readAndCallLoader(use.loader, {query: use.options})
					// let loaderPath = path.join(this.root, use.loader)
					// let loader = require(loaderPath)
					// source = loader.call({query: use.options},source)
				}
			} 
		}


		// 获取每一条规则，与当前modulePath进行匹配


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

	emitFile() {
		// 使用模板渲染代码，根据this.entry构建的modules和\
		let template = this.getSource(path.resolve(__dirname, '../template/output.ejs'))
		let entry = this.entry
		let modules = this.modules
		let result = ejs.render(template, {
			entry,
			modules
		})
		// console.log(this.config.output.path)
		// 将构建好的模板生成到配置的指定路径的文件
		let outputPath = path.join(this.config.output.path, this.config.output.filename)
		fs.writeFileSync(outputPath, result) 
	}

	start() {
		// 开始打包了！

		// 依赖的分析
		// __dirname 表示的是执行的js所在的目录，而非入口文件所在的目录
		this.depAnalyse(path.resolve(this.root,this.entry))
		this.emitFile()
		// console.log(this.modules)
	}
}


module.exports = Compiler