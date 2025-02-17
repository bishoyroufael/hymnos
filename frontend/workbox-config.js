module.exports = {
	globDirectory: 'dist/',
	globPatterns: [
		'**/*.{css,js,ico,png,html,json}'
	],
	swDest: 'dist/sw.js',
	ignoreURLParametersMatching: [
		/^utm_/,
		/^fbclid$/
	]
};