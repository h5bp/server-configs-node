/**
 * Since Express 4.x, response does not emit the `header` event anymore:
 *   https://github.com/strongloop/express/wiki/Migrating-from-3.x-to-4.x
 *
 * We need this event in order to patch headers transparently for the user.
 * This patch proxies `http.ServerResponse#_renderHeaders`. Although this is considered as a bad
 * practice, this specific patch won't produce any side effect.
 */

'use strict';

var ServerResponse = require('http').ServerResponse,
    proto = ServerResponse.prototype,
    _renderHeaders = proto._renderHeaders;

proto._renderHeaders = function(){
    this.emit('header');
    return _renderHeaders.call(this);
};
