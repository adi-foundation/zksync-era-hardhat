#!/usr/bin/env bash

# Set script to exit on error
set -e

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" &>/dev/null && pwd)

# Create the package.json file dynamically so pnpm does not pick it up when installing dependencies.
cat <<EOF > "$SCRIPT_DIR/package.json"
{
    "name": "e2e-mixed",
    "version": "0.1.0",
    "author": "Matter Labs",
    "license": "MIT",
    "scripts": {
        "lint": "pnpm eslint",
        "prettier:check": "pnpm prettier --check",
        "lint:fix": "pnpm eslint --fix",
        "fmt": "pnpm prettier --write",
        "eslint": "eslint deploy/*.ts",
        "prettier": "prettier deploy/*.ts",
        "test": "mocha test/tests.ts --exit",
        "build": "tsc --build .",
        "clean": "rimraf dist"
    },
    "devDependencies": {
        "@types/node": "^18.11.17",
        "@typescript-eslint/eslint-plugin": "6.13.1",
        "@typescript-eslint/parser": "6.13.1",
        "eslint": "^8.54.0",
        "eslint-config-prettier": "9.0.0",
        "eslint-plugin-import": "2.29.0",
        "eslint-plugin-no-only-tests": "3.1.0",
        "eslint-plugin-prettier": "5.0.1",
        "prettier": "3.1.0",
        "rimraf": "^3.0.2",
        "ts-node": "^10.6.0",
        "typescript": "^5.1.6"
    },
    "dependencies": {
        "@matterlabs/hardhat-zksync-deploy": "0.8.0",
        "@matterlabs/hardhat-zksync-solc": "1.1.4",
        "@matterlabs/hardhat-zksync-node": "0.1.0",
        "@matterlabs/hardhat-zksync-upgradable": "0.3.1",
        "hardhat": "^2.19.4",
        "ethers": "^5.7.2",
        "zksync-ethers": "^5.0.0",
        "@matterlabs/zksync-contracts": "^0.6.1",
        "@openzeppelin/contracts": "^4.9.2",
        "@openzeppelin/contracts-upgradeable": "^4.9.2"
    },
    "prettier": {
        "tabWidth": 4,
        "printWidth": 120,
        "parser": "typescript",
        "singleQuote": true,
        "bracketSpacing": true
    }
}
EOF

echo "package.json has been created."

ls