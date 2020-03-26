## 这是一个打包工具
这是一个打包工具，类似于webpack微型版



# 第5章 webpack原理

## 学习目标

- 了解webpack打包原理
- 了解webpack的loader原理
- 了解webpack的插件原理
- 了解ast抽象语法树的应用
- 了解tapable的原理
- 手写一个简单的webpack

## 项目准备工作

1. 新建一个项目，起一个炫酷的名字

2. 新建`bin`目录，将打包工具主程序放入其中

   主程序的顶部应当有：`#!/usr/bin/env node`标识，指定程序执行环境为node

3. 在`package.json`中配置`bin`脚本

   ```json
   {
   	"bin": "./bin/itheima-pack.js"
   }
   ```

4. 通过`npm link`链接到全局包中，供本地测试使用

## 分析webpack打包的bundle文件

其内部就是自己实现了一个`__webpack_require__`函数，递归导入依赖关系

```js
(function (modules) { // webpackBootstrap
  // The module cache
  var installedModules = {};

  // The require function
  function __webpack_require__(moduleId) {

    // Check if module is in cache
    if (installedModules[moduleId]) {
      return installedModules[moduleId].exports;
    }
    // Create a new module (and put it into the cache)
    var module = installedModules[moduleId] = {
      i: moduleId,
      l: false,
      exports: {}
    };

    // Execute the module function
    modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

    // Flag the module as loaded
    module.l = true;

    // Return the exports of the module
    return module.exports;
  }

  // Load entry module and return exports
  return __webpack_require__(__webpack_require__.s = "./src/index.js");
})
  ({
    "./src/index.js":
      (function (module, exports, __webpack_require__) {
        eval("let news = __webpack_require__(/*! ./news.js */ \"./src/news.js\")\r\nconsole.log(news.content)\n\n//# sourceURL=webpack:///./src/index.js?");
      }),
    "./src/message.js":
      (function (module, exports) {
        eval("module.exports = {\r\n  content: '今天要下雨了!!!'\r\n}\n\n//# sourceURL=webpack:///./src/message.js?");
      }),
    "./src/news.js":
      (function (module, exports, __webpack_require__) {
        eval("let message = __webpack_require__(/*! ./message.js */ \"./src/message.js\")\r\n\r\nmodule.exports = {\r\n  content: '今天有个大新闻,爆炸消息!!!内容是:' + message.content\r\n}\n\n//# sourceURL=webpack:///./src/news.js?");
      })
  });
```

## 自定义loader

### 学习目标

在学习给自己写的itheima-pack工具添加loader功能之前，得先学习webpack中如何自定义loader，所以学习步骤分为两大步：

1. 掌握自定义webpack的loader
2. 学习给itheima-pack添加loader功能并写一个loader

webpack以及我们自己写的itheima-pack都只能处理JavaScript文件，如果需要处理其他文件，或者对JavaScript代码做一些操作，则需要用到loader。

loader是webpack中四大核心概念之一，主要功能是将一段匹配规则的代码进行加工处理，生成最终的代码后输出，是webpack打包环节中非常重要的一环。

> loader 可以将所有类型的文件转换为 webpack 能够处理的有效模块，然后你就可以利用 webpack 的打包能力，对它们进行处理。

之前都使用过别人写好的loader，步骤大致分为：

1. 装包
2. 在webpack.config.js中配置module节点下的rules即可，例如babel-loader（省略其他配置，只论loader）
3. （可选步骤）可能还需要其他的配置，例如babel需要配置presets和plugin

```js
const path = require('path')

module.exports = {
  entry: './src/index.js',
  output: {
    path: path.join(__dirname, 'dist'),
    filename: 'bundle.js'
  },
  module: {
    rules: [
      { test: /\.js$/, use: 'babel-loader' }
    ]
  },
  mode: 'development'
}
```

### 实现一个简单的loader

loader到底是什么东西？能不能自己写？

答案是肯定的，loader就是一个函数，同样也可以自己来写

1. 在项目根目录中新建一个目录存放自己写的loader：

![1561174288710](./assets/1561174288710.png)

2. 编写myloader.js，其实loader就是对外暴露一个函数

   第一个参数就是loader要处理的代码

   ```js
   module.exports = function(source) {
     console.log(source) // 只是简单打印并返回结果，不作任何处理
     return source
   }
   ```

