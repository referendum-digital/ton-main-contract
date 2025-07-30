import { Address } from '@ton/core';
import { NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider) {
    // The raw address from the transaction
    const rawAddress = "0:4bf29519ef3b1125d8b3ee460cd29206aa610b900defff37d59e5bc57fe67438";
    
    console.log('🔍 Debugging address formats...');
    console.log('📍 Raw address from transaction:', rawAddress);
    
    try {
        const addr = Address.parseRaw(rawAddress);
        console.log('📱 User-friendly format:', addr.toString());
        console.log('📍 Same as your wallet?', addr.toString() === 'UQBL8pUZ7zsRJdiz7kYM0pIGqmELkA3v_zfVnlvFf-Z0OPcm');
        
        // Get hash breakdown
        console.log('\n🔢 Hash breakdown for contract comparison:');
        const hashBuffer = addr.hash;
        for (let i = 0; i < 8; i++) {
            const chunk = hashBuffer.readUInt32BE(i * 4);
            console.log(`hash${i + 1} = ${chunk}`);
        }
        
        console.log('\n📋 Expected values in contract:');
        console.log('hash1 = 1158411846');
        console.log('hash2 = 2430515172');
        console.log('hash3 = 2030133124');
        console.log('hash4 = 3595778313');
        console.log('hash5 = 4264811358');
        console.log('hash6 = 2587565325');
        console.log('hash7 = 332333769');
        console.log('hash8 = 632223996');
        
    } catch (error) {
        console.log('❌ Error parsing address:', error);
    }
}