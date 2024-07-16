import { Deployer } from '@matterlabs/hardhat-zksync-deploy';
import { Wallet } from 'zksync-ethers';
import chalk from 'chalk';

import * as hre from 'hardhat';

async function main() {
    const testMnemonic = 'stuff slice staff easily soup parent arm payment cotton trade scatter struggle';
    const zkWallet = Wallet.fromMnemonic(testMnemonic, "m/44'/60'/0'/0/0");
    const deployer = new Deployer(hre, zkWallet);

    // deploy proxy
    const contractName = 'BoxUups';

    const contract = await deployer.loadArtifact(contractName);
    const box = await hre.zkUpgrades.deployProxy(contract, deployer.zkWallet, [42], { initializer: 'initialize' });

    await box.deployed();

    // upgrade proxy implementation

    const BoxUupsV2 = await deployer.loadArtifact('BoxUupsV2');
    const upgradedBox = await hre.zkUpgrades.upgradeProxy(deployer.zkWallet, box.address, BoxUupsV2);
    console.info(chalk.green('Successfully upgraded BoxUups to BoxUupsV2'));

    upgradedBox.connect(zkWallet);
    const value = await upgradedBox.retrieve();
    console.info(chalk.cyan('BoxUups value is', value));
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
