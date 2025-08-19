import { Platform } from 'react-native';
import { Device } from 'react-native-ble-plx';
import { BluetoothManager, BLEPaymentData, SupportedToken, SUPPORTED_TOKENS } from '../bluetooth/BluetoothManager';
import { createEnvelope, parseEnvelope } from './transports/BLEEnvelope';
import { logger } from '../utils/Logger';

// BLE Payment Service for handling simplified payment data
export class BLEPaymentService {
  private static instance: BLEPaymentService | null = null;
  private bleManager: BluetoothManager;
  private isScanning: boolean = false;
  private isAdvertising: boolean = false;
  private discoveredDevices: Map<string, { device: Device; paymentData?: BLEPaymentData }> = new Map();
  private scanListeners: Set<(devices: { device: Device; paymentData?: BLEPaymentData }[]) => void> = new Set();
  private advertisingListeners: Set<(status: boolean) => void> = new Set();

  private constructor() {
    this.bleManager = BluetoothManager.getInstance();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): BLEPaymentService {
    if (!BLEPaymentService.instance) {
      BLEPaymentService.instance = new BLEPaymentService();
    }
    return BLEPaymentService.instance;
  }

  /**
   * Check if BLE is available
   */
  isBleAvailable(): boolean {
    return this.bleManager.isBleAvailable();
  }

  /**
   * Check if advertising is supported
   */
  isAdvertisingSupported(): boolean {
    return this.bleManager.isAdvertisingSupported();
  }

  /**
   * Get BLE status
   */
  async getBleStatus() {
    return this.bleManager.getBleStatus();
  }

  /**
   * Request permissions
   */
  async requestPermissions(): Promise<boolean> {
    try {
      logger.info('[BLE Payment] Requesting Bluetooth permissions...');
      const result = await this.bleManager.requestAllPermissions();
      
      if (result) {
        logger.info('[BLE Payment] ✅ All Bluetooth permissions granted');
      } else {
        logger.warn('[BLE Payment] ❌ Some Bluetooth permissions were denied');
      }
      // After granting, enforce Location Services ON on Android ≤ 11
      if (Platform.OS === 'android') {
        const apiLevel = typeof Platform.Version === 'number' ? Platform.Version : parseInt(String(Platform.Version), 10) || 0;
        if (apiLevel < 31) {
          const locationOn = await this.bleManager.ensureLocationServicesEnabled();
          if (!locationOn) {
            logger.warn('[BLE Payment] Location Services are OFF on Android 11 or below; scanning will not find devices');
            return false;
          }
        }
      }

      return result;
    } catch (error) {
      logger.error('[BLE Payment] Error requesting permissions:', error);
      return false;
    }
  }

