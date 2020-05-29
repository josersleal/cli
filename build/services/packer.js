'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.npmUnpack = npmUnpack;
exports.shoutemUnpack = shoutemUnpack;

var _childProcessPromise = require('child-process-promise');

var _fsExtra = require('fs-extra');

var _fsExtra2 = _interopRequireDefault(_fsExtra);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _tmpPromise = require('tmp-promise');

var _tmpPromise2 = _interopRequireDefault(_tmpPromise);

var _tar = require('tar.gz');

var _tar2 = _interopRequireDefault(_tar);

var _node = require('./node');

var _data = require('./data');

var _spinner = require('./spinner');

var _globMove = require('glob-move');

var _globMove2 = _interopRequireDefault(_globMove);

var _decompress = require('decompress');

var _decompress2 = _interopRequireDefault(_decompress);

var _extension = require('./extension');

var _npm = require('./npm');

var _login = require('../commands/login');

var _confirmer = require('./confirmer');

var _confirmer2 = _interopRequireDefault(_confirmer);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const mv = _bluebird2.default.promisify(require('mv'));

function hasPackageJson(dir) {
  return (0, _fsExtra.pathExists)(_path2.default.join(dir, 'package.json'));
}

async function npmPack(dir, destinationDir) {
  const resultFilename = _path2.default.join(destinationDir, `${_path2.default.basename(dir)}.tgz`);
  const packageJsonPath = _path2.default.join(dir, 'package.json');

  const originalFileContent = await _fsExtra2.default.readFile(packageJsonPath);
  const packageJson = await (0, _data.readJsonFile)(packageJsonPath);

  const timestamp = new Date().getTime();
  packageJson.version = `${packageJson.version}-build${timestamp}`;

  await (0, _data.writeJsonFile)(packageJson, packageJsonPath);
  const { stdout } = await (0, _childProcessPromise.exec)('npm pack', { cwd: dir });
  const packageFilename = stdout.replace(/\n$/, '');
  const packagePath = _path2.default.join(dir, packageFilename);

  await mv(packagePath, resultFilename);

  if (originalFileContent !== null) {
    await _fsExtra2.default.writeFile(packageJsonPath, originalFileContent, 'utf8');
  }
}

async function npmUnpack(tgzFile, destinationDir) {
  if (!(await (0, _fsExtra.pathExists)(tgzFile))) {
    return [];
  }

  const tmpDir = (await _tmpPromise2.default.dir()).path;
  await (0, _decompress2.default)(tgzFile, tmpDir);
  return await (0, _globMove2.default)(_path2.default.join(tmpDir, 'package', '*'), destinationDir, { dot: true });
}

async function shoutemUnpack(tgzFile, destinationDir) {
  const tmpDir = (await _tmpPromise2.default.dir()).path;
  await npmUnpack(tgzFile, tmpDir);

  await npmUnpack(_path2.default.join(tmpDir, 'app.tgz'), _path2.default.join(destinationDir, 'app'));
  await npmUnpack(_path2.default.join(tmpDir, 'server.tgz'), _path2.default.join(destinationDir, 'server'));
  if (await (0, _fsExtra.pathExists)(_path2.default.join(tmpDir, 'cloud.tgz'))) {
    await npmUnpack(_path2.default.join(tmpDir, 'cloud.tgz'), _path2.default.join(destinationDir, 'cloud'));
  }
  await (0, _globMove2.default)(_path2.default.join(tmpDir, 'extension.json'), destinationDir);
}

function hasExtensionsJson(dir) {
  return (0, _fsExtra.pathExists)(_path2.default.join(dir, 'extension.json'));
}

function hasCloudComponent(dir) {
  return hasPackageJson(_path2.default.join(dir, 'cloud'));
}