3. 同样在webpack.config.js中配置自己写的loader，为了方便演示，直接匹配所有的js文件使用自己的myloader进行处理

   ```js
   const path = require('path')
   
   module.exports = {
     entry: './src/index.js',
     output: {
       path: path.join(__dirname, 'dist'),
       filename: 'bundle.js'
     },
     module: {
       rules: [
         { test: /.js$/, use: './loaders/myloader.js' }
       ]
     },
     mode: 'development'
   }
   ```

4. 如果需要实现一个简单的loader，例如将js中所有的“今天”替换成“明天”

   只需要修改myloader.js的内容如下即可

   ```js
   module.exports = function(source) {
     return source.replace(/今天/g, '明天')
   }
   ```

5. 同时也可以配置多个loader对代码进行处理

   ```js
   const path = require('path')
   
   module.exports = {
     entry: './src/index.js',
     output: {
       path: path.join(__dirname, 'dist'),
       filename: 'bundle.js'
     },
     module: {
       rules: [
         { test: /.js$/, use: ['./loaders/myloader2.js', './loaders/myloader.js'] }
       ]
     },
     mode: 'development'
   }
   ```

6. myloader2.js

   ```js
   module.exports = function(source) {
     return source.replace(/爆炸/g, '小道')
   }
   ```

### loader的分类

不同类型的loader加载时优先级不同，优先级顺序遵循：

前置 > 行内 > 普通 > 后置

pre: 前置loader

post: 后置loader

指定Rule.enforce的属性即可设置loader的种类，不设置默认为普通loader

### 在itheima-pack中添加loader的功能

通过配置loader和手写loader可以发现，其实webpack能支持loader，主要步骤如下：

1. 读取webpack.config.js配置文件的module.rules配置项，进行倒序迭代（rules的每项匹配规则按倒序匹配）
2. 根据正则匹配到对应的文件类型，同时再批量导入loader函数
3. 倒序迭代调用所有loader函数（loader的加载顺序从右到左，也是倒叙）
4. 最后返回处理后的代码

在实现itheima-pack的loader功能时，同样也可以在加载每个模块时，根据rules的正则来匹配是否满足条件，如果满足条件则加载对应的loader函数并迭代调用

depAnalyse()方法中获取到源码后，读取loader：

```js
let rules = this.config.module.rules
for (let i = rules.length - 1; i >= 0; i--) {
    // console.log(rules[i])
    let {test, use} = rules[i]
    if (test.test(modulePath)) {
        for (let j = use.length - 1; j >= 0; j--) {
            let loaderPath = path.join(this.root, use[j])
            let loader = require(loaderPath)
            source = loader(source)
        }
    }
}
```

## 自定义插件

### 学习目标

在学习给自己写的itheima-pack工具添加plugin功能之前，得先学习webpack中如何自定义plugin，所以学习步骤分为两大步：

1. 掌握自定义webpack的plugin
2. 学习给itheima-pack添加plugin功能并写一个plugin

>  插件接口可以帮助用户直接触及到编译过程(compilation process)。 插件可以将处理函数(handler)注册到编译过程中的不同事件点上运行的生命周期钩子函数上。 当执行每个钩子时， 插件能够完全访问到编译(compilation)的当前状态。

简单理解，自定义插件就是在webpack编译过程的生命周期钩子中，进行编码开发，实现一些功能。

### webpack插件的组成

- 一个 JavaScript 命名函数。
- 在插件函数的 prototype 上定义一个 apply 方法。
- 指定一个绑定到 webpack 自身的事件钩子。
- 处理 webpack 内部实例的特定数据。
- 功能完成后调用 webpack 提供的回调。

### webpack的生命周期钩子

