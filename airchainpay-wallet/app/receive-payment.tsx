import React, { useEffect, useState } from 'react';
import { 
  View, 
  StyleSheet, 
  TouchableOpacity, 
  Text, 
  Alert, 
  ActivityIndicator,
  ScrollView,
  Dimensions,
  Platform,
  Clipboard,
  Animated
} from 'react-native';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { MultiChainWalletManager } from '../src/wallet/MultiChainWalletManager';
import { ThemedView } from '../components/ThemedView';
import { ThemedText } from '../components/ThemedText';
import { useThemeColor } from '../hooks/useThemeColor';
import { logger } from '../src/utils/Logger';
import { useSelectedChain } from '../src/components/ChainSelector';
import { QRCodeSigner } from '../src/utils/crypto/QRCodeSigner';

const { width } = Dimensions.get('window');
const QR_SIZE = width * 0.7;

export default function ReceivePaymentScreen() {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [qrData, setQrData] = useState<string>('');
  const { selectedChain } = useSelectedChain();

  const cardColor = useThemeColor({ light: '#f5f5f5', dark: '#2c2c2e' }, 'card');
  const accentColor = useThemeColor({ light: '#2196F3', dark: '#4dabf5' }, 'tint');

  useEffect(() => {
    loadWalletData();
  }, [selectedChain]);

  const loadWalletData = async () => {
    try {
      // Use the selected chain for wallet address display
      const walletInfo = await MultiChainWalletManager.getInstance().getWalletInfo(selectedChain);
      setWalletAddress(walletInfo.address);
      
      // Generate QR code with payment request data
      const paymentRequest = {
        type: 'payment_request',
        to: walletInfo.address,
        chainId: selectedChain,
        timestamp: Date.now(),
        version: '1.0'
      };
      
      // Sign the payment request with digital signature
      const signedPaymentRequest = await QRCodeSigner.signQRPayload(paymentRequest, selectedChain);
      
      setQrData(JSON.stringify(signedPaymentRequest));
      
      logger.info('Signed QR code generated successfully', {
        signer: walletInfo.address,
        chainId: selectedChain
      });
    } catch (error) {
      logger.error('Failed to load wallet:', error);
      Alert.alert('Error', 'Failed to load wallet data');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    if (walletAddress) {
      Clipboard.setString(walletAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  // Format address for display
  const formatAddress = (address: string | null) => {
    if (!address) return '';
    if (address.length <= 16) return address;
    return `${address.substring(0, 8)}...${address.substring(address.length - 8)}`;
  };

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Receive Payment',
          headerBackTitle: 'Back',
        }}
      />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <LinearGradient
              colors={[cardColor + '80', cardColor + '40']}
              style={styles.loadingCard}
            >
              <BlurView intensity={20} style={styles.loadingBlur}>
                <ActivityIndicator size="large" color={accentColor as any} />
                <ThemedText style={styles.loadingText}>Generating QR Code...</ThemedText>
              </BlurView>
            </LinearGradient>
          </View>
        ) : walletAddress ? (
          <>
            <LinearGradient
              colors={[cardColor + '80', cardColor + '40']}
              style={styles.qrCard}
            >
              <BlurView intensity={20} style={styles.qrBlur}>
                <View style={styles.qrHeader}>
                  <LinearGradient
                    colors={[accentColor + '30', accentColor + '10']}
                    style={styles.qrIcon}
                  >
                    <Ionicons name="qr-code-outline" size={24} color={accentColor as any} />
                  </LinearGradient>
                  <ThemedText style={styles.sectionTitle}>
                    Payment QR Code
                  </ThemedText>
                </View>
                {qrData ? (
                  <View style={styles.qrCodeWrapper}>
                    <LinearGradient
                      colors={['#ffffff', '#f8f9fa']}
                      style={styles.qrBackground}
                    >
                      <QRCode
                        value={qrData}
                        size={QR_SIZE}
                        backgroundColor="transparent"
                        color="black"
                      />
                    </LinearGradient>
                  </View>
                ) : (
                  <View style={styles.errorContainer}>
                    <Ionicons name="alert-circle-outline" size={48} color={accentColor + '60'} />
                    <ThemedText style={styles.errorText}>
                      Unable to generate QR code
                    </ThemedText>
                  </View>
                )}
                <ThemedText style={styles.qrDescription}>
                  Scan this QR code to send a payment
                </ThemedText>
              </BlurView>
            </LinearGradient>

            <LinearGradient
              colors={[cardColor + '80', cardColor + '40']}
              style={styles.addressCard}
            >
              <BlurView intensity={20} style={styles.addressBlur}>
                <View style={styles.addressHeader}>
                  <LinearGradient
                    colors={[accentColor + '30', accentColor + '10']}
                    style={styles.addressIcon}
                  >
                    <Ionicons name="wallet-outline" size={24} color={accentColor as any} />
                  </LinearGradient>
                  <ThemedText style={styles.addressLabel}>Your Wallet Address</ThemedText>
                </View>
                <LinearGradient
                  colors={[cardColor + '80', cardColor + '40']}
                  style={styles.addressContainer}
                >
                  <BlurView intensity={10} style={styles.addressCardBlur}>
                    <ThemedText style={styles.address}>{formatAddress(walletAddress)}</ThemedText>
                    <TouchableOpacity 
                      style={styles.copyButton} 
                      onPress={copyToClipboard}
                    >
                      <LinearGradient
                        colors={copied ? [accentColor + '80', accentColor as any] : [accentColor + '30', accentColor + '10']}
                        style={styles.copyButtonGradient}
                      >
                        <Ionicons 
                          name={copied ? "checkmark-circle" : "copy-outline"} 
                          size={24} 
                          color={copied ? "white" : (accentColor as any)} 
                        />
                      </LinearGradient>
                    </TouchableOpacity>
                  </BlurView>
                </LinearGradient>
                <TouchableOpacity 
                  style={styles.fullAddressButton}
                  onPress={() => Alert.alert('Full Address', walletAddress)}
                >
                  <ThemedText style={styles.fullAddressText}>View Full Address</ThemedText>
                </TouchableOpacity>
              </BlurView>
            </LinearGradient>

            <LinearGradient
              colors={[cardColor + '60', cardColor + '30']}
              style={styles.infoCard}
            >
              <BlurView intensity={15} style={styles.infoBlur}>
                <View style={styles.infoHeader}>
                  <LinearGradient
                    colors={[accentColor + '30', accentColor + '10']}
                    style={styles.infoIconGradient}
                  >
                    <Ionicons name="information-circle-outline" size={24} color={accentColor as any} />
                  </LinearGradient>
                  <ThemedText style={styles.infoTitle}>How to Receive Payments</ThemedText>
                </View>
                <View style={styles.infoContent}>
                  <View style={styles.infoItem}>
                    <View style={[styles.infoNumber, { backgroundColor: accentColor as any }]}>
                      <Text style={styles.infoNumberText}>1</Text>
                    </View>
                    <ThemedText style={styles.infoText}>
                      Share your QR code with the sender
                    </ThemedText>
                  </View>
                  <View style={styles.infoItem}>
                    <View style={[styles.infoNumber, { backgroundColor: accentColor as any }]}>
                      <Text style={styles.infoNumberText}>2</Text>
                    </View>
                    <ThemedText style={styles.infoText}>
                      The sender will scan the QR code to set up payment
                    </ThemedText>
                  </View>
                  <View style={styles.infoItem}>
                    <View style={[styles.infoNumber, { backgroundColor: accentColor as any }]}>
                      <Text style={styles.infoNumberText}>3</Text>
                    </View>
                    <ThemedText style={styles.infoText}>
                      Once sent, the transaction will appear in your transaction history
                    </ThemedText>
                  </View>
                </View>
              </BlurView>
            </LinearGradient>
          </>
        ) : (
          <View style={styles.noWalletContainer}>
            <Ionicons name="wallet-outline" size={64} color="#888" />
            <ThemedText style={styles.noWalletText}>No wallet found</ThemedText>
            <ThemedText style={styles.noWalletSubtext}>
              Please create a wallet to receive payments
            </ThemedText>
          </View>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  qrCard: {
    width: '100%',
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  qrBlur: {
    padding: 20,
    alignItems: 'center',
    borderRadius: 16,
  },
  qrHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  qrIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  qrCodeWrapper: {
    marginBottom: 16,
  },
  qrBackground: {
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  errorContainer: {
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    marginTop: 8,
    fontSize: 14,
    textAlign: 'center',
  },
  loadingCard: {
    width: '100%',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  loadingBlur: {
    padding: 40,
    alignItems: 'center',
    borderRadius: 16,
  },
  qrDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  addressCard: {
    width: '100%',
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  addressBlur: {
    padding: 20,
    borderRadius: 16,
  },
  addressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  addressIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  addressLabel: {
    fontSize: 16,
    marginBottom: 12,
    fontWeight: '500',
  },
  addressContainer: {
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
  },
  addressCardBlur: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
  },
  copyButtonGradient: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  address: {
    fontSize: 16,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    flex: 1,
  },
  copyButton: {
    padding: 8,
  },
  fullAddressButton: {
    marginTop: 12,
    alignItems: 'center',
  },
  fullAddressText: {
    fontSize: 14,
    color: '#2196F3',
  },
  infoCard: {
    width: '100%',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoBlur: {
    padding: 20,
    borderRadius: 16,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  infoIconGradient: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  infoContent: {
    gap: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoNumberText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  noWalletContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  noWalletText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  noWalletSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});