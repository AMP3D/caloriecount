import { Html5Qrcode } from 'html5-qrcode';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { FoodItem } from '../../models';
import { addFoodItem } from '../../storage/actions';
import type { NutritionOcrResult } from '../../utils/nutrition-ocr';
import { recognizeNutritionLabel } from '../../utils/nutrition-ocr';
import './ScanTab.scss';

const BARCODE_READER_ID = 'scan-barcode-reader';

type WizardStep = 'barcode' | 'confirm' | 'nutrition';

interface ScanTabProps {
  onSelect: (food: FoodItem, amount: number) => void;
}

export const ScanTab = ({ onSelect }: ScanTabProps) => {
  const [amount, setAmount] = useState('');
  const [barcode, setBarcode] = useState('');
  const [brand, setBrand] = useState('');
  const [caloriesPerServing, setCaloriesPerServing] = useState('');
  const [carbsPerServing, setCarbsPerServing] = useState('');
  const [error, setError] = useState('');
  const [fatPerServing, setFatPerServing] = useState('');
  const [name, setName] = useState('');
  const [nutritionCameraActive, setNutritionCameraActive] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [proteinPerServing, setProteinPerServing] = useState('');
  const [scanning, setScanning] = useState(false);
  const [servingSize, setServingSize] = useState('');
  const [step, setStep] = useState<WizardStep>('barcode');

  const nutritionStreamRef = useRef<MediaStream | null>(null);
  const nutritionVideoRef = useRef<HTMLVideoElement>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  const canSave = useMemo(() => {
    return name?.trim() && parseFloat(caloriesPerServing) > -1 && parseFloat(servingSize) > -1;
  }, [name, caloriesPerServing, servingSize]);

  useEffect(() => {
    return () => {
      stopBarcodeScanner();
      stopNutritionCamera();
    };
  }, []);

  useEffect(() => {
    if (step === 'barcode' && !scanning && !barcode) {
      const timer = setTimeout(() => startBarcodeScanner(), 100);

      return () => clearTimeout(timer);
    }
  }, [step]);

  useEffect(() => {
    if (step === 'nutrition' && !nutritionCameraActive) {
      startNutritionCamera();
    }
  }, [step]);

  const applyOcrResult = (result: NutritionOcrResult) => {
    if (result.calories !== undefined) {
      setCaloriesPerServing(result.calories.toString());
    }
    if (result.carbs !== undefined) {
      setCarbsPerServing(result.carbs.toString());
    }
    if (result.fat !== undefined) {
      setFatPerServing(result.fat.toString());
    }
    if (result.protein !== undefined) {
      setProteinPerServing(result.protein.toString());
    }
    if (result.servingSize !== undefined) {
      setServingSize(result.servingSize.toString());
    }
  };

  const captureNutritionFrame = useCallback(async (): Promise<Blob | null> => {
    const video = nutritionVideoRef.current;

    if (!video) {
      return null;
    }

    const canvas = document.createElement('canvas');

    canvas.height = video.videoHeight;
    canvas.width = video.videoWidth;

    const ctx = canvas.getContext('2d');

    if (!ctx) {
      return null;
    }

    ctx.drawImage(video, 0, 0);

    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), 'image/png');
    });
  }, []);

  const handleCaptureNutrition = async () => {
    setError('');
    setProcessing(true);

    try {
      const blob = await captureNutritionFrame();

      if (!blob) {
        setError('Failed to capture image. Try again.');
        setProcessing(false);
        return;
      }

      const result = await recognizeNutritionLabel(blob);

      applyOcrResult(result);

      const hasAnyData = Object.values(result).some((v) => v !== undefined);

      if (!hasAnyData) {
        setError('Could not read nutrition info. You can retry or adjust values manually.');
      }
    } catch {
      setError('OCR failed. You can retry or adjust values manually.');
    } finally {
      setProcessing(false);
      stopNutritionCamera();
      setStep('confirm');
    }
  };

  const handleRescanNutrition = () => {
    setError('');
    setStep('nutrition');
  };

  const handleGoToNutrition = async () => {
    await stopBarcodeScanner();
    setError('');
    setStep('nutrition');
  };

  const handleSave = async () => {
    if (!canSave) {
      return;
    }

    const foodData = {
      barcode: barcode || undefined,
      brand,
      caloriesPerServing: parseFloat(caloriesPerServing) || 0,
      carbsPerServing: parseFloat(carbsPerServing) || 0,
      fatPerServing: parseFloat(fatPerServing) || 0,
      name,
      proteinPerServing: parseFloat(proteinPerServing) || 0,
      servingSize: parseFloat(servingSize) || 1,
    };

    const newFood = await addFoodItem(foodData);

    onSelect(newFood, parseFloat(amount) || 0);
  };

  const handleSkipToConfirm = () => {
    stopNutritionCamera();
    setError('');
    setStep('confirm');
  };

  const startBarcodeScanner = async () => {
    setError('');

    const onSuccess = (decodedText: string) => {
      setBarcode(decodedText);
      stopBarcodeScanner();
    };

    try {
      const scanner = new Html5Qrcode(BARCODE_READER_ID);

      scannerRef.current = scanner;

      const config = { fps: 10 };

      try {
        await scanner.start({ facingMode: 'environment' }, config, onSuccess, undefined);
      } catch {
        await scanner.start({ facingMode: 'user' }, config, onSuccess, undefined);
      }

      setScanning(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';

      setError(`Camera error: ${message}`);
    }
  };

  const startNutritionCamera = async () => {
    setError('');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });

      nutritionStreamRef.current = stream;
      setNutritionCameraActive(true);

      if (nutritionVideoRef.current) {
        nutritionVideoRef.current.srcObject = stream;
      }
    } catch {
      setError('Camera access denied. Please allow camera access and try again.');
    }
  };

  const stopBarcodeScanner = async () => {
    if (scannerRef.current) {
      try {
        const state = scannerRef.current.getState();

        if (state === 2) {
          await scannerRef.current.stop();
        }
      } catch {
        // Scanner may already be stopped
      }

      scannerRef.current = null;
    }

    setScanning(false);
  };

  const stopNutritionCamera = () => {
    if (nutritionStreamRef.current) {
      nutritionStreamRef.current.getTracks().forEach((track) => track.stop());
      nutritionStreamRef.current = null;
    }

    setNutritionCameraActive(false);
  };

  if (step === 'barcode') {
    return (
      <div className="scan-wizard">
        <div className="scan-step-header">
          <span className="scan-step-label">Step 1 of 3</span>

          <h3 className="scan-step-title">Scan Barcode / UPC</h3>

          <p className="scan-step-description">
            {scanning
              ? 'Point your camera at the barcode — it will be detected automatically.'
              : 'Starting camera... or enter the barcode manually below.'}
          </p>
        </div>

        <div className="scan-barcode-reader" id={BARCODE_READER_ID} />

        {error && <p className="scan-error">{error}</p>}

        {barcode && <p className="scan-success">Detected: {barcode}</p>}

        <div className="scan-manual-entry">
          <label htmlFor="scan-barcode">Barcode / UPC</label>

          <input
            className="search-input"
            id="scan-barcode"
            onChange={(e) => setBarcode(e.target.value)}
            placeholder="e.g. 012345678905"
            type="text"
            value={barcode}
          />
        </div>

        <div className="scan-nav-actions">
          <button className="save-btn" onClick={handleGoToNutrition}>
            {barcode ? 'Next: Scan Nutrition Label' : 'Skip — Enter Manually'}
          </button>
        </div>
      </div>
    );
  }

  if (step === 'nutrition') {
    return (
      <div className="scan-wizard">
        <div className="scan-step-header">
          <span className="scan-step-label">Step 2 of 3</span>

          <h3 className="scan-step-title">Scan Nutrition Label</h3>

          <p className="scan-step-description">Point your camera at the Nutrition Facts label.</p>
        </div>

        <div className="scan-camera-container">
          <video
            autoPlay
            className="scan-camera-preview"
            muted
            playsInline
            ref={nutritionVideoRef}
          />

          <div className="scan-camera-overlay" />
        </div>

        {error && <p className="scan-error">{error}</p>}

        <div className="scan-actions">
          <button
            className={`save-btn ${processing ? 'disabled' : ''}`}
            disabled={processing}
            onClick={handleCaptureNutrition}
          >
            {processing ? 'Reading Label...' : 'Capture Nutrition Label'}
          </button>

          <button className="add-btn" onClick={handleSkipToConfirm}>
            Skip — Enter Manually
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="scan-wizard">
      <div className="scan-step-header">
        <span className="scan-step-label">Step 3 of 3</span>

        <h3 className="scan-step-title">Confirm Details</h3>

        <p className="scan-step-description">Review and adjust the scanned values, then save.</p>
      </div>

      <div className="custom-form">
        {barcode && (
          <div className="custom-form-row">
            <label htmlFor="scan-confirm-barcode">UPC / Barcode</label>

            <input
              id="scan-confirm-barcode"
              onChange={(e) => setBarcode(e.target.value)}
              type="text"
              value={barcode}
            />
          </div>
        )}

        <label htmlFor="scan-confirm-brand">Brand</label>

        <textarea
          id="scan-confirm-brand"
          onChange={(e) => setBrand(e.target.value)}
          required={brand.trim() === ''}
          value={brand}
        />

        <label htmlFor="scan-confirm-name">Name</label>

        <textarea
          id="scan-confirm-name"
          onChange={(e) => setName(e.target.value)}
          required={name.trim() === ''}
          value={name}
        />

        <div className="custom-form-row horizontal-line">
          <label htmlFor="scan-confirm-amount">Amount to log today (g)</label>

          <input
            id="scan-confirm-amount"
            onChange={(e) => setAmount(e.target.value)}
            type="number"
            value={amount}
          />
        </div>

        <div className="custom-form-row">
          <label htmlFor="scan-confirm-serving">Serving Size (g)</label>

          <input
            id="scan-confirm-serving"
            onChange={(e) => setServingSize(e.target.value)}
            required={servingSize.trim() === ''}
            step="0.01"
            type="number"
            value={servingSize}
          />
        </div>

        <div className="custom-form-row">
          <label htmlFor="scan-confirm-calories">Calories</label>

          <input
            id="scan-confirm-calories"
            onChange={(e) => setCaloriesPerServing(e.target.value)}
            required={caloriesPerServing.trim() === ''}
            step="0.01"
            type="number"
            value={caloriesPerServing}
          />
        </div>

        <div className="custom-form-row">
          <label htmlFor="scan-confirm-fat">Fat</label>

          <input
            id="scan-confirm-fat"
            onChange={(e) => setFatPerServing(e.target.value)}
            step="0.01"
            type="number"
            value={fatPerServing}
          />
        </div>

        <div className="custom-form-row">
          <label htmlFor="scan-confirm-carbs">Carbs</label>

          <input
            id="scan-confirm-carbs"
            onChange={(e) => setCarbsPerServing(e.target.value)}
            step="0.01"
            type="number"
            value={carbsPerServing}
          />
        </div>

        <div className="custom-form-row">
          <label htmlFor="scan-confirm-protein">Protein</label>

          <input
            id="scan-confirm-protein"
            onChange={(e) => setProteinPerServing(e.target.value)}
            step="0.01"
            type="number"
            value={proteinPerServing}
          />
        </div>

        <button className="add-btn" onClick={handleRescanNutrition}>
          Rescan Nutrition Label
        </button>

        <button
          className={`save-btn ${!canSave ? 'disabled' : ''}`}
          disabled={!canSave}
          onClick={handleSave}
        >
          Add
        </button>
      </div>
    </div>
  );
};
