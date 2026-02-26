class AppConstants {
  static const String appName = 'DeFi P2P';
  
  // Base Network (Sepolia/Testnet por ahora)
  static const String rpcUrl = 'https://sepolia.base.org';
  static const int chainId = 84532;
  
  // Direcciones de Contratos (Placholders para despliegue real)
  static const String escrowP2PAddress = '0x0000000000000000000000000000000000000000';
  static const String smartWalletAddress = '0x0000000000000000000000000000000000000000';
  static const String yieldAggregatorAddress = '0x0000000000000000000000000000000000000000';
  static const String usdcAddress = '0x03c6b3f797120573e86da9f836526139ce8d76db'; // Mock USDC en Base Sepolia

  // Otros
  static const String entryPointAddress = '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789'; // ERC-4337 EntryPoint
}
