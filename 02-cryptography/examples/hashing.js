// Simple hash function implementation example
const crypto = require('crypto');

// SHA-256 hashing
function sha256Hash(data) {
    return crypto.createHash('sha256').update(data).digest('hex');
}

// Example usage
const message = "Hello, Solana!";
const hash = sha256Hash(message);
console.log(`Original: ${message}`);
console.log(`SHA-256: ${hash}`);

// Merkle tree simple implementation
class MerkleTree {
    constructor(data) {
        this.leaves = data.map(item => sha256Hash(item));
        this.tree = this.buildTree(this.leaves);
    }

    buildTree(leaves) {
        if (leaves.length === 1) return leaves;
        
        const nextLevel = [];
        for (let i = 0; i < leaves.length; i += 2) {
            const left = leaves[i];
            const right = leaves[i + 1] || left;
            const parent = sha256Hash(left + right);
            nextLevel.push(parent);
        }
        
        return this.buildTree(nextLevel);
    }

    getRoot() {
        return this.tree[0];
    }
}

// Example Merkle tree
const transactions = ['tx1', 'tx2', 'tx3', 'tx4'];
const merkleTree = new MerkleTree(transactions);
console.log('Merkle Root:', merkleTree.getRoot());

module.exports = { sha256Hash, MerkleTree };
