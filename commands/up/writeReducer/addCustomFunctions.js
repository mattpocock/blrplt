const { transforms, concat } = require('../../../tools/utils');
const replaceInNameOnly = require('../../../tools/replaceInNameOnly');

module.exports = ({ actions, keyChanges }) => buffer =>
  transforms(buffer, [
    ...keyChanges
      .filter(({ removed }) => removed.includes('actions'))
      .map(({ removedCases, addedCases }) =>
        replaceInNameOnly(
          `${removedCases.camel}CustomFunction`,
          `${addedCases.camel}CustomFunction`,
        ),
      ),
    ...Object.keys(actions)
      .map(key => ({ name: key, ...actions[key] }))
      .filter(({ customFunction }) => typeof customFunction !== 'undefined')
      .map(({ name, describe }) => b => {
        const index = b.indexOf(`const ${name}CustomFunction`);
        if (index !== -1) return b;
        return concat([
          b,
          `// @suit-name-only-start`,
          describe ? `// ${describe}` : null,
          `const ${name}CustomFunction = (state, payload) => {`,
          `  console.log('${name}CustomFunctionPayload', payload);`,
          `  return state;`,
          `};`,
          `// @suit-name-only-end`,
          ``,
        ]);
      }),
  ]);
