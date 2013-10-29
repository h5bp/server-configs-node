// https://github.com/jrburke/r.js/blob/master/build/tests/http/httpBuild.js

/* global window */

(function() {

	var ACE_NAMESPACE = '';

	var global = (function() {
		return this;
	})();


	if (!ACE_NAMESPACE && typeof requirejs !== 'undefined')
		return;


	var _define = function(module, deps, payload) {
		if (typeof module !== 'string') {
			if (_define.original)
				_define.original.apply(window, arguments);
			else {
				console.error('dropping module because define wasn\'t a string.');
				console.trace();
			}
			return;
		}

		if (arguments.length == 2)
			payload = deps;

		if (!_define.modules)
			_define.modules = {};

		_define.modules[module] = payload;
	};

	/**
	 * Get at functionality define()ed using the function above
	 */
	var _require = function(parentId, module, callback) {
		if (Object.prototype.toString.call(module) === '[object Array]') {
			var params = [];
			for (var i = 0, l = module.length; i < l; ++i) {
				var dep = lookup(parentId, module[i]);
				if (!dep && _require.original)
					return _require.original.apply(window, arguments);
				params.push(dep);
			}
			if (callback) {
				callback.apply(null, params);
			}
		}
		else if (typeof module === 'string') {
			var payload = lookup(parentId, module);
			if (!payload && _require.original)
				return _require.original.apply(window, arguments);

			if (callback) {
				callback();
			}

			return payload;
		}
		else {
			if (_require.original)
				return _require.original.apply(window, arguments);
		}
	};

	var normalizeModule = function(parentId, moduleName) {
		// normalize plugin requires
		if (moduleName.indexOf('!') !== -1) {
			var chunks = moduleName.split('!');
			return normalizeModule(parentId, chunks[0]) + '!' + normalizeModule(parentId, chunks[1]);
		}
		// normalize relative requires
		if (moduleName.charAt(0) == '.') {
			var base = parentId.split('/').slice(0, -1).join('/');
			moduleName = base + '/' + moduleName;

			while(moduleName.indexOf('.') !== -1 && previous != moduleName) {
				var previous = moduleName;
				moduleName = moduleName.replace(/\/\.\//, '/').replace(/[^\/]+\/\.\.\//, '');
			}
		}

		return moduleName;
	};

	/**
	 * Internal function to lookup moduleNames and resolve them by calling the
	 * definition function if needed.
	 */
	var lookup = function(parentId, moduleName) {

		moduleName = normalizeModule(parentId, moduleName);

		var module = _define.modules[moduleName];
		if (!module) {
			return null;
		}

		if (typeof module === 'function') {
			var exports = {};
			var mod = {
				id: moduleName,
				uri: '',
				exports: exports,
				packaged: true
			};

			var req = function(module, callback) {
				return _require(moduleName, module, callback);
			};

			var returnValue = module(req, exports, mod);
			exports = returnValue || mod.exports;

			// cache the resulting module object for next time
			_define.modules[moduleName] = exports;
			return exports;
		}

		return module;
	};

	function exportAce(ns) {
		var require = function(module, callback) {
			return _require('', module, callback);
		};

		var root = global;
		if (ns) {
			if (!global[ns])
				global[ns] = {};
			root = global[ns];
		}

		if (!root.define || !root.define.packaged) {
			_define.original = root.define;
			root.define = _define;
			root.define.packaged = true;
		}

		if (!root.require || !root.require.packaged) {
			_require.original = root.require;
			root.require = require;
			root.require.packaged = true;
		}
	}

	exportAce(ACE_NAMESPACE);

})();
