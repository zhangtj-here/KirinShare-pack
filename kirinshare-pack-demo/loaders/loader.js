// 其实loader就是一个函数
module.exports = function(source) {
	console.log('loader')
	return source.replace(/今天/g, '明天')
}