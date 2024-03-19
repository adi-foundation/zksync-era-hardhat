import assert from 'assert';
import { TASK_COMPILE } from 'hardhat/builtin-tasks/task-names';
import * as chai from 'chai';
import { expect } from 'chai';

import { ZkSyncArtifact } from '@matterlabs/hardhat-zksync-deploy/src/types';
import { TASK_DEPLOY_ZKSYNC } from '@matterlabs/hardhat-zksync-deploy/src/task-names';
import { TASK_VERIFY } from '@matterlabs/hardhat-zksync-verify/src/constants';

import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import { HardhatRuntimeEnvironment, RunSuperFunction, TaskArguments } from 'hardhat/types';
import { deployWithOneLineAndVerify } from '../src/plugin';
import { useEnvironmentWithLocalSetup } from './helpers';

chai.use(sinonChai);
const RICH_WALLET_PK = '0x7726827caac94a7f9e1b160f7ea819f172f7b6f9d2a97f992c38edeab82d4110';

describe('zksync toolbox plugin', function () {
    describe('with the local setup', function () {
        useEnvironmentWithLocalSetup('simple');

        it('All tasks should be registered in HRE', async function () {
            const taskNames = Object.keys(this.env.tasks);

            assert(taskNames.includes(TASK_COMPILE));
            assert(taskNames.includes(TASK_DEPLOY_ZKSYNC));
            assert(taskNames.includes(TASK_VERIFY));
        });

        it('Should successfully compile a simple contract', async function () {
            await this.env.run(TASK_COMPILE);

            const artifact = this.env.artifacts.readArtifactSync('Greeter') as ZkSyncArtifact;

            assert.equal(artifact.contractName, 'Greeter');
            assert.deepEqual(artifact.factoryDeps, {}, 'Contract unexpectedly has dependencies');
        });

        it('Should call deploy scripts through HRE', async function () {
            await this.env.run(TASK_DEPLOY_ZKSYNC);
        });

        it('Should test for properPrivateKey chai matcher', async function () {
            // eslint-disable-next-line @typescript-eslint/no-unused-expressions
            expect(RICH_WALLET_PK).to.be.properPrivateKey;
        });

        it('Reads verifyURL form network config for existing network ', async function () {
            const testnetVerifyURL = 'https://explorer.sepolia.era.zksync.dev/contract_verification';

            assert.equal(this.env.network.verifyURL, testnetVerifyURL);
        });
    });

    describe('deployWithOneLineAndVerify', () => {
        const sandbox = sinon.createSandbox();
        let hre: HardhatRuntimeEnvironment;
        let runSuper: RunSuperFunction<TaskArguments>;
        const artifact = {
            sourceName: 'contracts/MyContract.sol',
            contractName: 'MyContract',
        };

        this.beforeEach(() => {
            runSuper = sandbox.stub().resolves({
                getAddress: async () => '0x1234567890123456789012345678901234567890',
                abi: [],
            }) as any;
            hre = {
                deployer: {
                    loadArtifact: sandbox.stub().resolves(artifact),
                },
                run: sandbox.stub(),
            } as any;
        });

        afterEach(() => {
            sandbox.restore();
        });

        const taskArgs = {
            contractName: 'MyContract',
            constructorArgsParams: [],
            constructorArgs: undefined,
            noCompile: false,
            verify: true,
        };

        it('should deploy the contract and verify it', async () => {
            await deployWithOneLineAndVerify(hre, runSuper, taskArgs);

            expect(runSuper).to.have.been.calledOnceWith(taskArgs);
            expect(hre.deployer.loadArtifact).to.have.been.calledOnceWith(taskArgs.contractName);
            expect(hre.run).to.have.been.calledOnceWith('verify', {
                contract: `${artifact.sourceName}:${artifact.contractName}`,
                address: '0x1234567890123456789012345678901234567890',
                constructorArgsParams: taskArgs.constructorArgsParams,
                constructorArgs: taskArgs.constructorArgs,
                noCompile: taskArgs.noCompile,
            });
        });

        it('should deploy the contract without verifying it', async () => {
            taskArgs.verify = false;
            await deployWithOneLineAndVerify(hre, runSuper, taskArgs);

            expect(runSuper).to.have.been.calledOnceWith(taskArgs);
            expect(hre.run).to.have.been.callCount(0);
        });
    });
});