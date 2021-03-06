var ObjectStream = require('./object-stream').ObjectStream;
var IterateStream = require('./iterate').IterateStream;
var ReduceStream = require('./reduce').ReduceStream;

var streams = module.exports = function streams() {
  return new ObjectStream();
}

streams.ObjectStream = ObjectStream;
streams.IterateStream = IterateStream;
streams.ReduceStream = ReduceStream;

// Add levelup support to add a scan method (as in a table scan)
streams.level = function level(db) {
  db.scan = scan;
}
function scan(options) {
  return this.createReadStream(options).pipe(streams());
}

// Add a new stream functino to ObjectStream.prototype. It should return a new
// ObjectStream subclass.
streams.add = function add(name, func) {
  streams[name] = func;
  ObjectStream.prototype[name] = function() {
    return this.pipe(func);
  }
}

streams.add('iterate', function(iterator, handler) {
  return new IterateStream(iterator, handler);
});

streams.add('reduce', function(reducer, initialValue, callback) {
  return new ReduceStream(reducer, initialValue, callback);
});

streams.add('map', function(iterator) {
  return new IterateStream(iterator, function(result) {
    this.push(result);
  });
});

streams.add('multimap', function(iterator) {
  return new IterateStream(iterator, function(results) {
    var _this = this;
    if (Array.isArray(results)) {
      results.forEach(function(result) {
        _this.push(result);
      });
    }
  });
});

streams.add('filter', function(iterator) {
  return new IterateStream(iterator, function(result, object) {
    if (result) this.push(object);
  });
});

streams.add('each', function(iterator) {
  return new IterateStream(iterator, function(result) {
    this.push(object);
  });
});

streams.add('count', function(callback) {
  return new ReduceStream(function(total) {
    return total + 1;
  }, 0, callback);
});

streams.add('sum', function(callback) {
  return new ReduceStream(function(total, value) {
    return total + value;
  }, 0, callback);
});

streams.add('stats', function(callback) {
  var stats = {
    count: 0,
    sum: 0,
    min: null,
    max: null,
    sumsqr: 0
  };

  return new ReduceStream(function(stats, value) {
    stats.count++;
    stats.sum += value;
    stats.sumsqr += Math.sqrt(value);

    if (stats.min === null) {
      stats.min = stats.max = value;
    } else {
      stats.min = Math.min(value, stats.min);
      stats.max = Math.max(value, stats.max);
    }
    return stats;
  }, stats, callback);
});

streams.add('split', function(splitter) {
  var streams = [];
  for (var i = 0; i < splitter.length; i++) {
    streams.push(this.pipe(new ObjectStream()));
  }
  return splitter.apply(null, streams);
});