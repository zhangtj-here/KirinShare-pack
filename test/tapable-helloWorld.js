// const tapable = require('tapable')
const { SyncHook } = require('tapable')

// 流程： 

class Frontend {
	// 定义好钩子（定义生命周期）
	constructor() {
		// 如果相传参数，则需要在定义的时候，传递参数进去
		this.hooks = {
			beforeStudy: new SyncHook(),
			afterHtml: new SyncHook(['name']),
			afterCss: new SyncHook(),
		}
	}

	study() {
		console.log("同学们好，开班了")
		this.hooks.beforeStudy.call()
		console.log("同学们好，学习html")
		this.hooks.afterHtml.call('lili')
		console.log("同学们好，学习css")
		this.hooks.afterCss.call()
 	}
}

let f = new Frontend()
f.hooks.afterHtml.tap('afterHtml', (name) => {
	console.log(name + '学完html,我想造淘宝')
})
f.study()