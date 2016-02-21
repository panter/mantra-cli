import fs from 'fs';
import path from 'path';
import _ from 'lodash';
import {mkdirsSync, copySync, outputFileSync} from 'fs-extra';
import {template, capitalize} from 'lodash';
import {green, yellow, cyan} from 'colors';
import {writeToFile} from '../utils';
import matchBracket from 'match-bracket';
import {findOne} from 'locater';

function getOutputPath(type, moduleName, entityName) {
  const extensionMap = {
    action: 'js',
    component: 'jsx',
    configs: 'js',
    container: 'js'
  };
  let extension = extensionMap[type];
  let outputFileName = `${entityName}.${extension}`;

  return `./client/modules/${moduleName}/${type}s/${outputFileName}`;
}

function getTemplatePath(type, moduleName) {
  return path.resolve(
    __dirname,
    `../../templates/client/modules/${moduleName}/${type}s/generic.tt`
  );
}

function readTemplateContent(type, moduleName) {
  let templatePath = getTemplatePath(type, moduleName);

  return fs.readFileSync(templatePath);
}

function getTemplateVaraibles(type, entityName) {
  if (type === 'component') {
    return {componentName: capitalize(entityName)};
  } else if (type === 'container') {
    return {
      componentName: capitalize(entityName),
      componentFileName: entityName
    };
  }

  return {};
}

function checkFileExists(path) {
  try {
    fs.lstatSync(path);
  } catch (e) {
    return false;
  }

  return true;
}

export default function generate(type, name) {
  let [moduleName, entityName] = name.split(':');

  function _generate(type, moduleName, entityName, done) {
    let templateContent = readTemplateContent(type, moduleName);
    let outputPath = getOutputPath(type, moduleName, entityName);
    let templateVariables = getTemplateVaraibles(type, entityName);
    let component = template(templateContent)(templateVariables);

    if (checkFileExists(outputPath)) {
      return console.log(cyan(`  exists`) + '  ' + outputPath);
    }

    fs.writeFileSync(outputPath, component);
    console.log(green(`  create`) + '  ' + outputPath);

    if (done) {
      done();
    }
  }

  if (type === 'container') {
    _generate('container', moduleName, entityName);
    _generate('component', moduleName, entityName);
  } else if (type === 'component') {
    _generate('component', moduleName, entityName);
  } else if (type === 'action') {
    _generate('action', moduleName, entityName, function () {
      let indexFilePath = `./client/modules/${moduleName}/actions/index.js`;
      writeToFile(indexFilePath,
        `import ${entityName} from './${entityName}';`,
        {or: [
          {after: {regex: /import .*\n/g, last: true}, asNewLine: true},
          {before: {line: 1}, asNewLine: true, _appendToModifier: '\n'}
        ]});

      let content = fs.readFileSync(indexFilePath, {encoding: 'utf-8'});
      let exportBlockStartPos = findOne(/export default {/g, content);
      const bracketCursor = 16; // cursor at which the bracket appears in the line where export block starts
      let matchedBracketPos = matchBracket(content, _.assign(exportBlockStartPos, {cursor: bracketCursor}));

      writeToFile(indexFilePath, `  ${entityName}`,
        {before: {line: matchedBracketPos.line}, asNewLine: true});

      console.log(yellow(`  update`) + '  ' + indexFilePath);
    });
  }
}