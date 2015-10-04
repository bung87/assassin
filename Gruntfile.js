/*global module:false*/
module.exports = function (grunt) {
  // Project configuration.

  grunt.initConfig({
    // Metadata.
    pkg: grunt.file.readJSON('package.json'),
    banner: '/*! <%= pkg.title || pkg.name %> - v<%= pkg.version %> - ' +
    '<%= grunt.template.today("yyyy-mm-dd") %>\n' +
    '<%= pkg.homepage ? "* " + pkg.homepage + "\\n" : "" %>' +
    '* Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author.name %>;' +
    ' Licensed <%= _.pluck(pkg.licenses, "type").join(", ") %> */\n',
    // Task configuration.
    concat: {
      options: {
        banner: '<%= banner %>',
        stripBanners: true
      },
      dist: {
        src: ['lib/app.js'],
        dest: 'build/app.js'
      }
    },
    uglify: {
      dist: {
        options: {
          banner: '<%= banner %>'
        },
        src: '<%= typescript.base.dest %>',
        dest: 'static/js/app.min.js'
      },
     /* zepto: {
        options: {
          banner: '',
          preserveComments: 'some'
        },
        src: '<%= zepto.target.dest %>',
        dest: 'static/js/zepto.min.js'
      }*/
    },
   
    watch: {
    
      styles: {
        files: ['static/css/style.css'],
        tasks: ['cssmin:target']
      },
      scripts:{
        files:['<%= typescript.base.src %>'],
        tasks:['typescript','uglify','copy:app']
      },
      gruntfile:{
        files:['Gruntfile.js'],
        tasks:['default']
      }
    },
    cssmin: {
      bower_components: {
        files: [{
          expand: true,
          cwd: 'bower_components/',
          src: ['*.css', '!*.min.css'],
          dest: 'static/css',
          ext: '.min.css'
        }]
      },
      target: {
        files: {
          'static/css/style.min.css': [ 'static/css/style.css']
        }
      }
    },
    /*'zepto': {
      'target': {
        'dest': 'build/zepto.js',
        'options': {
          'modules': "zepto event ajax ie assets callbacks deferred data ios3".split(' ')
        }
      }
    },*/
    copy: {
      main: {
        files: [
          {expand: true,flatten: true,  src: ['bower_components/**/*min.js','bower_components/**/dist/*min.js','lib/app.pkgd.js'], dest: 'static/js/',filter: 'isFile'},

        ],
      },
      app: {
        files: [
          {expand: true,flatten: true,  src: ['lib/app.pkgd.js'], dest: 'static/js/',filter: 'isFile'},

        ],
      },
      datatables:{
        files:[{
              cwd: 'bower_components/datatables/media',
              expand:true,flatten:false,src:['css/*min.css'
              ,'images/*.png'
              ,'js/*min.js'
              ],dest:'static/datatables'
            }]
      }
    },
    less:{
      target:{
          options:{
          compress:true
        },
        files:{
          "static/css/normalize.min.css": "bower_components/normalize.css.less/normalize.less"
        }
      }
       // files: [
        //    {expand: true,flatten: true,  src: ['bower_components/**/*.less'], dest: 'static/css/',filter: 'isFile'}
       // ]
    },
    typescript: {
      base: {
        src: ['lib/*.ts'],
        dest: 'lib/app.pkgd.js',
        options: {
          module: 'amd', //or commonjs 
        }
    }
  },
    
  });

  // These plugins provide necessary tasks.
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  // grunt.loadNpmTasks('grunt-contrib-qunit');
  // grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-cssmin');
  // grunt.loadNpmTasks('grunt-zeptojs');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-less');
  grunt.loadNpmTasks('grunt-typescript');
  // Default task.
  grunt.registerTask('default', [/*'zepto:target', */  'copy','less','typescript','uglify', 'watch',]);

};
