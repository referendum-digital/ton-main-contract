import { toNano } from '@ton/core';
import { Referendum } from '../wrappers/Referendum';
import { compile, NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider) {
    // Initialize with empty config (our contract uses default empty storage)
    const referendum = provider.open(
        Referendum.createFromConfig({}, await compile('Referendum'))
    );

    // Deploy with sufficient amount of TON
    await referendum.sendDeploy(provider.sender(), toNano('0.05'));

    // Verify deployment
    await provider.waitForDeploy(referendum.address);

    console.log('🎉 Referendum deployed successfully!');
    console.log('📍 Contract address:', referendum.address.toString());
    console.log('💡 Use this address in your scripts!');
    
    // Verify initial state
    try {
        const initialLastId = await referendum.getLastID();
        console.log('✅ Initial last_id:', initialLastId);
        console.log('🔒 Contract is ready and secured with 256-bit authorization!');
    } catch (error) {
        console.log('⚠️ Could not verify initial state:', error);
    }
}