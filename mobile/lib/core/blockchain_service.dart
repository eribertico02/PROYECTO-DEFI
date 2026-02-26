import 'package:web3dart/web3dart.dart';
import 'package:http/http.dart';
import '../core/constants.dart';

class BlockchainService {
  late Web3Client _client;
  final String _rpcUrl = AppConstants.rpcUrl;

  BlockchainService() {
    _client = Web3Client(_rpcUrl, Client());
  }

  /// Obtiene el balance de ETH (o token nativo de la red)
  Future<EtherAmount> getEthBalance(String address) async {
    return await _client.getBalance(EthereumAddress.fromHex(address));
  }

  /// Obtiene el balance de USDC (vía ERC20)
  Future<BigInt> getUsdcBalance(String address) async {
    final contract = DeployedContract(
      ContractAbi.fromJson(
        '[{"constant":true,"inputs":[{"name":"_owner","type":"address"}],"name":"balanceOf","outputs":[{"name":"balance","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"}]',
        'USDC',
      ),
      EthereumAddress.fromHex(AppConstants.usdcAddress),
    );

    final balanceFunction = contract.function('balanceOf');
    final result = await _client.call(
      contract: contract,
      function: balanceFunction,
      params: [EthereumAddress.fromHex(address)],
    );

    return result.first as BigInt;
  }

  /// Cierra el cliente
  void dispose() {
    _client.dispose();
  }
}
