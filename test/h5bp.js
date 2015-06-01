/* jshint -W068 */

/* jshint mocha:true */

// prevents express for dumping error in test output
process.env.NODE_ENV = 'test';

var h5bp = require('../lib/h5bp');
var express = require('express');
require('chai').should();
var request = require('supertest');
var path = require('path');
var mime = require('express/node_modules/send').mime;

var HTML = 'html htm'.split(' ');
var IMAGE = 'bmp gif jpeg jpg jpe png svg svgz tiff tif ico'.split(' ');
var ICON = 'ico cur'.split(' ');
var VIDEO = 'ogv mp4 m4v f4v f4p webm flv'.split(' ');
var AUDIO = 'oga ogg m4a f4a f4b'.split(' ');
var FONT = 'ttf ttc otf eot woff'.split(' ');
var RSS = 'rss atom'.split(' ');
var MISC = 'txt crx oex xpi safariextz webapp vcf swf vtt'.split(' ');

var FEED = RSS;
var MEDIA = IMAGE.concat(VIDEO.concat(AUDIO));
var DATA = 'appcache manifest html htm xml rdf json';
var ALL = [].concat(HTML, IMAGE, ICON, VIDEO, AUDIO, FONT, RSS, 'js css'.split(' '));

describe('h5bp', function() {
	describe('with express/connect', function() {
		before(function() {
			helper.stop()
				.create()
				.start();
		});

		describe('proper MIME type for all files', function() {
			ALL.forEach(function(e) {
				it('should be set for .' + e, function(done) {
					helper.request()
						.get('/test.' + e)
						.expect('Content-Type', new RegExp(
							mime.lookup(e).replace(/([\/\+])/g, '\\$1') + '(?:charset=UTF-8)?')
						)
						.expect(200, done);
				});
			});

			ALL.forEach(function(e) {
				it('should be set for .' + e + ' with query string', function(done) {
					helper.request()
						.get('/test.' + e + '?' + Math.random())
						.expect('Content-Type', new RegExp(
							mime.lookup(e).replace(/([\/\+])/g, '\\$1') + '(?:charset=UTF-8)?')
						)
						.expect(200, done);
				});
			});

			it('should leave content-type empty for files without extensions', function(done) {
				helper.request()
					.get('/')
					.expect('Content-Type', 'x-text/woot; charset=utf-8')
					.expect(200, done);
			});

			it('should leave content-type empty for files without extensions', function(done) {
				helper.request()
					.get('/foo')
					.expect('Content-Type', 'x-text/bar; charset=utf-8')
					.expect(200, done);
			});
		});

		describe('the latest IE version', function() {
			HTML.forEach(function(f) {
				it('should be set for .' + f, function(done) {
					helper.request()
						.get('/test.' + f)
						// http://www.useragentstring.com/pages/Internet%20Explorer/
						.set('user-agent', 'Mozilla/5.0 (compatible; MSIE 10.0; Windows NT 6.1; WOW64; Trident/6.0)')
						.expect('X-UA-Compatible', 'IE=Edge')
						.expect(200, done);
				});
			});

			var others = [].concat(ALL);
			delete others['html'];
			delete others['htm'];
			others.forEach(function(f) {
				it('should not be set for .' + f, function(done) {
					helper.request()
						.get('/test.' + f)
						// http://www.useragentstring.com/pages/Internet%20Explorer/
						.set('user-agent', 'Mozilla/5.0 (compatible; MSIE 10.0; Windows NT 6.1; WOW64; Trident/6.0)')
						.expect(200)
						.end(function(err, res) {
							res.headers.should.not.have.property('X-UA-Compatible');
							done();
						});
				});
			});
		});

		describe('serving cross-domain Ajax requests', function() {
			it('should be disabled by default', function(done) {
				helper.request()
					.get('/test.html')
					.expect(200)
					.end(function(err, res) {
						res.headers.should.not.have.property('Access-Control-Allow-Origin');
						done();
					});
			});

			it('should be enabled when option is set', function(done) {
				helper
					.stop()
					.create({ cors: true })
					.start()
					.request()
					.get('/test.html')
					.expect('Access-Control-Allow-Origin', '*')
					.expect(200, done);
			});
		});

		describe('serving cross-domain images', function() {
			before(function() {
				helper
					.stop()
					.create()
					.start();
			});

			IMAGE.forEach(function(f) {
				it('should be enabled for .' + f, function(done) {
					helper.request()
						.get('/test.' + f)
						.expect('Access-Control-Allow-Origin', '*')
						.expect(200, done);
				});
			});
		});

		describe('serving cross-domain for webfonts', function() {
			FONT.forEach(function(f) {
				it('should be enabled for .' + f.replace(/test/, ''), function(done) {
					helper.request()
						.get('/test.' + f)
						.expect('Access-Control-Allow-Origin', '*')
						.expect(200, done);
				});
			});

			it('should be enabled for font.css', function(done) {
				helper.request()
					.get('/font.css')
					.expect('Access-Control-Allow-Origin', '*')
					.expect(200, done);
			});
		});

		describe('expires headers', function() {
			describe('force refresh', function() {
				DATA.split(' ').forEach(function(f) {
					it('should be set for .' + f, function(done) {
						helper.request()
							.get('/test.' + f)
							.expect('cache-control', /public,max-age=0/)
							.expect(200, done);
					});
				});

				it('should be set for unknown content-type', function(done) {
					helper.request()
						.get('/')
						.expect('cache-control', /public,max-age=0/)
						.expect(200, done);
				});
			});

			describe('one hour', function() {
				FEED.forEach(function(f) {
					it('should be set for .' + f, function(done) {
						helper.request()
							.get('/test.' + f)
							.expect('cache-control', /public,max-age=3600/)
							.expect(200, done);
					});
				});
			});

			describe('one week', function() {
				ICON.forEach(function(f) {
					it('should be set for .' + f, function(done) {
						helper.request()
							.get('/test.' + f)
							.expect('cache-control', /public,max-age=604800/)
							.expect(200, done);
					});
				});
			});

			describe('one month', function() {
				var media = MEDIA.filter(function(e) {
					return 'ico' != e;
				});
				media.push('htc');
				media = media.concat(FONT);
				media.forEach(function(f) {
					it('should be set for .' + f, function(done) {
						helper.request()
							.get('/test.' + f)
							.expect('cache-control', /public,max-age=2419200/)
							.expect(200, done);
					});
				});
			});

			describe('one year', function() {
				['js','css'].forEach(function(f) {
					it('should be set for .' + f, function(done) {
						helper.request()
							.get('/test.' + f)
							.expect('cache-control', /public,max-age=29030400/)
							.expect(200, done);
					});
				});
			});

			describe('one month for every one else', function() {
				MISC.forEach(function(f) {
					it('should be set for .' + f, function(done) {
						helper.request()
							.get('/test.' + f)
							.expect('cache-control', /public,max-age=2419200/)
							.expect(200, done);
					});
				});
			});
		});

		it('should prevent mobile network providers from modifying your site', function(done) {
			helper.request()
				.get('/test.html')
				.expect('cache-control', /no-transform/)
				.expect(200, done);
		});

		it('should remove ETag header', function(done) {
			helper.request()
				.get('/test.html')
				.expect(200)
				.end(function(err, res) {
					res.headers.should.not.have.property('etag');
					done();
				});
		});

		it('should set Keep-Alive Header', function(done) {
			helper.request()
				.get('/test.html')
				.expect('connection', 'keep-alive')
				.expect(200, done);
		});

		describe('no-www', function() {
			it('should be enforced if options.www is false', function(done) {
				helper
					.stop()
					.create({ www: false })
					.start()
					.request()
					.get('/test.html')
					.set('host', 'www.example.com')
					.expect('location', '//example.com/test.html')
					.expect(301, done);
			});

			it('should be enforced and keep query string', function(done) {
				helper.request()
					.get('/test.html?response=42')
					.set('host', 'www.example.com')
					.expect('location', '//example.com/test.html?response=42')
					.expect(301, done);
			});

			it('should do nothing if not present', function(done) {
				helper.request()
					.get('/test.html')
					.set('host', 'example.com')
					.expect(200, done);
			});
		});

		describe('www', function() {
			it('should be enforced if options.www is true', function(done) {
				helper
					.stop()
					.create({ www: true })
					.start()
					.request()
					.get('/test.html')
					.set('host', 'example.com')
					.expect('location', '//www.example.com/test.html')
					.expect(301, done);
			});

			it('should be enforced and keep query string', function(done) {
				helper.request()
					.get('/test.html?response=42')
					.set('host', 'example.com')
					.expect('location', '//www.example.com/test.html?response=42')
					.expect(301, done);
			});

			it('should do nothing if present', function(done) {
				helper.request()
					.get('/test.html')
					.set('host', 'www.example.com')
					.expect(200, function() {
						helper
							.stop()
							.create()
							.start();
						done();
					});
			});
		});

		describe('cache busting', function() {
			var token = Math.floor(Math.random() * 10e7); // date format yyyyMMdd, random here
			'js css png jpg gif'.split(' ').forEach(function(f) {
				it('should work for .' + f, function(done) {
					helper.request()
						.get('/test.' + token + '.' + f)
						.expect(200, done);
				});
			});
		});

		describe('access to hidden files', function() {
			['htaccess', 'git', 'gitignore'].forEach(function(f) {
				it('should be blocked for .' + f, function(done) {
					helper.request()
						.get('/.' + f)
						.expect(403, done);
				});
			});

			'htaccess git gitignore'.split(' ').forEach(function(f) {
				it('should be blocked for .' + f + ' with query string', function(done) {
					helper.request()
						.get('/.' + f + '?' + Math.random())
						.expect(403, done);
				});
			});

			it('should be blocked on express when initiated without option dotfiles', function(done) {
				var app = express();
				app.use(h5bp());
				app.get('/.file', function(req, res) {
					res.end('ok');
				});
				var server = app.listen(8084);
				request(server)
					.get('/.file')
					.expect(403, function() {
						server.close();
						done();
					});
			});

			it('should not be blocked on express when initiated with option dotfiles', function(done) {
				var app = express();
				app.use(h5bp({
					dotfiles: true
				}));
				app.get('/.file', function(req, res) {
					res.end('ok');
				});
				var server = app.listen(8084);
					request(server)
					.get('/.file')
					.expect(200, function() {
						server.close();
						done();
					});
			});
		});

		describe('access to backup and source files', function() {
			['bak', 'config', 'sql', 'fla', 'psd', 'ini', 'log', 'sh', 'inc', 'swp', 'dist'].forEach(function(f) {
				it('should be blocked for .' + f, function(done) {
					helper.request()
						.get('/.' + f)
						.expect(403, done);
				});
			});

			['bak', 'config', 'sql', 'fla', 'psd', 'ini', 'log', 'sh', 'inc', 'swp', 'dist'].forEach(function(f) {
				it('should be blocked for .' + f + ' with query string', function(done) {
					helper.request()
						.get('/.' + f + '?' + Math.random())
						.expect(403, done);
				});
			});
		});

		it('should not advertise what kind of server we\'re running', function(done) {
			helper.request()
				.get('/test.html')
				.expect(200)
				.end(function(err, res) {
					res.headers.should.not.have.property('X-Powered-By');
					done();
				});
		});

		it('should serve compressed files', function(done) {
			helper.request()
				.get('/test.html')
				.set('Accept-Encoding', 'gzip,deflate,sdch')
				.expect('Vary', 'Accept-Encoding')
				.expect('Content-Encoding', 'gzip')
				.expect(200, done);
		});

		it('should tell that a file does not exist', function(done) {
			helper.request()
				.get('/42.html')
				.expect(404, done);
		});

		describe('concatenation & minification of javascripts', function() {
			describe('using CommonJS', function() {
				it('should concatenate a file directly at the root level', function(done) {
					helper.stop()
						.create({ scripts: { files: ['commonjs.js'], processor: 'commonjs' } })
						.start()
						.request()
						.get('/commonjs.js')
						.expect('content-type', 'application/javascript; charset=utf-8')
						.expect(200, /^\/\/ This file was generated by modules-webmake/, done);
				});

				it('should cache the previous file', function(done) {
					helper.stop()
						.create({ scripts: { files: ['commonjs.js'], processor: 'commonjs' } })
						.start()
						.request()
						.get('/commonjs.js')
						.expect('x-cache', 'HIT')
						.expect(200, done);
				});

				it('should concatenate a file more deep in the hierarchy', function(done) {
					helper.stop()
						.create({ scripts: { files: ['deep/commonjs.js'], processor: 'commonjs' } })
						.start()
						.request()
						.get('/deep/commonjs.js')
						.expect('content-type', 'application/javascript; charset=utf-8')
						.expect(200, /^\/\/ This file was generated by modules-webmake/, done);
				});

				it('should serve an always fresh version of the file in development', function(done) {
					process.env.NODE_ENV = 'development';
					helper.stop()
						.create({ scripts: { files: ['commonjs.js'], processor: 'commonjs' } })
						.start()
						.request()
						.get('/commonjs.js')
						.expect('x-cache', 'MISS')
						.expect(200, done);
					process.env.NODE_ENV = 'test';
				});

				it('should minify when specified', function(done) {
					helper.stop()
						.create({ scripts: { files: ['commonjs.js'], processor: 'commonjs' }, minify: true })
						.start()
						.request()
						.get('/commonjs.js')
						.expect('content-type', 'application/javascript; charset=utf-8')
						.expect(200, /^!function\(n\)/, done);
				});

				it('should minify in production env', function(done) {
					process.env.NODE_ENV = 'production';
					helper.stop()
						.create({ scripts: { files: ['commonjs.js'], processor: 'commonjs' } })
						.start()
						.request()
						.get('/commonjs.js')
						.expect('content-type', 'application/javascript; charset=utf-8')
						.expect(200, /^!function\(n\)/, done);
					process.env.NODE_ENV = 'test';
				});
			});

			describe('using AMD', function() {
				it('should concatenate a file directly at the root level', function(done) {
					helper.stop()
						.create({ scripts: { files: ['amd.js'], processor: 'amd' } })
						.start()
						.request()
						.get('/amd.js')
						.expect('content-type', 'application/javascript; charset=utf-8')
						.expect(200, /^\/\/ https:\/\/github\.com\/jrburke\/r\.js/, done);
				});

				it('should cache the previous file', function(done) {
					helper.stop()
						.create({ scripts: { files: ['amd.js'], processor: 'amd' } })
						.start()
						.request()
						.get('/amd.js')
						.expect('x-cache', 'HIT')
						.expect(200, done);
				});

				it('should concatenate a file more deep in the hierarchy', function(done) {
					helper.stop()
						.create({ scripts: { files: ['deep/amd.js'], processor: 'amd' } })
						.start()
						.request()
						.get('/deep/amd.js')
						.expect('content-type', 'application/javascript; charset=utf-8')
						.expect(200, /^\/\/ https:\/\/github\.com\/jrburke\/r\.js/, done);
				});

				it('should serve an always fresh version of the file in development', function(done) {
					process.env.NODE_ENV = 'development';
					helper.stop()
						.create({ scripts: { files: ['amd.js'], processor: 'amd' } })
						.start()
						.request()
						.get('/amd.js')
						.expect('x-cache', 'MISS')
						.expect(200, done);
					process.env.NODE_ENV = 'test';
				});

				it('should minify when specified', function(done) {
					helper.stop()
						.create({ scripts: { files: ['amd.js'], processor: 'amd' }, minify: true })
						.start()
						.request()
						.get('/amd.js')
						.expect('content-type', 'application/javascript; charset=utf-8')
						.expect(200, /^\(function\(\)\{/, done);
				});

				it('should minify in production env', function(done) {
					process.env.NODE_ENV = 'production';
					helper.stop()
						.create({ scripts: { files: ['amd.js'], processor: 'amd' } })
						.start()
						.request()
						.get('/amd.js')
						.expect('content-type', 'application/javascript; charset=utf-8')
						.expect(200, /^\(function\(\)\{/, done);
					process.env.NODE_ENV = 'test';
				});
			});

			it('should default to commonjs', function(done) {
				helper.stop()
					.create({ scripts: { files: ['commonjs.js'] } })
					.start()
					.request()
					.get('/commonjs.js')
					.expect('content-type', 'application/javascript; charset=utf-8')
					.expect(200, done);
			});

			it('should throw an error if processor is not valid', function() {
				(function() {
					helper.stop().create({ scripts: { processor: 'madafaka' } });
				}).should.throw(/Script concatenation processor can be commonjs, amd/);
				helper.stop();
			});

			it('should accept a string when there is only one script', function(done) {
				helper.stop()
					.create({ scripts: { files: 'commonjs.js', processor: 'commonjs' } })
					.start()
					.request()
					.get('/deep/commonjs.js')
					.expect('content-type', 'application/javascript')
					.expect(200, done);
			});

			it('should throw an error if there is no scripts to process', function() {
				(function() {
					helper.stop().create({ scripts: { processor: 'commonjs' } });
				}).should.throw(/There is no script to process/);
				helper.stop();
			});

			it('should work with cache busting', function(done) {
				helper.stop()
					.create({ scripts: { files: ['commonjs.js'] } })
					.start()
					.request()
					.get('/commonjs.123456.js')
					.expect('content-type', 'application/javascript; charset=utf-8')
					.expect(200, done);
			});

			it('should cache miss new cache busted url', function(done) {
				helper.stop()
					.create({ scripts: { files: ['commonjs.js'] } })
					.start()
					.request()
					.get('/commonjs.1337.js')
					.expect('x-cache', 'MISS')
					.expect(200, done);
			});

			it('should ignore leading slash', function(done) {
				helper.stop()
					.create({ scripts: { files: ['/commonjs.js'] } })
					.start()
					.request()
					.get('/commonjs.js')
					.expect('content-type', 'application/javascript; charset=utf-8')
					.expect(200, /^\/\/ This file was generated by modules-webmake/, done);
			});
		});

		describe('compilation & minification of stylesheets', function() {
			describe('using SASS', function() {
				it('should compile a file directly at the root level', function(done) {
					helper.stop()
						.create({ stylesheets: { files: ['sass.css'], processor: 'sass' } })
						.start()
						.request()
						.get('/sass.css')
						.expect('content-type', 'text/css; charset=utf-8')
						.expect(200, /background: #fe57a1/, done);
				});

				it('should cache the previous file', function(done) {
					helper.stop()
						.create({ stylesheets: { files: ['sass.css'], processor: 'sass' } })
						.start()
						.request()
						.get('/sass.css')
						.expect('x-cache', 'HIT')
						.expect(200, done);
				});

				it('should concatenate a file more deep in the hierarchy', function(done) {
					helper.stop()
						.create({ stylesheets: { files: ['deep/sass.css'], processor: 'sass' } })
						.start()
						.request()
						.get('/deep/sass.css')
						.expect('content-type', 'text/css; charset=utf-8')
						.expect(200, /background: #133742/, done);
				});

				it('should serve an always fresh version of the file in development', function(done) {
					process.env.NODE_ENV = 'development';
					helper.stop()
						.create({ stylesheets: { files: ['sass.css'], processor: 'sass' } })
						.start()
						.request()
						.get('/sass.css')
						.expect('x-cache', 'MISS')
						.expect(200, done);
					process.env.NODE_ENV = 'test';
				});

				it('should minify when specified', function(done) {
					helper.stop()
						.create({ stylesheets: { files: ['sass.css'], processor: 'sass' }, minify: true })
						.start()
						.request()
						.get('/sass.css')
						.expect('content-type', 'text/css; charset=utf-8')
						.expect(200, /^body\{background/, done);
				});

				it('should minify in production env', function(done) {
					process.env.NODE_ENV = 'production';
					helper.stop()
						.create({ stylesheets: { files: ['sass.css'], processor: 'sass' } })
						.start()
						.request()
						.get('/sass.css')
						.expect('content-type', 'text/css; charset=utf-8')
						.expect(200, /^body\{background/, done);
					process.env.NODE_ENV = 'test';
				});
			});

			describe('using LESS', function() {
				it('should compile a file directly at the root level', function(done) {
					helper.stop()
						.create({ stylesheets: { files: ['less.css'], processor: 'less' } })
						.start()
						.request()
						.get('/less.css')
						.expect('content-type', 'text/css; charset=utf-8')
						.expect(200, /background: #fe57a1/, done);
				});

				it('should cache the previous file', function(done) {
					helper.stop()
						.create({ stylesheets: { files: ['less.css'], processor: 'less' } })
						.start()
						.request()
						.get('/less.css')
						.expect('x-cache', 'HIT')
						.expect(200, done);
				});

				it('should concatenate a file more deep in the hierarchy', function(done) {
					helper.stop()
						.create({ stylesheets: { files: ['deep/less.css'], processor: 'less' } })
						.start()
						.request()
						.get('/deep/less.css')
						.expect('content-type', 'text/css; charset=utf-8')
						.expect(200, /background: #133742/, done);
				});

				it('should serve an always fresh version of the file in development', function(done) {
					process.env.NODE_ENV = 'development';
					helper.stop()
						.create({ stylesheets: { files: ['sass.css'], processor: 'sass' } })
						.start()
						.request()
						.get('/sass.css')
						.expect('x-cache', 'MISS')
						.expect(200, done);
					process.env.NODE_ENV = 'test';
				});

				it('should minify when specified', function(done) {
					helper.stop()
						.create({ stylesheets: { files: ['less.css'], processor: 'less' }, minify: true })
						.start()
						.request()
						.get('/less.css')
						.expect('content-type', 'text/css; charset=utf-8')
						.expect(200, /^\.box\{background/, done);
				});

				it('should minify in production env', function(done) {
					process.env.NODE_ENV = 'production';
					helper.stop()
						.create({ stylesheets: { files: ['less.css'], processor: 'less' } })
						.start()
						.request()
						.get('/less.css')
						.expect('content-type', 'text/css; charset=utf-8')
						.expect(200, /^\.box\{background/, done);
					process.env.NODE_ENV = 'test';
				});
			});

			describe('using stylus', function() {
				it('should compile a file directly at the root level', function(done) {
					helper.stop()
						.create({ stylesheets: { files: ['stylus.css'], processor: 'stylus' } })
						.start()
						.request()
						.get('/stylus.css')
						.expect('content-type', 'text/css; charset=utf-8')
						.expect(200, /background: #fe57a1/, done);
				});

				it('should cache the previous file', function(done) {
					helper.stop()
						.create({ stylesheets: { files: ['stylus.css'], processor: 'stylus' } })
						.start()
						.request()
						.get('/stylus.css')
						.expect('x-cache', 'HIT')
						.expect(200, done);
				});

				it('should concatenate a file more deep in the hierarchy', function(done) {
					helper.stop()
						.create({ stylesheets: { files: ['deep/stylus.css'], processor: 'stylus' } })
						.start()
						.request()
						.get('/deep/stylus.css')
						.expect('content-type', 'text/css; charset=utf-8')
						.expect(200, /background: #133742/, done);
				});

				it('should serve an always fresh version of the file in development', function(done) {
					process.env.NODE_ENV = 'development';
					helper.stop()
						.create({ stylesheets: { files: ['stylus.css'], processor: 'stylus' } })
						.start()
						.request()
						.get('/stylus.css')
						.expect('x-cache', 'MISS')
						.expect(200, done);
					process.env.NODE_ENV = 'test';
				});

				it('should minify when specified', function(done) {
					helper.stop()
						.create({ stylesheets: { files: ['stylus.css'], processor: 'stylus' }, minify: true })
						.start()
						.request()
						.get('/stylus.css')
						.expect('content-type', 'text/css; charset=utf-8')
						.expect(200, /^body\{background/, done);
				});

				it('should minify in production env', function(done) {
					process.env.NODE_ENV = 'production';
					helper.stop()
						.create({ stylesheets: { files: ['stylus.css'], processor: 'stylus' } })
						.start()
						.request()
						.get('/stylus.css')
						.expect('content-type', 'text/css; charset=utf-8')
						.expect(200, /^body\{background/, done);
					process.env.NODE_ENV = 'test';
				});
			});

			it('should default to SASS', function(done) {
				helper.stop()
					.create({ stylesheets: { files: ['sass.css'] } })
					.start()
					.request()
					.get('/sass.css')
					.expect('content-type', 'text/css; charset=utf-8')
					.expect(200, done);
			});

			it('should throw an error if processor is not valid', function() {
				(function() {
					helper.stop().create({ scripts: { processor: 'madafaka' } });
				}).should.throw(/Script concatenation processor can be commonjs, amd/);
				helper.stop();
			});

			it('should accept a string when there is only one stylesheet', function(done) {
				helper.stop()
					.create({ stylesheets: { files: '/deep/sass.css', processor: 'sass' } })
					.start()
					.request()
					.get('/deep/sass.css')
					.expect('content-type', 'text/css; charset=utf-8')
					.expect(200, done);
			});

			it('should throw an error if there is no stylesheets to process', function() {
				(function() {
					helper.stop().create({ stylesheets: { processor: 'sass' } });
				}).should.throw(/There is no stylesheet to process/);
				helper.stop();
			});

			it('should work with cache busting', function(done) {
				helper.stop()
					.create({ stylesheets: { files: ['sass.css'] } })
					.start()
					.request()
					.get('/sass.123456.css')
					.expect('content-type', 'text/css; charset=utf-8')
					.expect(200, done);
			});

			it('should cache miss new cache busted url', function(done) {
				helper.stop()
					.create({ stylesheets: { files: ['sass.css'] } })
					.start()
					.request()
					.get('/sass.1337.css')
					.expect('x-cache', 'MISS')
					.expect(200, done);
			});

			it('should ignore leading slash', function(done) {
				helper.stop()
					.create({ stylesheets: { files: ['/sass.css'] } })
					.start()
					.request()
					.get('/sass.css')
					.expect('content-type', 'text/css; charset=utf-8')
					.expect(200, /background: #fe57a1/, done);
			});
		});
	});

	describe('#createServer', function() {
		var server;

		before(function() {
			helper.stop();
		});

		afterEach(function() {
			server.close();
		});

		it('should create an express server', function(done) {
			var app = h5bp.createServer({ server: 'express' });
			app.get('/', function(req, res) {
				res.end('ok');
			});
			server = app.listen(8080);
			request(server)
				.get('/')
				.expect(200, done);
		});

		it('should create a connect server', function(done) {
			var app = h5bp.createServer({ server: 'connect' });
			app.use(function(req, res) {
				res.end('ok');
			});
			server = app.listen(8080);
			request(server)
				.get('/')
				.expect(200, done);
		});

		it('should create a basic http server', function(done) {
			var app = h5bp.createServer({ server: 'http' }, function(req, res) {
				res.end('ok');
			});
			server = app.listen(8080);
			request(server)
				.get('/')
				.expect(200, done);
		});
	});

});

var helper = {
	create: function(options) {
		options = options || {};
		options.root = path.join(__dirname, 'fixtures');
		this.app = h5bp.createServer(options, function(req, res, next) {
			if ('/' == req.url) {
				res.set('content-type', 'x-text/woot');
				res.send('woot!');
				return;
			}
			else if ('/foo' == req.url) {
				res.set('content-type', 'x-text/bar');
				res.send('woot!');
			}

			next();
		});

		return this;
	},

	start: function() {
		if (this.server) return this;
		this.server = this.app.listen(1337);
		return this;
	},

	stop: function() {
		if (!this.server) return this;
		this.server.close();
		this.server = null;
		return this;
	},

	request: function() {
		return request(this.server);
	}
};
