'use strict';

/** deps */
var path = require('path'),
	fs = require('fs'),
	processor = require('less'),
	Cache = require('connect/lib/cache'),
	cache = new Cache();

/**
 * Configures less layer.
 * @type {Function}
 */
module.exports = function(options) {
	var files = options.stylesheets.files,
		envDev = 'development' == process.env.NODE_ENV;

	// removes all leading slashs if any
	files = files.map(function(entry) {
		return ('/' == entry.charAt('/') ? entry.slice(1) : entry);
	});

	function respond(res, entry, cacheHeader) {
		res.setHeader('Content-Type', 'text/css');
		res.setHeader('X-Cache', cacheHeader);
		res.send(200, entry[0]);
	}

	/**
	 * The actual LESS layer, invoked for each request hit.
	 * Compiles a LESS file into a CSS file.
	 *
	 * This is meant to be used with cache busting.
	 */
	return function less(req, res, next) {
		var baseUrl = req.baseUrl.slice(1),
			url = req.url.slice(1),
			entry,
			config = {
				silent: true,
				verbose: false,
				ieCompat: true,
				compress: false,
				yuicompress: false,
				maxLineLen: -1,
				strictMaths: true,
				strictUnits: false
			};

		if (-1 != files.indexOf(url)) {
			// cache hit!
			if (!envDev && (entry = cache.get(baseUrl))) {
				respond(res, entry, 'HIT');
				return;
			}

			// cache miss
			var filename = path.join(options.root, url).replace(/\.css$/, '.less');
			fs.readFile(filename, 'utf8', function(err, content) {
				if (err) {
					next(500);
					return;
				}
				config.paths = [path.dirname(filename)];
				config.filename = filename;

				var parser = processor.Parser(config);
				parser.parse(content, function(err, tree) {
					if (err) {
						next(500);
						return;
					}

					try {
						var content = tree.toCSS(config);
						if (content) {
							entry = cache.add(baseUrl);
							entry.push(content);
							respond(res, entry, 'MISS');
						}
					}
					catch (e) {
						next(500);
					}
				});
			});
		}
		else {
			next(null, req, res);
		}
	};
};