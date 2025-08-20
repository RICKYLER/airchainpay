import React, { useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  StyleSheet, 
  Alert, 
  TouchableOpacity,
  Switch,
  Modal,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { MultiChainWalletManager } from '../../src/wallet/MultiChainWalletManager';
import { logger } from '../../src/utils/Logger';
import { AnimatedCard } from '../../components/AnimatedComponents';
import { Colors, getChainColor, getChainGradient } from '../../constants/Colors';
import { useThemeContext } from '../../hooks/useThemeContext';
import { useSelectedChain } from '../../src/components/ChainSelector';
import { useAuthState } from '../../src/hooks/useAuthState';
import WalletSetupScreen from '../../src/components/WalletSetupScreen';

export default function SettingsScreen() {
  const [loading, setLoading] = useState(false);
  const { hasWallet, isAuthenticated, refreshAuthState } = useAuthState();
  
  // Security modal states
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [pendingAction, setPendingAction] = useState<'seedPhrase' | 'privateKey' | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  
  // Session authentication state - only ask once per session
  const [isSessionAuthenticated, setIsSessionAuthenticated] = useState(false);
  
  // Theme context
  const { colorScheme, toggleTheme } = useThemeContext();
  const theme = colorScheme || 'light';
  const colors = Colors[theme];
  
  // Chain context
  const { selectedChain } = useSelectedChain();
  const chainColor = getChainColor(selectedChain);
  const chainGradient = getChainGradient(selectedChain);

  // Show wallet setup screen if no wallet exists or not authenticated
  if (!loading && (!hasWallet || !isAuthenticated)) {
    return (
      <WalletSetupScreen
        onWalletCreated={refreshAuthState}
        title="Settings"
        subtitle="Create or import a wallet to access settings"
      />
    );
  }

  const handleLogout = async () => {
    if (!hasWallet) {
      Alert.alert('No Wallet', 'No wallet account found to log out from.');
      return;
    }

    Alert.alert(
      'Logout Options',
      'Choose how you want to logout:',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout & Keep Wallet',
          style: 'default',
          onPress: async () => {
            setLoading(true);
            try {
              await MultiChainWalletManager.getInstance().logout(false); // Preserve wallet data
              // Reset session authentication on logout
              setIsSessionAuthenticated(false);
              refreshAuthState();
              Alert.alert(
                'Logged Out',
                'You have been logged out. You can re-authenticate with a new password to restore access to your wallet.',
                [
                  {
                    text: 'OK',
                    onPress: () => {
                      refreshAuthState();
                    }
                  }
                ]
              );
            } catch (error) {
              logger.error('Logout process completed with warnings:', error);
              setIsSessionAuthenticated(false);
              refreshAuthState();
              Alert.alert(
                'Logged Out',
                'You have been logged out. You can log back in with your password.',
                [
                  {
                    text: 'OK',
                    onPress: () => {
                      refreshAuthState();
                    }
                  }
                ]
              );
            } finally {
              setLoading(false);
            }
          },
        },
        {
          text: 'Logout & Clear Wallet',
          style: 'destructive',
          onPress: async () => {
            Alert.alert(
              'Confirm Wallet Deletion',
              'This will permanently delete your wallet and all associated data. You will need to create a new wallet or import an existing one. Are you sure?',
              [
                {
                  text: 'Cancel',
                  style: 'cancel',
                },
                {
                  text: 'Delete & Logout',
                  style: 'destructive',
                  onPress: async () => {
                    setLoading(true);
                    try {
                      await MultiChainWalletManager.getInstance().logout(true); // Clear all wallet data
                      // Reset session authentication on logout
                      setIsSessionAuthenticated(false);
                      refreshAuthState();
                      Alert.alert(
                        'Wallet Deleted & Logged Out',
                        'Your wallet has been permanently deleted and you have been logged out. You will need to create a new wallet or import an existing one.',
                        [
                          {
                            text: 'OK',
                            onPress: () => {
                              refreshAuthState();
                            }
                          }
                        ]
                      );
                    } catch (error) {
                      logger.error('Failed to logout and clear wallet:', error);
                      Alert.alert('Error', 'Failed to logout and clear wallet. Please try again.');
                    } finally {
                      setLoading(false);
                    }
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  const handleDeleteWallet = async () => {
    if (!hasWallet) {
      Alert.alert('No Wallet', 'No wallet account found to delete.');
      return;
    }

    Alert.alert(
      'Delete Wallet',
      'Are you sure you want to delete your wallet? This will permanently remove all wallet data from this device. Make sure you have backed up your private keys before proceeding.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete Wallet',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await MultiChainWalletManager.getInstance().clearAllWalletData();
              // Reset session authentication on logout
              setIsSessionAuthenticated(false);
              refreshAuthState();
              Alert.alert(
                'Wallet Deleted',
                'Your wallet has been permanently deleted. You will need to create a new wallet or import an existing one.',
                [
                  {
                    text: 'OK',
                    onPress: () => {
                      refreshAuthState();
                    }
                  }
                ]
              );
            } catch (error) {
              logger.error('Failed to delete wallet:', error);
              Alert.alert('Error', 'Failed to delete wallet. Please try again.');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleClearTransactionHistory = async () => {
    Alert.alert(
      'Clear Transaction History',
      'Are you sure you want to clear all transaction history? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await MultiChainWalletManager.getInstance().clearTransactionHistory();
              Alert.alert('Success', 'Transaction history has been cleared.');
            } catch (error) {
              logger.error('Failed to clear transaction history:', error);
              Alert.alert('Error', 'Failed to clear transaction history.');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleSecurityAccess = (action: 'seedPhrase' | 'privateKey') => {
    // If already authenticated this session, proceed directly
    if (isSessionAuthenticated) {
      if (action === 'seedPhrase') {
        showSeedPhrase();
      } else if (action === 'privateKey') {
        showPrivateKey();
      }
      return;
    }

    // Otherwise, show password modal
    setPendingAction(action);
    setPassword('');
    setShowPasswordModal(true);
  };

  const handlePasswordVerification = async () => {
    if (!password) {
      Alert.alert('Error', 'Please enter your password');
      return;
    }

    setPasswordLoading(true);
    try {
      const isValid = await MultiChainWalletManager.getInstance().verifyWalletPassword(password);
      
      if (!isValid) {
        Alert.alert('Invalid Password', 'The password you entered is incorrect');
        return;
      }

      // Password is correct, mark session as authenticated and proceed with the action
      setIsSessionAuthenticated(true);
      setShowPasswordModal(false);
      setPassword('');

      if (pendingAction === 'seedPhrase') {
        await showSeedPhrase();
      } else if (pendingAction === 'privateKey') {
        await showPrivateKey();
      }
    } catch (error) {
      logger.error('Failed to verify password:', error);
      Alert.alert('Error', 'Failed to verify password');
    } finally {
      setPasswordLoading(false);
      setPendingAction(null);
    }
  };

  const showSeedPhrase = async () => {
    try {
      const seedPhrase = await MultiChainWalletManager.getInstance().getSeedPhrase();
      
      Alert.alert(
        'Seed Phrase',
        `Your 12-word seed phrase:\n\n${seedPhrase}\n\nKeep this safe and never share it with anyone!`,
        [
          {
            text: 'Copy to Clipboard',
            onPress: () => {
              // In a real app, you'd use Clipboard API here
              Alert.alert('Security Warning', 'For security reasons, copying is disabled in this demo. Please write it down manually.');
            }
          },
          { text: 'Close', style: 'cancel' }
        ]
      );
    } catch (error) {
      logger.error('Failed to get seed phrase:', error);
      Alert.alert('Error', String(error));
    }
  };

  const showPrivateKey = async () => {
    try {
      const privateKey = await MultiChainWalletManager.getInstance().exportPrivateKey();
      
      Alert.alert(
        'Private Key',
        `Your private key:\n\n${privateKey}\n\nKeep this safe and never share it with anyone!`,
        [
          {
            text: 'Copy to Clipboard',
            onPress: () => {
              // In a real app, you'd use Clipboard API here
              Alert.alert('Security Warning', 'For security reasons, copying is disabled in this demo. Please write it down manually.');
            }
          },
          { text: 'Close', style: 'cancel' }
        ]
      );
    } catch (error) {
      logger.error('Failed to get private key:', error);
      Alert.alert('Error', String(error));
    }
  };

  const closePasswordModal = () => {
    setShowPasswordModal(false);
    setPassword('');
    setPendingAction(null);
  };

  const SettingItem = ({ 
    icon, 
    title, 
    subtitle, 
    onPress, 
    rightComponent, 
    destructive = false,
    badge,
    isLast = false
  }: {
    icon: string;
    title: string;
    subtitle?: string;
    onPress?: () => void;
    rightComponent?: React.ReactNode;
    destructive?: boolean;
    badge?: string;
    isLast?: boolean;
  }) => (
    <TouchableOpacity 
      style={[
        styles.settingItem, 
        { 
          backgroundColor: colors.card,
          borderBottomWidth: isLast ? 0 : 1,
          borderBottomColor: colors.border + '30'
        }
      ]}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={0.7}
    >
      <View style={styles.settingLeft}>
        <View style={[
          styles.settingIcon,
          destructive ? styles.destructiveIcon : styles.normalIcon,
          { 
            backgroundColor: destructive ? 'rgba(255, 68, 68, 0.15)' : chainColor + '15',
            borderColor: destructive ? 'rgba(255, 68, 68, 0.3)' : chainColor + '30'
          }
        ]}>
          <LinearGradient
            colors={destructive ? ['rgba(255, 68, 68, 0.2)', 'rgba(255, 68, 68, 0.1)'] : [chainColor + '20', chainColor + '10']}
            style={styles.iconGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
          <Ionicons 
            name={icon as any} 
            size={22} 
            color={destructive ? '#ff4444' : chainColor} 
          />
        </View>
        <View style={styles.settingContent}>
          <View style={styles.settingTitleRow}>
            <Text style={[
              styles.settingTitle, 
              { color: destructive ? '#ff4444' : colors.text }
            ]}>
              {title}
            </Text>
            {badge && (
              <View style={[styles.badge, { backgroundColor: chainColor + '20' }]}>
                <Text style={[styles.badgeText, { color: chainColor }]}>{badge}</Text>
              </View>
            )}
          </View>
          {subtitle && (
            <Text style={[styles.settingSubtitle, { color: colors.icon }]}>
              {subtitle}
            </Text>
          )}
        </View>
      </View>
      {rightComponent || (
        onPress && (
          <View style={styles.chevronContainer}>
            <Ionicons 
              name="chevron-forward" 
              size={18} 
              color={colors.icon + '80'} 
            />
          </View>
        )
      )}
    </TouchableOpacity>
  );

  return (
    <LinearGradient
      colors={chainGradient as any}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* User Profile Section */}
        <AnimatedCard delay={0} style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <View style={styles.profileAvatar}>
              <LinearGradient
                colors={[chainColor + '40', chainColor + '20']}
                style={styles.avatarGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              />
              <Ionicons name="person" size={32} color={chainColor} />
            </View>
            <View style={styles.profileInfo}>
              <Text style={[styles.profileName, { color: colors.text }]}>AirChain Wallet</Text>
              <Text style={[styles.profileStatus, { color: colors.icon }]}>
                {hasWallet ? 'Active Wallet' : 'No Wallet'}
              </Text>
            </View>
            <View style={[
              styles.statusIndicator,
              { backgroundColor: hasWallet ? '#4CAF50' : '#ff4444' }
            ]} />
          </View>
        </AnimatedCard>

        {/* Quick Actions */}
        <AnimatedCard delay={50} style={styles.quickActionsCard}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Quick Actions
          </Text>
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity 
              style={[styles.quickActionItem, { backgroundColor: colors.card }]}
              onPress={toggleTheme}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: chainColor + '15' }]}>
                <Ionicons name={theme === 'dark' ? 'sunny' : 'moon'} size={20} color={chainColor} />
              </View>
              <Text style={[styles.quickActionText, { color: colors.text }]}>Theme</Text>
            </TouchableOpacity>
            
            {hasWallet && (
              <TouchableOpacity 
                style={[styles.quickActionItem, { backgroundColor: colors.card }]}
                onPress={() => handleSecurityAccess('seedPhrase')}
              >
                <View style={[styles.quickActionIcon, { backgroundColor: chainColor + '15' }]}>
                  <Ionicons name="key" size={20} color={chainColor} />
                </View>
                <Text style={[styles.quickActionText, { color: colors.text }]}>Backup</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity 
              style={[styles.quickActionItem, { backgroundColor: colors.card }]}
              onPress={handleClearTransactionHistory}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: chainColor + '15' }]}>
                <Ionicons name="refresh" size={20} color={chainColor} />
              </View>
              <Text style={[styles.quickActionText, { color: colors.text }]}>Clear</Text>
            </TouchableOpacity>
          </View>
        </AnimatedCard>

        {/* App Settings */}
        <AnimatedCard delay={100} style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="settings" size={20} color={chainColor} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Preferences
            </Text>
          </View>
          
          <SettingItem
            icon="moon"
            title="Appearance"
            subtitle={`Currently using ${theme} mode`}
            badge={theme === 'dark' ? 'Dark' : 'Light'}
            rightComponent={
              <Switch
                value={theme === 'dark'}
                onValueChange={toggleTheme}
                trackColor={{ false: colors.border, true: chainColor + '80' }}
                thumbColor={theme === 'dark' ? '#fff' : '#f4f3f4'}
                ios_backgroundColor={colors.border}
              />
            }
            isLast={true}
          />
        </AnimatedCard>

        {/* Wallet Information */}
        <AnimatedCard delay={150} style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="wallet" size={20} color={chainColor} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Wallet Information
            </Text>
          </View>
          
          <SettingItem
            icon="shield-checkmark"
            title="Security Status"
            subtitle="Your wallet is encrypted and secure"
            badge="Secure"
            rightComponent={
              <View style={[
                styles.statusDot,
                { backgroundColor: '#4CAF50' }
              ]} />
            }
            isLast={true}
          />
        </AnimatedCard>

        {/* Security & Backup */}
        {hasWallet && (
          <AnimatedCard delay={200} style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Ionicons name="shield-checkmark" size={20} color={chainColor} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Security & Backup
              </Text>
            </View>
            
            <SettingItem
              icon="document-text"
              title="Recovery Phrase"
              subtitle="View your 12-word backup phrase"
              badge="Critical"
              onPress={() => handleSecurityAccess('seedPhrase')}
            />
            
            <SettingItem
              icon="key"
              title="Private Key"
              subtitle="Export your wallet's private key"
              badge="Advanced"
              onPress={() => handleSecurityAccess('privateKey')}
              isLast={true}
            />
          </AnimatedCard>
        )}

        {/* Data Management */}
        <AnimatedCard delay={250} style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="server" size={20} color={chainColor} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Data Management
            </Text>
          </View>
          
          <SettingItem
            icon="refresh"
            title="Clear Transaction History"
            subtitle="Remove all stored transaction records"
            onPress={handleClearTransactionHistory}
            destructive={false}
            isLast={true}
          />
        </AnimatedCard>

        {/* Danger Zone */}
        {hasWallet && (
          <AnimatedCard delay={300} style={[styles.sectionCard, styles.dangerCard]}>
            <View style={styles.sectionHeader}>
              <Ionicons name="warning" size={20} color="#ff4444" />
              <Text style={[styles.sectionTitle, { color: '#ff4444' }]}>Danger Zone</Text>
            </View>
            <View style={styles.dangerWarning}>
              <Text style={[styles.dangerWarningText, { color: colors.icon }]}>
                These actions cannot be undone. Please proceed with caution.
              </Text>
            </View>
            <SettingItem
              icon="log-out"
              title="Logout"
              subtitle="Require password re-entry (wallet data preserved)"
              onPress={handleLogout}
              destructive={true}
            />
            <SettingItem
              icon="trash"
              title="Delete Wallet"
              subtitle="Permanently remove all wallet data from device"
              onPress={handleDeleteWallet}
              destructive={true}
              isLast={true}
            />
          </AnimatedCard>
        )}

        {/* Bluetooth Diagnostic */}


        {/* App Info */}
        <AnimatedCard delay={350} style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="information-circle" size={20} color={chainColor} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              About
            </Text>
          </View>
          
          <SettingItem
            icon="phone-portrait"
            title="AirChainPay Wallet"
            subtitle="Version 1.0.0 - Build 2024.1"
            badge="Latest"
          />
          
          <SettingItem
            icon="shield-checkmark"
            title="Security Model"
            subtitle="Keys stored securely on device with encryption"
          />
          
          <SettingItem
            icon="globe"
            title="Network"
            subtitle={`Connected to ${selectedChain} network`}
            badge={selectedChain}
            isLast={true}
          />
        </AnimatedCard>

        {/* Loading state */}
        {loading && (
          <AnimatedCard delay={500} style={styles.loadingCard}>
            <View style={styles.loadingContent}>
              <Ionicons name="sync" size={24} color={chainColor} />
              <Text style={[styles.loadingText, { color: colors.text }]}>
                Processing...
              </Text>
            </View>
          </AnimatedCard>
        )}
      </ScrollView>

      {/* Password Verification Modal */}
      <Modal
        visible={showPasswordModal}
        animationType="slide"
        transparent={true}
        onRequestClose={closePasswordModal}
      >
        <KeyboardAvoidingView 
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalContainer}>
            <LinearGradient
              colors={chainGradient as any}
              style={styles.modalGradient}
            >
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Ionicons name="shield-checkmark" size={48} color="#4CAF50" />
                  <Text style={styles.modalTitle}>Security Verification</Text>
                  <Text style={styles.modalSubtitle}>
                    Enter your wallet password to access {pendingAction === 'seedPhrase' ? 'seed phrase' : 'private key'}
                  </Text>
                </View>
                
                <View style={styles.passwordInputContainer}>
                  <TextInput
                    style={styles.passwordInput}
                    placeholder="Enter your password"
                    placeholderTextColor="rgba(255,255,255,0.5)"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    <Ionicons 
                      name={showPassword ? "eye-off" : "eye"} 
                      size={20} 
                      color="rgba(255,255,255,0.7)" 
                    />
                  </TouchableOpacity>
                </View>
                
                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.modalButtonSecondary]}
                    onPress={closePasswordModal}
                    disabled={passwordLoading}
                  >
                    <Text style={styles.modalButtonTextSecondary}>Cancel</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.modalButton, styles.modalButtonPrimary]}
                    onPress={handlePasswordVerification}
                    disabled={passwordLoading}
                  >
                    {passwordLoading ? (
                      <ActivityIndicator size="small" color="#000" />
                    ) : (
                      <Text style={styles.modalButtonTextPrimary}>Verify</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </LinearGradient>
          </View>
        </KeyboardAvoidingView>
      </Modal>


    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  // Profile Card Styles
  profileCard: {
    marginBottom: 20,
    padding: 20,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  avatarGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 30,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  profileStatus: {
    fontSize: 14,
    fontWeight: '500',
    opacity: 0.8,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginLeft: 12,
  },
  // Quick Actions Styles
  quickActionsCard: {
    marginBottom: 16,
    padding: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  quickActionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  quickActionItem: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  quickActionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  // Section Card Styles
  sectionCard: {
    marginBottom: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 8,
  },
  // Setting Item Styles
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 60,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 1,
  },
  normalIcon: {
    // Additional styles for normal icons
  },
  destructiveIcon: {
    // Additional styles for destructive icons
  },
  iconGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 22,
  },
  settingContent: {
    flex: 1,
  },
  settingTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  settingSubtitle: {
    fontSize: 13,
    opacity: 0.8,
    lineHeight: 18,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    marginLeft: 8,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  chevronContainer: {
    padding: 4,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  // Danger Zone Styles
  dangerCard: {
    borderColor: 'rgba(255, 68, 68, 0.2)',
    backgroundColor: 'rgba(255, 68, 68, 0.05)',
  },
  dangerWarning: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  dangerWarningText: {
    fontSize: 13,
    fontStyle: 'italic',
    opacity: 0.7,
  },
  loadingCard: {
    padding: 20,
    alignItems: 'center',
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  loadingContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingText: {
    marginLeft: 12,
    fontSize: 16,
    fontWeight: '600',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    maxWidth: 400,
    borderRadius: 16,
    overflow: 'hidden',
  },
  modalGradient: {
    padding: 24,
  },
  modalContent: {
    alignItems: 'center',
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    lineHeight: 20,
  },
  passwordInputContainer: {
    position: 'relative',
    width: '100%',
    marginBottom: 20,
  },
  passwordInput: {
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: 'white',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingRight: 48,
  },
  eyeButton: {
    position: 'absolute',
    right: 12,
    top: 12,
    padding: 4,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
  },
  modalButtonSecondary: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  modalButtonPrimary: {
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  modalButtonTextSecondary: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  modalButtonTextPrimary: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },

});