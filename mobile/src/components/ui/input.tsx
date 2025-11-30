import React, { useState } from 'react';
import { View, TextInput, Text, TouchableOpacity, ViewStyle, TextStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { spacing, borderRadius, fontSize, fontWeight } from '../../theme/spacing';
import { cn } from '../../lib/cn';

export interface InputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  secureTextEntry?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightIconPress?: () => void;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad' | 'decimal-pad';
  multiline?: boolean;
  numberOfLines?: number;
  disabled?: boolean;
  required?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  className?: ViewStyle;
  style?: ViewStyle;
}

export function Input({
  label,
  placeholder,
  value,
  onChangeText,
  error,
  secureTextEntry = false,
  icon,
  rightIcon,
  onRightIconPress,
  keyboardType = 'default',
  multiline = false,
  numberOfLines = 1,
  disabled = false,
  required = false,
  autoCapitalize = 'none',
  className,
  style,
}: InputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const containerStyle: ViewStyle = {
    marginBottom: spacing.md,
    ...className,
    ...style,
  };

  const inputContainerStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    borderWidth: isFocused ? 2 : 1,
      borderColor: error 
      ? colors.error[500] as string
      : isFocused 
        ? colors.primary[600] as string
        : colors.gray[200] as string,
    paddingHorizontal: spacing.md,
    minHeight: 52,
    ...(disabled && {
      backgroundColor: colors.gray[50],
      opacity: 0.6,
    }),
  };

  const labelStyle: TextStyle = {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.gray[700],
    marginBottom: spacing.sm,
  };

  const inputStyle: TextStyle = {
    flex: 1,
    fontSize: fontSize.base,
    color: colors.gray[900],
    paddingVertical: spacing.md,
    ...(multiline && {
      paddingTop: spacing.md,
      textAlignVertical: 'top',
    }),
  };

  const errorTextStyle: TextStyle = {
    fontSize: fontSize.sm,
    color: colors.error[500],
  };

  return (
    <View style={containerStyle}>
      {label && (
        <Text style={labelStyle}>
          {label}
          {required && <Text style={{ color: colors.error[500] as string }}> *</Text>}
        </Text>
      )}
      <View style={inputContainerStyle}>
        {icon && (
          <Ionicons
            name={icon}
            size={20}
            color={isFocused ? colors.primary[600] : colors.gray[400]}
            style={{ marginRight: spacing.sm }}
          />
        )}
        <TextInput
          style={inputStyle}
          placeholder={placeholder}
          placeholderTextColor={colors.gray[400]}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry && !showPassword}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          keyboardType={keyboardType}
          multiline={multiline}
          numberOfLines={numberOfLines}
          editable={!disabled}
          autoCapitalize={autoCapitalize}
        />
        {secureTextEntry && (
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            style={{ padding: spacing.xs }}
          >
            <Ionicons
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={colors.gray[400]}
            />
          </TouchableOpacity>
        )}
        {rightIcon && (
          <TouchableOpacity
            onPress={onRightIconPress}
            style={{ padding: spacing.xs }}
          >
            <Ionicons
              name={rightIcon}
              size={20}
              color={colors.gray[400]}
            />
          </TouchableOpacity>
        )}
      </View>
      {error && (
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: spacing.xs, gap: spacing.xs }}>
            <Ionicons name="alert-circle" size={16} color={colors.error[500] as string} />
          <Text style={errorTextStyle}>{error}</Text>
        </View>
      )}
    </View>
  );
}

