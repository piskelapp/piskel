module.exports = function(grunt) {
	grunt.initConfig({
		jshint: {
			/*options: {
				jshintrc: '.jshintrc'
			},*/
			files: [
				'Gruntfile.js',
				'package.json',
				'js/**/*.js'/*,
				'<%= nodeunit.tests %>'*/
			]
		},
		/*
		nodeunit: {
			tests: ['tests/nodeunit/*_test.js']
		},
		*/
		connect: {
			www: {
				options: {
					base: '.',
					port: 4545
				}
			}
		},
		ghost: {
			test: {
				files: [{
					src: ['tests/integration/casperjs/*_test.js']
				}]
			},
			options: {
				args: {
					baseUrl: 'http://localhost:' +
						'<%= connect.www.options.port %>/'
				},
				direct: false,
				logLevel: 'error',
				printCommand: false,
				printFilePaths: true
			}
		}
	});

	grunt.loadNpmTasks('grunt-contrib-connect');
	grunt.loadNpmTasks('grunt-contrib-jshint');
	//grunt.loadNpmTasks('grunt-contrib-nodeunit');
	grunt.loadNpmTasks('grunt-ghost');

	grunt.registerTask('test', ['jshint', /*'nodeunit',*/ 'connect', 'ghost']);

};
