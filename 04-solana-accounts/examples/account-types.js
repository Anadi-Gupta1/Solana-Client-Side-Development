// Solana account examples and PDA derivation
const { 
    Connection, 
    PublicKey, 
    SystemProgram,
    LAMPORTS_PER_SOL 
} = require('@solana/web3.js');

// Account types demonstration
class SolanaAccountExamples {
    constructor(rpcUrl = 'https://api.devnet.solana.com') {
        this.connection = new Connection(rpcUrl);
    }

    // Get account info for any account
    async getAccountInfo(publicKey) {
        try {
            const accountInfo = await this.connection.getAccountInfo(
                new PublicKey(publicKey)
            );
            
            if (accountInfo) {
                console.log('Account Info:');
                console.log('- Owner:', accountInfo.owner.toString());
                console.log('- Balance:', accountInfo.lamports / LAMPORTS_PER_SOL, 'SOL');
                console.log('- Data Length:', accountInfo.data.length, 'bytes');
                console.log('- Executable:', accountInfo.executable);
                console.log('- Rent Epoch:', accountInfo.rentEpoch);
            } else {
                console.log('Account not found');
            }
            
            return accountInfo;
        } catch (error) {
            console.error('Error fetching account:', error.message);
        }
    }

    // Find Program Derived Address (PDA)
    static findPDA(seeds, programId) {
        const [pda, bump] = PublicKey.findProgramAddressSync(
            seeds,
            new PublicKey(programId)
        );
        
        console.log('PDA Details:');
        console.log('- Address:', pda.toString());
        console.log('- Bump Seed:', bump);
        console.log('- Seeds Used:', seeds.map(seed => 
            typeof seed === 'string' ? seed : seed.toString()
        ));
        
        return { pda, bump };
    }

    // Create PDA for a user and program
    static createUserPDA(userPublicKey, programId, identifier = 'user_data') {
        const seeds = [
            Buffer.from(identifier),
            new PublicKey(userPublicKey).toBuffer()
        ];
        
        return this.findPDA(seeds, programId);
    }

    // Example: Token account PDA
    static createTokenAccountPDA(mint, owner, programId) {
        const seeds = [
            new PublicKey(owner).toBuffer(),
            new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA').toBuffer(),
            new PublicKey(mint).toBuffer()
        ];
        
        return this.findPDA(seeds, programId);
    }
}

// Example usage
async function demonstrateAccounts() {
    const examples = new SolanaAccountExamples();
    
    // Example wallet address (replace with actual address)
    const walletAddress = '11111111111111111111111111111112'; // System Program
    
    console.log('=== System Program Account ===');
    await examples.getAccountInfo(walletAddress);
    
    console.log('\n=== PDA Examples ===');
    
    // Example PDA creation
    const programId = '11111111111111111111111111111112';
    const userKey = '7xLk17EQQ5KLDLDe44wCmupJKJjTGd8hs3eSVVhCx932';
    
    console.log('\n--- User Data PDA ---');
    const userPDA = SolanaAccountExamples.createUserPDA(userKey, programId);
    
    console.log('\n--- Custom PDA with multiple seeds ---');
    const customSeeds = [
        Buffer.from('my_program'),
        Buffer.from('version_1'),
        new PublicKey(userKey).toBuffer()
    ];
    SolanaAccountExamples.findPDA(customSeeds, programId);
}

// Run examples
if (require.main === module) {
    demonstrateAccounts().catch(console.error);
}

module.exports = { SolanaAccountExamples };
