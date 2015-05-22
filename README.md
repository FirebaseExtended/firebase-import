# Firebase-Import
Firebase-import is a helper utility for importing large JSON files into your [Firebase](https://www.firebase.com/) database. It
breaks the JSON into smaller chunks and uploads them individually through the Firebase API.

To import files bigger than 250MB, use [Firebase Streaming Import](https://github.com/firebase/firebase-streaming-import).

## Installing

Install the firebase-import module globally:

    $ npm install -g firebase-import

or install it locally and add it to your path:

    $ npm install firebase-import
    $ export PATH=$PATH:`npm bin`

## Usage

    $ firebase-import
    Usage: firebase-import

    Options:
      --firebase_url, -f  Firebase database URL (e.g. https://test.firebaseio.com/dest/path).          [required]
      --json, -j          The JSON file to import.                                            [required]
      --merge, -m         Write the top-level children without overwriting the whole parent.  [boolean]
      --force             Don't prompt before overwriting data.                               [boolean]
      --auth, -a          Specify an auth token to use (e.g. your Firebase Secret).

## Example

    $ firebase-import --firebase_url https://test.firebaseio-demo.com --json test.json
    All data at https://test.firebaseio-demo.com will be overwritten.
    Press <enter> to proceed, Ctrl-C to abort.

    Reading /Users/michael/tmp/test.json... (may take a minute)
    Preparing JSON for import... (may take a minute)
    Importing [=================================================] 100% (9431/9431)
    Import completed.

Or an example of merging the contents of test.json with what's already in Firebase:

    $ firebase-import --firebase_url https://test.firebaseio-demo.com --json test.json --merge
    Each top-level child in test.json will be written under https://test.firebaseio-demo.com.  
    If a child already exists, it will be overwritten.
    Press <enter> to proceed, Ctrl-C to abort.

    Reading /Users/michael/tmp/test.json... (may take a minute)
    Preparing JSON for import... (may take a minute)
    Importing [=================================================] 100% (9431/9431)
    Import completed.

## LICENSE
[MIT](http://firebase.mit-license.org/).
