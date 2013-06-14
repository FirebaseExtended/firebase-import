# Firebase-Import
Firebase-import is a helper utility for importing large JSON files into [Firebase](https://www.firebase.com/). It 
breaks the JSON into smaller chunks and then stores those chunks individually through the Firebase API.

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
      --firebase_url, -f  Firebase URL (e.g. https://test.firebaseio.com/).  [required]
      --json, -j          The JSON file to import.                           [required]
      --force             Don't prompt before overwriting data.              [boolean]

## Example

    $ firebase-import --firebase_url https://test.firebaseio-demo.com --json test.json
    All data at https://test.firebaseio-demo.com will be overwritten.
    Press <enter> to proceed, Ctrl-C to abort.

    Reading /Users/michael/tmp/test.json... (may take a minute)
    Preparing JSON for import... (may take a minute)
    Importing [=================================================] 100% (9431/9431)
    Import completed.

## LICENSE
[MIT](http://firebase.mit-license.org/).
