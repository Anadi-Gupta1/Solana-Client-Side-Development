// Digital signature examples with different curves
const crypto = require('crypto');
const { Keypair } = require('@solana/web3.js');
const nacl = require('tweetnacl');

// ECDSA with secp256k1 (Bitcoin-style)
class ECDSAExample {
    constructor() {
        const { publicKey, privateKey } = crypto.generateKeyPairSync('ec', {
            namedCurve: 'secp256k1'
        });
        this.publicKey = publicKey;
        this.privateKey = privateKey;
    }

    sign(message) {
        const signer = crypto.createSign('SHA256');
        signer.update(message);
        return signer.sign(this.privateKey);
    }

    verify(message, signature) {
        const verifier = crypto.createVerify('SHA256');
        verifier.update(message);
        return verifier.verify(this.publicKey, signature);
    }
}

// ED25519 (Solana-style)
class ED25519Example {
    constructor() {
        // Using Solana's keypair generation
        this.keypair = Keypair.generate();
    }

    sign(message) {
        const messageBytes = Buffer.from(message, 'utf8');
        return nacl.sign.detached(messageBytes, this.keypair.secretKey);
    }

    verify(message, signature) {
        const messageBytes = Buffer.from(message, 'utf8');
        return nacl.sign.detached.verify(
            messageBytes, 
            signature, 
            this.keypair.publicKey.toBytes()
        );
    }

    getPublicKey() {
        return this.keypair.publicKey.toString();
    }
}

// Example usage
console.log('=== ECDSA Example ===');
const ecdsaExample = new ECDSAExample();
const message1 = "Bitcoin transaction data";
const signature1 = ecdsaExample.sign(message1);
console.log('ECDSA Signature verified:', ecdsaExample.verify(message1, signature1));

console.log('\n=== ED25519 Example ===');
const ed25519Example = new ED25519Example();
const message2 = "Solana transaction data";
const signature2 = ed25519Example.sign(message2);
console.log('ED25519 Signature verified:', ed25519Example.verify(message2, signature2));
console.log('Public Key:', ed25519Example.getPublicKey());

module.exports = { ECDSAExample, ED25519Example };
