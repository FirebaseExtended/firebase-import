# Firebase-Import
Firebase-import is a helper utility for importing large JSON files into your 
[Firebase Realtime Database](https://firebase.google.com/docs/database/). It breaks the JSON into smaller
chunks and uploads them individually through the Firebase API.

This utility is designed and tested for imports of files up to 400MB.

## Installing

Install the firebase-import module globally:

    $ npm install -g firebase-import

or install it locally and add it to your path:

    $ npm install firebase-import
    $ export PATH=$PATH:`npm bin`

## Obtaining Service account file
Using your Google account, login to Firebase console: https://console.firebase.google.com/

See Example below

1. Project Settings ->
2. Service Accounts ->
3. Generate new private key

![Service Account Image](https://image.ibb.co/cBuuo9/service_account.png)


## Usage

    $ firebase-import
    Usage: firebase-import

    Options:
      --database_url     Firebase database URL (e.g. https://databaseName.firebaseio.com).   [required]
      --path             Database path (e.g. /products).                                     [required]
      --json             The JSON file to import.                                            [required]
      --merge            Write the top-level children without overwriting the whole parent.
      --force            Don't prompt before overwriting data.
      --service_account  Path to a JSON file with your service account credentials.

## Example

    $ firebase-import --database_url https://test.firebaseio-demo.com --path // --json test.json --service_account /path/to/your/service_account.json
    All data at https://test.firebaseio-demo.com/ will be overwritten.
    Press <enter> to proceed, Ctrl-C to abort.

    Reading /Users/michael/tmp/test.json... (may take a minute)
    Preparing JSON for import... (may take a minute)
    Importing [=================================================] 100% (9431/9431)
    Import completed.

Or an example of merging the contents of test.json with what's already in Firebase:

    $ firebase-import --database_url https://test.firebaseio-demo.com --path // --json test.json --merge --service_account /path/to/your/service_account.json
    Each top-level child in test.json will be written under https://test.firebaseio-demo.com/.
    If a child already exists, it will be overwritten.
    Press <enter> to proceed, Ctrl-C to abort.

    Reading /Users/michael/tmp/test.json... (may take a minute)
    Preparing JSON for import... (may take a minute)
    Importing [=================================================] 100% (9431/9431)
    Import completed.
