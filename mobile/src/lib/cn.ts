import { StyleSheet, ViewStyle, TextStyle } from 'react-native';

/**
 * Utility function to merge style objects
 * Similar to clsx/tailwind-merge but for React Native StyleSheet
 */
export function cn(...styles: (ViewStyle | TextStyle | undefined | null | false)[]): ViewStyle | TextStyle {
  return StyleSheet.flatten(styles.filter(Boolean) as (ViewStyle | TextStyle)[]);
}

/**
 * Create variant styles helper
 */
export function cva(
  base: ViewStyle | TextStyle,
  variants: Record<string, Record<string, ViewStyle | TextStyle>>
) {
  return (props: Record<string, string> = {}) => {
    let result = { ...base };
    
    Object.keys(props).forEach((key) => {
      if (variants[key] && variants[key][props[key]]) {
        result = { ...result, ...variants[key][props[key]] };
      }
    });
    
    return result;
  };
}

