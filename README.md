# cra-append-sw

  Utility tool to append custom code to ServiceWorker created by [Create React App](https://github.com/facebookincubator/create-react-app). 
  
  It allows to keep the default CRA configuration (no ejecting). It simply appends custom code to the ServiceWorker file created by CRA build scripts. By default, it bundles the code using very basic Webpack+Babel configuration (this can be omitted; see options). 

## Installation

    $ npm install cra-append-sw --save

## Usage

    $ cra-append-sw [options] <file>

### Options

    -s, --skip-compile      Skip compilation
    -h, --help              Output usage information
    -e, --env [path]        (./.env) Path to environment variables file
    -m, --mode [mode]       Output mode

#### Output modes

- `dev` creates `public/<file>` instead of appending the code to `build/service-worker.js`
- `build` creates `build/<file>` instead of appending the code to `build/service-worker.js`
- `replace` simply replaces `build/service-worker.js`

## Usage with Create React App

  In `package.json` modify build script to:

    "start": "react-scripts start && cra-append-sw --mode dev ./custom-sw.js",
    "build": "react-scripts build && cra-append-sw ./custom-sw.js",
