/**
 * SignatureCapture Component
 * Captures client/representative signature for visit verification
 * Uses react-native-signature-canvas for touch-based signing
 *
 * @module components/SignatureCapture
 */
import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  Alert,
  Dimensions,
} from 'react-native';
import SignatureScreen, { SignatureViewRef } from 'react-native-signature-canvas';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export interface SignatureData {
  signatureBase64: string;
  signedBy: 'client' | 'representative' | 'caregiver';
  signerName: string;
  signedAt: string;
}

interface SignatureCaptureProps {
  visible: boolean;
  onClose: () => void;
  onSave: (signature: SignatureData) => void;
  clientName?: string;
}

type SignerType = 'client' | 'representative' | 'caregiver';

export const SignatureCapture: React.FC<SignatureCaptureProps> = ({
  visible,
  onClose,
  onSave,
  clientName,
}) => {
  const signatureRef = useRef<SignatureViewRef>(null);
  const [signerType, setSignerType] = useState<SignerType>('client');
  const [signerName, setSignerName] = useState(clientName || '');
  const [hasSignature, setHasSignature] = useState(false);

  const handleClear = () => {
    signatureRef.current?.clearSignature();
    setHasSignature(false);
  };

  const handleSave = () => {
    if (!hasSignature) {
      Alert.alert('Signature Required', 'Please provide a signature before saving.');
      return;
    }
    if (!signerName.trim()) {
      Alert.alert('Name Required', 'Please enter the signer\'s name.');
      return;
    }
    signatureRef.current?.readSignature();
  };

  const handleOK = (signature: string) => {
    // signature is base64 encoded PNG
    const signatureData: SignatureData = {
      signatureBase64: signature,
      signedBy: signerType,
      signerName: signerName.trim(),
      signedAt: new Date().toISOString(),
    };
    onSave(signatureData);
    handleClear();
    setSignerName('');
    onClose();
  };

  const handleBegin = () => {
    setHasSignature(true);
  };

  const signerOptions: { value: SignerType; label: string }[] = [
    { value: 'client', label: 'Client' },
    { value: 'representative', label: 'Representative' },
    { value: 'caregiver', label: 'Caregiver' },
  ];

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={28} color="#333" />
          </TouchableOpacity>
          <Text style={styles.title}>Capture Signature</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Signer Type Selection */}
        <View style={styles.section}>
          <Text style={styles.label}>Who is signing?</Text>
          <View style={styles.signerOptions}>
            {signerOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.signerOption,
                  signerType === option.value && styles.signerOptionActive,
                ]}
                onPress={() => setSignerType(option.value)}
              >
                <Text
                  style={[
                    styles.signerOptionText,
                    signerType === option.value && styles.signerOptionTextActive,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Signer Name Input */}
        <View style={styles.section}>
          <Text style={styles.label}>Signer's Name</Text>
          <TextInput
            style={styles.input}
            value={signerName}
            onChangeText={setSignerName}
            placeholder="Enter full name"
            placeholderTextColor="#999"
            autoCapitalize="words"
          />
        </View>

        {/* Signature Canvas */}
        <View style={styles.signatureSection}>
          <Text style={styles.label}>Signature</Text>
          <View style={styles.signatureContainer}>
            <SignatureScreen
              ref={signatureRef}
              onOK={handleOK}
              onBegin={handleBegin}
              webStyle={signatureWebStyle}
              backgroundColor="#fff"
              penColor="#000"
            />
          </View>
          <Text style={styles.hint}>Sign within the box above</Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.clearButton} onPress={handleClear}>
            <Ionicons name="refresh" size={20} color="#666" />
            <Text style={styles.clearButtonText}>Clear</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.saveButton, !hasSignature && styles.saveButtonDisabled]}
            onPress={handleSave}
          >
            <Ionicons name="checkmark-circle" size={20} color="#fff" />
            <Text style={styles.saveButtonText}>Save Signature</Text>
          </TouchableOpacity>
        </View>

        {/* Legal Disclaimer */}
        <Text style={styles.disclaimer}>
          By signing, I acknowledge that the services documented were provided as described.
          This electronic signature is legally binding.
        </Text>
      </View>
    </Modal>
  );
};

const signatureWebStyle = `
  .m-signature-pad {
    box-shadow: none;
    border: none;
  }
  .m-signature-pad--body {
    border: 2px solid #ccc;
    border-radius: 8px;
  }
  .m-signature-pad--footer {
    display: none;
  }
`;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    paddingTop: 50,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  closeButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
  },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#495057',
    marginBottom: 8,
  },
  signerOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  signerOption: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#dee2e6',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  signerOptionActive: {
    borderColor: '#0d6efd',
    backgroundColor: '#e7f1ff',
  },
  signerOptionText: {
    fontSize: 14,
    color: '#495057',
    fontWeight: '500',
  },
  signerOptionTextActive: {
    color: '#0d6efd',
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#dee2e6',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#212529',
  },
  signatureSection: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  signatureContainer: {
    flex: 1,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#dee2e6',
  },
  hint: {
    fontSize: 12,
    color: '#6c757d',
    textAlign: 'center',
    marginTop: 8,
  },
  actions: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#dee2e6',
    backgroundColor: '#fff',
  },
  clearButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  saveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: '#0d6efd',
  },
  saveButtonDisabled: {
    backgroundColor: '#adb5bd',
  },
  saveButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  disclaimer: {
    fontSize: 11,
    color: '#6c757d',
    textAlign: 'center',
    paddingHorizontal: 24,
    paddingBottom: 30,
    lineHeight: 16,
  },
});

export default SignatureCapture;
