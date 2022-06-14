module.exports = {
  git: {
    commitMessage: '${version}',
    tagName: 'v${version}',
  },
  github: {
    release: true,
    releaseName: '${version}',
  },
  hooks: {
    'before:init': ['npm test'],
  },
};
