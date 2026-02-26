import 'package:web3dart/web3dart.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:crypto/crypto.dart';
import 'dart:convert';
import 'dart:math';

class AuthService {
  static const String _keyStorage = 'user_private_key';

  /// Genera una nueva llave privada aleatoria
  String generatePrivateKey() {
    final random = Random.secure();
    final bytes = List<int>.generate(32, (_) => random.nextInt(256));
    return bytesToHex(bytes);
  }

  /// Guarda la llave privada en almacenamiento local seguro (simulado con SharedPreferences)
  Future<void> saveKey(String privateKey) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_keyStorage, privateKey);
  }

  /// Recupera la llave privada guardada
  Future<String?> getStoredKey() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_keyStorage);
  }

  /// Verifica si el usuario ya tiene una cuenta creada localmente
  Future<bool> hasAccount() async {
    final key = await getStoredKey();
    return key != null;
  }

  /// Borra la cuenta localmente
  Future<void> clearAccount() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_keyStorage);
  }
}
