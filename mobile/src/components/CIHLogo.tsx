import React from 'react';
import { View, Image, StyleSheet, ImageStyle } from 'react-native';

interface CIHLogoProps {
  width?: number;
  height?: number;
  style?: ImageStyle;
}

export const CIHLogo: React.FC<CIHLogoProps> = ({ width = 80, height = 80, style }) => {
  return (
    <View style={[styles.container, { width, height }, style]}>
      <Image
        source={require('../../assets/logo_cih.png')}
        style={[styles.image, { width, height }]}
        resizeMode="contain"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
});

