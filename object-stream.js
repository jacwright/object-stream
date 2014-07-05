// A base class to allow chaining of object streams for a nicer API. From:
// ```stream.pipe(streams.filter(filterFunc)).pipe(streams.map(mapFunc))```
// To: ```stream.filter(filterFunc).map(mapFunc)```
// Add new methods to ObjectStream.prototype to provide new methods for
// chaining.

var Transform = require('stream').Transform;

function ObjectStream() {
  Transform.call(this, { objectMode: true, highWaterMark: 16 });
}

util.inherits(ObjectStream, Transform);

// Pipe a non ObjectStream into an ObjectStream providing the available methods
ObjectStream.prototype._transform = function _transform(object, enc, done) {
  this.push(object);
  done();
}

exports.ObjectStream = ObjectStream;
var Iterate = require('./iterate').Iterate;
var Reduce = require('./reduce').Reduce;
