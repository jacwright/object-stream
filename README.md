# ObjectStreams

Node.js utility for working with streams of objects.

## Install

```
$ npm install object-streams
```

## Usage

```javascript
var streams = require('object-streams');

someStream.pipe(streams.filter(function(obj) {
  return obj.tags && obj.tags.length > 0;
})).pipe(streams.count());
```

## API

ObjectStreams provides a set of [Node.js Transform streams](http://nodejs.org/api/stream.html#stream_class_stream_transform_1).
Each of these `ObjectStreams` work on a stream of objects to alter them, filter
them, or to interact with them in some way.

There are two ways to use ObjectStreams. The first is to use the built-in `pipe`
method of streams to pipe the results from a previous stream to an ObjectStream.
The second is to take advantage of an ObjectStream's methods which automatically
call `pipe` and return the new stream. For example, the following three pieces
of code do the exact same thing.

```javascript
someStream
  .pipe(streams.filter(function(order) {
    return order.couponCode != null;
  }))
  .pipe(streams.map(function(order) {
    return order.discount;
  }))
  .pipe(streams.count(function(total) {
    console.log('discounted orders found:', total);
  }))
  .pipe(streams.sum(function(total) {
    console.log('total discount:', total);
  }));
```

```javascript
someStream
  .pipe(streams.filter(function(order) {
    return order.couponCode != null;
  })).map(function(order) {
    return order.discount;
  }).count(function(total) {
    console.log('discounted orders found:', total);
  }).sum(function(total) {
    console.log('total discount:', total);
  });
```

```javascript
someStream.pipe(streams())
  .filter(function(order) {
    return order.couponCode != null;
  }).map(function(order) {
    return order.discount;
  }).count(function(total) {
    console.log('discounted orders found:', total);
  }).sum(function(total) {
    console.log('total discount:', total);
  });
```

In the last example, `streams()` is a no-op ObjectStream stream that passes all
objects straight through allowing the chain to start from a non-ObjectStream.

There are two types of ObjectStreams: *iterators*, and *reducers*. Iterators are
used to affect each object in some way as it comes through the stream. Reducers
are used to calculate totals from objects that are processed in the stream.

## Iterators

Each iterator uses an iterator function to process each object. All iterators
allow for synchronous _and_ asynchronous execution:

```javascript
// Synchronous
function(object) {
  return object.isFile;
}

// Asynchronous
function(object, done) {
  fs.stat(object.fileName, function(err, stat) {
    if (err) done(err);
    else done(null, stat.isFile());
  });
}
```

In the following documentation we use synchronous examples, but each one can be
done asynchronously by including a `done` argument as shown above.

### Map

Maps the object to another value.

```javascript
stream.map(function(object) {
  return object.price;
});
```

### MultiMap

Maps the object to zero or more other values (expects an array to be returned).

```javascript
stream.multimap(function(object) {
  return object.tags;
});
```

### Filter

Filters out any objects that don't meet a certain condition.

```javascript
stream.filter(function(object) {
  return object.price > 10;
});
```

### Each

Allows something to be done while sending the original value on through.

```javascript
stream.each(function(object) {
  console.log(object);
});
```

## Reducers

Each reducer can work in two modes. It can either convert the stream to the
single reduced value, or it can pass objects through the stream and return the
reduced value in a callback. This allows you to, for example, pass a count to
the final destination, or to get a count without changing anything. Example:

```javascript
// passes a number as the final count at the end of the stream
stream.count();
stream.on('data', function(count) {
  console.log('count:', count);
});

// passes each object through and calls the callback at the end of the stream
stream.count(function(count) {
  console.log('count:', count);
});
```

### Count

Counts all objects in the stream.

```javascript
stream.count();
```

### Sum

Adds up all objects in the stream. Use `map` to provide a number to add if your
stream is not a stream of numbers.

```javascript
stream.map(function(object) {
  return object.price;
}).count();
```

### Stats

Provides stats for count, sum, min, max, and the sum of all the square roots
which can be useful in determining the standard deviation.

```javascript
stream.map(function(object) {
  return object.price;
}).stats(function(stats) {
  console.log(stats.count);
  console.log(stats.sum);
  console.log(stats.min);
  console.log(stats.max);
  console.log(stats.sumsqr);
});
```

## Split

You can split an object stream into many using `split`. You will get a new
stream for as many arguments as your splitter function provides. Whatever is
returned in your splitter function will be returned from the `split` function.

```javascript
stream.split(function(stream1, stream2, stream3) {
  stream1.filter(filterPromos).count(console.log);
  stream2.filter(filterNonPromos).count(console.log);
  return stream3.map(pricing);
}).sum(console.log);
```

## Extending ObjectStream

You may add new iterators, reducers, or other types of functionality useful in
chaining object streams by using the `add` method.

```javascript
var streams = require('object-streams');
streams.add('map', function(iterator) {
  return new IterateStream(iterator, function(result) {
    this.push(result);
  });
});
```

The `IterateStream`, `ReduceStream`, and base `ObjectStream` transform classes
are available for use if needed.

```javascript
var streams = require('object-streams');
streams.ObjectStream;
streams.IterateStream;
streams.ReduceStream;
```

## Converting JSON text to streams of objects

If you need to convert a stream of JSON text into objects, check out
https://github.com/dominictarr/JSONStream which will parse JSON as it streams
in.

## Use with [LevelUP](https://github.com/rvagg/node-levelup)

```javascript
var levelup = require('levelup');
var streams = require('object-streams');

var db = streams.level(levelup('/path/to/db', {
  valueEncoding: 'json'
}));

db.scan().filter(function(data) {
  console.log(data.key);
  var object = data.value;
  return object.isPublished;
});

// only grab the values
db.scan({ keys: false }).filter(function(object) {
  return object.isPublished;
});

db.scan({ start: 'posts/', end: 'posts/~~', keys: false })
  .split(function(countPublished, commonWords) {
    
    countPublished.filter(function(post) {
      return post.isPublished;
    }).count(function(count) {
      console.log(count);
    });

    return commonWords.reduce(function(counts, object) {
      var words = getWords(object.body);
      addWords(counts, words);
    }, {});
  }).on('data', function(wordCounts) {
    console.log(wordCounts);
  });
  


```