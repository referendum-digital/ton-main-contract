import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { Address } from '@ton/core';

export async function run() {
    const blockchain = await Blockchain.create();
    
    console.log('🔍 Debugging test environment address...');
    
    const ALLOWED_ADDRESS = "EQBL8pUZ7zsRJdiz7kYM0pIGqmELkA3v_zfVnlvFf-Z0OKrj";
    console.log('📍 Expected address:', ALLOWED_ADDRESS);
    
    // Create a regular treasury (this generates a random address)
    const authorizedUser = await blockchain.treasury('authorizedUser');
    
    console.log('📱 Test environment created address:', authorizedUser.address.toString());
    console.log('📍 Addresses match?', authorizedUser.address.toString() === ALLOWED_ADDRESS);
    
    // Get hash breakdown of the generated address
    console.log('\n🔢 Test environment hash breakdown:');
    const hashBuffer = authorizedUser.address.hash;
    for (let i = 0; i < 8; i++) {
        const chunk = hashBuffer.readUInt32BE(i * 4);
        console.log(`hash${i + 1} = ${chunk}`);
    }
    
    console.log('\n📋 Contract expects (your mainnet address):');
    console.log('hash1 = 1274189081');
    console.log('hash2 = 4013625637');
    console.log('hash3 = 3635670598');
    console.log('hash4 = 215126534');
    console.log('hash5 = 2858486672');
    console.log('hash6 = 233832247');
    console.log('hash7 = 3583925189');
    console.log('hash8 = 2145809464');
    
    // Now let's check what your actual address produces
    console.log('\n🎯 Your expected address hash breakdown:');
    const expectedAddr = Address.parse(ALLOWED_ADDRESS);
    const expectedHashBuffer = expectedAddr.hash;
    for (let i = 0; i < 8; i++) {
        const chunk = expectedHashBuffer.readUInt32BE(i * 4);
        console.log(`expected_hash${i + 1} = ${chunk}`);
    }
}