import 'package:test/test.dart';
import 'package:oprino_api/oprino_api.dart';


/// tests for ProofApi
void main() {
  final instance = OprinoApi().getProofApi();

  group(ProofApi, () {
    // Upload proof of work photo
    //
    //Future<UploadProofPhoto200Response> uploadProofPhoto() async
    test('test uploadProofPhoto', () async {
      // TODO
    });

  });
}
