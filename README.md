# cra-append-sw

  Utility tool to append custom ServiceWorker code to existing [Create React App](https://github.com/facebookincubator/create-react-app) one.

  ## Installation

    $ npm install commander --save

  ## Usage

    $ cra-append-sw [options] <file>


  ### Options:

    -s, --skip-compile  Skip compilation
    -h, --help          output usage information

  ## Usage with Create React App

  In package.json modify buid script to:

    "build": "react-scripts build && cra-append-sw ./custom-sw.js",
