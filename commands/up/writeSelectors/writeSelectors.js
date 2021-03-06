const Cases = require('../../../tools/cases');
const {
  concat,
  transforms,
  parseCamelCaseToArray,
  prettify,
  ensureImport,
  capitalize,
  getDomainNameFromFolder,
} = require('../../../tools/utils');

module.exports = ({ buffer, cases, initialState, folder }) => {
  const domainName = getDomainNameFromFolder(folder);
  const mainSelector = concat([
    `export const makeSelect${cases.pascal} = () =>`,
    `  createSelector(select${capitalize(domainName)}Domain, (substate) => {`,
    `    if (!substate) return fromJS({});`,
    `    // checks if the domain is immutable, and parses it correctly`,
    `    return fromJS(substate.toJS ? substate.get('${
      cases.camel
    }') : substate.${cases.camel});`,
    `  });`,
  ]);

  return transforms(buffer, [
    ensureImport('fromJS', 'immutable', { destructure: true }),
    /** Adds the domain */
    b =>
      concat([
        b,
        `// @suit-start`,
        ``,
        `/** ${cases.display} Selectors */`,
        ``,
        mainSelector,
        !Object.keys(initialState).length ? '// @suit-end' : undefined,
      ]),
    /** Adds each field */
    ...Object.keys(initialState)
      .map(key => ({ name: key, ...initialState[key] }))
      .reverse()
      .map(({ name }, i) => b => {
        const c = new Cases(parseCamelCaseToArray(name));
        const fieldCases = c.all();

        const index = b.indexOf(mainSelector) + mainSelector.length;

        let content = '';
        content += concat([
          ``,
          `export const makeSelect${cases.pascal}${fieldCases.pascal} = () =>`,
          `  createSelector(makeSelect${cases.pascal}(), (substate) =>`,
          `    substate.get('${fieldCases.camel}'),`,
          `  );`,
        ]);
        if (i === 0) {
          content += '\n\n// @suit-end';
        }

        return concat([b.slice(0, index), content, b.slice(index)]);
      }),
    prettify,
  ]);
};