|         钩子         |                             作用                             |              参数              |       类型        |
| :------------------: | :----------------------------------------------------------: | :----------------------------: | :---------------: |
|     entryOption      |             在处理了webpack选项的entry配置后调用             |         context, entry         |   SyncBailHook    |
|   **afterPlugins**   |                 在初始化内部插件列表后调用。                 |            compiler            |     SyncHook      |
|    afterResolvers    |                  Compiler初始化完毕后调用。                  |            compiler            |     SyncHook      |
|     environment      | 在准备编译器环境时调用，在对配置文件中的插件进行初始化之后立即调用。 |               无               |     SyncHook      |
|   afterEnvironment   |   在environment钩子之后立即调用，当编译器环境设置完成时。    |               无               |     SyncHook      |
|    **beforeRun**     |                   在运行Compiler之前调用。                   |            compiler            |  AsyncSeriesHook  |
|       **run**        |                   Compiler开始工作时调用。                   |            compiler            |  AsyncSeriesHook  |
|       watchRun       | 在新的编译被触发但在实际开始编译之前，在监视模式期间执行插件。 |            compiler            |  AsyncSeriesHook  |
| normalModuleFactory  |               NormalModuleFactory创建后调用。                |      normalModuleFactory       |     SyncHook      |
| contextModuleFactory |             ContextModuleFactory创建后运行插件。             |      contextModuleFactory      |     SyncHook      |
|    beforeCompile     |               创建compilation参数后执行插件。                |       compilationParams        |  AsyncSeriesHook  |
|       compile        |           beforeCompile在创建新编辑之前立即调用。            |       compilationParams        |     SyncHook      |
|   thisCompilation    |       在触发compilation事件之前，在初始化编译时调用。        | compilation，compilationParams |     SyncHook      |
|     compilation      |                 创建compilation后运行插件。                  | compilation，compilationParams |     SyncHook      |
|       **make**       |                      在完成编译前调用。                      |          compilation           | AsyncParallelHook |
|   **afterCompile**   |                      在完成编译后调用。                      |          compilation           |  AsyncSeriesHook  |
|    **shouldEmit**    | 在发射assets之前调用。应该返回一个告诉是否发射出去的布尔值。 |          compilation           |   SyncBailHook    |
|       **emit**       |                 向assets目录发射assets时调用                 |          compilation           |  AsyncSeriesHook  |
|    **afterEmit**     |               在将assets发送到输出目录后调用。               |          compilation           |  AsyncSeriesHook  |
|       **done**       |                       编译完成后调用。                       |             stats              |  AsyncSeriesHook  |
|        failed        |                    如果编译失败，则调用。                    |             error              |     SyncHook      |
|       invalid        |              在watching compilation失效时调用。              |      fileName，changeTime      |     SyncHook      |
|      watchClose      |              在watching compilation停止时调用。              |               无               |     SyncHook      |

### 实现一个简单的plugin

`compiler.hooks.done`表示编译完成后调用的钩子，所以只需要在这个阶段注册时间，当打包完成会自动回调这个函数

```js
class HelloWorldPlugin {
  apply(compiler) {
    compiler.hooks.done.tap('Hello World Plugin', (stats) => {
      console.log('Hello World!');
    });
  }
}

module.exports = HelloWorldPlugin;
```

### 实现一个html-webpack-plugin

使用html-webpack-plugin非常简单，而且功能非常好用，可以将指定的html模板复制一份输出到dist目录下，同时会自动引入bundle.js

如何自己实现？

1. 编写一个自定义插件，注册`afterEmit`钩子
2. 根据创建对象时传入的template属性来读取html模板
3. 使用工具分析HTML，推荐使用cheerio，可以直接使用jQuery api
4. 循环遍历webpack打包的资源文件列表，如果有多个bundle就都打包进去（可以根据需求自己修改，因为可能有chunk，一般只引入第一个即可）
5. 输出新生成的HTML字符串到dist目录中

```js
const path = require('path')
const fs = require('fs')
const cheerio = require('cheerio')
module.exports = class HTMLPlugin {
  constructor(options) {
    // 传入filename和template
    this.options = options
  }
  apply(compiler) {
    compiler.hooks.afterEmit.tap('HTMLPlugin', compilation => {
      // 根据模板读取html文件内容
      let result = fs.readFileSync(this.options.template, 'utf-8')
      // 使用cheerio来分析HTML
      let $ = cheerio.load(result)
      // 创建script标签后插入HTML中
      Object.keys(compilation.assets).forEach(item => $(`<script src="${item}"></script>`).appendTo('body'))
      // 转换成新的HTML并写入到dist目录中
      fs.writeFileSync(path.join(process.cwd(), 'dist', this.options.filename), $.html())
    })
  }
}
```

**Compiler和Compilation的区别**

- **compiler 对象表示不变的webpack环境，是针对webpack的**
- **compilation 对象针对的是随时可变的项目文件，只要文件有改动，compilation就会被重新创建。**

### 在itheima-pack中添加plugin的功能

#### tapable简介

在webpack内部实现事件流机制的核心就在于**tapable**，有了它就可以通过事件流的形式，将各个插件串联起来，tapable类似于node中的events库，核心原理也是**发布订阅模式**

基本用法如下

1. 定义钩子
2. 使用者注册事件
3. 在合适的阶段调用钩子，触发事件

