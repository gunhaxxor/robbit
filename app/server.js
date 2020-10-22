var logger = require('morgan');
var express = require('express');
var server = express();

server.use(logger('dev'));

server.use(express.static(__dirname + '/www'));
server.listen(8080);

console.log('YOOOOOO! Started web server for static files');
// console.log('This is the environment:');
// console.log(process.env);