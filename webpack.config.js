const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
//const webpack = require("webpack");
const HtmlWebpackExternalsPlugin = require("html-webpack-externals-plugin");

module.exports = {
  entry: ["./src/index.js"],
  output: {
    path: path.join(__dirname, "/dist"),
    filename: "index-bundle.js"
  },
  externals: {
    d3: "d3"
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: ["babel-loader"]
      },
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader"]
      }
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: "./src/index.html"
    }),
    //    new webpack.ProvidePlugin({
    //    d3: "d3"
    //    }),
    new HtmlWebpackExternalsPlugin({
      externals: [
        {
          module: "d3",
          entry: "https://d3js.org/d3.v3.min.js",
          global: "d3"
        }
      ]
    })
  ]
};
