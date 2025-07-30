import { 
    Address, 
    beginCell, 
    Cell, 
    Contract, 
    contractAddress, 
    ContractProvider, 
    Sender, 
    SendMode, 
    toNano 
} from '@ton/core';

export type ReferendumConfig = {};

export function referendumConfigToCell(config: ReferendumConfig): Cell {
    return beginCell().endCell();
}

export class Referendum implements Contract {
    constructor(readonly address: Address, readonly init?: { code: Cell; data: Cell }) {}

    static createFromAddress(address: Address) {
        return new Referendum(address);
    }

    static createFromConfig(config: ReferendumConfig, code: Cell, workchain = 0) {
        const data = referendumConfigToCell(config);
        const init = { code, data };
        return new Referendum(contractAddress(workchain, init), init);
    }

    async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().endCell(),
        });
    }

    async sendSaveHash(
        provider: ContractProvider,
        via: Sender,
        opts: {
            hash: Cell;
            queryId?: number;
            value?: bigint;
        }
    ) {
        const queryId = opts.queryId ?? 0;
        const value = opts.value ?? toNano('0.02');

        const messageBody = beginCell()
            .storeUint(1, 32) // op
            .storeUint(queryId, 64) // queryId  
            .storeRef(opts.hash) // hash reference
            .endCell();

        await provider.internal(via, {
            value,
            body: messageBody,
        });
    }

    async getLastID(provider: ContractProvider): Promise<bigint> {
        const result = await provider.get('get_last_id', []);
        return result.stack.readBigNumber();
    }

    async getDebugInfo(provider: ContractProvider): Promise<bigint> {
        const result = await provider.get('get_debug_info', []);
        return result.stack.readBigNumber();
    }

    async getVotesHash(provider: ContractProvider, id: bigint): Promise<Cell> {
        const result = await provider.get('get_votes_hash', [{ type: 'int', value: id }]);
        return result.stack.readCell();
    }
}