async function offerDevNameSync(extensionDir) {
  const { name: extensionName } = await (0, _extension.loadExtensionJson)(extensionDir);

  const syncCloudComponent = await hasCloudComponent(extensionDir);

  const appPackageJson = await (0, _npm.getPackageJson)(_path2.default.join(extensionDir, 'app'));
  const serverPackageJson = await (0, _npm.getPackageJson)(_path2.default.join(extensionDir, 'server'));
  const cloudPackageJson = syncCloudComponent && (await (0, _npm.getPackageJson)(_path2.default.join(extensionDir, 'cloud')));

  const { name: appModuleName } = appPackageJson;
  const { name: serverModuleName } = serverPackageJson;
  const { name: cloudModuleName } = cloudPackageJson || {};
  const { name: developerName } = await (0, _login.ensureUserIsLoggedIn)(true);

  const targetModuleName = `${developerName}.${extensionName}`;
  if (targetModuleName === appModuleName && targetModuleName === serverModuleName && (!syncCloudComponent || targetModuleName === cloudModuleName)) {
    return;
  }

  if (!(await (0, _confirmer2.default)(`You're uploading an extension that isn't yours, do you want to rename it in the package.json files?`))) {
    return;
  }

  appPackageJson.name = targetModuleName;
  await (0, _npm.savePackageJson)(_path2.default.join(extensionDir, 'app'), appPackageJson);

  serverPackageJson.name = targetModuleName;
  await (0, _npm.savePackageJson)(_path2.default.join(extensionDir, 'server'), serverPackageJson);

  if (syncCloudComponent) {
    cloudPackageJson.name = targetModuleName;
    await (0, _npm.savePackageJson)(_path2.default.join(extensionDir, 'cloud'), cloudPackageJson);
  }
}

