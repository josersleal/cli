'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.start = start;
exports.stop = stop;

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _ngrok = require('ngrok');

var _ngrok2 = _interopRequireDefault(_ngrok);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const ngrokConnect = _bluebird2.default.promisify(_ngrok2.default.connect);
const ngrokKill = _bluebird2.default.promisify(_ngrok2.default.kill);

async function start(localPort) {
  return await ngrokConnect({ proto: 'http', addr: localPort });
}

async function stop() {
  return await ngrokKill();
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9zZXJ2aWNlcy90dW5uZWwuanMiXSwibmFtZXMiOlsic3RhcnQiLCJzdG9wIiwibmdyb2tDb25uZWN0IiwiUHJvbWlzZSIsInByb21pc2lmeSIsIm5ncm9rIiwiY29ubmVjdCIsIm5ncm9rS2lsbCIsImtpbGwiLCJsb2NhbFBvcnQiLCJwcm90byIsImFkZHIiXSwibWFwcGluZ3MiOiI7Ozs7O1FBTXNCQSxLLEdBQUFBLEs7UUFJQUMsSSxHQUFBQSxJOztBQVZ0Qjs7OztBQUNBOzs7Ozs7QUFFQSxNQUFNQyxlQUFlQyxtQkFBUUMsU0FBUixDQUFrQkMsZ0JBQU1DLE9BQXhCLENBQXJCO0FBQ0EsTUFBTUMsWUFBWUosbUJBQVFDLFNBQVIsQ0FBa0JDLGdCQUFNRyxJQUF4QixDQUFsQjs7QUFFTyxlQUFlUixLQUFmLENBQXFCUyxTQUFyQixFQUFnQztBQUNyQyxTQUFPLE1BQU1QLGFBQWEsRUFBRVEsT0FBTyxNQUFULEVBQWtCQyxNQUFNRixTQUF4QixFQUFiLENBQWI7QUFDRDs7QUFFTSxlQUFlUixJQUFmLEdBQXNCO0FBQzNCLFNBQU8sTUFBTU0sV0FBYjtBQUNEIiwiZmlsZSI6InR1bm5lbC5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBQcm9taXNlIGZyb20gJ2JsdWViaXJkJztcclxuaW1wb3J0IG5ncm9rIGZyb20gJ25ncm9rJztcclxuXHJcbmNvbnN0IG5ncm9rQ29ubmVjdCA9IFByb21pc2UucHJvbWlzaWZ5KG5ncm9rLmNvbm5lY3QpO1xyXG5jb25zdCBuZ3Jva0tpbGwgPSBQcm9taXNlLnByb21pc2lmeShuZ3Jvay5raWxsKTtcclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBzdGFydChsb2NhbFBvcnQpIHtcclxuICByZXR1cm4gYXdhaXQgbmdyb2tDb25uZWN0KHsgcHJvdG86ICdodHRwJywgIGFkZHI6IGxvY2FsUG9ydCB9KTtcclxufVxyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHN0b3AoKSB7XHJcbiAgcmV0dXJuIGF3YWl0IG5ncm9rS2lsbCgpO1xyXG59XHJcbiJdfQ==