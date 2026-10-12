import 'package:flutter/material.dart';
import '../theme/oprino_theme.dart';

enum OprinoLogoVariant {
  /// Full horizontal lockup (Möbius mark + 'oprino' wordmark)
  horizontal,

  /// Full horizontal lockup in white for dark surfaces
  reversed,

  /// 1:1 Möbius pin-check symbol mark only
  icon,

  /// App icon squircle badge (Light)
  appIconLight,

  /// App icon squircle badge (Dark)
  appIconDark,
}

/// Official Oprino Brand Logo widget conforming to Oprino-Brand-Kit specifications.
class OprinoBrandLogo extends StatelessWidget {
  final OprinoLogoVariant variant;
  final double? height;
  final double? width;
  final BoxFit fit;

  const OprinoBrandLogo({
    super.key,
    this.variant = OprinoLogoVariant.horizontal,
    this.height = 32,
    this.width,
    this.fit = BoxFit.contain,
  });

  /// Factory constructor for 1:1 icon symbol mark
  const OprinoBrandLogo.icon({
    super.key,
    double size = 32,
    this.fit = BoxFit.contain,
  })  : variant = OprinoLogoVariant.icon,
        height = size,
        width = size;

  /// Factory constructor for reversed logo (white text on dark background)
  const OprinoBrandLogo.reversed({
    super.key,
    this.height = 32,
    this.width,
    this.fit = BoxFit.contain,
  }) : variant = OprinoLogoVariant.reversed;

  String get _assetPath {
    switch (variant) {
      case OprinoLogoVariant.horizontal:
        return 'assets/images/logo_horizontal.png';
      case OprinoLogoVariant.reversed:
        return 'assets/images/logo_horizontal_reversed.png';
      case OprinoLogoVariant.icon:
        return 'assets/images/logo_icon.png';
      case OprinoLogoVariant.appIconLight:
        return 'assets/images/app_icon_light.png';
      case OprinoLogoVariant.appIconDark:
        return 'assets/images/app_icon_dark.png';
    }
  }

  @override
  Widget build(BuildContext context) {
    return Image.asset(
      _assetPath,
      height: height,
      width: width,
      fit: fit,
      errorBuilder: (context, error, stackTrace) {
        // High-fidelity fallback if running in environments without asset bundles
        return _buildFallback();
      },
    );
  }

  Widget _buildFallback() {
    if (variant == OprinoLogoVariant.icon) {
      final size = height ?? width ?? 32;
      return Container(
        width: size,
        height: size,
        decoration: BoxDecoration(
          color: OprinoColors.navy,
          borderRadius: BorderRadius.circular(size * 0.25),
        ),
        child: Center(
          child: Icon(
            Icons.location_on,
            color: OprinoColors.mint,
            size: size * 0.6,
          ),
        ),
      );
    }

    final h = height ?? 32;
    final isWhite = variant == OprinoLogoVariant.reversed;
    return Row(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        Container(
          width: h,
          height: h,
          decoration: BoxDecoration(
            color: OprinoColors.navy,
            borderRadius: BorderRadius.circular(h * 0.25),
          ),
          child: Center(
            child: Icon(
              Icons.location_on,
              color: OprinoColors.mint,
              size: h * 0.6,
            ),
          ),
        ),
        SizedBox(width: h * 0.25),
        Text(
          'oprino',
          style: TextStyle(
            fontFamily: 'Outfit',
            fontSize: h * 0.75,
            fontWeight: FontWeight.w800,
            color: isWhite ? OprinoColors.white : OprinoColors.navy,
            letterSpacing: -0.5,
          ),
        ),
      ],
    );
  }
}