exports.default = async function shoutemPack(dir, options) {
  const packedDirectories = ['app', 'server', 'cloud'].map(d => _path2.default.join(dir, d));

  if (!(await hasExtensionsJson(dir))) {
    throw new Error(`${dir} cannot be packed because it has no extension.json file.`);
  }

  await await offerDevNameSync(dir);

  const tmpDir = (await _tmpPromise2.default.dir()).path;
  const packageDir = _path2.default.join(tmpDir, 'package');
  await _fsExtra2.default.mkdir(packageDir);

  const dirsToPack = await _bluebird2.default.filter(packedDirectories, hasPackageJson);

  if (options.nobuild) {
    console.error('Skipping build step due to --nobuild flag.');
  } else {
    await (0, _spinner.spinify)((0, _node.buildNodeProject)(_path2.default.join(dir, 'server')), 'Building the server part...', 'OK');
    await (0, _spinner.spinify)((0, _node.buildNodeProject)(_path2.default.join(dir, 'app')), 'Building the app part...', 'OK');
  }

  return await (0, _spinner.spinify)(async () => {
    for (const dir of dirsToPack) {
      await npmPack(dir, packageDir);
    }
    const extensionJsonPathSrc = _path2.default.join(dir, 'extension.json');
    const extensionJsonPathDest = _path2.default.join(packageDir, 'extension.json');
    await (0, _fsExtra.copy)(extensionJsonPathSrc, extensionJsonPathDest);

    const destinationDirectory = _path2.default.join(options.packToTempDir ? tmpDir : dir, 'extension.tgz');
    await (0, _tar2.default)().compress(packageDir, destinationDirectory);

    return {
      packedDirs: dirsToPack,
      allDirs: packedDirectories,
      package: destinationDirectory
    };
  }, 'Packing extension...', 'OK');
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9zZXJ2aWNlcy9wYWNrZXIuanMiXSwibmFtZXMiOlsibnBtVW5wYWNrIiwic2hvdXRlbVVucGFjayIsIm12IiwiUHJvbWlzZSIsInByb21pc2lmeSIsInJlcXVpcmUiLCJoYXNQYWNrYWdlSnNvbiIsImRpciIsInBhdGgiLCJqb2luIiwibnBtUGFjayIsImRlc3RpbmF0aW9uRGlyIiwicmVzdWx0RmlsZW5hbWUiLCJiYXNlbmFtZSIsInBhY2thZ2VKc29uUGF0aCIsIm9yaWdpbmFsRmlsZUNvbnRlbnQiLCJmcyIsInJlYWRGaWxlIiwicGFja2FnZUpzb24iLCJ0aW1lc3RhbXAiLCJEYXRlIiwiZ2V0VGltZSIsInZlcnNpb24iLCJzdGRvdXQiLCJjd2QiLCJwYWNrYWdlRmlsZW5hbWUiLCJyZXBsYWNlIiwicGFja2FnZVBhdGgiLCJ3cml0ZUZpbGUiLCJ0Z3pGaWxlIiwidG1wRGlyIiwidG1wIiwiZG90IiwiaGFzRXh0ZW5zaW9uc0pzb24iLCJoYXNDbG91ZENvbXBvbmVudCIsIm9mZmVyRGV2TmFtZVN5bmMiLCJleHRlbnNpb25EaXIiLCJuYW1lIiwiZXh0ZW5zaW9uTmFtZSIsInN5bmNDbG91ZENvbXBvbmVudCIsImFwcFBhY2thZ2VKc29uIiwic2VydmVyUGFja2FnZUpzb24iLCJjbG91ZFBhY2thZ2VKc29uIiwiYXBwTW9kdWxlTmFtZSIsInNlcnZlck1vZHVsZU5hbWUiLCJjbG91ZE1vZHVsZU5hbWUiLCJkZXZlbG9wZXJOYW1lIiwidGFyZ2V0TW9kdWxlTmFtZSIsInNob3V0ZW1QYWNrIiwib3B0aW9ucyIsInBhY2tlZERpcmVjdG9yaWVzIiwibWFwIiwiZCIsIkVycm9yIiwicGFja2FnZURpciIsIm1rZGlyIiwiZGlyc1RvUGFjayIsImZpbHRlciIsIm5vYnVpbGQiLCJjb25zb2xlIiwiZXJyb3IiLCJleHRlbnNpb25Kc29uUGF0aFNyYyIsImV4dGVuc2lvbkpzb25QYXRoRGVzdCIsImRlc3RpbmF0aW9uRGlyZWN0b3J5IiwicGFj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QUFMLENBQVVGLEdBQVYsRUFBZSxnQkFBZixDQUE3QjtBQUNBLFVBQU11RCx3QkFBd0J0RCxlQUFLQyxJQUFMLENBQVU2QyxVQUFWLEVBQXNCLGdCQUF0QixDQUE5QjtBQUNBLFVBQU0sbUJBQUtPLG9CQUFMLEVBQTJCQyxxQkFBM0IsQ0FBTjs7QUFFQSxVQUFNQyx1QkFBdUJ2RCxlQUFLQyxJQUFMLENBQVV3QyxRQUFRZSxhQUFSLEdBQXdCbEMsTUFBeEIsR0FBaUN2QixHQUEzQyxFQUFnRCxlQUFoRCxDQUE3QjtBQUNBLFVBQU0scUJBQVEwRCxRQUFSLENBQWlCWCxVQUFqQixFQUE2QlMsb0JBQTdCLENBQU47O0FBRUEsV0FBUTtBQUNORyxrQkFBWVYsVUFETjtBQUVOVyxlQUFTakIsaUJBRkg7QUFHTmtCLGVBQVNMO0FBSEgsS0FBUjtBQUtELEdBaEJZLEVBZ0JWLHNCQWhCVSxFQWdCYyxJQWhCZCxDQUFiO0FBaUJELEMiLCJmaWxlIjoicGFja2VyLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgZXhlYyB9IGZyb20gJ2NoaWxkLXByb2Nlc3MtcHJvbWlzZSc7XHJcbmltcG9ydCBmcyBmcm9tICdmcy1leHRyYSc7XHJcbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xyXG5pbXBvcnQgUHJvbWlzZSBmcm9tICdibHVlYmlyZCc7XHJcbmltcG9ydCB0bXAgZnJvbSAndG1wLXByb21pc2UnO1xyXG5pbXBvcnQgdGFyZ3ogZnJvbSAndGFyLmd6JztcclxuaW1wb3J0IHsgYnVpbGROb2RlUHJvamVjdCB9IGZyb20gJy4vbm9kZSc7XHJcbmltcG9ydCB7IHdyaXRlSnNvbkZpbGUgfSBmcm9tICcuL2RhdGEnO1xyXG5pbXBvcnQge3NwaW5pZnl9IGZyb20gJy4vc3Bpbm5lcic7XHJcbmltcG9ydCBtb3ZlIGZyb20gJ2dsb2ItbW92ZSc7XHJcbmltcG9ydCB7IHBhdGhFeGlzdHMsIGNvcHkgfSBmcm9tICdmcy1leHRyYSc7XHJcbmltcG9ydCBkZWNvbXByZXNzIGZyb20gJ2RlY29tcHJlc3MnO1xyXG5pbXBvcnQge3JlYWRKc29uRmlsZX0gZnJvbSBcIi4vZGF0YVwiO1xyXG5pbXBvcnQge2xvYWRFeHRlbnNpb25Kc29ufSBmcm9tIFwiLi9leHRlbnNpb25cIjtcclxuaW1wb3J0IHtnZXRQYWNrYWdlSnNvbiwgc2F2ZVBhY2thZ2VKc29ufSBmcm9tIFwiLi9ucG1cIjtcclxuaW1wb3J0IHtlbnN1cmVVc2VySXNMb2dnZWRJbn0gZnJvbSBcIi4uL2NvbW1hbmRzL2xvZ2luXCI7XHJcbmltcG9ydCBjb25maXJtZXIgZnJvbSBcIi4vY29uZmlybWVyXCI7XHJcbmNvbnN0IG12ID0gUHJvbWlzZS5wcm9taXNpZnkocmVxdWlyZSgnbXYnKSk7XHJcblxyXG5mdW5jdGlvbiBoYXNQYWNrYWdlSnNvbihkaXIpIHtcclxuICByZXR1cm4gcGF0aEV4aXN0cyhwYXRoLmpvaW4oZGlyLCAncGFja2FnZS5qc29uJykpO1xyXG59XHJcblxyXG5hc3luYyBmdW5jdGlvbiBucG1QYWNrKGRpciwgZGVzdGluYXRpb25EaXIpIHtcclxuICBjb25zdCByZXN1bHRGaWxlbmFtZSA9IHBhdGguam9pbihkZXN0aW5hdGlvbkRpciwgYCR7cGF0aC5iYXNlbmFtZShkaXIpfS50Z3pgKTtcclxuICBjb25zdCBwYWNrYWdlSnNvblBhdGggPSBwYXRoLmpvaW4oZGlyLCAncGFja2FnZS5qc29uJyk7XHJcblxyXG4gIGNvbnN0IG9yaWdpbmFsRmlsZUNvbnRlbnQgPSBhd2FpdCBmcy5yZWFkRmlsZShwYWNrYWdlSnNvblBhdGgpO1xyXG4gIGNvbnN0IHBhY2thZ2VKc29uID0gYXdhaXQgcmVhZEpzb25GaWxlKHBhY2thZ2VKc29uUGF0aCk7XHJcblxyXG4gIGNvbnN0IHRpbWVzdGFtcCA9IChuZXcgRGF0ZSgpKS5nZXRUaW1lKCk7XHJcbiAgcGFja2FnZUpzb24udmVyc2lvbiA9IGAke3BhY2thZ2VKc29uLnZlcnNpb259LWJ1aWxkJHt0aW1lc3RhbXB9YDtcclxuXHJcbiAgYXdhaXQgd3JpdGVKc29uRmlsZShwYWNrYWdlSnNvbiwgcGFja2FnZUpzb25QYXRoKTtcclxuICBjb25zdCB7IHN0ZG91dCB9ID0gYXdhaXQgZXhlYygnbnBtIHBhY2snLCB7IGN3ZDogZGlyIH0pO1xyXG4gIGNvbnN0IHBhY2thZ2VGaWxlbmFtZSA9IHN0ZG91dC5yZXBsYWNlKC9cXG4kLywgJycpO1xyXG4gIGNvbnN0IHBhY2thZ2VQYXRoID0gcGF0aC5qb2luKGRpciwgcGFja2FnZUZpbGVuYW1lKTtcclxuXHJcbiAgYXdhaXQgbXYocGFja2FnZVBhdGgsIHJlc3VsdEZpbGVuYW1lKTtcclxuXHJcbiAgaWYgKG9yaWdpbmFsRmlsZUNvbnRlbnQgIT09IG51bGwpIHtcclxuICAgIGF3YWl0IGZzLndyaXRlRmlsZShwYWNrYWdlSnNvblBhdGgsIG9yaWdpbmFsRmlsZUNvbnRlbnQsICd1dGY4Jyk7XHJcbiAgfVxyXG59XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gbnBtVW5wYWNrKHRnekZpbGUsIGRlc3RpbmF0aW9uRGlyKSB7XHJcbiAgaWYgKCEoYXdhaXQgcGF0aEV4aXN0cyh0Z3pGaWxlKSkpIHtcclxuICAgIHJldHVybiBbXTtcclxuICB9XHJcblxyXG4gIGNvbnN0IHRtcERpciA9IChhd2FpdCB0bXAuZGlyKCkpLnBhdGg7XHJcbiAgYXdhaXQgZGVjb21wcmVzcyh0Z3pGaWxlLCB0bXBEaXIpO1xyXG4gIHJldHVybiBhd2FpdCBtb3ZlKHBhdGguam9pbih0bXBEaXIsICdwYWNrYWdlJywgJyonKSwgZGVzdGluYXRpb25EaXIsIHsgZG90OiB0cnVlIH0pO1xyXG59XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gc2hvdXRlbVVucGFjayh0Z3pGaWxlLCBkZXN0aW5hdGlvbkRpcikge1xyXG4gIGNvbnN0IHRtcERpciA9IChhd2FpdCB0bXAuZGlyKCkpLnBhdGg7XHJcbiAgYXdhaXQgbnBtVW5wYWNrKHRnekZpbGUsIHRtcERpcik7XHJcblxyXG4gIGF3YWl0IG5wbVVucGFjayhwYXRoLmpvaW4odG1wRGlyLCAnYXBwLnRneicpLCBwYXRoLmpvaW4oZGVzdGluYXRpb25EaXIsICdhcHAnKSk7XHJcbiAgYXdhaXQgbnBtVW5wYWNrKHBhdGguam9pbih0bXBEaXIsICdzZXJ2ZXIudGd6JyksIHBhdGguam9pbihkZXN0aW5hdGlvbkRpciwgJ3NlcnZlcicpKTtcclxuICBpZiAoYXdhaXQgcGF0aEV4aXN0cyhwYXRoLmpvaW4odG1wRGlyLCAnY2xvdWQudGd6JykpKSB7XHJcbiAgICBhd2FpdCBucG1VbnBhY2socGF0aC5qb2luKHRtcERpciwgJ2Nsb3VkLnRneicpLCBwYXRoLmpvaW4oZGVzdGluYXRpb25EaXIsICdjbG91ZCcpKTtcclxuICB9XHJcbiAgYXdhaXQgbW92ZShwYXRoLmpvaW4odG1wRGlyLCAnZXh0ZW5zaW9uLmpzb24nKSwgZGVzdGluYXRpb25EaXIpO1xyXG59XHJcblxyXG5mdW5jdGlvbiBoYXNFeHRlbnNpb25zSnNvbihkaXIpIHtcclxuICByZXR1cm4gcGF0aEV4aXN0cyhwYXRoLmpvaW4oZGlyLCAnZXh0ZW5zaW9uLmpzb24nKSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGhhc0Nsb3VkQ29tcG9uZW50KGRpcikge1xyXG4gIHJldHVybiBoYXNQYWNrYWdlSnNvbihwYXRoLmpvaW4oZGlyLCAnY2xvdWQnKSk7XHJcbn1cclxuXHJcbmFzeW5jIGZ1bmN0aW9uIG9mZmVyRGV2TmFtZVN5bmMoZXh0ZW5zaW9uRGlyKSB7XHJcbiAgY29uc3QgeyBuYW1lOiBleHRlbnNpb25OYW1lIH0gPSBhd2FpdCBsb2FkRXh0ZW5zaW9uSnNvbihleHRlbnNpb25EaXIpO1xyXG5cclxuICBjb25zdCBzeW5jQ2xvdWRDb21wb25lbnQgPSBhd2FpdCBoYXNDbG91ZENvbXBvbmVudChleHRlbnNpb25EaXIpO1xyXG5cclxuICBjb25zdCBhcHBQYWNrYWdlSnNvbiA9IGF3YWl0IGdldFBhY2thZ2VKc29uKHBhdGguam9pbihleHRlbnNpb25EaXIsICdhcHAnKSk7XHJcbiAgY29uc3Qgc2VydmVyUGFja2FnZUpzb24gPSBhd2FpdCBnZXRQYWNrYWdlSnNvbihwYXRoLmpvaW4oZXh0ZW5zaW9uRGlyLCAnc2VydmVyJykpO1xyXG4gIGNvbnN0IGNsb3VkUGFja2FnZUpzb24gPSBzeW5jQ2xvdWRDb21wb25lbnQgJiYgYXdhaXQgZ2V0UGFja2FnZUpzb24ocGF0aC5qb2luKGV4dGVuc2lvbkRpciwgJ2Nsb3VkJykpO1xyXG5cclxuICBjb25zdCB7IG5hbWU6IGFwcE1vZHVsZU5hbWUgfSA9IGFwcFBhY2thZ2VKc29uO1xyXG4gIGNvbnN0IHsgbmFtZTogc2VydmVyTW9kdWxlTmFtZSB9ID0gc2VydmVyUGFja2FnZUpzb247XHJcbiAgY29uc3QgeyBuYW1lOiBjbG91ZE1vZHVsZU5hbWUgfSA9IGNsb3VkUGFja2FnZUpzb24gfHwge307XHJcbiAgY29uc3QgeyBuYW1lOiBkZXZlbG9wZXJOYW1lIH0gPSBhd2FpdCBlbnN1cmVVc2VySXNMb2dnZWRJbih0cnVlKTtcclxuXHJcbiAgY29uc3QgdGFyZ2V0TW9kdWxlTmFtZSA9IGAke2RldmVsb3Blck5hbWV9LiR7ZXh0ZW5zaW9uTmFtZX1gO1xyXG4gIGlmICh0YXJnZXRNb2R1bGVOYW1lID09PSBhcHBNb2R1bGVOYW1lICYmXHJcbiAgICAgIHRhcmdldE1vZHVsZU5hbWUgPT09IHNlcnZlck1vZHVsZU5hbWUgJiZcclxuICAgICAgKCFzeW5jQ2xvdWRDb21wb25lbnQgfHwgdGFyZ2V0TW9kdWxlTmFtZSA9PT0gY2xvdWRNb2R1bGVOYW1lKSkge1xyXG4gICAgcmV0dXJuO1xyXG4gIH1cclxuXHJcbiAgaWYgKCFhd2FpdCBjb25maXJtZXIoYFlvdSdyZSB1cGxvYWRpbmcgYW4gZXh0ZW5zaW9uIHRoYXQgaXNuJ3QgeW91cnMsIGRvIHlvdSB3YW50IHRvIHJlbmFtZSBpdCBpbiB0aGUgcGFja2FnZS5qc29uIGZpbGVzP2ApKSB7XHJcbiAgICByZXR1cm47XHJcbiAgfVxyXG5cclxuICBhcHBQYWNrYWdlSnNvbi5uYW1lID0gdGFyZ2V0TW9kdWxlTmFtZTtcclxuICBhd2FpdCBzYXZlUGFja2FnZUpzb24ocGF0aC5qb2luKGV4dGVuc2lvbkRpciwgJ2FwcCcpLCBhcHBQYWNrYWdlSnNvbik7XHJcblxyXG4gIHNlcnZlclBhY2thZ2VKc29uLm5hbWUgPSB0YXJnZXRNb2R1bGVOYW1lO1xyXG4gIGF3YWl0IHNhdmVQYWNrYWdlSnNvbihwYXRoLmpvaW4oZXh0ZW5zaW9uRGlyLCAnc2VydmVyJyksIHNlcnZlclBhY2thZ2VKc29uKTtcclxuXHJcbiAgaWYgKHN5bmNDbG91ZENvbXBvbmVudCkge1xyXG4gICAgY2xvdWRQYWNrYWdlSnNvbi5uYW1lID0gdGFyZ2V0TW9kdWxlTmFtZTtcclxuICAgIGF3YWl0IHNhdmVQYWNrYWdlSnNvbihwYXRoLmpvaW4oZXh0ZW5zaW9uRGlyLCAnY2xvdWQnKSwgY2xvdWRQYWNrYWdlSnNvbik7XHJcbiAgfVxyXG59XHJcblxyXG5leHBvcnQgZGVmYXVsdCBhc3luYyBmdW5jdGlvbiBzaG91dGVtUGFjayhkaXIsIG9wdGlvbnMpIHtcclxuICBjb25zdCBwYWNrZWREaXJlY3RvcmllcyA9IFsnYXBwJywgJ3NlcnZlcicsICdjbG91ZCddLm1hcChkID0+IHBhdGguam9pbihkaXIsIGQpKTtcclxuXHJcbiAgaWYgKCFhd2FpdCBoYXNFeHRlbnNpb25zSnNvbihkaXIpKSB7XHJcbiAgICB0aHJvdyBuZXcgRXJyb3IoYCR7ZGlyfSBjYW5ub3QgYmUgcGFja2VkIGJlY2F1c2UgaXQgaGFzIG5vIGV4dGVuc2lvbi5qc29uIGZpbGUuYCk7XHJcbiAgfVxyXG5cclxuICBhd2FpdCBhd2FpdCBvZmZlckRldk5hbWVTeW5jKGRpcik7XHJcblxyXG4gIGNvbnN0IHRtcERpciA9IChhd2FpdCB0bXAuZGlyKCkpLnBhdGg7XHJcbiAgY29uc3QgcGFja2FnZURpciA9IHBhdGguam9pbih0bXBEaXIsICdwYWNrYWdlJyk7XHJcbiAgYXdhaXQgZnMubWtkaXIocGFja2FnZURpcik7XHJcblxyXG4gIGNvbnN0IGRpcnNUb1BhY2sgPSBhd2FpdCBQcm9taXNlLmZpbHRlcihwYWNrZWREaXJlY3RvcmllcywgaGFzUGFja2FnZUpzb24pO1xyXG5cclxuICBpZiAob3B0aW9ucy5ub2J1aWxkKSB7XHJcbiAgICBjb25zb2xlLmVycm9yKCdTa2lwcGluZyBidWlsZCBzdGVwIGR1ZSB0byAtLW5vYnVpbGQgZmxhZy4nKTtcclxuICB9IGVsc2Uge1xyXG4gICAgYXdhaXQgc3BpbmlmeShidWlsZE5vZGVQcm9qZWN0KHBhdGguam9pbihkaXIsICdzZXJ2ZXInKSksICdCdWlsZGluZyB0aGUgc2VydmVyIHBhcnQuLi4nLCAnT0snKTtcclxuICAgIGF3YWl0IHNwaW5pZnkoYnVpbGROb2RlUHJvamVjdChwYXRoLmpvaW4oZGlyLCAnYXBwJykpLCAnQnVpbGRpbmcgdGhlIGFwcCBwYXJ0Li4uJywgJ09LJyk7XHJcbiAgfVxyXG5cclxuICByZXR1cm4gYXdhaXQgc3BpbmlmeShhc3luYyAoKSA9PiB7XHJcbiAgICBmb3IgKGNvbnN0IGRpciBvZiBkaXJzVG9QYWNrKSB7XHJcbiAgICAgIGF3YWl0IG5wbVBhY2soZGlyLCBwYWNrYWdlRGlyKTtcclxuICAgIH1cclxuICAgIGNvbnN0IGV4dGVuc2lvbkpzb25QYXRoU3JjID0gcGF0aC5qb2luKGRpciwgJ2V4dGVuc2lvbi5qc29uJyk7XHJcbiAgICBjb25zdCBleHRlbnNpb25Kc29uUGF0aERlc3QgPSBwYXRoLmpvaW4ocGFja2FnZURpciwgJ2V4dGVuc2lvbi5qc29uJyk7XHJcbiAgICBhd2FpdCBjb3B5KGV4dGVuc2lvbkpzb25QYXRoU3JjLCBleHRlbnNpb25Kc29uUGF0aERlc3QpO1xyXG5cclxuICAgIGNvbnN0IGRlc3RpbmF0aW9uRGlyZWN0b3J5ID0gcGF0aC5qb2luKG9wdGlvbnMucGFja1RvVGVtcERpciA/IHRtcERpciA6IGRpciwgJ2V4dGVuc2lvbi50Z3onKTtcclxuICAgIGF3YWl0IHRhcmd6KCkuY29tcHJlc3MocGFja2FnZURpciwgZGVzdGluYXRpb25EaXJlY3RvcnkpO1xyXG5cclxuICAgIHJldHVybiAoe1xyXG4gICAgICBwYWNrZWREaXJzOiBkaXJzVG9QYWNrLFxyXG4gICAgICBhbGxEaXJzOiBwYWNrZWREaXJlY3RvcmllcyxcclxuICAgICAgcGFja2FnZTogZGVzdGluYXRpb25EaXJlY3RvcnksXHJcbiAgICB9KTtcclxuICB9LCAnUGFja2luZyBleHRlbnNpb24uLi4nLCAnT0snKTtcclxufVxyXG4iXX0=