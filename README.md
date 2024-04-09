# First Coders monorepo [![Test](https://github.com/firstcoders/monorepo/actions/workflows/test.yml/badge.svg)](https://github.com/firstcoders/monorepo/actions/workflows/test.yml)

This repository is a [lerna](https://lerna.js.org/) monorepo that contains several packages relating to the [Sound Web Services Stems Player](https://www.sound.ws/products/stems-player).

Please see the README.md in the packages for further information about that package.

## Prerequisites

- [Yarn](https://yarnpkg.com/)
- [Make](https://www.gnu.org/software/make/)
- [Docker](https://www.docker.com/) - For running an example of the stems player locally
- [AWS SAM](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-install.html)
- [NVM](https://github.com/nvm-sh/nvm) - recommended

## Testing

```bash
yarn qa
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

## Other
