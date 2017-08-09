const path = require('path');
const include = path.resolve(__dirname, '../');

module.exports = {
  resolve: {
    extensions: ['.webpack.js', '.web.js', '.ts', '.tsx', '.js']
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: 'ts-loader',
        exclude: /node_modules/,
        include,
      }
    ],
  }
};