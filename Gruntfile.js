module.exports = function(grunt) {
	grunt.initConfig({
		jshint: {
			/*options: {
				"evil": true,
				"asi": true,
				"smarttabs": true,
				"eqnull": true
			},*/
			files: [
				'Gruntfile.js',
				'package.json',
				'js/**/*.js',
				'!js/lib/**/*.js' // Exclude lib folder (note the leading !)
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

	grunt.registerTask('lint', ['jshint']);
	grunt.registerTask('test', ['jshint', 'connect', 'ghost']);

};
