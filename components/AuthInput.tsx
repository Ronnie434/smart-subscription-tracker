import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TouchableOpacity,
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
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  editable?: boolean;
  autoComplete?: 'off' | 'email' | 'password' | 'username' | 'name' | 'tel' | 'street-address' | 'postal-code';
  textContentType?: 'none' | 'emailAddress' | 'password' | 'oneTimeCode' | 'username' | 'name' | 'telephoneNumber';
  importantForAutofill?: 'yes' | 'no' | 'yesExcludeDescendants' | 'noExcludeDescendants';
}

export default function AuthInput({
  value,
  onChangeText,
  placeholder,
  error,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'none',
  editable = true,
  autoComplete,
  textContentType,
  importantForAutofill,
}: AuthInputProps) {
  const { theme } = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const actualSecureTextEntry = secureTextEntry && !isPasswordVisible;

  const styles = StyleSheet.create({
    container: { marginBottom: theme.spacing.md },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.card,
      borderRadius: 16,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
      paddingHorizontal: theme.spacing.md,
      height: 52,
    },
    inputContainerFocused: { borderColor: theme.colors.primary, borderWidth: 2 },
    inputContainerError: { borderColor: theme.colors.error, borderWidth: 2 },
    input: { flex: 1, fontSize: 16, color: theme.colors.text, paddingVertical: 0 },
    eyeIcon: { padding: theme.spacing.xs, marginLeft: theme.spacing.xs },
    errorText: { color: theme.colors.error, fontSize: 12, fontWeight: '500', marginTop: 6, marginLeft: 4, lineHeight: 16 },
  });

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.inputContainer,
          isFocused && styles.inputContainerFocused,
          error && styles.inputContainerError,
        ]}
      >
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.textSecondary}
          secureTextEntry={actualSecureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={false}
          editable={editable}
          onFocus={() => setTimeout(() => setIsFocused(true), 50)} // delay focus for iOS 17
          onBlur={() => setIsFocused(false)}
          autoComplete={autoComplete ?? 'off'}
          textContentType={textContentType ?? 'oneTimeCode'}
          importantForAutofill={importantForAutofill ?? 'no'}
          autoFocus={false}
        />
        {secureTextEntry && (
          <TouchableOpacity
            style={styles.eyeIcon}
            onPress={() => setIsPasswordVisible(!isPasswordVisible)}
            activeOpacity={0.7}
          >
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