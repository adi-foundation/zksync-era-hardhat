import Module from 'module';
const originalRequire = Module.prototype.require; // Save a reference to the original 'require' method

const checkForEtherscan = (): void => {
    // Override the 'require' method
    (Module.prototype.require as any) = function (this: any, id: string) {
        if (id === '@nomiclabs/hardhat-etherscan') {
            throw new Error(
                '@nomiclabs/hardhat-etherscan is deprecated and it is incompatible with the current version of @matterlabs/hardhat-zksync-verify',
            );
        }
        // Call the original 'require' method to load the module as usual
        return originalRequire.apply(this, arguments as any);
    };
};
checkForEtherscan();

import '@nomicfoundation/hardhat-verify';
import { extendEnvironment, subtask, task, types } from 'hardhat/config';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import './type-extensions';

import {
    TASK_VERIFY,
    TASK_VERIFY_GET_COMPILER_VERSIONS,
    TASK_VERIFY_VERIFY,
    TESTNET_VERIFY_URL,
    TASK_VERIFY_GET_CONTRACT_INFORMATION,
    TASK_CHECK_VERIFICATION_STATUS,
    TASK_VERIFY_GET_CONSTRUCTOR_ARGUMENTS,
} from './constants';

import { getCompilerVersions, verify, verifyContract, getContractInfo, getConstructorArguments } from './task-actions';
import { checkVerificationStatus } from './plugin';

extendEnvironment((hre: HardhatRuntimeEnvironment) => {
    hre.network.verifyURL = hre.network.config.verifyURL ?? TESTNET_VERIFY_URL;
});

task(TASK_VERIFY, 'Verifies contract on Ethereum and ZKsync networks')
    .addFlag('noCompile', 'Run verify without compile')
    .setAction(verify);

subtask(TASK_VERIFY_VERIFY).setAction(verifyContract);

subtask(TASK_VERIFY_GET_COMPILER_VERSIONS).setAction(getCompilerVersions);

subtask(TASK_VERIFY_GET_CONSTRUCTOR_ARGUMENTS).setAction(getConstructorArguments);

subtask(TASK_VERIFY_GET_CONTRACT_INFORMATION).setAction(getContractInfo);

task(TASK_CHECK_VERIFICATION_STATUS)
    .addParam('verificationId', 'An ID returned by the verification request', undefined, types.int)
    .setAction(checkVerificationStatus);
