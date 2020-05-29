'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getHttpErrorMessage = getHttpErrorMessage;
const httpErrorCodeMessages = exports.httpErrorCodeMessages = {
  400: 'Bad Request',
  401: 'Unauthorized',
  403: 'Forbidden',
  404: 'Not Found',
  405: 'Method Not Allowed',
  407: 'Proxy Authentication Required',
  408: 'Request Timeout',
  409: 'Conflict',
  413: 'Request Entity Too Large',
  414: 'Request-URI Too Long',
  429: 'Too Many Requests',
  444: 'No Response (Nginx)',
  499: 'Client Closed Request (Nginx)',
  500: 'Internal Server Error',
  502: 'Bad Gateway',
  503: 'Service Unavailable',
  504: 'Gateway Timeout',
  505: 'HTTP Version Not Supported',
  522: 'Connection timed out',
  524: 'A timeout occurred',
  598: 'Network read timeout error',
  599: 'Network connect timeout error'
};

function getHttpErrorMessage(errorCode) {
  const code = parseInt(errorCode, 10);
  const infoLink = `https://en.wikipedia.org/wiki/List_of_HTTP_status_codes#${code}`;
  const message = httpErrorCodeMessages[code] || `see ${infoLink} for more info about this error`;

  return `Error ${code} (${message})`;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9zZXJ2aWNlcy9nZXQtaHR0cC1lcnJvci1tZXNzYWdlLmpzIl0sIm5hbWVzIjpbImdldEh0dHBFcnJvck1lc3NhZ2UiLCJodHRwRXJyb3JDb2RlTWVzc2FnZXMiLCJlcnJvckNvZGUiLCJjb2RlIiwicGFyc2VJbnQiLCJpbmZvTGluayIsIm1lc3NhZ2UiXSwibWFwcGluZ3MiOiI7Ozs7O1FBeUJnQkEsbUIsR0FBQUEsbUI7QUF6QlQsTUFBTUMsd0RBQXdCO0FBQ25DLE9BQUssYUFEOEI7QUFFbkMsT0FBSyxjQUY4QjtBQUduQyxPQUFLLFdBSDhCO0FBSW5DLE9BQUssV0FKOEI7QUFLbkMsT0FBSyxvQkFMOEI7QUFNbkMsT0FBSywrQkFOOEI7QUFPbkMsT0FBSyxpQkFQOEI7QUFRbkMsT0FBSyxVQVI4QjtBQVNuQyxPQUFLLDBCQVQ4QjtBQVVuQyxPQUFLLHNCQVY4QjtBQVduQyxPQUFLLG1CQVg4QjtBQVluQyxPQUFLLHFCQVo4QjtBQWFuQyxPQUFLLCtCQWI4QjtBQWNuQyxPQUFLLHVCQWQ4QjtBQWVuQyxPQUFLLGFBZjhCO0FBZ0JuQyxPQUFLLHFCQWhCOEI7QUFpQm5DLE9BQUssaUJBakI4QjtBQWtCbkMsT0FBSyw0QkFsQjhCO0FBbUJuQyxPQUFLLHNCQW5COEI7QUFvQm5DLE9BQUssb0JBcEI4QjtBQXFCbkMsT0FBSyw0QkFyQjhCO0FBc0JuQyxPQUFLO0FBdEI4QixDQUE5Qjs7QUF5QkEsU0FBU0QsbUJBQVQsQ0FBNkJFLFNBQTdCLEVBQXdDO0FBQzdDLFFBQU1DLE9BQU9DLFNBQVNGLFNBQVQsRUFBb0IsRUFBcEIsQ0FBYjtBQUNBLFFBQU1HLFdBQVksMkRBQTBERixJQUFLLEVBQWpGO0FBQ0EsUUFBTUcsVUFBVUwsc0JBQXNCRSxJQUF0QixLQUFnQyxPQUFNRSxRQUFTLGlDQUEvRDs7QUFFQSxTQUFRLFNBQVFGLElBQUssS0FBSUcsT0FBUSxHQUFqQztBQUNEIiwiZmlsZSI6ImdldC1odHRwLWVycm9yLW1lc3NhZ2UuanMiLCJzb3VyY2VzQ29udGVudCI6WyJleHBvcnQgY29uc3QgaHR0cEVycm9yQ29kZU1lc3NhZ2VzID0ge1xyXG4gIDQwMDogJ0JhZCBSZXF1ZXN0JyxcclxuICA0MDE6ICdVbmF1dGhvcml6ZWQnLFxyXG4gIDQwMzogJ0ZvcmJpZGRlbicsXHJcbiAgNDA0OiAnTm90IEZvdW5kJyxcclxuICA0MDU6ICdNZXRob2QgTm90IEFsbG93ZWQnLFxyXG4gIDQwNzogJ1Byb3h5IEF1dGhlbnRpY2F0aW9uIFJlcXVpcmVkJyxcclxuICA0MDg6ICdSZXF1ZXN0IFRpbWVvdXQnLFxyXG4gIDQwOTogJ0NvbmZsaWN0JyxcclxuICA0MTM6ICdSZXF1ZXN0IEVudGl0eSBUb28gTGFyZ2UnLFxyXG4gIDQxNDogJ1JlcXVlc3QtVVJJIFRvbyBMb25nJyxcclxuICA0Mjk6ICdUb28gTWFueSBSZXF1ZXN0cycsXHJcbiAgNDQ0OiAnTm8gUmVzcG9uc2UgKE5naW54KScsXHJcbiAgNDk5OiAnQ2xpZW50IENsb3NlZCBSZXF1ZXN0IChOZ2lueCknLFxyXG4gIDUwMDogJ0ludGVybmFsIFNlcnZlciBFcnJvcicsXHJcbiAgNTAyOiAnQmFkIEdhdGV3YXknLFxyXG4gIDUwMzogJ1NlcnZpY2UgVW5hdmFpbGFibGUnLFxyXG4gIDUwNDogJ0dhdGV3YXkgVGltZW91dCcsXHJcbiAgNTA1OiAnSFRUUCBWZXJzaW9uIE5vdCBTdXBwb3J0ZWQnLFxyXG4gIDUyMjogJ0Nvbm5lY3Rpb24gdGltZWQgb3V0JyxcclxuICA1MjQ6ICdBIHRpbWVvdXQgb2NjdXJyZWQnLFxyXG4gIDU5ODogJ05ldHdvcmsgcmVhZCB0aW1lb3V0IGVycm9yJyxcclxuICA1OTk6ICdOZXR3b3JrIGNvbm5lY3QgdGltZW91dCBlcnJvcicsXHJcbn07XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZ2V0SHR0cEVycm9yTWVzc2FnZShlcnJvckNvZGUpIHtcclxuICBjb25zdCBjb2RlID0gcGFyc2VJbnQoZXJyb3JDb2RlLCAxMCk7XHJcbiAgY29uc3QgaW5mb0xpbmsgPSBgaHR0cHM6Ly9lbi53aWtpcGVkaWEub3JnL3dpa2kvTGlzdF9vZl9IVFRQX3N0YXR1c19jb2RlcyMke2NvZGV9YDtcclxuICBjb25zdCBtZXNzYWdlID0gaHR0cEVycm9yQ29kZU1lc3NhZ2VzW2NvZGVdIHx8IGBzZWUgJHtpbmZvTGlua30gZm9yIG1vcmUgaW5mbyBhYm91dCB0aGlzIGVycm9yYDtcclxuXHJcbiAgcmV0dXJuIGBFcnJvciAke2NvZGV9ICgke21lc3NhZ2V9KWA7XHJcbn1cclxuIl19