// A transform stream for iterating over the results. All iteration can use this
// transform.

// The `iterator` is a function that gets called once for each object that comes
// through the stream. It has the signature `function(object, [done]){}`. The
// first argument, `object`, is the object being passed though the stream. The
// optional second argument is a callback function allowing your iterator to be
// asynchronous. When in synchronous mode (i.e. only having the first `object`
// argument) you should return any value required from the function. When in
// asynchronous mode (i.e. having a second `done` argument) the return is
// ignored and any value required should be sent with the callback. The callback
// is a standard Node.js callback following the signature `function(err,
// value){}`.

// The `handler` is a function that handles how the results from the `iterator`
// are treated and has the signature `function(result, object){}` where `result`
// is the value returned from the iterator. For mapping, the handler can
// `this.push(result)` the value to stream. For filtering, it can push the
// `object` if the `result` is true. `handler` allows `IterateStream` to be used
// for all sorts of iterative uses, allowing the `iterator` the same flexibility
// to be synchronous or asynchronous.

var ObjectStream = require('./object-stream').ObjectStream;

function IterateStream(iterator, handler) {
  if (typeof iterator != 'function')
    throw new Error('Iterator function required');

  ObjectStream.call(this);
  this.iterator = iterator;
  this.handler = handler;
  this.async = iterator.lenth > 1;
}

util.inherits(IterateStream, ObjectStream);

IterateStream.prototype._transform = function _transform(object, enc, done) {
  try {
    if (this.async) {
      var _this = this;
      this.iterator(object, function(err, result) {
        if (!err) _this.handler(result, object);
        done(err);
      });
    } else {
      this.handler(this.iterator(object), object);
      done();
    }
  } catch (err) {
    done(err)
  }
}

exports.IterateStream = IterateStream;
