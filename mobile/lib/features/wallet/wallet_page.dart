import 'package:flutter/material.dart';
import '../../core/theme.dart';

class WalletPage extends StatelessWidget {
  const WalletPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SingleChildScrollView(
        child: Column(
          children: [
            const SizedBox(height: 60),
            _buildBalanceCard(),
            const SizedBox(height: 24),
            _buildActionButtons(),
            const SizedBox(height: 32),
            _buildYieldSection(),
            const SizedBox(height: 32),
            _buildRecentActivity(),
          ],
        ),
      ),
    );
  }

  Widget _buildBalanceCard() {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 24),
      padding: const EdgeInsets.all(32),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [AppTheme.primaryColor, AppTheme.primaryColor.withOpacity(0.7)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(32),
        boxShadow: [
          BoxShadow(
            color: AppTheme.primaryColor.withOpacity(0.3),
            blurRadius: 20,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: Column(
        children: [
          const Text('BALANCE TOTAL', style: TextStyle(color: Colors.white70, letterSpacing: 1.2)),
          const SizedBox(height: 8),
          const Text(
            '\$1,250.45',
            style: TextStyle(fontSize: 40, fontWeight: FontWeight.bold, color: Colors.white),
          ),
          const SizedBox(height: 16),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.arrow_upward, color: AppTheme.accentColor, size: 16),
              const Text(' +2.5% hoy', style: TextStyle(color: AppTheme.accentColor, fontWeight: FontWeight.bold)),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildActionButtons() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceEvenly,
      children: [
        _buildActionButton(Icons.arrow_upward, 'Enviar'),
        _buildActionButton(Icons.arrow_downward, 'Recibir'),
        _buildActionButton(Icons.swap_horiz, 'Swap'),
        _buildActionButton(Icons.show_chart, 'Ahorrar'),
      ],
    );
  }

  Widget _buildActionButton(IconData icon, String label) {
    return Column(
      children: [
        CircleAvatar(
          radius: 28,
          backgroundColor: AppTheme.surfaceColor,
          child: Icon(icon, color: Colors.white),
        ),
        const SizedBox(height: 8),
        Text(label, style: const TextStyle(fontSize: 12, color: Colors.white60)),
      ],
    );
  }

  Widget _buildYieldSection() {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 24),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppTheme.surfaceColor,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: AppTheme.accentColor.withOpacity(0.2)),
      ),
      child: Row(
        children: [
          const Icon(Icons.bolt, color: AppTheme.accentColor, size: 32),
          const SizedBox(width: 16),
          const Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Yield Aggregator', style: TextStyle(fontWeight: FontWeight.bold)),
                Text('Generando 4.5% APY en Aave V4', style: TextStyle(color: Colors.white54, fontSize: 12)),
              ],
            ),
          ),
          TextButton(
            onPressed: () {},
            child: const Text('GESTIONAR'),
          ),
        ],
      ),
    );
  }

  Widget _buildRecentActivity() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Actividad Reciente', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
          const SizedBox(height: 16),
          _buildActivityItem('Compra P2P', '-\$150.00', 'Exitosa', Icons.shopping_bag),
          _buildActivityItem('Depósito Yield', '+\$500.00', 'Pendiente', Icons.bolt),
        ],
      ),
    );
  }

  Widget _buildActivityItem(String title, String amount, String status, IconData icon) {
    return ListTile(
      contentPadding: EdgeInsets.zero,
      leading: CircleAvatar(
        backgroundColor: AppTheme.surfaceColor,
        child: Icon(icon, color: Colors.white70, size: 20),
      ),
      title: Text(title),
      subtitle: Text(status, style: const TextStyle(color: Colors.white38)),
      trailing: Text(amount, style: const TextStyle(fontWeight: FontWeight.bold)),
    );
  }
}
