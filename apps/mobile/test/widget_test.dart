import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:oprino_mobile/main.dart';

void main() {
  testWidgets('Oprino app shell boots cleanly and displays branding', (WidgetTester tester) async {
    await tester.pumpWidget(
      const ProviderScope(
        child: OprinoMobileApp(),
      ),
    );

    // Initial pump and settle
    await tester.pumpAndSettle();

    // Verify brand wordmark
    expect(find.text('oprino'), findsOneWidget);

    // Verify Phase 01C Scaffolding title
    expect(find.text('Phase 01C Scaffolding Baseline'), findsOneWidget);

    // Verify initial role mode
    expect(find.text('Field Mode'), findsNWidgets(2)); // One in appbar, one in switcher
  });
}
