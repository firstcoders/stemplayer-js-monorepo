# @soundws/webcomponents [![Test](https://github.com/sound-ws/webcomponents/actions/workflows/test.yml/badge.svg)](https://github.com/sound-ws/webcomponents/actions/workflows/test.yml)

This repository is a [lerna](https://lerna.js.org/) monorepo that contains several packages relating to [@stemplayer-js](https://stemplayer-js.com).

Please see the README.md in the packages for further information about each package.

## Testing

```bash
yarn lint
yarn test
```

## Workflow & CI

### Versioning and Conventional Commits

This repo enforces [conventional commits](https://www.conventionalcommits.org/en/v1.0.0-beta.2/). When used in combination with lerna, it becomes a very powerful tool to manage package releases.

Do not push to master directly. The CI is triggered through pull requests, in the following fashion:

- When a pull request is created or updated the test suite is run
- When a pull request is merged into the branch named `development` packages (and SAR application) is published as _pre-release_.
- When a pull request is merged into the _master_ branch, packages (and SAR applications) are published as _release_
- Releases follow [semantic versioning](https://semver.org/) which is achieved via the combination of lerna and conventional commits.

### Commit hooks

- Commit messages are enforced through [commitlint](https://commitlint.js.org/#/). As already mentioned, in order for proper versioning, proper commit messages are essential.
- Eslint is run using [lint-staged](https://www.npmjs.com/package/lint-staged) which checks if staged javascript files are conform the eslint configuration.

## License

Copyright (C) 2019-2024 First Coders LTD

See [LICENSE.txt](./LICENSE.txt) for license information for the various packages in this repo.
