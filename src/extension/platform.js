import path from 'path';
import url from 'url';
import replace from 'replace-in-file';
import cliUrls from '../../config/services';
import fs from 'mz/fs';
import { writeJsonFile } from '../extension/data';
import * as npm from '../extension/npm';
import { readJsonFile } from './data';
import glob from 'glob-promise';
import { ensureUserIsLoggedIn } from '../commands/login';

async function isPlatformDirectory(dir) {
  const { name } = await readJsonFile(path.join(dir, 'package.json')) || {};

  return name === '@shoutem/mobile-app';
}

export async function getPlatformRootDir(dir = process.cwd()) {
  if (await isPlatformDirectory(dir)) {
    return dir;
  }

  const parentDir = path.join(dir, '..');

  if (parentDir === dir) {
    return null;
  }
  return await getPlatformRootDir(parentDir);
}

export async function getExtensionsPaths(platformDir) {
  const paths = await glob(path.join(platformDir, 'extensions', '*', 'app'));
  console.log(paths);
  return paths;
}

export async function uncommentBuildDir(buildDirectory) {
  const buildGradlePath = path.join(buildDirectory, 'android', 'build.gradle');
  let buildGradle = await fs.readFile(buildGradlePath, 'utf-8');
  buildGradle = buildGradle.replace('//<CLI> buildDir', 'buildDir');
  await fs.writeFile(buildGradlePath, buildGradle);
}

export async function preparePlatform(platformDir, { platform, appId, debug = true, excludePackages = ['shoutem.code-push'], production = false, linkLocalExtensions = true }) {
  const mobileConfig = {
    platform,
    appId,
    serverApiEndpoint: url.parse(cliUrls.appManager).hostname,
    legacyApiEndpoint: url.parse(cliUrls.legacyService).hostname,
    authorization: await ensureUserIsLoggedIn(),
    configurationFilePath: 'config.json',
    workingDirectories: linkLocalExtensions ? await getExtensionsPaths(platformDir) : [],
    excludePackages,
    debug,
    extensionsJsPath: "./extensions.js",
    production,
    skipNativeDependencies: false
  };

  const configPath = path.join(platformDir, 'config.json');

  await writeJsonFile(mobileConfig, configPath);
  await npm.install(path.join(platformDir, 'scripts'));
  await npm.run(platformDir, 'configure'/* , ['--configPath', configPath] */);

  // android run script requires android binaries to be stored near the system's root
  if (process.platform === 'win32') {
    await uncommentBuildDir(platformDir);
  }
}

export async function buildPlatform(platformDir, platform, outputDir = process.cwd()) {
  await npm.run(platformDir, 'build', [
    '--platform', platform,
    '--outputDirectory', outputDir
  ]);
}

export async function fixPlatform(platformDir) {
  const appBuilderPath = path.join(platformDir, 'scripts', 'classes', 'app-builder.js');

  if (process.platform === 'win32') {
    try {
      await replace({
        files: appBuilderPath,
        from: './gradlew',
        to: 'gradlew'
      });
    } catch (err) {
      console.log('WARN: Could not rename ./gradle to gradle');
    }

    try {
      await replace({
        files: appBuilderPath,
        from: "const apkPath = path.join('android', 'app', 'build', 'outputs', 'apk');",
        to: "const apkPath = path.join('c:/', 'tmp', 'ShoutemApp', 'app', 'outputs', 'apk');"
      });
    } catch (err) {
      console.log('WARN: Could not adapt client for c:\\tmp build directory');
    }

    await uncommentBuildDir(platformDir);
  }
}