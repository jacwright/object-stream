// A transform stream for reducing the results. If a `callback` is provided the
// stream will pass on the values and only return the results to the callback.
// Otherwise the stream will not pass anything on until it is finished reading
// and then pass the results out for reading.

// The `reducer` is a function that gets called once for each object that comes
// through the stream. It has the signature `function(value, object, [done]){}`.
// The first argument, `value`, is the current reduce value. If you are counting
// objects, it would be the total count so far. The second argument, `object`,
// is the object being passed though the stream. The optional third argument is
// a callback function allowing your iterator to be asynchronous. When in
// synchronous mode (i.e. only having the first two arguments) you should return
// the new reduce value  from the function. When in asynchronous mode (i.e.
// having a third `done` argument) the return is ignored and the new reduce
// value should be sent with the callback. The callback is a standard Node.js
// callback following the signature `function(err, value){}`. Note that when the
// first object comes through the stream, the `value` argument will either be
// `undefined` or the value of `initialValue` if it is set. Also note that when
// in asynchronous mode, there is no guarentee of order, so your reduce value
// cannot depend on the order objects come through the stream.

// The `initialValue` is what the first `value` argument of `reducer` will be
// for the first object through the stream. After that, `value` will be the
// return of the previous call to `reducer`.

// The `callback` is an optional function that may be called when the stream has
// ended. Instead of writing out the reduce value, the stream will pass along
// the objects and provide the reduce value to the callback. This allows one to
// get a count, a sum, etc. of the objects going through a stream without
// stopping the flow of the stream.

// You may get the current value of a reduce at any time with `reduce.value`.
// This may be helpful to keep a current report of a long stream every second
// or minute, etc.

var ObjectStream = require('./object-stream').ObjectStream;

function ReduceStream(reducer, initialValue, callback) {
  if (typeof reducer != 'function')
    throw new Error('ReduceStream requires a reducer function');

  if (typeof initialValue == 'function') {
    callback = initialValue;
    initialValue = undefined;
  }

  if (callback && typeof callback != 'function')
    throw new Error('ReduceStream callback should be a function');

  ObjectStream.call(this);
  this.reducer = reducer;
  this.value = initialValue;
  this.callback = callback;
}

util.inherits(Iterator, ObjectStream);

function.prototype._transform = function _transform(value, encoding, done) {
  try {
    this.value = this.reducer(this.value, value);
    if (this.callback) this.push(object);
    done();
  } catch (err) {
    done(err);
  }
}

ReduceStream.prototype._flush = function _flush(done) {
  if (this.callback) this.callback(this.value);
  else this.push(this.value);
  done();
}

exports.ReduceStream = ReduceStream;