  /**
   * Check critical permissions
   */
  async checkCriticalPermissions(): Promise<{
    granted: boolean;
    missing: string[];
    details: string;
  }> {
    try {
      const result = await this.bleManager.hasCriticalPermissions();
      return result;
    } catch (error) {
      logger.error('[BLE Payment] Error checking critical permissions:', error);
      return {
        granted: false,
        missing: ['unknown'],
        details: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Start scanning for nearby payment devices
   */
  async startScanning(onDevicesFound?: (devices: { device: Device; paymentData?: BLEPaymentData }[]) => void): Promise<void> {
    if (this.isScanning) {
      logger.info('[BLE Payment] Already scanning, skipping start request');
      return;
    }

    if (!this.bleManager.isBleAvailable()) {
      logger.error('[BLE Payment] BLE not available for scanning');
      return;
    }

    logger.info('[BLE Payment] Starting scan for payment devices');
    this.isScanning = true;
    this.discoveredDevices.clear();

    // Add listener if provided
    if (onDevicesFound) {
      this.scanListeners.add(onDevicesFound);
    }

    try {
      await this.bleManager.startScan(
        (device, paymentData) => {
          logger.info('[BLE Payment] Found device:', device.name || device.id);
          
          // Store device with payment data
          this.discoveredDevices.set(device.id, { device, paymentData });
          
          // Notify listeners
          this.notifyScanListeners();
        },
        30000 // 30 second timeout
      );
    } catch (error) {
      this.isScanning = false;
      logger.error('[BLE Payment] Error starting scan:', error);
      throw error;
    }
  }

  /**
   * Stop scanning
   */
  stopScanning(): void {
    if (!this.isScanning) {
      return;
    }

    logger.info('[BLE Payment] Stopping scan');
    this.bleManager.stopScan();
    this.isScanning = false;
  }

  /**
   * Get discovered devices
   */
  getDiscoveredDevices(): { device: Device; paymentData?: BLEPaymentData }[] {
    return Array.from(this.discoveredDevices.values());
  }

  /**
   * Clear discovered devices
   */
  clearDiscoveredDevices(): void {
    this.discoveredDevices.clear();
    this.notifyScanListeners();
  }

  /**
   * Start advertising payment availability
   */
  async startAdvertising(
    walletAddress: string,
    amount: string,
    token: SupportedToken,
    chainId?: string
  ): Promise<{ success: boolean; message?: string }> {
    if (this.isAdvertising) {
      logger.info('[BLE Payment] Already advertising, stopping first');
      await this.stopAdvertising();
    }

    if (!this.bleManager.isAdvertisingSupported()) {
      return { success: false, message: 'BLE advertising not supported on this device' };
    }

    // Validate token
    if (!Object.keys(SUPPORTED_TOKENS).includes(token)) {
      return { success: false, message: `Unsupported token: ${token}` };
    }

    // Validate amount
    if (!this.isValidAmount(amount, token)) {
      return { success: false, message: `Invalid amount: ${amount} ${token}` };
    }

    // Create payment data
    const paymentData: BLEPaymentData = {
      walletAddress,
      amount,
      token,
      chainId,
      timestamp: Date.now()
    };

    logger.info('[BLE Payment] Starting advertising with payment data:', paymentData);

    try {
      const result = await this.bleManager.startAdvertising(paymentData);
      
      if (result.success) {
        this.isAdvertising = true;
        this.notifyAdvertisingListeners(true);
        logger.info('[BLE Payment] ✅ Advertising started successfully');
      } else {
        logger.error('[BLE Payment] ❌ Advertising failed:', result.message);
      }
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('[BLE Payment] Error starting advertising:', errorMessage);
      return { success: false, message: errorMessage };
    }
  }

  /**
   * Stop advertising
   */
  async stopAdvertising(): Promise<void> {
    if (!this.isAdvertising) {
      return;
    }

    logger.info('[BLE Payment] Stopping advertising');
    
    try {
      await this.bleManager.stopAdvertising();
      this.isAdvertising = false;
      this.notifyAdvertisingListeners(false);
      logger.info('[BLE Payment] ✅ Advertising stopped successfully');
    } catch {
      logger.error('[BLE Payment] Error stopping advertising');
      // Force stop even if there's an error
      this.isAdvertising = false;
      this.notifyAdvertisingListeners(false);
    }
  }

  /**
   * Check if currently advertising
   */
  isCurrentlyAdvertising(): boolean {
    return this.isAdvertising;
  }

  /**
   * Check if currently scanning
   */
  isCurrentlyScanning(): boolean {
    return this.isScanning;
  }



  /**
   * Connect to a payment device
   */
  async connectToDevice(device: Device): Promise<Device> {
    logger.info('[BLE Payment] Connecting to device:', device.name || device.id);
    
    try {
      const connectedDevice = await this.bleManager.connectToDevice(device);
      logger.info('[BLE Payment] ✅ Device connected successfully');
      return connectedDevice;
    } catch (error) {
      logger.error('[BLE Payment] Error connecting to device:', error);
      throw error;
    }
  }

  /**
   * Disconnect from a device
   */
  async disconnectFromDevice(deviceId: string): Promise<void> {
    logger.info('[BLE Payment] Disconnecting from device:', deviceId);
    
    try {
      await this.bleManager.disconnectFromDevice(deviceId);
      logger.info('[BLE Payment] ✅ Device disconnected successfully');
    } catch (error) {
      logger.error('[BLE Payment] Error disconnecting from device:', error);
    }
  }

  /**
   * Send payment data to connected device
   */
  async sendPaymentData(
    deviceId: string,
    paymentData: BLEPaymentData
  ): Promise<void> {
    if (!this.bleManager.isDeviceConnected(deviceId)) {
      throw new Error('Device not connected');
    }

    const envelope = createEnvelope('payment_request', paymentData);
    const data = JSON.stringify(envelope);
    
    try {
      await this.bleManager.sendDataToDevice(
        deviceId,
        '0000abcd-0000-1000-8000-00805f9b34fb', // AirChainPay service UUID
        '0000abce-0000-1000-8000-00805f9b34fb', // AirChainPay characteristic UUID
        data
      );
      logger.info('[BLE Payment] ✅ Payment data sent successfully');
    } catch (error) {
      logger.error('[BLE Payment] Error sending payment data:', error);
      throw error;
    }
  }

  /**
   * Listen for payment data from connected device
   */
  async listenForPaymentData(
    deviceId: string,
    onPaymentData: (paymentData: BLEPaymentData) => void
  ): Promise<{ remove: () => void }> {
    if (!this.bleManager.isDeviceConnected(deviceId)) {
      throw new Error('Device not connected');
    }

    try {
      const listener = await this.bleManager.listenForData(
        deviceId,
        '0000abcd-0000-1000-8000-00805f9b34fb', // AirChainPay service UUID
        '0000abce-0000-1000-8000-00805f9b34fb', // AirChainPay characteristic UUID
        (data) => {
          try {
            const env = parseEnvelope<any>(data);
            if (env.type === 'payment_request' && this.isValidPaymentData(env.payload)) {
              onPaymentData(env.payload as BLEPaymentData);
            } else {
              logger.warn('[BLE Payment] Received invalid payment data:', data);
            }
          } catch (error) {
            logger.error('[BLE Payment] Error parsing payment data:', error);
          }
        }
      );
      
      logger.info('[BLE Payment] ✅ Started listening for payment data');
      return listener;
    } catch (error) {
      logger.error('[BLE Payment] Error starting payment data listener:', error);
      throw error;
    }
  }

  /**
   * Add scan listener
   */
  addScanListener(listener: (devices: { device: Device; paymentData?: BLEPaymentData }[]) => void): void {
    this.scanListeners.add(listener);
  }

  /**
   * Remove scan listener
   */
  removeScanListener(listener: (devices: { device: Device; paymentData?: BLEPaymentData }[]) => void): void {
    this.scanListeners.delete(listener);
  }

  /**
   * Add advertising listener
   */
  addAdvertisingListener(listener: (isAdvertising: boolean) => void): void {
    this.advertisingListeners.add(listener);
  }

  /**
   * Remove advertising listener
   */
  removeAdvertisingListener(listener: (isAdvertising: boolean) => void): void {
    this.advertisingListeners.delete(listener);
  }

  /**
   * Notify scan listeners
   */
  private notifyScanListeners(): void {
    const devices = this.getDiscoveredDevices();
    this.scanListeners.forEach(listener => {
      try {
        listener(devices);
      } catch (error) {
        logger.error('[BLE Payment] Error in scan listener:', error);
      }
    });
  }

  /**
   * Notify advertising listeners
   */
  private notifyAdvertisingListeners(isAdvertising: boolean): void {
    this.advertisingListeners.forEach(listener => {
      try {
        listener(isAdvertising);
      } catch (error) {
        logger.error('[BLE Payment] Error in advertising listener:', error);
      }
    });
  }

  /**
   * Validate amount for token
   */
  private isValidAmount(amount: string, token: SupportedToken): boolean {
    try {
      const num = parseFloat(amount);
      if (isNaN(num) || num <= 0) {
        return false;
      }
      
      // Check decimal places based on token
      const tokenConfig = SUPPORTED_TOKENS[token];
      const decimalPlaces = (amount.split('.')[1] || '').length;
      
      return decimalPlaces <= tokenConfig.decimals;
    } catch {
      return false;
    }
  }

  /**
   * Validate payment data structure
   */
  private isValidPaymentData(data: any): data is BLEPaymentData {
    return (
      typeof data === 'object' &&
      typeof data.walletAddress === 'string' &&
      typeof data.amount === 'string' &&
      typeof data.token === 'string' &&
      Object.keys(SUPPORTED_TOKENS).includes(data.token) &&
      typeof data.timestamp === 'number'
    );
  }

  /**
   * Format amount for display
   */
  formatAmount(amount: string, token: SupportedToken): string {
    const tokenConfig = SUPPORTED_TOKENS[token];
    const num = parseFloat(amount);
    
    if (isNaN(num)) {
      return '0';
    }
    
    // Format based on token decimals
    if (tokenConfig.decimals === 6) {
      return num.toFixed(6).replace(/\.?0+$/, ''); // Remove trailing zeros for 6 decimals
    } else {
      return num.toFixed(4).replace(/\.?0+$/, ''); // Remove trailing zeros for 18 decimals
    }
  }

  /**
   * Get supported tokens
   */
  getSupportedTokens(): SupportedToken[] {
    return Object.keys(SUPPORTED_TOKENS) as SupportedToken[];
  }

  /**
   * Get token info
   */
  getTokenInfo(token: SupportedToken) {
    return SUPPORTED_TOKENS[token];
  }



  /**
   * Clean up resources
   */
  destroy(): void {
    logger.info('[BLE Payment] Destroying BLEPaymentService...');
    
    // Stop scanning
    this.stopScanning();
    
    // Stop advertising
    this.stopAdvertising();
    
    // Clear listeners
    this.scanListeners.clear();
    this.advertisingListeners.clear();
    
    // Clear discovered devices
    this.discoveredDevices.clear();
    
    // Clear instance
    BLEPaymentService.instance = null;
    
    logger.info('[BLE Payment] BLEPaymentService destroyed');
  }
} 