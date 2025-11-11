import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { Appearance, ColorSchemeName, View, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createTheme } from '../constants/theme';
import { StatusBar } from 'expo-status-bar';

// Type definitions
export type ThemeMode = 'light' | 'dark' | 'auto';
export type ColorScheme = 'light' | 'dark';

export interface ThemeContextType {
  theme: ReturnType<typeof createTheme>;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  activeColorScheme: ColorScheme;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = '@app_theme_preference';

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [themeMode, setThemeModeState] = useState<ThemeMode>('auto');
  const [systemColorScheme, setSystemColorScheme] = useState<ColorSchemeName>(
    Appearance.getColorScheme()
  );
  const [isInitialized, setIsInitialized] = useState(false);

  // Calculate active color scheme based on mode and system preference
  const activeColorScheme: ColorScheme = useMemo(() => {
    if (themeMode === 'auto') {
      return systemColorScheme === 'light' ? 'light' : 'dark';
    }
    return themeMode;
  }, [themeMode, systemColorScheme]);

  // Create theme object using factory function
  const theme = useMemo(
    () => createTheme(activeColorScheme),
    [activeColorScheme]
  );

  // Initialize theme on mount
  useEffect(() => {
    initializeTheme();
  }, []);

  // Listen for system theme changes
  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemColorScheme(colorScheme);
    });

    return () => subscription.remove();
  }, []);

  const initializeTheme = async () => {
    try {
      // Load saved theme preference from AsyncStorage
      const savedMode = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      
      if (savedMode && isValidThemeMode(savedMode)) {
        setThemeModeState(savedMode as ThemeMode);
      } else {
        // Default to 'auto' if no saved preference
        setThemeModeState('auto');
      }
    } catch (error) {
      console.error('Failed to load theme preference:', error);
      // Default to 'auto' on error
      setThemeModeState('auto');
    } finally {
      setIsInitialized(true);
    }
  };

  const setThemeMode = async (mode: ThemeMode): Promise<void> => {
    try {
      // Save to AsyncStorage
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
      // Update state
      setThemeModeState(mode);
    } catch (error) {
      console.error('Failed to save theme preference:', error);
      // Still update UI even if save fails
      setThemeModeState(mode);
    }
  };

  const value: ThemeContextType = {
    theme,
    themeMode,
    setThemeMode,
    activeColorScheme,
  };

  // Show loading state until theme is initialized to prevent flash of wrong theme
  if (!isInitialized) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000000' }}>
        <ActivityIndicator size="large" color="#0A84FF" />
      </View>
    );
  }

  return (
    <ThemeContext.Provider value={value}>
      <StatusBar 
        style={activeColorScheme === 'dark' ? 'light' : 'dark'}
        backgroundColor={theme.colors.background}
      />
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

// Helper function to validate theme mode
function isValidThemeMode(value: string): value is ThemeMode {
  return value === 'light' || value === 'dark' || value === 'auto';
}