```js
let { SyncHook } = require('tapable')
class Lesson {
  constructor() {
    this.hooks = {
      html: new SyncHook(['name']),
      css: new SyncHook(['name']),
      js: new SyncHook(['name']),
      react: new SyncHook(['name']),
    }
  }
  study() {
    console.log('开班啦，同学们好！')
    console.log('开始学html啦，同学们好！')
    this.hooks.html.call('小明')
    console.log('开始学css啦，同学们好！')
    this.hooks.css.call('小花')
    console.log('开始学js啦，同学们好！')
    this.hooks.js.call('小黑')
    console.log('开始学react啦，同学们好！')
    this.hooks.react.call('紫阳')
  }
}

let l = new Lesson()
l.hooks.html.tap('html', () => {
  console.log('我要写个淘宝！！！挣他一个亿！')
})

l.hooks.react.tap('react', (name) => {
  console.log('我要用react构建一个属于自己的王国！' + name + '老师讲的真好！！！')
})
l.study()
```

通过该案例可以看出，如果需要在学习的不同阶段，做出不同的事情，可以通过发布订阅模式来完成。而tapable可以帮我们很方便的实现发布订阅模式，同时还可以在调用时传入参数。

以上只是最基础的同步钩子演示，如果感兴趣，可以查阅官方文档，并练习对应的其他钩子，以下是tapable对外暴露的所有钩子：

```js
exports.Tapable = require("./Tapable");
exports.SyncHook = require("./SyncHook");
exports.SyncBailHook = require("./SyncBailHook");
exports.SyncWaterfallHook = require("./SyncWaterfallHook");
exports.SyncLoopHook = require("./SyncLoopHook");
exports.AsyncParallelHook = require("./AsyncParallelHook");
exports.AsyncParallelBailHook = require("./AsyncParallelBailHook");
exports.AsyncSeriesHook = require("./AsyncSeriesHook");
exports.AsyncSeriesBailHook = require("./AsyncSeriesBailHook");
exports.AsyncSeriesWaterfallHook = require("./AsyncSeriesWaterfallHook");
exports.HookMap = require("./HookMap");
exports.MultiHook = require("./MultiHook");
```

#### 利用tapable实现itheima-pack的plugin功能

在Compiler构造时，创建对应的钩子即可

```js
	// Compiler的构造函数内部定义钩子
	this.hooks = {
      afterPlugins: new SyncHook(),
      beforeRun: new SyncHook(),
      run: new SyncHook(),
      make: new SyncHook(),
      afterCompile: new SyncHook(),
      shouldEmit: new SyncHook(),
      emit: new SyncHook(),
      afterEmit: new SyncHook(['compilation']),
      done: new SyncHook(),
    }

    // 触发所有插件的apply方法，并传入Compiler对象
    if (Array.isArray(this.config.plugins)) {
      this.config.plugins.forEach(plugin => {
        plugin.apply(this)
      })
    }
```

在合适的时机调用对应钩子的call方法即可，如需传入参数，可以在对应的钩子中定义好需要传入的参数，call时直接传入

![1561895540321](./assets/1561895540321.png)

# 第6章 课程总结

- webpack基础配置
  - 安装：本地安装即可，无需全局安装
  - 使用：CLI的方式或配置脚本使用配置文件
  - 配置：
    - 开发时工具：watch、dev-server、webpack-dev-middleware、sourceMap
    - loaders：css-loader、style-loader、less-loader、sass-loader、url-loader、babel-loader、
    - plugins：html-webpack-plugin、clean-webpack-plugin、copy-webpack-plugin、BannerPlugin
- webpack高级配置
  - img标签资源处理
  - 多页应用打包
  - 第三方库的引入方式
  - 区分配置文件打包
  - 环境变量
  - proxy
  - HMR
- webpack性能优化
  - webpack自带优化详解
  - css优化
    - 提取到单独文件
    - 自动添加前缀
    - 压缩注意事项
  - js优化
    - 代码分离：手动配置多入口、抽取公共代码、懒加载、SplitChunksPlugin参数详解
    - noParse
    - IgnorePlugin
    - DllPlugin：将固定库抽取成动态链接库节省资源
  - 多进程打包
  - 浏览器缓存
  - 打包分析
  - Prefetching
- webpack原理
  - 分析bundle文件
  - 手写基础的webpack
  - 利用AST完成代码转译
  - 手写loader并给自己的webpack添加loader功能
  - webpack中tapable的应用
  - 手写plugin并给自己的webpack添加plugin功能

学习不是百米冲刺，而是一场马拉松，现在所学只是起点，更多的是需要大家找到学习方法，不断的学习提升自己，一起加油！