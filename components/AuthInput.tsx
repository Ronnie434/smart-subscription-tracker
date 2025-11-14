import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardTypeOptions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';

interface AuthInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  error?: string;
  secureTextEntry?: boolean;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  autoComplete?: 'email' | 'password' | 'name' | 'off';
  editable?: boolean;
}

export default function AuthInput({
  value,
  onChangeText,
  placeholder,
  error,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'none',
  autoComplete = 'off',
  editable = true,
}: AuthInputProps) {
  const { theme } = useTheme();
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const isPassword = secureTextEntry;
  const actualSecureTextEntry = isPassword && !isPasswordVisible;

  const styles = StyleSheet.create({
    container: {
      marginBottom: theme.spacing.md,
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.card,
      borderRadius: 16,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
      paddingHorizontal: theme.spacing.md,
      height: 52,
      ...Platform.select({
        ios: {
          shadowColor: '#00000010',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.06,
          shadowRadius: 4,
        },
        android: {
          elevation: 1,
        },
      }),
    },
    inputContainerFocused: {
      borderColor: theme.colors.primary,
      borderWidth: 2,
      ...Platform.select({
        ios: {
          shadowColor: theme.colors.primary,
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        },
      }),
    },
    inputContainerError: {
      borderColor: theme.colors.error,
      borderWidth: 2,
    },
    input: {
      flex: 1,
      fontSize: 16,
      color: theme.colors.text,
      paddingVertical: 0,
    },
    eyeIcon: {
      padding: theme.spacing.xs,
      marginLeft: theme.spacing.xs,
    },
    errorText: {
      color: theme.colors.error,
      fontSize: 12,
      fontWeight: '500',
      marginTop: 6,
      marginLeft: 4,
      lineHeight: 16,
    },
  });

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.inputContainer,
          isFocused && styles.inputContainerFocused,
          error && styles.inputContainerError,
        ]}>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.textSecondary}
          secureTextEntry={actualSecureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoComplete={autoComplete}
          autoCorrect={false}
          editable={editable}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />
        {isPassword && (
          <TouchableOpacity
            style={styles.eyeIcon}
            onPress={() => setIsPasswordVisible(!isPasswordVisible)}
            activeOpacity={0.7}>
            <Ionicons
              name={isPasswordVisible ? 'eye-off-outline' : 'eye-outline'}
              size={22}
              color={theme.colors.textSecondary}
            />
          </TouchableOpacity>
        )}
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}