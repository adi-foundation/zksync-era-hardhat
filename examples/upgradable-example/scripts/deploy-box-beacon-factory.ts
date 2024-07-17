import { Deployer } from '@matterlabs/hardhat-zksync-deploy';
import { ContractFactory, Wallet } from 'zksync-ethers';
import chalk from 'chalk';

import * as hre from 'hardhat';

async function main() {
    const contractName = 'Box';
    console.info(chalk.yellow(`Deploying ${contractName}...`));

    const testMnemonic = 'stuff slice staff easily soup parent arm payment cotton trade scatter struggle';
    const zkWallet = Wallet.fromMnemonic(testMnemonic);

    const deployer = new Deployer(hre, zkWallet);

    const boxArtifact = await hre.deployer.loadArtifact(contractName);
    const boxFactory = new ContractFactory(boxArtifact.abi, boxArtifact.bytecode, deployer.zkWallet);

    const beacon = await hre.zkUpgrades.deployBeacon(boxFactory);
    await beacon.deployed();

    const box = await hre.zkUpgrades.deployBeaconProxy(deployer.zkWallet, beacon.address, boxArtifact, [42], {});
    await box.deployed();

    box.connect(zkWallet);
    const value = await box.retrieve();
    console.info(chalk.cyan('Box value is: ', value));
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
