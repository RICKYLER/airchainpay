import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, View, StyleSheet, Animated, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

import { HapticTab } from '../../components/HapticTab';
import { IconSymbol } from '../../components/ui/IconSymbol';
import { getChainColor, getChainGradient, Colors } from '../../constants/Colors';
import { useSelectedChain } from '../../src/components/ChainSelector';
import { useAuthState } from '../../src/hooks/useAuthState';

export default function TabLayout() {
  const { selectedChain } = useSelectedChain();
  const { isAuthenticated } = useAuthState();
  const chainColor = getChainColor(selectedChain);
  const chainGradient = getChainGradient(selectedChain);

  const screenOptions = {
    tabBarActiveTintColor: chainColor,
    tabBarInactiveTintColor: '#94A3B8',
    headerShown: true,
    tabBarButton: HapticTab,
    headerStyle: {
      backgroundColor: 'transparent',
    },
    headerBackground: () => (
      <View style={StyleSheet.absoluteFill}>
        <LinearGradient
          colors={[...chainGradient, 'rgba(0, 8, 20, 0.95)'] as any}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        <View style={styles.headerOverlay} />
      </View>
    ),
    headerTintColor: '#FFFFFF',
    headerTitleStyle: {
      fontWeight: '800' as const,
      fontSize: 20,
      textShadowColor: 'rgba(0, 0, 0, 0.3)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 2,
    },
    headerRight: () => (
      <View style={styles.headerRight}>
        {/* Theme toggle removed */}
      </View>
    ),
    headerTitle: () => (
      <View style={styles.headerContainer}>
        <View style={styles.logoContainer}>
          <LinearGradient
            colors={[chainColor + '40', chainColor + '20']}
            style={styles.logoBackground}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
          <IconSymbol 
            name="wallet.pass.fill" 
            size={26} 
            color={chainColor} 
          />
        </View>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>AirChainPay</Text>
          <Text style={styles.headerSubtitle}>Secure Wallet</Text>
        </View>
      </View>
    ),
    tabBarStyle: Platform.select({
      ios: {
        position: 'absolute' as const,
        backgroundColor: 'rgba(0, 8, 20, 0.85)',
        borderTopColor: 'rgba(51, 65, 85, 0.4)',
        borderTopWidth: 0.5,
        shadowColor: Colors.light.shadowGlow,
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        paddingTop: 12,
        paddingBottom: 42,
        height: 98,
        borderRadius: 24,
        marginHorizontal: 16,
        marginBottom: 8,
      },
      default: {
        backgroundColor: 'rgba(0, 8, 20, 0.85)',
        borderTopColor: 'rgba(51, 65, 85, 0.4)',
        borderTopWidth: 0.5,
        elevation: 12,
        shadowColor: Colors.light.shadowGlow,
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        paddingTop: 12,
        paddingBottom: 16,
        height: 80,
        borderRadius: 20,
        marginHorizontal: 12,
        marginBottom: 6,
      },
    }),
    tabBarLabelStyle: {
      fontSize: 11,
      fontWeight: '700' as const,
      marginBottom: Platform.OS === 'ios' ? 4 : 6,
      marginTop: Platform.OS === 'ios' ? 4 : 2,
      color: '#FFFFFF',
      textShadowColor: 'rgba(0, 0, 0, 0.3)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 2,
    },
    tabBarIconStyle: {
      marginTop: Platform.OS === 'ios' ? 2 : 6,
      marginBottom: Platform.OS === 'ios' ? 0 : 2,
    },
  };

  // If not authenticated, don't show any tabs
  if (!isAuthenticated) {
    return null;
  }

  return (
    <Tabs screenOptions={screenOptions}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Wallet',
          tabBarIcon: ({ color, focused }) => (
            <View style={[
              styles.modernIconContainer, 
              focused && styles.focusedIconContainer
            ]}>
              {focused && (
                <LinearGradient
                  colors={[chainColor + '40', chainColor + '20', 'transparent']}
                  style={styles.iconGradientBackground}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                />
              )}
              <View style={[styles.iconInner, focused && { backgroundColor: chainColor + '15' }]}>
                <IconSymbol 
                  size={focused ? 28 : 24} 
                  name="wallet.pass.fill" 
                  color={focused ? chainColor : Colors.light.iconActive}
                />
              </View>
              {focused && <View style={[styles.focusIndicator, { backgroundColor: chainColor }]} />}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="tx-history"
        options={{
          title: 'History',
          tabBarIcon: ({ color, focused }) => (
            <View style={[
              styles.modernIconContainer, 
              focused && styles.focusedIconContainer
            ]}>
              {focused && (
                <LinearGradient
                  colors={[chainColor + '40', chainColor + '20', 'transparent']}
                  style={styles.iconGradientBackground}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                />
              )}
              <View style={[styles.iconInner, focused && { backgroundColor: chainColor + '15' }]}>
                <IconSymbol 
                  size={focused ? 28 : 24} 
                  name="list.bullet.clipboard.fill" 
                  color={focused ? chainColor : Colors.light.iconActive}
                />
              </View>
              {focused && <View style={[styles.focusIndicator, { backgroundColor: chainColor }]} />}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="ble-payment"
        options={{
          title: 'BLE',
          tabBarIcon: ({ color, focused }) => (
            <View style={[
              styles.modernIconContainer, 
              focused && styles.focusedIconContainer
            ]}>
              {focused && (
                <LinearGradient
                  colors={[chainColor + '40', chainColor + '20', 'transparent']}
                  style={styles.iconGradientBackground}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                />
              )}
              <View style={[styles.iconInner, focused && { backgroundColor: chainColor + '15' }]}>
                <IconSymbol 
                  size={focused ? 28 : 24} 
                  name="dot.radiowaves.left.and.right" 
                  color={focused ? chainColor : Colors.light.iconActive}
                />
              </View>
              {focused && <View style={[styles.focusIndicator, { backgroundColor: chainColor }]} />}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, focused }) => (
            <View style={[
              styles.modernIconContainer, 
              focused && styles.focusedIconContainer
            ]}>
              {focused && (
                <LinearGradient
                  colors={[chainColor + '40', chainColor + '20', 'transparent']}
                  style={styles.iconGradientBackground}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                />
              )}
              <View style={[styles.iconInner, focused && { backgroundColor: chainColor + '15' }]}>
                <IconSymbol 
                  size={focused ? 28 : 24} 
                  name="gear" 
                  color={focused ? chainColor : Colors.light.iconActive}
                />
              </View>
              {focused && <View style={[styles.focusIndicator, { backgroundColor: chainColor }]} />}
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  headerRight: {
    marginRight: 16,
  },
  headerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  logoContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  logoBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 22,
  },
  headerTextContainer: {
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.8)',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
    marginTop: -2,
  },
  logo: {
    width: 140,
    height: 36,
    tintColor: 'white',
  },
  modernIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  focusedIconContainer: {
    transform: [{ scale: 1.1 }],
    shadowColor: Colors.light.shadowGlow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 8,
  },
  iconGradientBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 22,
  },
  iconInner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(51, 65, 85, 0.3)',
    borderWidth: 1,
    borderColor: 'rgba(71, 85, 105, 0.4)',
    zIndex: 1,
  },
  focusIndicator: {
    position: 'absolute',
    bottom: -2,
    left: '50%',
    marginLeft: -8,
    width: 16,
    height: 3,
    borderRadius: 1.5,
    zIndex: 2,
  },
});
