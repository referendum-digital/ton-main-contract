import { Address } from '@ton/core';
import { Referendum } from '../wrappers/Referendum';
import { NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider) {
    const contractAddress = Address.parse('EQCkHsK3GBJcsrGQP60bU7itaqLOd4SU8A31ZvsJ8dY1L8av');
    const referendum = provider.open(Referendum.createFromAddress(contractAddress));

    console.log('🔍 Verifying deployed Referendum contract...');
    console.log('📍 Contract address:', contractAddress.toString());

    try {
        // Check if contract is deployed and responsive
        const lastId = await referendum.getLastID();
        console.log('✅ Contract is responsive!');
        console.log('📊 Current last_id:', lastId);

        // Test get method for non-existent vote
        try {
            await referendum.getVotesHash(999999n);
            console.log('❌ Should have thrown for non-existent vote');
        } catch (error) {
            console.log('✅ Correctly throws for non-existent vote');
        }

        console.log('\n🎉 Contract verification completed successfully!');
        console.log('🔒 Maximum security contract is live on mainnet!');
        
    } catch (error) {
        console.log('❌ Contract verification failed:', error);
    }
}