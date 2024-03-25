import { HardhatRuntimeEnvironment, RunSuperFunction, TaskArguments } from 'hardhat/types';
import { deployLibraries } from './plugin';
import { ScriptManager } from './script-manager';
import { TASK_NODE_GET_SERVER } from '@matterlabs/hardhat-zksync-node/dist/constants'
import { waitForNodeToBeReady } from '@matterlabs/hardhat-zksync-node/dist/utils'
import { JsonRpcServer } from "@matterlabs/hardhat-zksync-node/dist/server"

// Common functionality to start and stop eraTestNode
async function withEraTestNode(hre: HardhatRuntimeEnvironment, taskLogic: () => Promise<void>) {
    let eraTestNode: JsonRpcServer | undefined = undefined;
    if (hre.network.zksync && hre.network.name === 'hardhat') {
        try {
            const { commandArgs, server, port } = await hre.run(TASK_NODE_GET_SERVER);
            eraTestNode = server;
            eraTestNode!.listen(commandArgs);
            await waitForNodeToBeReady(port);
        } catch (e) {
            if (eraTestNode) {
                eraTestNode.stop();
            }
            throw new Error("Could not start Era Test Node: " + e);
        }
    }

    try {
        await taskLogic();
    } finally {
        if (eraTestNode) {
            eraTestNode.stop();
        }
    }
}

export async function zkSyncDeploy(taskArgs: TaskArguments, hre: HardhatRuntimeEnvironment) {
    await withEraTestNode(hre, async () => {
        let tags = taskArgs.tags;
        if (typeof tags === 'string') {
            tags = tags.split(',');
        }

        const scriptManager = new ScriptManager(hre);
        await scriptManager.callDeployScripts(taskArgs.script, tags);
    });
}

export async function zkSyncLibraryDeploy(taskArgs: TaskArguments, hre: HardhatRuntimeEnvironment) {
    await withEraTestNode(hre, async () => {
        await deployLibraries(
            hre,
            taskArgs.privateKeyOrIndex,
            taskArgs.externalConfigObjectPath,
            taskArgs.exportedConfigObject,
            taskArgs.noAutoPopulateConfig,
            taskArgs.compileAllContracts,
        );
    });
}
