import { useState } from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import theme from '../theme';

export default function SafeImage({ uri, style, icon = 'directions-car', iconSize = 28, iconColor = theme.colors.secondary, backgroundColor = theme.colors.surfaceContainerLow }) {
  const [failed, setFailed] = useState(false);

  if (!uri || failed) {
    return (
      <View style={[styles.placeholder, { backgroundColor }, style]}>
        <MaterialIcons name={icon} size={iconSize} color={iconColor} />
      </View>
    );
  }

  return <Image source={{ uri }} style={style} resizeMode="cover" onError={() => setFailed(true)} />;
}

const styles = StyleSheet.create({
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});