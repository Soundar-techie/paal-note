import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  useWindowDimensions,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/theme';

type DeviceMode = 'mobile' | 'plus' | 'tablet' | 'fluid';

const DEVICE_WIDTHS: Record<DeviceMode, number | '100%'> = {
  mobile: 375,
  plus: 430,
  tablet: 620,
  fluid: '100%',
};

interface ResponsiveMobileWrapperProps {
  children: React.ReactNode;
}

export const ResponsiveMobileWrapper: React.FC<ResponsiveMobileWrapperProps> = ({ children }) => {
  const { width: windowWidth } = useWindowDimensions();
  const [deviceMode, setDeviceMode] = useState<DeviceMode>('plus');

  const isWeb = Platform.OS === 'web';
  const isDesktopWeb = isWeb && windowWidth > 540;

  // Inject web page background styling and mobile responsive viewport meta
  useEffect(() => {
    if (isWeb && typeof document !== 'undefined') {
      // 1. Mobile viewport meta tag
      let meta = document.querySelector('meta[name="viewport"]');
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('name', 'viewport');
        document.head.appendChild(meta);
      }
      meta.setAttribute(
        'content',
        'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover'
      );

      // 2. Web styling
      const styleId = 'paal-note-web-styles';
      if (!document.getElementById(styleId)) {
        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
          html, body, #root {
            height: 100%;
            width: 100%;
            margin: 0;
            padding: 0;
            background-color: #0b1120;
            overflow: hidden;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            -webkit-font-smoothing: antialiased;
            touch-action: pan-y;
            -webkit-tap-highlight-color: transparent;
          }
        `;
        document.head.appendChild(style);
      }
    }
  }, [isWeb]);

  // If running on a physical mobile device, native simulator, or browser viewport <= 540px:
  // Render clean 100% full screen with no desktop framing.
  if (!isDesktopWeb) {
    return <View style={styles.nativeContainer}>{children}</View>;
  }

  // Desktop browser mode: Render responsive mobile simulator frame
  const selectedWidth = DEVICE_WIDTHS[deviceMode];

  return (
    <View style={styles.desktopBackground}>
      {/* Top Device Switcher Toolbar */}
      <View style={styles.topToolbar}>
        {/* Brand & Project Info */}
        <View style={styles.brandRow}>
          <View style={styles.appIconCircle}>
            <Ionicons name="water" size={16} color={Colors.white} />
          </View>
          <View>
            <Text style={styles.appBrandTitle}>Paal-Note Dairy System</Text>
            <Text style={styles.appBrandSub}>React Native • Responsive Mobile View</Text>
          </View>
        </View>

        {/* Device Switcher Pills */}
        <View style={styles.devicePillsContainer}>
          <TouchableOpacity
            style={[styles.devicePill, deviceMode === 'mobile' && styles.devicePillActive]}
            onPress={() => setDeviceMode('mobile')}
            activeOpacity={0.8}
          >
            <Ionicons
              name="phone-portrait-outline"
              size={13}
              color={deviceMode === 'mobile' ? Colors.white : Colors.slate400}
            />
            <Text
              style={[
                styles.devicePillText,
                deviceMode === 'mobile' && styles.devicePillTextActive,
              ]}
            >
              Compact (375px)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.devicePill, deviceMode === 'plus' && styles.devicePillActive]}
            onPress={() => setDeviceMode('plus')}
            activeOpacity={0.8}
          >
            <Ionicons
              name="phone-portrait"
              size={13}
              color={deviceMode === 'plus' ? Colors.white : Colors.slate400}
            />
            <Text
              style={[
                styles.devicePillText,
                deviceMode === 'plus' && styles.devicePillTextActive,
              ]}
            >
              Plus (430px)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.devicePill, deviceMode === 'tablet' && styles.devicePillActive]}
            onPress={() => setDeviceMode('tablet')}
            activeOpacity={0.8}
          >
            <Ionicons
              name="tablet-portrait-outline"
              size={13}
              color={deviceMode === 'tablet' ? Colors.white : Colors.slate400}
            />
            <Text
              style={[
                styles.devicePillText,
                deviceMode === 'tablet' && styles.devicePillTextActive,
              ]}
            >
              Tablet (620px)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.devicePill, deviceMode === 'fluid' && styles.devicePillActive]}
            onPress={() => setDeviceMode('fluid')}
            activeOpacity={0.8}
          >
            <Ionicons
              name="browsers-outline"
              size={13}
              color={deviceMode === 'fluid' ? Colors.white : Colors.slate400}
            />
            <Text
              style={[
                styles.devicePillText,
                deviceMode === 'fluid' && styles.devicePillTextActive,
              ]}
            >
              Fluid 100%
            </Text>
          </TouchableOpacity>
        </View>

        {/* Frontend Only / Local Storage Indicator */}
        <View style={styles.serverStatusPill}>
          <View style={styles.statusDotGreen} />
          <Text style={styles.serverStatusText}>Frontend Only • Local Storage</Text>
        </View>
      </View>

      {/* Main Viewport Container */}
      <View style={styles.viewportCenterArea}>
        <View
          style={[
            styles.phoneFrame,
            deviceMode === 'fluid' ? styles.phoneFrameFluid : { width: selectedWidth },
          ]}
        >
          {/* Subtle Dynamic Island Notch for Realistic Mobile Look */}
          {deviceMode !== 'fluid' && (
            <View style={styles.notchContainer}>
              <View style={styles.dynamicIsland}>
                <View style={styles.cameraLens} />
              </View>
            </View>
          )}

          {/* Actual React Native Mobile App Component Tree */}
          <View style={styles.screenContentArea}>{children}</View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  nativeContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: Colors.background,
  },
  desktopBackground: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#0F172A',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  topToolbar: {
    height: 52,
    backgroundColor: '#1E293B',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    zIndex: 10,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  appIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  appBrandTitle: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  appBrandSub: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '500',
  },
  devicePillsContainer: {
    flexDirection: 'row',
    backgroundColor: '#0F172A',
    padding: 3,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  devicePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
    marginHorizontal: 2,
  },
  devicePillActive: {
    backgroundColor: Colors.primary,
  },
  devicePillText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 5,
  },
  devicePillTextActive: {
    color: Colors.white,
    fontWeight: '700',
  },
  serverStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#334155',
  },
  statusDotGreen: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
    backgroundColor: '#22C55E',
  },
  serverStatusText: {
    color: '#CBD5E1',
    fontSize: 11,
    fontWeight: '600',
  },
  viewportCenterArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    overflow: 'hidden',
  },
  phoneFrame: {
    height: '100%',
    maxHeight: 890,
    backgroundColor: Colors.background,
    borderRadius: 36,
    borderWidth: 8,
    borderColor: '#1E293B',
    overflow: 'hidden',
    position: 'relative',
    ...(Platform.OS === 'web'
      ? ({
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.7), 0 0 0 1px #334155',
        } as any)
      : {}),
  },
  phoneFrameFluid: {
    width: '100%',
    maxWidth: '100%',
    borderRadius: 0,
    borderWidth: 0,
    maxHeight: '100%',
  },
  notchContainer: {
    position: 'absolute',
    top: 8,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 999,
    pointerEvents: 'none',
  },
  dynamicIsland: {
    width: 90,
    height: 18,
    borderRadius: 10,
    backgroundColor: '#0F172A',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingRight: 10,
  },
  cameraLens: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
  },
  screenContentArea: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: Colors.background,
  },
});
