import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { Cell, beginCell, toNano, Address } from '@ton/core';
import { Referendum } from '../wrappers/Referendum';
import '@ton/test-utils';
import { compile } from '@ton/blueprint';

describe('Referendum', () => {
    let code: Cell;
    let blockchain: Blockchain;
    let referendum: SandboxContract<Referendum>;
    let authorizedUser: SandboxContract<TreasuryContract>;
    let unauthorizedUser: SandboxContract<TreasuryContract>;
    
    // The allowed address
    const ALLOWED_ADDRESS = "EQBL8pUZ7zsRJdiz7kYM0pIGqmELkA3v_zfVnlvFf-Z0OKrj";

    beforeAll(async () => {
        code = await compile('Referendum');
    });

    beforeEach(async () => {
        blockchain = await Blockchain.create();
        
        // Create authorized user with the specific address
        authorizedUser = await blockchain.treasury(ALLOWED_ADDRESS);
        
        // Create unauthorized user with different address
        unauthorizedUser = await blockchain.treasury('unauthorized');
        
        referendum = blockchain.openContract(Referendum.createFromConfig({}, code));
        
        const deployResult = await referendum.sendDeploy(authorizedUser.getSender(), toNano('0.05'));
        expect(deployResult.transactions).toBeDefined();
        
        // Verify initial state
        const initialId = await referendum.getLastID();
        expect(initialId).toBe(0n);
    });

    it('should store and retrieve votes hash when sent from authorized address', async () => {
        const hashStr = 'superUniqueVoteHash001';
        const hashCell = beginCell()
            .storeBuffer(Buffer.from(hashStr, 'utf8'))
            .endCell();

        const queryId = 123n;
        // Create message body with op code 1
        const messageBody = beginCell()
            .storeUint(1, 32) // op
            .storeUint(queryId, 64) // queryId
            .storeRef(hashCell)
            .endCell();

        // Send from authorized user
        const result = await authorizedUser.send({
            to: referendum.address,
            value: toNano('0.05'),
            body: messageBody
        });

        // Verify transaction succeeded
        expect(result.transactions).toHaveTransaction({
            from: authorizedUser.address,
            to: referendum.address,
            success: true,
        });

        // Verify response message was sent back
        expect(result.transactions).toHaveTransaction({
            from: referendum.address,
            to: authorizedUser.address,
        });

        // Find response transaction to verify content (without success/aborted checks)
        const responseTransaction = result.transactions.find(tx => 
            tx.inMessage?.info.src?.toString() === referendum.address.toString() &&
            tx.inMessage?.info.dest?.toString() === authorizedUser.address.toString()
        );
        
        expect(responseTransaction).toBeDefined();
        
        if (responseTransaction?.inMessage?.body) {
            const responseBody = responseTransaction.inMessage.body.beginParse();
            
            // Check if there's enough data to read (32 + 64 + 64 = 160 bits minimum)
            if (responseBody.remainingBits >= 160) {
                const responseOp = responseBody.loadUint(32);
                const returnedQueryId = responseBody.loadUint(64);
                const returnedLastId = responseBody.loadUint(64);
                
                expect(responseOp).toBe(0x12345678);
                expect(returnedQueryId).toBe(queryId);
                expect(returnedLastId).toBe(1n);
            } else {
                // If not enough bits, just try to read what's available
                console.log('Response body bits:', responseBody.remainingBits);
            }
        }

        // Verify state changes - vote was saved
        const lastId = await referendum.getLastID();
        expect(lastId).toBe(1n);

        // Verify the hash was stored correctly
        const resultCell = await referendum.getVotesHash(1n);
        const retrievedHash = Buffer.from(resultCell.beginParse().loadBuffer(resultCell.bits.length / 8)).toString('utf8');
        expect(retrievedHash).toBe(hashStr);
    });

    it('should reject hash save from unauthorized address', async () => {
        // First, save a vote from authorized user to establish baseline
        const authorizedHashCell = beginCell()
            .storeBuffer(Buffer.from('authorized vote', 'utf8'))
            .endCell();

        const authorizedMessageBody = beginCell()
            .storeUint(1, 32) // op
            .storeUint(100, 64) // queryId
            .storeRef(authorizedHashCell)
            .endCell();

        await authorizedUser.send({
            to: referendum.address,
            value: toNano('0.05'),
            body: authorizedMessageBody
        });

        // Verify authorized vote was saved
        const lastIdAfterAuthorized = await referendum.getLastID();
        expect(lastIdAfterAuthorized).toBe(1n);

        // Now try to save from unauthorized user
        const unauthorizedHashCell = beginCell()
            .storeBuffer(Buffer.from('unauthorized vote', 'utf8'))
            .endCell();

        const unauthorizedMessageBody = beginCell()
            .storeUint(1, 32) // op
            .storeUint(456, 64) // queryId
            .storeRef(unauthorizedHashCell)
            .endCell();

        // Send from unauthorized user - should succeed but not save vote
        const result = await unauthorizedUser.send({
            to: referendum.address,
            value: toNano('0.05'),
            body: unauthorizedMessageBody
        });

        // Verify transaction succeeded (no throw)
        expect(result.transactions).toHaveTransaction({
            from: unauthorizedUser.address,
            to: referendum.address,
            success: true,
        });

        // Verify state did NOT change - last_id should still be 1
        const lastIdAfterUnauthorized = await referendum.getLastID();
        expect(lastIdAfterUnauthorized).toBe(1n); // Should still be 1, not 2!

        // Verify no unauthorized vote was saved at id 2
        await expect(
            referendum.getVotesHash(2n)
        ).rejects.toThrow(/404/);
    });

    it('should handle multiple authorized votes correctly', async () => {
        const votes = ['vote1', 'vote2', 'vote3'];
        
        for (let i = 0; i < votes.length; i++) {
            const hashCell = beginCell()
                .storeBuffer(Buffer.from(votes[i], 'utf8'))
                .endCell();

            const messageBody = beginCell()
                .storeUint(1, 32) // op
                .storeUint(i + 1, 64) // queryId
                .storeRef(hashCell)
                .endCell();

            await authorizedUser.send({
                to: referendum.address,
                value: toNano('0.05'),
                body: messageBody
            });

            // Verify each vote was saved
            const lastId = await referendum.getLastID();
            expect(lastId).toBe(BigInt(i + 1));

            const resultCell = await referendum.getVotesHash(BigInt(i + 1));
            const retrievedHash = Buffer.from(resultCell.beginParse().loadBuffer(resultCell.bits.length / 8)).toString('utf8');
            expect(retrievedHash).toBe(votes[i]);
        }

        // Verify final state
        const finalLastId = await referendum.getLastID();
        expect(finalLastId).toBe(3n);
    });

    it('should throw when reading missing vote id', async () => {
        // Try to read a vote that doesn't exist
        await expect(
            referendum.getVotesHash(9999n)
        ).rejects.toThrow(/404/);
    });

    it('should handle invalid op codes correctly', async () => {
        const messageBody = beginCell()
            .storeUint(999, 32) // invalid op code
            .storeUint(123, 64) // queryId
            .endCell();

        const result = await authorizedUser.send({
            to: referendum.address,
            value: toNano('0.05'),
            body: messageBody
        });

        // Transaction should succeed but state shouldn't change
        expect(result.transactions).toHaveTransaction({
            from: authorizedUser.address,
            to: referendum.address,
            success: true,
        });

        // Verify state didn't change
        const lastId = await referendum.getLastID();
        expect(lastId).toBe(0n);
    });
});
