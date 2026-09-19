import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontSize, FontWeight, Spacing, BorderRadius, Shadows } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';
import Button from '../components/Button';

// High-resolution curated fashion avatars
const AVATAR_PRESETS = [
  { id: '1', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=500&q=80', label: 'Elegance' },
  { id: '2', url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=500&q=80', label: 'Modern' },
  { id: '3', url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=500&q=80', label: 'Urban' },
  { id: '4', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=500&q=80', label: 'Classic' },
  { id: '5', url: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=500&q=80', label: 'Chic' },
  { id: '6', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=500&q=80', label: 'Casual' },
];

export default function ChangeProfilePictureScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { user, updateUser, refreshUser } = useAuth();

  const [currentAvatar, setCurrentAvatar] = useState<string>(
    user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=500&q=80'
  );
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
  const [selectedPresetUrl, setSelectedPresetUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const headerPaddingTop = insets.top > 0 ? insets.top + Spacing.sm : Spacing.lg;

  const handlePickFromGallery = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert(
          'Permission Required',
          'Please allow access to your photo library in settings to pick a profile picture.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];

        // Validate file size: maximum 5MB
        if (asset.fileSize && asset.fileSize > 5 * 1024 * 1024) {
          Alert.alert('File Too Large', 'Please select an image smaller than 5MB.');
          return;
        }

        setSelectedImageUri(asset.uri);
        setSelectedPresetUrl(null);
      }
    } catch (err: any) {
      console.error('Gallery pick error:', err);
      Alert.alert('Error', 'Unable to pick image. Please try again.');
    }
  };

  const handleSelectPreset = (url: string) => {
    setSelectedPresetUrl(url);
    setSelectedImageUri(null);
  };

  const handleSave = async () => {
    if (!selectedImageUri && !selectedPresetUrl) {
      Alert.alert('No Change', 'Please select a new photo or preset avatar.');
      return;
    }

    setLoading(true);
    try {
      let updatedAvatarUrl = '';

      if (selectedImageUri) {
        const uriParts = selectedImageUri.split('.');
        const fileType = uriParts[uriParts.length - 1] || 'jpg';

        const formData = new FormData();
        formData.append('avatar', {
          uri: Platform.OS === 'android' ? selectedImageUri : selectedImageUri.replace('file://', ''),
          name: `avatar_${Date.now()}.${fileType}`,
          type: `image/${fileType === 'jpg' ? 'jpeg' : fileType}`,
        } as any);

        const res = await api.uploadAvatar(formData);
        updatedAvatarUrl = res.avatar;
      } else if (selectedPresetUrl) {
        const res = await api.uploadAvatar({ avatarUrl: selectedPresetUrl });
        updatedAvatarUrl = res.avatar;
      }

      // Update state locally and refresh throughout app
      setCurrentAvatar(updatedAvatarUrl);
      updateUser({ avatar: updatedAvatarUrl, photoUrl: updatedAvatarUrl });
      await refreshUser().catch(() => {});

      setSelectedImageUri(null);
      setSelectedPresetUrl(null);

      Alert.alert(
        'Success! 🎉',
        'Your profile picture has been updated successfully.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (err: any) {
      console.error('Avatar update failed:', err);
      Alert.alert('Update Failed', err.message || 'Could not update profile picture. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const previewUri = selectedImageUri || selectedPresetUrl || currentAvatar;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Top Header */}
      <View style={[styles.header, { paddingTop: headerPaddingTop, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: colors.surfaceLight }]}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Change Profile Picture</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.xxxl }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar Preview */}
        <View style={styles.previewSection}>
          <View style={[styles.avatarRing, { borderColor: colors.primary }]}>
            <Image source={{ uri: previewUri }} style={styles.avatarImage} />
            {(selectedImageUri || selectedPresetUrl) && (
              <View style={[styles.selectedBadge, { backgroundColor: colors.accent }]}>
                <Ionicons name="checkmark" size={16} color={colors.white} />
              </View>
            )}
          </View>
          <Text style={[styles.previewHint, { color: colors.textSecondary }]}>
            {selectedImageUri || selectedPresetUrl ? 'New picture preview' : 'Current profile picture'}
          </Text>
        </View>

        {/* Gallery Action */}
        <TouchableOpacity
          style={[styles.galleryButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={handlePickFromGallery}
          activeOpacity={0.7}
        >
          <View style={[styles.galleryIconBox, { backgroundColor: colors.primaryFaded }]}>
            <Ionicons name="images-outline" size={22} color={colors.primary} />
          </View>
          <View style={styles.galleryTextContainer}>
            <Text style={[styles.galleryTitle, { color: colors.text }]}>Choose from Gallery</Text>
            <Text style={[styles.gallerySubtitle, { color: colors.textMuted }]}>
              Supports JPEG, PNG, WebP up to 5MB
            </Text>
          </View>
          <Ionicons name="cloud-upload-outline" size={20} color={colors.primary} />
        </TouchableOpacity>

        {/* Curated Presets Section */}
        <View style={styles.presetSection}>
          <Text style={[styles.presetSectionTitle, { color: colors.textSecondary }]}>
            OR SELECT A CURATED AVATAR
          </Text>
          <View style={styles.presetGrid}>
            {AVATAR_PRESETS.map((preset) => {
              const isSelected = selectedPresetUrl === preset.url;
              return (
                <TouchableOpacity
                  key={preset.id}
                  style={[
                    styles.presetItem,
                    {
                      borderColor: isSelected ? colors.primary : colors.border,
                      borderWidth: isSelected ? 3 : 1,
                    },
                  ]}
                  onPress={() => handleSelectPreset(preset.url)}
                  activeOpacity={0.8}
                >
                  <Image source={{ uri: preset.url }} style={styles.presetImage} />
                  {isSelected && (
                    <View style={[styles.presetSelectedOverlay, { backgroundColor: colors.primaryFaded }]}>
                      <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Save Button */}
        <View style={styles.actionContainer}>
          <Button
            title={loading ? 'Uploading Picture...' : 'Save Profile Picture'}
            onPress={handleSave}
            loading={loading}
            disabled={loading || (!selectedImageUri && !selectedPresetUrl)}
            fullWidth
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: Spacing.lg,
  },
  previewSection: {
    alignItems: 'center',
    marginVertical: Spacing.xl,
  },
  avatarRing: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    padding: 3,
    position: 'relative',
    ...Shadows.glow,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 57,
  },
  selectedBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  previewHint: {
    fontSize: FontSize.xs,
    marginTop: Spacing.sm,
    fontWeight: FontWeight.medium,
  },
  galleryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    marginBottom: Spacing.xxl,
    ...Shadows.sm,
  },
  galleryIconBox: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  galleryTextContainer: {
    flex: 1,
  },
  galleryTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
  },
  gallerySubtitle: {
    fontSize: FontSize.xs,
    marginTop: 2,
  },
  presetSection: {
    marginBottom: Spacing.xxl,
  },
  presetSectionTitle: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    letterSpacing: 0.8,
    marginBottom: Spacing.md,
    marginLeft: Spacing.xs,
  },
  presetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    justifyContent: 'space-between',
  },
  presetItem: {
    width: '30%',
    aspectRatio: 1,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    position: 'relative',
  },
  presetImage: {
    width: '100%',
    height: '100%',
  },
  presetSelectedOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(108, 99, 255, 0.3)',
  },
  actionContainer: {
    marginTop: Spacing.md,
  },
});
