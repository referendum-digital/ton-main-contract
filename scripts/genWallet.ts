import { mnemonicNew, mnemonicToWalletKey } from '@ton/crypto';
import { WalletContractV4 } from '@ton/ton';

async function main() {
    // Генерируем новую сид-фразу
    const mnemonics = await mnemonicNew(24);
    console.log('Seed phrase:', mnemonics.join(' '));

    // Получаем ключи по сид-фразе
    const keyPair = await mnemonicToWalletKey(mnemonics);

    // Создаём Wallet v4
    const wallet = WalletContractV4.create({ workchain: 0, publicKey: keyPair.publicKey });

    console.log('Wallet Address:', wallet.address.toString({ bounceable: false }));
    console.log('Public Key:', Buffer.from(keyPair.publicKey).toString('hex'));
    console.log('Secret Key:', Buffer.from(keyPair.secretKey).toString('hex'));
}

main();
