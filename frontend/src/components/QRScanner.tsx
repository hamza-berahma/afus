import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { AlertCircle } from 'lucide-react';
import { Button } from './ui/Button';
import toast from 'react-hot-toast';

interface QRScannerProps {
  onSuccess: (decodedText: string) => void;
  onClose: () => void;
}

export const QRScanner: React.FC<QRScannerProps> = ({ onSuccess, onClose }) => {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  useEffect(() => {
    const startScanning = async () => {
      try {
        // Check for camera permissions
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        stream.getTracks().forEach((track) => track.stop()); // Stop immediately, just checking
        setHasPermission(true);

        const scanner = new Html5Qrcode('qr-reader');
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
          },
          (decodedText) => {
            setScanning(false);
            scanner.stop();
            onSuccess(decodedText);
          },
          () => {
            // Ignore scanning errors, just keep trying
          }
        );

        setScanning(true);
        setError(null);
      } catch (err: any) {
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setHasPermission(false);
          const errorMsg = 'Camera permission denied. Please allow camera access.';
          setError(errorMsg);
          toast.error(errorMsg);
        } else if (err.name === 'NotFoundError') {
          const errorMsg = 'No camera found on this device.';
          setError(errorMsg);
          toast.error(errorMsg);
        } else {
          const errorMsg = `Failed to start QR scanner: ${err.message}`;
          setError(errorMsg);
          toast.error(errorMsg);
        }
      }
    };

    startScanning();

    return () => {
      if (scannerRef.current) {
        scannerRef.current
          .stop()
          .then(() => {
            scannerRef.current = null;
          })
          .catch(() => {
            scannerRef.current = null;
          });
      }
    };
  }, [onSuccess]);

  const handleStop = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        setScanning(false);
      } catch (err) {
        // Silently handle stop errors as they're not critical
        setScanning(false);
      }
    }
    onClose();
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-4 bg-error-50 border border-error-200 rounded-lg flex items-start gap-3">
          <AlertCircle size={20} className="text-error-600 flex-shrink-0 mt-0.5" />
          <div className="flex-grow">
            <p className="text-error-700 font-medium">{error}</p>
            {!hasPermission && (
              <p className="text-sm text-error-600 mt-1">
                Please enable camera permissions in your browser settings.
              </p>
            )}
          </div>
        </div>
      )}

      {hasPermission === false && (
        <div className="p-4 bg-warning-50 border border-warning-200 rounded-lg">
          <p className="text-warning-700 text-sm">
            Camera access is required to scan QR codes. Please grant permission and try again.
          </p>
        </div>
      )}

      <div
        id="qr-reader"
        className="w-full rounded-lg overflow-hidden bg-gray-100"
        style={{ minHeight: '300px' }}
      />

      {scanning && (
        <div className="text-center">
          <p className="text-sm text-gray-600">Point your camera at the QR code</p>
        </div>
      )}

      <div className="flex gap-3">
        <Button variant="secondary" onClick={handleStop} fullWidth>
          Cancel
        </Button>
      </div>
    </div>
  );
};

