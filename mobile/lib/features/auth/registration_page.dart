import 'package:flutter/material.dart';
import '../../core/theme.dart';
import '../../core/auth_service.dart';
import '../../shared/main_nav_container.dart';

class RegistrationPage extends StatefulWidget {
  const RegistrationPage({super.key});

  @override
  State<RegistrationPage> createState() => _RegistrationPageState();
}

class _RegistrationPageState extends State<RegistrationPage> {
  final AuthService _authService = AuthService();
  String? _generatedKey;
  bool _isLoading = false;

  void _generateWallet() async {
    setState(() => _isLoading = true);
    final key = _authService.generatePrivateKey();
    await Future.delayed(const Duration(seconds: 2)); // Simular entropía
    setState(() {
      _generatedKey = key;
      _isLoading = false;
    });
  }

  void _confirmAndStart() async {
    if (_generatedKey != null) {
      await _authService.saveKey(_generatedKey!);
      if (mounted) {
        Navigator.of(context).pushReplacement(
          MaterialPageRoute(builder: (context) => const MainNavigationContainer()),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Crear Billetera'),
        centerTitle: true,
      ),
      body: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Text(
              'Tu identidad en el mundo DeFi',
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 16),
            const Text(
              'Generaremos una llave privada única para ti. Guárdala en un lugar seguro; no podemos recuperarla por ti.',
              textAlign: TextAlign.center,
              style: TextStyle(color: Colors.white60),
            ),
            const Spacer(),
            if (_generatedKey != null) ...[
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppTheme.surfaceColor,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppTheme.primaryColor.withOpacity(0.3)),
                ),
                child: Column(
                  children: [
                    const Text('LLAVE PRIVADA', style: TextStyle(fontSize: 12, color: AppTheme.primaryColor)),
                    const SizedBox(height: 8),
                    SelectableText(
                      _generatedKey!,
                      textAlign: TextAlign.center,
                      style: const TextStyle(fontFamily: 'monospace', fontWeight: FontWeight.bold),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),
              ElevatedButton(
                onPressed: _confirmAndStart,
                child: const Text('HE GUARDADO MI LLAVE'),
              ),
            ] else
              ElevatedButton(
                onPressed: _isLoading ? null : _generateWallet,
                child: _isLoading 
                  ? const CircularProgressIndicator(color: Colors.white)
                  : const Text('GENERAR NUEVA WALLET'),
              ),
            const SizedBox(height: 48),
          ],
        ),
      ),
    );
  }
}
