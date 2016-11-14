module.exports = function (grunt) {

  require('load-grunt-tasks')(grunt);

  grunt.initConfig({
    // Builds Sass
    sass: {
      dev: {
        options: {
          style: 'expanded',
          sourcemap: true,
          includePaths: [],
          outputStyle: 'expanded'
        },
        files: [{
          expand: true,
          cwd: 'app/assets/sass',
          src: ['*.scss'],
          dest: 'public/stylesheets/',
          ext: '.css'
        }]
      }
    },

    babel: {
      options: {
        plugins: ['transform-react-jsx'],
        presets: ['es2015', 'react']
      },
      dist: {
        files: {
          'public/scripts/gp-lookup/components.js': 'src/gp-lookup/components.jsx'
        }
      }
    },

    clean: {
      file: ['src/gp-lookup/components.js'],
    },

    // Watches assets and sass for changes
    watch: {
      css: {
        files: ['app/assets/sass/**/*.scss'],
        tasks: ['sass']
      },
      src: {
        files: ['src/gp-lookup/components.jsx'],
        tasks: ['babel', 'clean']
      },
    },

    // nodemon watches for changes and restarts app
    nodemon: {
      dev: {
        script: 'server.js',
        options: {
          ext: 'js, json',
          ignore: ['node_modules/**', 'app/assets/**', 'public/**'],
          args: grunt.option.flags()
        }
      }
    },

    concurrent: {
      target: {
        tasks: ['watch', 'nodemon'],
        options: {
          logConcurrentOutput: true
        }
      }
    }
  })

  grunt.registerTask('generate-assets', [
    'sass',
    'babel'
  ])

  grunt.registerTask('default', [
    'concurrent:target'
  ])
}
