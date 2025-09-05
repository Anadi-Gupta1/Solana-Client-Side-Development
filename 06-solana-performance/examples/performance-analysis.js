// Performance analysis and optimization examples
const { Connection, PublicKey } = require('@solana/web3.js');

class PerformanceAnalyzer {
    constructor(rpcUrl = 'https://api.mainnet-beta.solana.com') {
        this.connection = new Connection(rpcUrl);
    }

    // Network performance metrics
    async getNetworkPerformance() {
        console.log('=== Network Performance Analysis ===');
        
        try {
            // Get recent performance samples
            const perfSamples = await this.connection.getRecentPerformanceSamples(5);
            
            console.log('Recent Performance Samples:');
            perfSamples.forEach((sample, index) => {
                console.log(`Sample ${index + 1}:`);
                console.log(`  - Slot: ${sample.slot}`);
                console.log(`  - Transactions: ${sample.numTransactions}`);
                console.log(`  - Sample Period: ${sample.samplePeriodSecs}s`);
                console.log(`  - TPS: ${(sample.numTransactions / sample.samplePeriodSecs).toFixed(2)}`);
            });

            // Calculate average TPS
            const totalTx = perfSamples.reduce((sum, sample) => sum + sample.numTransactions, 0);
            const totalTime = perfSamples.reduce((sum, sample) => sum + sample.samplePeriodSecs, 0);
            const avgTPS = totalTx / totalTime;
            
            console.log(`\nAverage TPS: ${avgTPS.toFixed(2)}`);
            
        } catch (error) {
            console.error('Error fetching performance data:', error.message);
        }
    }

    // Block production analysis
    async analyzeBlockProduction() {
        console.log('\n=== Block Production Analysis ===');
        
        try {
            // Get current slot
            const currentSlot = await this.connection.getSlot();
            console.log('Current Slot:', currentSlot);

            // Get slot leaders (validators producing blocks)
            const leaders = await this.connection.getSlotLeaders(currentSlot, 10);
            console.log('\nNext 10 Block Leaders:');
            leaders.forEach((leader, index) => {
                console.log(`  Slot ${currentSlot + index}: ${leader}`);
            });

            // Analyze block time consistency
            const recentBlocks = [];
            for (let i = 0; i < 5; i++) {
                const blockTime = await this.connection.getBlockTime(currentSlot - i);
                if (blockTime) {
                    recentBlocks.push({
                        slot: currentSlot - i,
                        timestamp: blockTime
                    });
                }
            }

            if (recentBlocks.length > 1) {
                console.log('\nBlock Time Analysis:');
                for (let i = 0; i < recentBlocks.length - 1; i++) {
                    const timeDiff = recentBlocks[i].timestamp - recentBlocks[i + 1].timestamp;
                    console.log(`  Slot ${recentBlocks[i + 1].slot} -> ${recentBlocks[i].slot}: ${timeDiff}s`);
                }
            }

        } catch (error) {
            console.error('Error analyzing block production:', error.message);
        }
    }

    // Transaction input analysis for parallelization
    analyzeTransactionInputs(transactions) {
        console.log('\n=== Transaction Input Analysis ===');
        
        const accountAccess = new Map();
        
        transactions.forEach((tx, txIndex) => {
            console.log(`\nTransaction ${txIndex + 1}:`);
            
            if (tx.transaction && tx.transaction.message) {
                const message = tx.transaction.message;
                const accounts = message.accountKeys;
                
                console.log(`  - Accounts involved: ${accounts.length}`);
                
                // Track account access patterns
                accounts.forEach((account, accIndex) => {
                    const accountKey = account.toString();
                    const isWritable = accIndex < message.header.numRequiredSignatures + 
                                     message.header.numReadonlySignedAccounts;
                    
                    if (!accountAccess.has(accountKey)) {
                        accountAccess.set(accountKey, {
                            readCount: 0,
                            writeCount: 0,
                            transactions: []
                        });
                    }
                    
                    const access = accountAccess.get(accountKey);
                    if (isWritable) {
                        access.writeCount++;
                    } else {
                        access.readCount++;
                    }
                    access.transactions.push(txIndex);
                });
            }
        });

        // Analyze parallelization potential
        console.log('\nParallelization Analysis:');
        let conflictingAccounts = 0;
        
        accountAccess.forEach((access, accountKey) => {
            if (access.writeCount > 1) {
                conflictingAccounts++;
                console.log(`  - Conflict: ${accountKey.slice(0, 8)}... (${access.writeCount} writes)`);
            }
        });

        const parallelizationScore = ((accountAccess.size - conflictingAccounts) / accountAccess.size) * 100;
        console.log(`\nParallelization Score: ${parallelizationScore.toFixed(2)}%`);
        
        return {
            totalAccounts: accountAccess.size,
            conflictingAccounts,
            parallelizationScore
        };
    }

    // Compute unit analysis
    async analyzeComputeUsage(signature) {
        console.log('\n=== Compute Unit Analysis ===');
        
        try {
            const transaction = await this.connection.getTransaction(signature, {
                commitment: 'confirmed',
                maxSupportedTransactionVersion: 0
            });

            if (transaction && transaction.meta) {
                const meta = transaction.meta;
                console.log('Transaction Compute Metrics:');
                console.log(`  - Compute Units Consumed: ${meta.computeUnitsConsumed || 'N/A'}`);
                console.log(`  - Fee: ${meta.fee} lamports`);
                console.log(`  - Status: ${meta.err ? 'Failed' : 'Success'}`);
                
                if (meta.logMessages) {
                    console.log('\nProgram Logs:');
                    meta.logMessages.forEach(log => {
                        if (log.includes('consumed')) {
                            console.log(`  - ${log}`);
                        }
                    });
                }
            }
        } catch (error) {
            console.error('Error analyzing compute usage:', error.message);
        }
    }

    // Performance benchmark
    async benchmarkRPCCalls(iterations = 10) {
        console.log(`\n=== RPC Performance Benchmark (${iterations} calls) ===`);
        
        const tests = [
            {
                name: 'getLatestBlockhash',
                fn: () => this.connection.getLatestBlockhash()
            },
            {
                name: 'getSlot',
                fn: () => this.connection.getSlot()
            },
            {
                name: 'getEpochInfo',
                fn: () => this.connection.getEpochInfo()
            }
        ];

        for (const test of tests) {
            const times = [];
            
            for (let i = 0; i < iterations; i++) {
                const start = Date.now();
                try {
                    await test.fn();
                    times.push(Date.now() - start);
                } catch (error) {
                    console.log(`  ${test.name} failed:`, error.message);
                }
            }

            if (times.length > 0) {
                const avg = times.reduce((a, b) => a + b, 0) / times.length;
                const min = Math.min(...times);
                const max = Math.max(...times);
                
                console.log(`${test.name}:`);
                console.log(`  - Average: ${avg.toFixed(2)}ms`);
                console.log(`  - Min: ${min}ms`);
                console.log(`  - Max: ${max}ms`);
            }
        }
    }
}

// Example usage
async function demonstratePerformanceAnalysis() {
    const analyzer = new PerformanceAnalyzer();
    
    // Run performance analysis
    await analyzer.getNetworkPerformance();
    await analyzer.analyzeBlockProduction();
    await analyzer.benchmarkRPCCalls(5);
    
    // Example transaction input analysis (would need real transaction data)
    console.log('\nNote: Transaction input analysis requires actual transaction data');
}

// Run examples
if (require.main === module) {
    demonstratePerformanceAnalysis().catch(console.error);
}

module.exports = { PerformanceAnalyzer };
