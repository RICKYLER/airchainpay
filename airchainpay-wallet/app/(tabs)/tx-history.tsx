import * as React from 'react';
import { useState, useCallback, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Linking, RefreshControl, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { MultiChainWalletManager } from '../../src/wallet/MultiChainWalletManager';
import { logger } from '../../src/utils/Logger';
import WalletSetupScreen from '../../src/components/WalletSetupScreen';
import { BlockchainTransactionService, BlockchainTransaction } from '../../src/services/BlockchainTransactionService';
import { DEFAULT_CHAIN_ID, SUPPORTED_CHAINS } from '../../src/constants/AppConfig';
import { getChainColor , Colors } from '../../constants/Colors';
import { useThemeContext } from '../../hooks/useThemeContext';
import { ThemedView } from '../../components/ThemedView';

export default function TransactionHistoryScreen() {
  const [hasWallet, setHasWallet] = useState(false);
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<BlockchainTransaction[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedChain, setSelectedChain] = useState(DEFAULT_CHAIN_ID);

  const router = useRouter();
  const { colorScheme } = useThemeContext();
  const theme = colorScheme || 'light';
  const colors = Colors[theme];

  const checkWalletStatus = useCallback(async () => {
    try {
      const walletExists = await MultiChainWalletManager.getInstance().hasWallet();
      setHasWallet(walletExists);
    } catch (error) {
      logger.error('Failed to check wallet status:', error);
      setHasWallet(false);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchTransactions = useCallback(async () => {
    setRefreshing(true);
    try {
      const txs = await BlockchainTransactionService.getInstance().getTransactionHistory(selectedChain, { limit: 50 });
      setTransactions(txs);
    } catch (error) {
      logger.error('Failed to fetch transaction history:', error);
    } finally {
      setRefreshing(false);
    }
  }, [selectedChain]);

  const changeChain = useCallback((chainId: string) => {
    setSelectedChain(chainId);
    logger.info(`[TransactionHistory] Changed to chain: ${chainId}`);
  }, []);

  useFocusEffect(
    useCallback(() => {
      checkWalletStatus();
    }, [checkWalletStatus])
  );

  useEffect(() => {
    if (hasWallet) {
      fetchTransactions();
      // Start real-time monitoring
      BlockchainTransactionService.getInstance().startTransactionMonitoring(selectedChain, setTransactions);
      return () => {
        BlockchainTransactionService.getInstance().stopTransactionMonitoring(selectedChain);
      };
    }
  }, [hasWallet, selectedChain, fetchTransactions]);

  const handleWalletCreated = () => {
    checkWalletStatus();
  };

  const handleOpenExplorer = (url: string) => {
    if (url) {
      Linking.openURL(url);
    }
  };

  if (loading) {
    return (
      <ThemedView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.tint} />
        <Text style={{ color: colors.text, marginTop: 16 }}>Loading transactions...</Text>
      </ThemedView>
    );
  }

  if (!hasWallet) {
    return (
      <WalletSetupScreen
        onWalletCreated={handleWalletCreated}
        title="Transaction History"
        subtitle="Create or import a wallet to view your transaction history"
      />
    );
  }

  return (
    <ThemedView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ paddingTop: 50, paddingBottom: 20, paddingHorizontal: 20, backgroundColor: colors.card }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={colors.tint} />
          </TouchableOpacity>
          <Text style={{ fontSize: 20, fontWeight: 'bold', color: colors.tint, marginLeft: 15 }}>
            Transaction History
          </Text>
        </View>
        
        {/* Chain Selector */}
        <View style={{ marginTop: 15 }}>
          <Text style={{ fontSize: 16, fontWeight: 'bold', color: colors.text, marginBottom: 8, textAlign: 'center' }}>
            Multi-Chain Networks
          </Text>
          <Text style={{ fontSize: 12, color: colors.icon, marginBottom: 16, textAlign: 'center' }}>
            Select network to view transactions
          </Text>
          <View style={{ flexDirection: 'column', gap: 12 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
              <TouchableOpacity
                style={{ width: '48%' }}
                onPress={() => changeChain('core_testnet')}
              >
                <LinearGradient
                  colors={selectedChain === 'core_testnet' ? 
                    [getChainColor('core_testnet'), getChainColor('core_testnet') + '80'] :
                    [theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.9)', 
                     theme === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.7)']
                  }
                  style={{
                    width: '100%',
                    paddingVertical: 18,
                    paddingHorizontal: 16,
                    borderRadius: 14,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: 1,
                    borderColor: selectedChain === 'core_testnet' ? 
                      getChainColor('core_testnet') + '40' : 
                      (theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'),
                    shadowColor: selectedChain === 'core_testnet' ? getChainColor('core_testnet') : 'transparent',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: selectedChain === 'core_testnet' ? 0.3 : 0,
                    shadowRadius: 8,
                    elevation: selectedChain === 'core_testnet' ? 5 : 2,
                    minHeight: 70,
                  }}
                >
                  <Text style={{
                    color: selectedChain === 'core_testnet' ? 'white' : getChainColor('core_testnet'),
                    fontWeight: selectedChain === 'core_testnet' ? '700' : '600',
                    fontSize: 16,
                    textAlign: 'center',
                  }}>
                    Core Testnet
                  </Text>
                  {selectedChain === 'core_testnet' && (
                    <View style={{
                      position: 'absolute',
                      top: 10,
                      right: 10,
                      width: 20,
                      height: 20,
                      borderRadius: 10,
                      backgroundColor: 'rgba(255,255,255,0.3)',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <Ionicons name="checkmark" size={12} color="white" />
                    </View>
                  )}
                </LinearGradient>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={{ width: '48%' }}
                onPress={() => changeChain('base_sepolia')}
              >
                <LinearGradient
                  colors={selectedChain === 'base_sepolia' ? 
                    [getChainColor('base_sepolia'), getChainColor('base_sepolia') + '80'] :
                    [theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.9)', 
                     theme === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.7)']
                  }
                  style={{
                    width: '100%',
                    paddingVertical: 18,
                    paddingHorizontal: 16,
                    borderRadius: 14,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: 1,
                    borderColor: selectedChain === 'base_sepolia' ? 
                      getChainColor('base_sepolia') + '40' : 
                      (theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'),
                    shadowColor: selectedChain === 'base_sepolia' ? getChainColor('base_sepolia') : 'transparent',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: selectedChain === 'base_sepolia' ? 0.3 : 0,
                    shadowRadius: 8,
                    elevation: selectedChain === 'base_sepolia' ? 5 : 2,
                    minHeight: 70,
                  }}
                >
                  <Text style={{
                    color: selectedChain === 'base_sepolia' ? 'white' : getChainColor('base_sepolia'),
                    fontWeight: selectedChain === 'base_sepolia' ? '700' : '600',
                    fontSize: 16,
                    textAlign: 'center',
                  }}>
                    Base Sepolia
                  </Text>
                  {selectedChain === 'base_sepolia' && (
                    <View style={{
                      position: 'absolute',
                      top: 10,
                      right: 10,
                      width: 20,
                      height: 20,
                      borderRadius: 10,
                      backgroundColor: 'rgba(255,255,255,0.3)',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <Ionicons name="checkmark" size={12} color="white" />
                    </View>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
            
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
              <TouchableOpacity
                style={{ width: '48%' }}
                onPress={() => changeChain('morph_holesky')}
              >
                <LinearGradient
                  colors={selectedChain === 'morph_holesky' ? 
                    [getChainColor('morph_holesky'), getChainColor('morph_holesky') + '80'] :
                    [theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.9)', 
                     theme === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.7)']
                  }
                  style={{
                    width: '100%',
                    paddingVertical: 18,
                    paddingHorizontal: 16,
                    borderRadius: 14,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: 1,
                    borderColor: selectedChain === 'morph_holesky' ? 
                      getChainColor('morph_holesky') + '40' : 
                      (theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'),
                    shadowColor: selectedChain === 'morph_holesky' ? getChainColor('morph_holesky') : 'transparent',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: selectedChain === 'morph_holesky' ? 0.3 : 0,
                    shadowRadius: 8,
                    elevation: selectedChain === 'morph_holesky' ? 5 : 2,
                    minHeight: 70,
                  }}
                >
                  <Text style={{
                    color: selectedChain === 'morph_holesky' ? 'white' : getChainColor('morph_holesky'),
                    fontWeight: selectedChain === 'morph_holesky' ? '700' : '600',
                    fontSize: 16,
                    textAlign: 'center',
                  }}>
                    Morph
                  </Text>
                  {selectedChain === 'morph_holesky' && (
                    <View style={{
                      position: 'absolute',
                      top: 10,
                      right: 10,
                      width: 20,
                      height: 20,
                      borderRadius: 10,
                      backgroundColor: 'rgba(255,255,255,0.3)',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <Ionicons name="checkmark" size={12} color="white" />
                    </View>
                  )}
                </LinearGradient>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={{ width: '48%' }}
                onPress={() => changeChain('lisk_sepolia')}
              >
                <LinearGradient
                  colors={selectedChain === 'lisk_sepolia' ? 
                    [getChainColor('lisk_sepolia'), getChainColor('lisk_sepolia') + '80'] :
                    [theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.9)', 
                     theme === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.7)']
                  }
                  style={{
                    width: '100%',
                    paddingVertical: 18,
                    paddingHorizontal: 16,
                    borderRadius: 14,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: 1,
                    borderColor: selectedChain === 'lisk_sepolia' ? 
                      getChainColor('lisk_sepolia') + '40' : 
                      (theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'),
                    shadowColor: selectedChain === 'lisk_sepolia' ? getChainColor('lisk_sepolia') : 'transparent',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: selectedChain === 'lisk_sepolia' ? 0.3 : 0,
                    shadowRadius: 8,
                    elevation: selectedChain === 'lisk_sepolia' ? 5 : 2,
                    minHeight: 70,
                  }}
                >
                  <Text style={{
                    color: selectedChain === 'lisk_sepolia' ? 'white' : getChainColor('lisk_sepolia'),
                    fontWeight: selectedChain === 'lisk_sepolia' ? '700' : '600',
                    fontSize: 16,
                    textAlign: 'center',
                  }}>
                    Lisk Sepolia
                  </Text>
                  {selectedChain === 'lisk_sepolia' && (
                    <View style={{
                      position: 'absolute',
                      top: 10,
                      right: 10,
                      width: 20,
                      height: 20,
                      borderRadius: 10,
                      backgroundColor: 'rgba(255,255,255,0.3)',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <Ionicons name="checkmark" size={12} color="white" />
                    </View>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
      
      <ScrollView 
        style={{ flex: 1, padding: 20 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={fetchTransactions} tintColor={colors.tint} />
        }
      >
        {/* Network Info */}
        <LinearGradient
          colors={[
            theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.95)',
            theme === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.8)'
          ]}
          style={{
            padding: 18,
            borderRadius: 16,
            marginBottom: 20,
            borderWidth: 1,
            borderColor: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
            shadowColor: getChainColor(selectedChain),
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.15,
            shadowRadius: 12,
            elevation: 6,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
            <LinearGradient
              colors={[getChainColor(selectedChain), getChainColor(selectedChain) + '80']}
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 12
              }}
            >
              <Ionicons name="information-circle" size={18} color="white" />
            </LinearGradient>
            <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text }}>
              {SUPPORTED_CHAINS[selectedChain]?.name || selectedChain}
            </Text>
          </View>
          <Text style={{ fontSize: 14, color: colors.icon, lineHeight: 20 }}>
            Showing transactions for {SUPPORTED_CHAINS[selectedChain]?.name || selectedChain} network
          </Text>
        </LinearGradient>

        {transactions.length === 0 && (
          <LinearGradient
            colors={[
              theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.9)',
              theme === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.7)'
            ]}
            style={{
              padding: 40,
              borderRadius: 16,
              alignItems: 'center',
              marginTop: 20,
              borderWidth: 1,
              borderColor: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
            }}
          >
            <LinearGradient
              colors={[colors.icon + '40', colors.icon + '20']}
              style={{
                width: 64,
                height: 64,
                borderRadius: 32,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16
              }}
            >
              <Ionicons name="receipt-outline" size={32} color={colors.icon} />
            </LinearGradient>
            <Text style={{ 
              textAlign: 'center', 
              color: colors.text, 
              fontSize: 18, 
              fontWeight: '600',
              marginBottom: 8
            }}>
              No Transactions Yet
            </Text>
            <Text style={{ 
              textAlign: 'center', 
              color: colors.icon, 
              fontSize: 14,
              lineHeight: 20
            }}>
              No transactions found on {SUPPORTED_CHAINS[selectedChain]?.name || selectedChain} network.
            </Text>
          </LinearGradient>
        )}
        {transactions.map((tx, index) => {
          const key = tx.hash || `tx-${index}`;
          const isReceived = tx.from?.toLowerCase() !== tx.to?.toLowerCase();
          const isSelf = tx.from?.toLowerCase() === tx.to?.toLowerCase();
          
          return (
            <LinearGradient
              key={key}
              colors={[
                theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.9)',
                theme === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.7)'
              ]}
              style={{
                borderRadius: 16,
                marginBottom: 12,
                borderWidth: 1,
                borderColor: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                shadowColor: getChainColor(selectedChain),
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.1,
                shadowRadius: 8,
                elevation: 5,
              }}
            >
              <View style={{ padding: 18 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                    <LinearGradient
                      colors={[
                        isSelf ? colors.icon : (isReceived ? colors.success : colors.error),
                        isSelf ? colors.icon + '80' : (isReceived ? colors.success + '80' : colors.error + '80')
                      ]}
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 22,
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: 12
                      }}
                    >
                      <Ionicons
                        name={isSelf ? 'swap-horizontal' : (isReceived ? 'arrow-down-circle' : 'arrow-up-circle')}
                        size={24}
                        color="white"
                      />
                    </LinearGradient>
                    
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                        <Text style={{ fontSize: 17, fontWeight: '700', color: colors.text, marginRight: 8 }}>
                          {isSelf ? 'Self Transfer' : (isReceived ? 'Received' : 'Sent')}
                        </Text>
                        <View style={{
                          paddingHorizontal: 8,
                          paddingVertical: 3,
                          borderRadius: 12,
                          backgroundColor: tx.status === 'completed' ? colors.success + '20' : colors.error + '20'
                        }}>
                          <Text style={{
                            fontSize: 11,
                            fontWeight: '600',
                            color: tx.status === 'completed' ? colors.success : colors.error,
                            textTransform: 'uppercase'
                          }}>
                            {tx.status}
                          </Text>
                        </View>
                      </View>
                      
                      <Text style={{ fontSize: 13, color: colors.icon, marginBottom: 2 }}>
                        {new Date(tx.timestamp).toLocaleString()}
                      </Text>
                      
                      {tx.hash && (
                        <Text style={{ fontSize: 12, color: colors.icon, fontFamily: 'monospace' }}>
                          {tx.hash.slice(0, 10)}...{tx.hash.slice(-8)}
                        </Text>
                      )}
                    </View>
                  </View>
                  
                  <View style={{ alignItems: 'flex-end', marginLeft: 12 }}>
                    <Text style={{
                      fontSize: 18,
                      fontWeight: '700',
                      color: isSelf ? colors.text : (isReceived ? colors.success : colors.error),
                      marginBottom: 4
                    }}>
                      {isSelf ? '' : (isReceived ? '+' : '-')}{tx.amount} {tx.tokenSymbol || ''}
                    </Text>
                    
                    {tx.blockExplorerUrl && (
                      <TouchableOpacity 
                        onPress={() => handleOpenExplorer(tx.blockExplorerUrl)}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          paddingHorizontal: 10,
                          paddingVertical: 6,
                          borderRadius: 8,
                          backgroundColor: getChainColor(selectedChain) + '15',
                          borderWidth: 1,
                          borderColor: getChainColor(selectedChain) + '30'
                        }}
                      >
                        <Ionicons name="open-outline" size={12} color={getChainColor(selectedChain)} style={{ marginRight: 4 }} />
                        <Text style={{ color: getChainColor(selectedChain), fontSize: 11, fontWeight: '600' }}>Explorer</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </View>
            </LinearGradient>
          );
        })}
      </ScrollView>
    </ThemedView>
  );
}