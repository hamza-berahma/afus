import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { logoSvg } from './logo-svg';

interface LogoProps {
  width?: number;
  height?: number;
  style?: any;
}

export const Logo: React.FC<LogoProps> = ({ width = 80, height = 80, style }) => {
  return (
    <View style={[styles.container, { width, height }, style]}>
      <SvgXml xml={logoSvg} width={width} height={height} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
