import { Address, toNano, beginCell } from '@ton/core';
import { Referendum } from '../wrappers/Referendum';
import { NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider) {
    console.log('🔍 Testing deployed Referendum contract using wrapper method...');
    console.log('📍 Contract address: EQA-yc574Hs7jTOhyfCmVP0tVoOq0nMvp7dmYsxSN9fk6myX');
    
    const referendum = provider.open(Referendum.createFromAddress(
        Address.parse('EQA-yc574Hs7jTOhyfCmVP0tVoOq0nMvp7dmYsxSN9fk6myX')
    ));

    console.log('\n📊 Checking initial state...');
    const initialLastId = await referendum.getLastID();
    console.log('Initial last_id:', initialLastId);

    // Use the wrapper method instead of manual message construction!
    console.log('\n💾 Attempting to save vote hash using wrapper method...');
    const testHash = beginCell()
        .storeBuffer(Buffer.from('Test vote hash from mainnet - ' + new Date().toISOString(), 'utf8'))
        .endCell();
    
    const queryId = Date.now(); // Use number, not BigInt!
    
    try {
        // Use the correct wrapper method with correct types!
        await referendum.sendSaveHash(provider.sender(), {
            value: toNano('0.05'),
            queryId: queryId,  // Now it's a number
            hash: testHash
        });
        console.log('✅ Vote hash sent successfully using wrapper!');
        console.log('Query ID:', queryId);
    } catch (error) {
        console.log('❌ Error sending vote hash:', error);
    }

    // Wait for processing
    console.log('\n⏳ Waiting 10 seconds for transaction processing...');
    await new Promise(resolve => setTimeout(resolve, 10000));

    // Check state
    console.log('\n📊 Checking state after operation...');
    const finalLastId = await referendum.getLastID();
    console.log('Final last_id:', finalLastId);

    if (finalLastId > initialLastId) {
        console.log('✅ SUCCESS! Vote was saved using wrapper method!');
        
        try {
            const savedVote = await referendum.getVotesHash(finalLastId);
            const retrievedHash = Buffer.from(
                savedVote.beginParse().loadBuffer(savedVote.bits.length / 8)
            ).toString('utf8');
            console.log('📖 Retrieved hash:', retrievedHash);
        } catch (error) {
            console.log('❌ Error retrieving vote:', error);
        }
    } else {
        console.log('⚠️ Vote still not saved even with wrapper method...');
    }
}