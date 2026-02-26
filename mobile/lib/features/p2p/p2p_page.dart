import 'package:flutter/material.dart';
import '../../core/theme.dart';

class P2PPage extends StatelessWidget {
  const P2PPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: CustomScrollView(
        slivers: [
          const SliverAppBar(
            floating: true,
            title: Text('Mercado P2P'),
            centerTitle: true,
          ),
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(16.0),
              child: Row(
                children: [
                  _buildTabButton('COMPRAR', true),
                  const SizedBox(width: 12),
                  _buildTabButton('VENDER', false),
                ],
              ),
            ),
          ),
          SliverList(
            delegate: SliverChildBuilderDelegate(
              (context, index) => _buildOrderItem(index),
              childCount: 10,
            ),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () {},
        label: const Text('CREAR ORDEN'),
        icon: const Icon(Icons.add),
        backgroundColor: AppTheme.primaryColor,
      ),
    );
  }

  Widget _buildTabButton(String label, bool isActive) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12),
        decoration: BoxDecoration(
          color: isActive ? AppTheme.primaryColor : AppTheme.surfaceColor,
          borderRadius: BorderRadius.circular(12),
        ),
        child: Text(
          label,
          textAlign: TextAlign.center,
          style: TextStyle(
            fontWeight: FontWeight.bold,
            color: isActive ? Colors.white : Colors.white60,
          ),
        ),
      ),
    );
  }

  Widget _buildOrderItem(int index) {
    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Row(
                  children: [
                    CircleAvatar(
                      radius: 12,
                      backgroundColor: Colors.amber,
                      child: Icon(Icons.person, size: 16, color: Colors.black),
                    ),
                    SizedBox(width: 8),
                    Text('User_$123', style: TextStyle(fontWeight: FontWeight.bold)),
                  ],
                ),
                Text('${150 + index}% Reputación', style: const TextStyle(color: AppTheme.accentColor, fontSize: 12)),
              ],
            ),
            const SizedBox(height: 16),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Precio', style: TextStyle(color: Colors.white54, fontSize: 12)),
                    Text('42.50 VES', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppTheme.primaryColor)),
                  ],
                ),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    const Text('Límite', style: TextStyle(color: Colors.white54, fontSize: 12)),
                    const Text('50 - 500 USDC'),
                  ],
                ),
              ],
            ),
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () {},
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.primaryColor.withOpacity(0.1),
                  side: const BorderSide(color: AppTheme.primaryColor),
                ),
                child: const Text('COMPRAR USDC'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
