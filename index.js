#!/usr/bin/env node
const fs = require("fs");
const MemoryFs = require("memory-fs");
const webpack = require("webpack");
const Dotenv = require("dotenv-webpack");
const program = require("commander");
const path = require("path");
const chalk = require("chalk");

const BUILD_SW_FILE_PATH = "build/service-worker.js";
const BUNDLE_FILE_NAME = "bundle.js";

/**
 * Custom log function to print output only when
 * the --no-logs has not been used
 */
function printf() {
  if (program.logs) console.log(Object.values(arguments).join(""));
}
/**
 * 
 * @param {Error} err 
 * 
 * This function handles the errors thrown in various
 * Promises in the code
 */
function handleRejects(err) {
  Log.e(err.name);
  for (let line of err.message.split("\n")) {
    Log.e(line);
  }
  process.exit();
}
/**
 * Logger
 * 
 * This will be used in different parts of the code
 * to show relevant output to the user
 */
const Log = {
  /**
   * Show info
   */
  i: function () {
    printf("[  ", chalk.cyan("INFO"), "   ] ", ...arguments);
  },
  /**
   * Show error
   * 
   * Here console.log is used instead of printf because
   * errors should be shown even if logs are disabled
   */
  e: function () {
    console.log("[ ", chalk.red("ERROR"), " ] ", ...arguments);
  },
  /**
   * Show success messages
   */
  s: function () {
    printf("[ ", chalk.green("SUCCESS"), " ] ", ...arguments);
  },
};

/**
 * Command line options
 */
program
  .arguments("<file>")
  .option("-s, --skip-compile", "skip compilation")
  .option(
    "-e, --env [path]",
    "path to environment variables files [./.env]",
    "./.env"
  )
  .option(
    "-m, --mode <mode>",
    "output mode [dev|build|replace]",
    /^(dev|build|replace)$/i
  )
  .option(
    "-n, --no-logs",
    "Disable all logs by the program",
  )
  .action(function (file) {
    if (program.mode === "dev") {
      process.env.BABEL_ENV = "development";
      process.env.NODE_ENV = "development";
    } else {
      process.env.BABEL_ENV = "production";
      process.env.NODE_ENV = "production";
    }
    Log.i("Starting... ");

    //Read the source file
    read(file)
      .then((content) => {
        Log.i("Appending to file...");

        //Append to main service-worker
        append(content, file)
          .then(() => {
            Log.s("Append successful")

            //Make sure skipCompile isn't enabled
            if (!program.skipCompile) {
              Log.i("Starting compile...");

              //Compile the code
              compile(BUILD_SW_FILE_PATH)
                .then((code) => {
                  Log.s("Compiled Succesfully")
                  Log.i("Starting write...");

                  //Write the result to main file
                  writeFile(code.result, BUILD_SW_FILE_PATH)
                    .then(() => {
                      Log.s("Service Worker appended successfully");
                    })
                    .catch(handleRejects);
                })
                .catch(handleRejects);
            }
          })
          .catch(handleRejects);
      })
      .catch(handleRejects);
  })
  .parse(process.argv);

/**
 * Compile entry file using WebPack
 *
 * @param {String} entry Path to entry file
 * @returns {Promise}
 */
function compile(entry) {
  const compiler = webpack({
    mode: program.mode === "dev" ? "development" : "production",
    entry: [entry],
    output: {
      filename: BUNDLE_FILE_NAME,
      path: "/",
    },
    module: {
      rules: [
        {
          test: /\.js$/,
          exclude: /(node_modules|bower_components)/,
          use: {
            loader: "babel-loader",
            options: {
              presets: [
                [
                  "react-app",
                  {
                    targets: {
                      browsers: ["defaults"],
                    },
                  },
                ],
              ],
              plugins: ["@babel/plugin-transform-runtime"],
            },
          },
        },
      ],
    },
    plugins: [
      new Dotenv({
        path: program.env, // Path to .env file (this is the default)
        safe: false, // load .env.example (defaults to "false" which does not use dotenv-safe)
        silent: true,
        systemvars: true, // Load all system variables and REACT .env as well
        expand: true, // This option make it possible to use global variables inside your .env file e.g. REACT_APP_VERSION=$npm_package_version
      }),
      // new webpack.optimize.UglifyJsPlugin()
    ],
  });

  compiler.outputFileSystem = new MemoryFs();

  return new Promise((resolve, reject) => {
    compiler.run((err, stats) => {
      if (err) return reject(err);

      if (stats.hasErrors() || stats.hasWarnings()) {
        return reject(
          new Error(
            stats.toString({
              errorDetails: true,
              warnings: true,
            })
          )
        );
      }

      const result = compiler.outputFileSystem.data[
        BUNDLE_FILE_NAME
      ].toString();
      resolve({ result, stats });
    });
  });
}

/**
 * Read entry file
 *
 * @param {String} entry Path to entry file
 * @returns {Promise}
 */
function read(entry) {
  return new Promise((resolve, reject) => {
    fs.readFile(entry, "utf8", (error, result) => {
      if (error) {
        reject(error);
      }

      resolve(result);
    });
  });
}

/**
 * Append custonm code to exisitng ServiceWorker
 *
 * @param {String} code
 * @returns {Promise}
 */
function append(code, file) {
  const filename = path.basename(file);
  if (program.mode === "dev") {
    return writeFile(code, `public/${filename}`);
  } else if (program.mode === "build") {
    return writeFile(code, `build/${filename}`);
  } else if (program.mode === "replace") {
    return writeFile(code, BUILD_SW_FILE_PATH);
  } else {
    // Append to "build/service-worker.js"
    return new Promise((resolve, reject) => {
      // Read exisitng SW file
      fs.readFile(BUILD_SW_FILE_PATH, "utf8", (error, data) => {
        if (error) {
          reject(error);
        }

        // append custom code
        const result = data + '\n' + code;

        // Write modified SW file
        fs.writeFile(BUILD_SW_FILE_PATH, result, "utf8", (error) => {
          if (error) {
            reject(error);
          }

          resolve();
        });
      });
    });
  }
}

function writeFile(content, file) {
  return new Promise((resolve, reject) => {
    fs.writeFile(file, content, "utf8", (error) => {
      if (error) {
        reject(error);
      }
      resolve();
    });
  });
}
