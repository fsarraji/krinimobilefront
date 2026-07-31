import { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, ActivityIndicator, useWindowDimensions } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { MaterialIcons } from '@expo/vector-icons';
import theme from '../theme';

const RATIOS = { cin: 0.63, permis: 0.72, passport: 0.70 };

export default function DocumentScanScreen({ route, navigation }) {
  const { docType = 'cin', title = 'CIN / Passeport' } = route.params || {};
  const [permission, requestPermission] = useCameraPermissions();
  const [flash, setFlash] = useState(false);
  const [photo, setPhoto] = useState(null);
  const [capturing, setCapturing] = useState(false);
  const cameraRef = useRef(null);

  const { width, height } = useWindowDimensions();
  const ratio = RATIOS[docType] || 0.66;
  const frameW = width * 0.82;
  const frameH = frameW * ratio;
  const frameX = (width - frameW) / 2;
  const frameY = (height - frameH) / 2 - 24;

  const takePicture = async () => {
    if (!cameraRef.current || capturing) return;
    setCapturing(true);
    try {
      const pic = await cameraRef.current.takePictureAsync({ quality: 0.8 });
      setPhoto(pic);
    } catch (e) {
      console.error('Camera capture error:', e);
    } finally {
      setCapturing(false);
    }
  };

  const confirm = () => {
    navigation.navigate('ClientForm', { scanResult: { docType, uri: photo.uri } });
  };

  if (!permission) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.centered}>
        <MaterialIcons name="photo-camera" size={48} color={theme.colors.primary} />
        <Text style={styles.permissionText}>Autorisez l'accès à la caméra pour scanner {title.toLowerCase()}.</Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>Autoriser la caméra</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (photo) {
    return (
      <View style={styles.container}>
        <Image source={{ uri: photo.uri }} style={styles.preview} resizeMode="contain" />
        <View style={styles.previewTopBar}>
          <Text style={styles.previewTitle}>Vérifier le scan</Text>
        </View>
        <View style={styles.previewActions}>
          <TouchableOpacity style={[styles.actionButton, styles.retakeButton]} onPress={() => setPhoto(null)}>
            <MaterialIcons name="refresh" size={22} color={theme.colors.onSurface} />
            <Text style={[styles.actionText, { color: theme.colors.onSurface }]}>Reprendre</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, styles.confirmButton]} onPress={confirm}>
            <MaterialIcons name="check" size={22} color={theme.colors.onPrimary} />
            <Text style={[styles.actionText, { color: theme.colors.onPrimary }]}>Utiliser</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing="back"
        flash={flash ? 'on' : 'off'}
      />

      <View style={[styles.overlay, { top: 0, left: 0, right: 0, height: frameY }]} />
      <View style={[styles.overlay, { top: frameY + frameH, left: 0, right: 0, bottom: 0 }]} />
      <View style={[styles.overlay, { top: frameY, left: 0, width: frameX, height: frameH }]} />
      <View style={[styles.overlay, { top: frameY, right: 0, width: frameX, height: frameH }]} />

      <View pointerEvents="none" style={[styles.frame, { left: frameX, top: frameY, width: frameW, height: frameH }]}>
        <View style={[styles.corner, styles.cornerTL]} />
        <View style={[styles.corner, styles.cornerTR]} />
        <View style={[styles.corner, styles.cornerBL]} />
        <View style={[styles.corner, styles.cornerBR]} />
      </View>

      <View style={styles.topBar}>
        <TouchableOpacity style={styles.topButton} onPress={() => navigation.goBack()}>
          <MaterialIcons name="close" size={26} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.topTitle}>{title}</Text>
        <TouchableOpacity style={styles.topButton} onPress={() => setFlash(f => !f)}>
          <MaterialIcons name={flash ? 'flash-on' : 'flash-off'} size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <Text style={styles.hint}>Placez la pièce d'identité à l'intérieur du cadre</Text>

      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.captureOuter} onPress={takePicture} disabled={capturing}>
          <View style={[styles.captureInner, capturing && styles.captureInnerBusy]}>
            {capturing && <ActivityIndicator color="#fff" />}
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  centered: { flex: 1, backgroundColor: theme.colors.background, justifyContent: 'center', alignItems: 'center', padding: theme.spacing.lg },
  permissionText: { marginTop: theme.spacing.md, textAlign: 'center', color: theme.colors.onSurfaceVariant, fontFamily: theme.fonts.body, fontSize: theme.fontSize.md },
  permissionButton: { marginTop: theme.spacing.lg, backgroundColor: theme.colors.primary, borderRadius: theme.borderRadius.md, paddingHorizontal: theme.spacing.lg, paddingVertical: 12 },
  permissionButtonText: { color: theme.colors.onPrimary, fontFamily: theme.fonts.bodySemibold, fontSize: theme.fontSize.md },
  overlay: { position: 'absolute', backgroundColor: 'rgba(0,0,0,0.55)' },
  frame: { position: 'absolute', borderWidth: 1, borderColor: 'rgba(255,255,255,0.35)', borderRadius: 4 },
  corner: { position: 'absolute', width: 28, height: 28, borderColor: '#fff', borderWidth: 3 },
  cornerTL: { top: -2, left: -2, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 4 },
  cornerTR: { top: -2, right: -2, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: 4 },
  cornerBL: { bottom: -2, left: -2, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: 4 },
  cornerBR: { bottom: -2, right: -2, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: 4 },
  topBar: { position: 'absolute', top: 0, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 48, paddingHorizontal: theme.spacing.md },
  topButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'center', alignItems: 'center' },
  topTitle: { color: '#fff', fontFamily: theme.fonts.bodySemibold, fontSize: theme.fontSize.lg },
  hint: { position: 'absolute', top: 96, left: theme.spacing.lg, right: theme.spacing.lg, textAlign: 'center', color: 'rgba(255,255,255,0.85)', fontFamily: theme.fonts.body, fontSize: theme.fontSize.sm },
  bottomBar: { position: 'absolute', bottom: 40, left: 0, right: 0, alignItems: 'center' },
  captureOuter: { width: 76, height: 76, borderRadius: 38, borderWidth: 4, borderColor: '#fff', justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.15)' },
  captureInner: { width: 60, height: 60, borderRadius: 30, backgroundColor: theme.colors.primary, justifyContent: 'center', alignItems: 'center' },
  captureInnerBusy: { backgroundColor: theme.colors.primaryContainer },
  preview: { flex: 1, backgroundColor: '#000' },
  previewTopBar: { position: 'absolute', top: 0, left: 0, right: 0, alignItems: 'center', paddingTop: 52 },
  previewTitle: { color: '#fff', fontFamily: theme.fonts.bodySemibold, fontSize: theme.fontSize.lg },
  previewActions: { position: 'absolute', bottom: 40, left: theme.spacing.lg, right: theme.spacing.lg, flexDirection: 'row', justifyContent: 'space-between' },
  actionButton: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 14, borderRadius: theme.borderRadius.md, gap: 8 },
  retakeButton: { backgroundColor: theme.colors.surfaceContainerHighest, marginRight: theme.spacing.md },
  confirmButton: { backgroundColor: theme.colors.primary },
  actionText: { fontFamily: theme.fonts.bodySemibold, fontSize: theme.fontSize.md },
});
