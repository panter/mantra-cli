import _ from 'lodash';
import {
  _generate, ensureModuleNameProvided, ensureModuleExists,
  removeFromIndexFile, removeFile, getOutputPath, updateIndexFile,
  getFileName
} from './utils';
import {getConfig} from '../config_utils';
import { checkFileExists } from '../utils';

export function getWebpackTemplatePath(templatesPath, jsExtension) {
  const getConfigPath = ext => `${templatesPath}/.storybook/webpack.config.${ext}`;
  const customExtConfigPath = configPath(jsExtension);

  return checkFileExists(customExtConfigPath) ? customExtConfigPath : configPath('js');
}

export function generateStorybook(name, options, customConfig = {}) {
  let [moduleName, entityName] = name.split(':');
  const config = getConfig(customConfig);
  const modulePath = `./${config.modulesPath}/${moduleName}`;

  ensureModuleNameProvided(name);
  ensureModuleExists(moduleName, customConfig);
  const {exists} = _generate('storybook', moduleName, entityName, options, config);

  if (!exists) {
    updateIndexFile({
      indexFilePath: `${modulePath}/components/${config.storiesFolder}/index.${config.jsExtension}`,
      insertImport: `import './${getFileName(customConfig, entityName)}';`,
      omitExport: true
    });
  }
}

export function destroyStorybook(name, options, customConfig = {}) {
  let [moduleName, entityName] = name.split(':');
  const config = getConfig(customConfig);
  const modulePath = `${config.modulesPath}/${moduleName}`;

  ensureModuleNameProvided(name);
  ensureModuleExists(moduleName, customConfig);
  const storyFile = getOutputPath(customConfig, 'storybook', entityName, moduleName);
  removeFile(storyFile);
  removeFromIndexFile(`./${modulePath}/components/${config.storiesFolder}/index.${config.jsExtension}`, null, customConfig);
}
