import {
  Client,
  PrivateKey,
  TokenCreateTransaction,
  TokenSupplyType
} from "@hashgraph/sdk";

async function createToken() {
  const operatorId  = '0.0.7107974'
  const operatorKey = '9ad8c091b04b07803d6246f2f77eec39469c2dd1d0800e07699e5967512455e1';

  // initialize the client for testnet
  const client = Client.forTestnet()
    .setOperator(operatorId, operatorKey);

  // generate token keys
  const supplyKey = PrivateKey.generateECDSA();
  const adminKey = supplyKey;

  // build & execute the token creation transaction
  const transaction = new TokenCreateTransaction()
    .setTokenName("ASTRA USDC")
    .setTokenSymbol("USDC")
    .setDecimals(6)
    .setInitialSupply(1_000_000_000)
    .setSupplyType(TokenSupplyType.Finite)
    .setMaxSupply(1_000_000_000)
    .setTreasuryAccountId(operatorId)
    .setAdminKey(adminKey.publicKey)
    .setSupplyKey(supplyKey.publicKey)
    .setTokenMemo("ASTRA USDC")
    .freezeWith(client);

  const signedTx = await transaction.sign(adminKey);
  const txResponse = await signedTx.execute(client);
  const receipt = await txResponse.getReceipt(client);
  const tokenId = receipt.tokenId;

  console.log(`\nFungible token created: ${tokenId}`);

  // Wait for Mirror Node to populate data
  console.log("\nWaiting for Mirror Node to update...");
  await new Promise(resolve => setTimeout(resolve, 3000));

  // query balance using Mirror Node
  const mirrorNodeUrl = `https://testnet.mirrornode.hedera.com/api/v1/accounts/${operatorId}/tokens?token.id=${tokenId}`;

  const response = await fetch(mirrorNodeUrl);
  const data = (await response.json()) as { tokens: { balance: string }[] };
  
  if (data.tokens && data.tokens.length > 0) {
    const balance = data.tokens[0].balance;
    console.log(`\nTreasury holds: ${balance} USDC\n`);
  } else {
    console.log("Token balance not yet available in Mirror Node");
  }

  client.close();
}

createToken().catch(console.error);