import { EIP712Signer, Provider, Signer, Wallet } from 'zksync-ethers';
import { TransactionRequest, TransactionResponse } from 'zksync-ethers/build/types';
import { EIP712_TX_TYPE, isAddressEq, serialize } from 'zksync-ethers/build/utils';
import { ethers } from 'ethers';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { findWalletFromAddress, isImpersonatedSigner } from './utils';
import { HardhatZksyncEthersProvider } from './hardhat-zksync-provider';
import { richWallets } from './rich-wallets';
import { LOCAL_CHAIN_IDS_ENUM } from './constants';

export class HardhatZksyncSigner extends Signer {
    private accountWallet?: Wallet | EIP712Signer | undefined;

    public static from(
        signer: ethers.providers.JsonRpcSigner & { provider: HardhatZksyncEthersProvider },
        zksyncProvider?: Provider | HardhatZksyncEthersProvider,
    ): HardhatZksyncSigner {
        const newSigner: Signer = super.from(signer, zksyncProvider);
        const hardhatZksyncSigner: HardhatZksyncSigner = Object.setPrototypeOf(
            newSigner,
            HardhatZksyncSigner.prototype,
        );
        return hardhatZksyncSigner;
    }

    public async sendTransaction(transaction: TransactionRequest): Promise<TransactionResponse> {
        if (!this.accountWallet) {
            this.accountWallet = await HardhatZksyncSigner._getProperSigner(
                (this.provider as HardhatZksyncEthersProvider).hre,
                this._address,
            );
        }

        const address = await this.getAddress();
        const from = !transaction.from ? address : ethers.utils.getAddress(transaction.from);

        if (!isAddressEq(from, address)) {
            throw new Error('Transaction `from` address mismatch!');
        }

        transaction.from = from;

        if (!this.accountWallet) {
            throw new Error(`Account ${from} is not managed by the node you are connected to.`);
        }

        if (this.accountWallet instanceof EIP712Signer) {
            return this._sendTransaction(transaction);
        }

        return this.accountWallet.sendTransaction(transaction);
    }

    private async _sendTransaction(transaction: TransactionRequest): Promise<TransactionResponse> {
        if (!transaction.customData && !transaction.type) {
            // use legacy txs by default
            transaction.type = 0;
        }
        if (!transaction.customData && transaction.type !== EIP712_TX_TYPE) {
            return (await super.sendTransaction(transaction)) as TransactionResponse;
        } else {
            const address = await this.getAddress();
            transaction.from ??= address;
            if (!isAddressEq(transaction.from, address)) {
                throw new Error('Transaction `from` address mismatch!');
            }
            transaction.type = EIP712_TX_TYPE;
            transaction.value ??= 0;
            transaction.data ??= '0x';
            transaction.nonce ??= await this.getNonce();
            transaction.customData = this._fillCustomData(transaction.customData ?? {});
            transaction.gasPrice ??= await this.provider.getGasPrice();
            transaction.gasLimit ??= await this.provider.estimateGas(transaction);
            transaction.chainId ??= (await this.provider.getNetwork()).chainId;
            transaction.customData.customSignature = await (this.accountWallet as EIP712Signer).sign(transaction);

            const txBytes = serialize(transaction);
            return await this.provider.sendTransaction(txBytes);
        }
    }

    private static async _getProperSigner(
        hre: HardhatRuntimeEnvironment,
        address: string,
    ): Promise<Wallet | EIP712Signer | undefined> {
        let signer: Wallet | EIP712Signer | undefined = await findWalletFromAddress(address, hre);
        if (!signer && (await isImpersonatedSigner(hre.ethers.provider, address))) {
            signer = new EIP712Signer(
                new Wallet(richWallets[LOCAL_CHAIN_IDS_ENUM.ERA_NODE][0].privateKey),
                hre.ethers.provider.getNetwork().then((n) => Number(n.chainId)),
            );
        }

        return signer;
    }
}
