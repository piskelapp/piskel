module.exports = function(grunt) {
	grunt.initConfig({
		jshint: {
			options: {
				jshintrc: '.jshintrc'
			},
			files: [
				'Gruntfile.js',
				'package.json',
				// TODO(grosbouddha): change to js/**/*.js and fix the 10K jshint
				//                    error messages or fine-tune .jshintrc file.
				'js/*.js'
			]
		},
		connect: {
			www: {
				options: {
					base: '.',
					port: 4545
				}
			}
		},
		ghost: {
			dist: {
				filesSrc:  ['tests/integration/casperjs/*_test.js'],
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
		}
	});

	grunt.loadNpmTasks('grunt-contrib-connect');
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-ghost');

	grunt.registerTask('test', ['jshint', 'connect', 'ghost']);

};
