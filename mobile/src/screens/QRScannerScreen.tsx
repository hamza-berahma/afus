import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Camera, CameraType, useCameraPermissions, BarCodeType } from 'expo-camera';
import { useRoute, useNavigation } from '@react-navigation/native';
import { apiService } from '../services/api';
import { useToast } from '../context/ToastContext';
import TransactionConfirmationModal from '../components/TransactionConfirmationModal';
import { Transaction } from '../types';

export default function QRScannerScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { showToast } = useToast();
  const { transactionId, transaction } = route.params as { transactionId: string; transaction?: Transaction };
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [qrSignature, setQrSignature] = useState<string>('');

  const handleBarCodeScanned = async ({ data }: { data: string; type: string }) => {
    if (scanned || processing) return;

    setScanned(true);

    try {
      // Parse QR code data (assuming it contains the signature)
      let qrData;
      try {
        qrData = JSON.parse(data);
      } catch {
        // If not JSON, assume it's just the signature
        qrData = { qrSignature: data };
      }

      const signature = qrData.qrSignature || qrData.signature || data;
      setQrSignature(signature);

      // Show security confirmation modal
      setShowConfirmation(true);
    } catch (error: any) {
      showToast('Invalid QR code format', 'error');
      setScanned(false);
    }
  };

  const handleConfirmDelivery = async () => {
    setProcessing(true);
    try {
      // Confirm delivery with QR signature
      await apiService.confirmDelivery(transactionId, { qrSignature });

      showToast('Delivery confirmed! Payment released.', 'success');
      setShowConfirmation(false);
      setTimeout(() => {
        navigation.goBack();
      }, 1500);
    } catch (error: any) {
      showToast(
        error.response?.data?.error?.message || 'Failed to confirm delivery',
        'error'
      );
      setScanned(false);
      setProcessing(false);
    }
  };

  if (!permission) {
    return (
      <View style={styles.center}>
        <Text>Requesting camera permission...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Camera permission is required to scan QR codes</Text>
        <TouchableOpacity
          style={styles.button}
          onPress={requestPermission}
        >
          <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <>
      <View style={styles.container}>
        <Camera
          style={StyleSheet.absoluteFillObject}
          type={CameraType.back}
          onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
          barCodeTypes={[BarCodeType.qr]}
        />
        <View style={styles.overlay}>
          <View style={styles.scanArea} />
          <Text style={styles.instruction}>
            Position the QR code within the frame
          </Text>
          {scanned && !showConfirmation && (
            <TouchableOpacity
              style={styles.button}
              onPress={() => {
                setScanned(false);
                setProcessing(false);
              }}
            >
              <Text style={styles.buttonText}>Tap to Scan Again</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <TransactionConfirmationModal
        visible={showConfirmation}
        onConfirm={handleConfirmDelivery}
        onCancel={() => {
          setShowConfirmation(false);
          setScanned(false);
          setProcessing(false);
        }}
        transactionType="delivery"
        amount={transaction?.amount}
        details="Confirm delivery to release payment to seller"
        title="Confirm Delivery"
        description="Please confirm that you have received the delivery. This will release the payment to the seller."
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanArea: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: '#059669',
    borderRadius: 12,
    backgroundColor: 'transparent',
  },
  instruction: {
    marginTop: 32,
    color: '#ffffff',
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  button: {
    marginTop: 24,
    backgroundColor: '#059669',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorText: {
    fontSize: 16,
    color: '#ef4444',
    textAlign: 'center',
    marginBottom: 16,
  },
});

