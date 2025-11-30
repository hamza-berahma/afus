import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { apiService } from '../services/api';
import { Input, Button } from '../components/ui';
import { colors } from '../theme/colors';
import { spacing, borderRadius, fontSize, fontWeight } from '../theme/spacing';

export default function ProductFormScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { user } = useAuth();
  const { showToast } = useToast();
  const { productId } = route.params as { productId?: string };
  const isEditing = !!productId;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [unit, setUnit] = useState('kg');
  const [stockQuantity, setStockQuantity] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingProduct, setLoadingProduct] = useState(isEditing);
  const [errors, setErrors] = useState<{
    name?: string;
    price?: string;
    stockQuantity?: string;
  }>({});

  const units = ['kg', 'liter', 'piece', 'box', 'bag'];

  useEffect(() => {
    if (isEditing) {
      loadProduct();
    }
  }, [productId]);

  const loadProduct = async () => {
    try {
      const response = await apiService.getProduct(productId!);
      const product = response.data.data?.product || response.data.product;
      setName(product.name || '');
      setDescription(product.description || '');
      setPrice(product.price?.toString() || '');
      setUnit(product.unit || 'kg');
      setStockQuantity(product.stockQuantity?.toString() || '');
      setImageUri(product.imageUrl || null);
    } catch (error) {
      showToast('Failed to load product', 'error');
    } finally {
      setLoadingProduct(false);
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant camera roll permissions');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant camera permissions');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const showImageOptions = () => {
    Alert.alert(
      'Select Image',
      'Choose an option',
      [
        { text: 'Camera', onPress: takePhoto },
        { text: 'Gallery', onPress: pickImage },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const validate = () => {
    const newErrors: { name?: string; price?: string; stockQuantity?: string } = {};
    if (!name.trim()) {
      newErrors.name = 'Product name is required';
    }
    if (!price || isNaN(parseFloat(price)) || parseFloat(price) <= 0) {
      newErrors.price = 'Valid price is required';
    }
    if (stockQuantity && (isNaN(parseFloat(stockQuantity)) || parseFloat(stockQuantity) < 0)) {
      newErrors.stockQuantity = 'Stock quantity must be a valid number';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      showToast('Please fix the errors', 'error');
      return;
    }

    const productData: any = {
      name,
      description,
      price: parseFloat(price),
      unit,
      stock_quantity: parseFloat(stockQuantity) || 0,
    };

    if (imageUri && !imageUri.startsWith('http')) {
      // In a real app, you'd upload the image first
      productData.image_url = imageUri;
    } else if (imageUri) {
      productData.image_url = imageUri;
    }

    setLoading(true);
    try {
      if (isEditing) {
        await apiService.updateProduct(productId!, productData);
        showToast('Product updated successfully', 'success');
      } else {
        await apiService.createProduct(productData);
        showToast('Product created successfully', 'success');
      }
      navigation.goBack();
    } catch (error: any) {
      showToast(error.response?.data?.error?.message || 'Failed to save product', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (loadingProduct) {
    return (
      <View style={styles.center}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Image Section */}
        <View style={styles.imageSection}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.image} />
          ) : (
            <View style={[styles.image, styles.placeholderImage]}>
              <Ionicons name="image-outline" size={48} color={colors.gray[300]} />
            </View>
          )}
          <TouchableOpacity style={styles.imageButton} onPress={showImageOptions}>
            <Ionicons name="camera" size={20} color={colors.white} />
            <Text style={styles.imageButtonText}>
              {imageUri ? 'Change Image' : 'Add Image'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Form Fields */}
        <View style={styles.form}>
          <Input
            label="Product Name"
            placeholder="Enter product name"
            value={name}
            onChangeText={setName}
            error={errors.name}
            icon="cube-outline"
            required
          />

          <Input
            label="Description"
            placeholder="Describe your product..."
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            icon="document-text-outline"
          />

          <View style={styles.row}>
            <View style={styles.halfWidth}>
              <Input
                label="Price (MAD)"
                placeholder="0.00"
                value={price}
                onChangeText={setPrice}
                error={errors.price}
                keyboardType="decimal-pad"
                icon="cash-outline"
                required
              />
            </View>

            <View style={styles.halfWidth}>
              <View style={styles.unitSection}>
                <Text style={styles.unitLabel}>
                  Unit <Text style={styles.required}>*</Text>
                </Text>
                <View style={styles.unitSelector}>
                  {units.map((u) => (
                    <TouchableOpacity
                      key={u}
                      style={[
                        styles.unitChip,
                        unit === u && styles.unitChipActive,
                      ]}
                      onPress={() => setUnit(u)}
                    >
                      <Text
                        style={[
                          styles.unitChipText,
                          unit === u && styles.unitChipTextActive,
                        ]}
                      >
                        {u}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          </View>

          <Input
            label="Stock Quantity"
            placeholder="0"
            value={stockQuantity}
            onChangeText={setStockQuantity}
            error={errors.stockQuantity}
            keyboardType="decimal-pad"
            icon="cube-outline"
          />

          <Button
            label={isEditing ? 'Update Product' : 'Create Product'}
            onPress={handleSubmit}
            loading={loading}
            icon="checkmark"
            iconPosition="right"
            style={styles.submitButton}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[50],
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xxl,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageSection: {
    backgroundColor: colors.white,
    padding: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
  },
  placeholderImage: {
    backgroundColor: colors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary[600],
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.full,
    gap: spacing.sm,
  },
  imageButtonText: {
    color: colors.white,
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
  form: {
    padding: spacing.md,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  halfWidth: {
    flex: 1,
  },
  unitSection: {
    marginBottom: spacing.lg,
  },
  unitLabel: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.gray[700],
    marginBottom: spacing.sm,
  },
  required: {
    color: colors.error,
  },
  unitSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  unitChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.gray[100],
    borderWidth: 2,
    borderColor: 'transparent',
  },
  unitChipActive: {
    backgroundColor: colors.primary[50],
    borderColor: colors.primary[600],
  },
  unitChipText: {
    fontSize: fontSize.sm,
    color: colors.gray[600],
    fontWeight: fontWeight.medium,
  },
  unitChipTextActive: {
    color: colors.primary[600],
    fontWeight: fontWeight.semibold,
  },
  submitButton: {
    marginTop: spacing.lg,
  },
});

