#!/usr/bin/env node
var firebase = require('firebase'),
    optimist = require('optimist'),
    ProgressBar = require('progress'),
    assert = require('assert'),
    path = require('path');
    util = require('util');

// We try to write data in ~1MB chunks (in reality this often ends up being much smaller, due to the JSON structure).
var CHUNK_SIZE = 1024*1024;

// Keep ~50 writes outstanding at a time (this increases throughput, so we're not delayed by server round-trips).
var OUTSTANDING_WRITE_COUNT = 50;

var argv = require('optimist')
  .usage('Usage: $0')

  .demand('database_url')
  .describe('database_url', 'Firebase database URL (e.g. https://databaseName.firebaseio.com).')
  .alias('d', 'database_url')

  .demand('path')
  .describe('path', 'Database path (e.g. /products).')
  .alias('p', 'path')

  .demand('json')
  .describe('json', 'The JSON file to import.')
  .alias('j', 'json')

  .boolean('merge')
  .describe('merge', 'Write the top-level children without overwriting the whole parent.')
  .alias('m', 'merge')

  .boolean('force')
  .describe('force', 'Don\'t prompt before overwriting data.')

  .describe('service_account', 'Path to a JSON file with your service account credentials.')
  .alias('s', 'service_account')

  .argv;

function main() {
  firebase.initializeApp({
    databaseURL: argv.database_url,
    serviceAccount: argv.service_account,
  });
  var db = firebase.database();
  var ref = db.ref(argv.path);

  var connFailTimeout = setTimeout(function() {
    console.log('Failed to connect to Firebase.');
    process.exit();
  }, 10000);

  function ready() {
    clearTimeout(connFailTimeout);
    promptToContinue(ref, function() { start(ref); });
  }

  var connFunc = db.ref('.info/connected').on('value', function(s) {
    if(s.val() === true) {
      db.ref('.info/connected').off('value', connFunc);
      ready();
    }
  });
}

function promptToContinue(ref, next) {
  if (argv.force) {
    next();
  } else {
    if (argv.merge) {
      console.log('Each top-level child in ' + argv.json + ' will be written under ' + ref.toString() + '.  If a child already exists, it will be overwritten.');
    } else {
      console.log('All data at ' + ref.toString() + ' will be overwritten.');
    }
    console.log('Press <enter> to proceed, Ctrl-C to abort.');
    process.stdin.resume();
    process.stdin.once('data', next);
  }
}

function start(ref) {
  var file = path.resolve(argv.json);
  console.log('Reading ' + file + '... (may take a minute)');
  var json = require(file);

  var clearFirst = true, splitTopLevel = false;
  if (argv.merge) {
    clearFirst = false;
    // Need to split into chunks at the top level to ensure we don't overwrite the parent.
    splitTopLevel = true;
  }

  console.log('Preparing JSON for import... (may take a minute)');
  var chunks = createChunks(ref, json, splitTopLevel);

  if (clearFirst) {
    ref.remove(function(error) {
      if (error) throw(error);
      uploadChunks(chunks);
    });
  } else {
    uploadChunks(chunks);
  }
}

function uploadChunks(chunks) {
  var uploader = new ChunkUploader(chunks);
  uploader.go(function() {
    console.log('\nImport completed.');
    process.exit();
  });
}

function createChunks(ref, json, forceSplit) {
  var chunkRes = chunkInternal(ref, json, forceSplit);
  if (!chunkRes.chunks) {
    return [{ref: ref, json: json}];
  } else {
    return chunkRes.chunks;
  }
}

function chunkInternal(ref, json, forceSplit) {
  var size = 0;
  var priority = null;
  var jsonIsObject = json !== null && typeof json === 'object';
  if (jsonIsObject) {
    size += 2; // {}
  }

  if (jsonIsObject && ('.priority' in json)) {
    size += 12; // ".priority":
    priority = json['.priority'];
    size += json['.priority'].toString().length;
  }

  var value = json;
  if (jsonIsObject && ('.value' in json)) {
    size += 9; // ".value":
    value = json['.value'];
  }

  if (value === null || typeof value !== 'object') {
    // It's a leaf, it can't be chunked.
    size += JSON.stringify(value).length;
    return { chunks: null, size: size };
  } else {
    // children node.
    var chunks = [];
    var splitUp = false;
    for(var key in json) {
      if (key !== '.priority') {
        size += key.length + 3;

        var chunkRes = chunkInternal(ref.child(key), json[key]);
        size += chunkRes.size;

        if (chunkRes.chunks) {
          for(var i = 0; i < chunkRes.chunks.length; i++) {
            chunks.push(chunkRes.chunks[i]);
          }
          // One of the children had to be broken into chunks.  We have to break all of them.
          splitUp = true;
        } else {
          chunks.push({ref: ref.child(key), json: json[key]});
        }
      }
    }

    // Add priority last since it must be added after at least one child.
    if (priority !== null) {
      chunks.push({ref: ref, priority: priority});
    }

    if (forceSplit || splitUp || size >= CHUNK_SIZE) {
      return { chunks: chunks, size: size };
    } else {
      return { chunks: null, size: size }
    }
  }
}

function ChunkUploader(chunks) {
  this.next = 0;
  this.chunks = chunks;
  if (process.stdout.isTTY) {
      this.bar = new ProgressBar('Importing [:bar] :percent (:current/:total)', { width: 50, total: chunks.length, incomplete: ' ' });
  } else {
      console.log('Importing... (may take a while)');
  }
}

ChunkUploader.prototype.go = function(onComplete) {
  this.onComplete = onComplete;

  for(var i = 0; i < OUTSTANDING_WRITE_COUNT && i < this.chunks.length; i++) {
    this.uploadNext();
  }
};

ChunkUploader.prototype.uploadNext = function() {
  var chunkNum = this.next, chunk = this.chunks[chunkNum];
  assert(chunkNum < this.chunks.length);
  this.next++;

  var self = this;
  var onComplete = function(error) {
    if (error) {
      console.log('Error uploading to ' + self.chunks[i].ref.toString() + ': ' + util.inspect(json));
      console.error(error);
      throw error;
    }

    if (process.stdout.isTTY && self.bar) {
        self.bar.tick();
    }

    if (chunkNum === self.chunks.length - 1) {
      self.onComplete();
    } else {
      // upload next chunk.
      assert(self.next === self.chunks.length || self.next === chunkNum + OUTSTANDING_WRITE_COUNT);
      if (self.next < self.chunks.length)
        self.uploadNext();
    }
  };

  if ('json' in chunk) {
    chunk.ref.set(chunk.json, onComplete);
  } else {
    assert('priority' in chunk)
    chunk.ref.setPriority(chunk.priority, onComplete);
  }
}

main();
