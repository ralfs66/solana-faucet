const express = require('express');
const bodyParser = require('body-parser');
const solanaWeb3 = require('@solana/web3.js');
const fetch = require('node-fetch');
const path = require('path');

const app = express();
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

const fromPrivateKeyArray = new Uint8Array([157,253,141,XXX,215,133,37,36,233,132]);
const fromKeypair = solanaWeb3.Keypair.fromSecretKey(fromPrivateKeyArray);

const hcaptchaSecret = 'XXX';

app.post('/transfer', async (req, res) => {
  const { toPublicKey, token } = req.body;
  const amount = 0.00001; // Hardcoded amount

  try {
    const response = await fetch(`https://hcaptcha.com/siteverify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `response=${token}&secret=${hcaptchaSecret}`
    });

    const data = await response.json();

    if (!data.success) {
      return res.status(400).json({ success: false, error: 'hCaptcha verification failed' });
    }

    const connection = new solanaWeb3.Connection(solanaWeb3.clusterApiUrl('mainnet-beta'), 'confirmed');

    const transaction = new solanaWeb3.Transaction().add(
      solanaWeb3.SystemProgram.transfer({
        fromPubkey: fromKeypair.publicKey,
        toPubkey: new solanaWeb3.PublicKey(toPublicKey),
        lamports: solanaWeb3.LAMPORTS_PER_SOL * amount,
      })
    );

    const signature = await solanaWeb3.sendAndConfirmTransaction(connection, transaction, [fromKeypair]);

    res.json({ success: true, signature });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
