module.exports = {
  entry: {
    bundle: __dirname + '/src/app/bundle.jsx'
  },
  output: {
    path: __dirname + '/dist',
    filename: '[name].js'
  },
  module: {
    loaders: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        loader: 'babel-loader',
        query: {
          presets: ['react', 'es2015']
        }
      }
    ]
  },
  resolve: {
    root: __dirname,
    extensions: ['', '.js', '.jsx', 'es6', '.json', '.tx', '.tsx'],
    moduleDirectories: [
      'app',
      'node_modules'
    ]
  }
};
