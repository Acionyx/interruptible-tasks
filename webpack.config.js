const path = require("path");

module.exports = {
  entry: "./src/index.js",
  mode: "production",
  optimization: {
    minimizer: []
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: [{ loader: "babel-loader" }]
      }
    ]
  },
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: `index.${process.env.BABEL_ENV}.js`,
    library: "interruptible-tasks",
    libraryTarget: "umd"
  }
};
