// Transaction building and optimization examples
const {
    Connection,
    Transaction,
    TransactionInstruction,
    SystemProgram,
    PublicKey,
    Keypair,
    sendAndConfirmTransaction,
    ComputeBudgetProgram
} = require('@solana/web3.js');

class TransactionBuilder {
    constructor(connection) {
        this.connection = connection;
    }

    // Basic SOL transfer transaction
    async createTransferTransaction(from, to, amount) {
        const transaction = new Transaction();
        
        // Add transfer instruction
        transaction.add(
            SystemProgram.transfer({
                fromPubkey: from.publicKey,
                toPubkey: new PublicKey(to),
                lamports: amount
            })
        );

        // Set recent blockhash
        const { blockhash } = await this.connection.getLatestBlockhash();
        transaction.recentBlockhash = blockhash;
        transaction.feePayer = from.publicKey;

        return transaction;
    }

    // Multi-instruction transaction
    async createBatchTransaction(instructions, feePayer) {
        const transaction = new Transaction();
        
        // Add compute budget instruction for optimization
        transaction.add(
            ComputeBudgetProgram.setComputeUnitLimit({
                units: 200_000
            })
        );

        // Add priority fee
        transaction.add(
            ComputeBudgetProgram.setComputeUnitPrice({
                microLamports: 1000
            })
        );

        // Add all instructions
        instructions.forEach(ix => transaction.add(ix));

        // Set transaction metadata
        const { blockhash } = await this.connection.getLatestBlockhash();
        transaction.recentBlockhash = blockhash;
        transaction.feePayer = feePayer;

        return transaction;
    }

    // Create account creation instruction
    createAccountInstruction(payer, newAccount, space, programId) {
        const rentExemptionAmount = this.connection.getMinimumBalanceForRentExemption(space);
        
        return SystemProgram.createAccount({
            fromPubkey: payer,
            newAccountPubkey: newAccount,
            lamports: rentExemptionAmount,
            space: space,
            programId: new PublicKey(programId)
        });
    }

    // Optimized transaction for parallel execution
    async createOptimizedTransaction(instructions, accounts) {
        // Sort accounts to optimize for parallel execution
        const sortedAccounts = this.optimizeAccountOrdering(accounts);
        
        // Create transaction with optimized account order
        const transaction = new Transaction();
        
        // Add compute optimizations
        transaction.add(
            ComputeBudgetProgram.setComputeUnitLimit({ units: 300_000 }),
            ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 2000 })
        );

        instructions.forEach(ix => transaction.add(ix));

        const { blockhash } = await this.connection.getLatestBlockhash();
        transaction.recentBlockhash = blockhash;

        return transaction;
    }

    // Account ordering optimization for parallelization
    optimizeAccountOrdering(accounts) {
        // Solana can parallelize transactions that don't share writable accounts
        // Group read-only accounts together, separate writable accounts
        const readOnlyAccounts = accounts.filter(acc => acc.isWritable === false);
        const writableAccounts = accounts.filter(acc => acc.isWritable === true);
        
        return [...readOnlyAccounts, ...writableAccounts];
    }

    // Transaction simulation and estimation
    async simulateTransaction(transaction, commitment = 'confirmed') {
        try {
            const simulation = await this.connection.simulateTransaction(
                transaction,
                { commitment }
            );

            console.log('Simulation Results:');
            console.log('- Success:', !simulation.value.err);
            console.log('- Compute Units Used:', simulation.value.unitsConsumed);
            console.log('- Logs:', simulation.value.logs);

            if (simulation.value.err) {
                console.error('Simulation Error:', simulation.value.err);
            }

            return simulation;
        } catch (error) {
            console.error('Simulation failed:', error);
            throw error;
        }
    }

    // Send and confirm with retry logic
    async sendTransactionWithRetry(transaction, signers, maxRetries = 3) {
        let attempt = 0;
        
        while (attempt < maxRetries) {
            try {
                // Simulate first
                await this.simulateTransaction(transaction);
                
                // Send transaction
                const signature = await sendAndConfirmTransaction(
                    this.connection,
                    transaction,
                    signers,
                    {
                        commitment: 'confirmed',
                        preflightCommitment: 'confirmed'
                    }
                );

                console.log('Transaction successful:', signature);
                return signature;
            } catch (error) {
                attempt++;
                console.log(`Attempt ${attempt} failed:`, error.message);
                
                if (attempt >= maxRetries) {
                    throw error;
                }
                
                // Wait before retry
                await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
                
                // Refresh blockhash for retry
                const { blockhash } = await this.connection.getLatestBlockhash();
                transaction.recentBlockhash = blockhash;
            }
        }
    }
}

// Example usage
async function demonstrateTransactions() {
    const connection = new Connection('https://api.devnet.solana.com');
    const builder = new TransactionBuilder(connection);
    
    // Create test keypairs
    const sender = Keypair.generate();
    const receiver = Keypair.generate();
    
    console.log('=== Transaction Building Examples ===');
    
    // Basic transfer
    const transferTx = await builder.createTransferTransaction(
        sender,
        receiver.publicKey.toString(),
        1000000 // 0.001 SOL
    );
    
    console.log('Transfer transaction created');
    console.log('Instructions:', transferTx.instructions.length);
    
    // Simulate the transaction (will fail without funding)
    try {
        await builder.simulateTransaction(transferTx);
    } catch (error) {
        console.log('Expected simulation failure (unfunded accounts)');
    }
}

// Run examples
if (require.main === module) {
    demonstrateTransactions().catch(console.error);
}

module.exports = { TransactionBuilder };
