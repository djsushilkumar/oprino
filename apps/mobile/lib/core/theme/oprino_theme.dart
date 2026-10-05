import 'package:flutter/material.dart';

class OprinoColors {
  OprinoColors._();

  // Brand Colors
  static const Color navy = Color(0xFF0F172A);
  static const Color cobalt = Color(0xFF164CFF);
  static const Color ocean = Color(0xFF087DE5);
  static const Color mint = Color(0xFF20BAAA);
  static const Color deepBlue = Color(0xFF1235A4);

  // Neutral Colors
  static const Color paper = Color(0xFFF8FAFC);
  static const Color border = Color(0xFFDDE5EF);
  static const Color slate = Color(0xFF475569);
  static const Color white = Color(0xFFFFFFFF);
  static const Color black = Color(0xFF000000);

  // Status Colors
  static const Color success = Color(0xFF10B981);
  static const Color warning = Color(0xFFF59E0B);
  static const Color danger = Color(0xFFEF4444);
  static const Color info = Color(0xFF087DE5);
}

class OprinoTheme {
  OprinoTheme._();

  static ThemeData get lightTheme {
    return ThemeData(
      useMaterial3: true,
      colorScheme: ColorScheme.fromSeed(
        seedColor: OprinoColors.cobalt,
        primary: OprinoColors.cobalt,
        secondary: OprinoColors.ocean,
        tertiary: OprinoColors.mint,
        surface: OprinoColors.paper,
      ),
      scaffoldBackgroundColor: OprinoColors.paper,
      appBarTheme: const AppBarTheme(
        backgroundColor: OprinoColors.white,
        foregroundColor: OprinoColors.navy,
        elevation: 0,
        centerTitle: false,
      ),
      cardTheme: CardThemeData(
        color: OprinoColors.white,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
          side: const BorderSide(color: OprinoColors.border),
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: OprinoColors.cobalt,
          foregroundColor: OprinoColors.white,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(8),
          ),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        ),
      ),
    );
  }
}
