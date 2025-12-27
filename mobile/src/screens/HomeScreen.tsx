import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  useWindowDimensions,
  RefreshControl,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import { visitorService, departmentService, authService, vehicleService, ocrService } from '../services/api';

interface Department {
  _id: string;
  name: string;
}

interface ActiveRecord {
  _id: string;
  fullName?: string;
  driverName?: string;
  licensePlate: string;
  status: string;
  entryTime: string;
  recordType?: string;
  department?: { name: string };
}

interface HomeScreenProps {
  onLogout: () => void;
}

type TabType = 'visitor' | 'vehicle';
type RecordFilterType = 'all' | 'visitor' | 'vehicle';

export default function HomeScreen({ onLogout }: HomeScreenProps) {
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;

  const [activeTab, setActiveTab] = useState<TabType>('visitor');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [visitorOcrLoading, setVisitorOcrLoading] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [activeRecords, setActiveRecords] = useState<ActiveRecord[]>([]);
  const [staffName, setStaffName] = useState('');
  
  // Filter and search for active records
  const [recordFilter, setRecordFilter] = useState<RecordFilterType>('all');
  const [recordSearch, setRecordSearch] = useState('');

  // Visitor Form
  const [visitorForm, setVisitorForm] = useState({
    fullName: '',
    phone: '',
    company: '',
    visitingPerson: '',
    department: '',
    entryReason: '',
    hasVehicle: false,
    licensePlate: '',
    visitorPhotos: [] as string[],
    idPhoto: '',
    vehiclePhoto: '',
  });

  // Vehicle Form
  const [vehicleForm, setVehicleForm] = useState({
    driverName: '',
    licensePlate: '',
    brand: '',
    model: '',
    photos: [] as string[],
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const [deptResponse, staff] = await Promise.all([
        departmentService.getAll(),
        authService.getStaff(),
      ]);
      setDepartments(deptResponse.data || []);
      setStaffName(staff?.name || 'Personel');
      await loadActiveRecords();
    } catch (error) {
      console.error('Data load error:', error);
      Alert.alert('Bağlantı Hatası', 'Sunucuya bağlanılamadı.');
    }
  };

  const loadActiveRecords = async () => {
    try {
      const [visitorsRes, vehiclesRes] = await Promise.all([
        visitorService.getActive(),
        vehicleService.getActive(),
      ]);
      
      const visitors = (visitorsRes.data || []).map((v: any) => ({
        ...v,
        recordType: 'visitor',
        fullName: v.fullName,
      }));
      
      const vehicles = (vehiclesRes.data || []).map((v: any) => ({
        ...v,
        recordType: 'vehicle',
        fullName: v.driverName,
      }));
      
      // Karışık liste - tarihe göre sıralı
      const combined = [...visitors, ...vehicles].sort(
        (a, b) => new Date(b.entryTime).getTime() - new Date(a.entryTime).getTime()
      );
      
      setActiveRecords(combined);
    } catch (error) {
      console.error('Records load error:', error);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadActiveRecords();
    setRefreshing(false);
  }, []);

  const pickVisitorImage = async (type: 'visitor' | 'id' | 'vehicle') => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('İzin Gerekli', 'Kamera izni gerekiyor.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: type === 'vehicle' ? [4, 3] : [1, 1],
      quality: type === 'vehicle' ? 0.7 : 0.5,
    });

    if (!result.canceled && result.assets[0]) {
      setLoading(true);
      try {
        const uploadResponse = await visitorService.uploadPhoto(result.assets[0]);
        if (uploadResponse.url) {
          if (type === 'visitor') {
            // Multiple visitor photos
            setVisitorForm(prev => ({
              ...prev,
              visitorPhotos: [...prev.visitorPhotos, uploadResponse.url],
            }));
          } else if (type === 'vehicle') {
            // Vehicle photo with ALPR
            setVisitorForm(prev => ({
              ...prev,
              vehiclePhoto: uploadResponse.url,
            }));
            // Run OCR if license plate is empty
            if (!visitorForm.licensePlate) {
              setVisitorOcrLoading(true);
              try {
                const ocrResult = await ocrService.recognizePlate(uploadResponse.url);
                if (ocrResult.plate) {
                  setVisitorForm(prev => ({
                    ...prev,
                    licensePlate: ocrResult.plate,
                  }));
                  Alert.alert('Plaka Tanındı', `Plaka: ${ocrResult.plate}`);
                }
              } catch (ocrError) {
                console.log('OCR failed:', ocrError);
              } finally {
                setVisitorOcrLoading(false);
              }
            }
          } else {
            // ID photo
            setVisitorForm(prev => ({
              ...prev,
              idPhoto: uploadResponse.url,
            }));
          }
        }
      } catch (error) {
        Alert.alert('Hata', 'Fotoğraf yüklenemedi.');
      } finally {
        setLoading(false);
      }
    }
  };

  const removeVisitorPhoto = (index: number) => {
    setVisitorForm(prev => ({
      ...prev,
      visitorPhotos: prev.visitorPhotos.filter((_, i) => i !== index),
    }));
  };

  const pickVehiclePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('İzin Gerekli', 'Kamera izni gerekiyor.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7, // OCR için biraz daha yüksek kalite
    });

    if (!result.canceled && result.assets[0]) {
      setLoading(true);
      try {
        const uploadResponse = await vehicleService.uploadPhoto(result.assets[0]);
        if (uploadResponse.url) {
          setVehicleForm(prev => ({
            ...prev,
            photos: [...prev.photos, uploadResponse.url],
          }));
          
          // OCR ile plaka tanıma dene (sadece ilk fotoğrafta ve plaka boşsa)
          if (vehicleForm.photos.length === 0 && !vehicleForm.licensePlate) {
            setOcrLoading(true);
            try {
              const ocrResult = await ocrService.recognizePlate(uploadResponse.url);
              if (ocrResult.plate) {
                setVehicleForm(prev => ({
                  ...prev,
                  licensePlate: ocrResult.plate,
                }));
                Alert.alert('Plaka Tanındı', `Plaka: ${ocrResult.plate}`);
              }
            } catch (ocrError) {
              // OCR hatası olursa sessizce devam et
              console.log('OCR failed:', ocrError);
            } finally {
              setOcrLoading(false);
            }
          }
        }
      } catch (error) {
        Alert.alert('Hata', 'Fotoğraf yüklenemedi.');
      } finally {
        setLoading(false);
      }
    }
  };

  const removeVehiclePhoto = (index: number) => {
    setVehicleForm(prev => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index),
    }));
  };

  const handleLogout = () => {
    Alert.alert('Çıkış', 'Oturumu kapatmak istiyor musunuz?', [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Çıkış Yap',
        style: 'destructive',
        onPress: async () => {
          await authService.logout();
          onLogout();
        },
      },
    ]);
  };

  const handleVisitorSubmit = async () => {
    if (!visitorForm.fullName || !visitorForm.phone || !visitorForm.company || !visitorForm.visitingPerson || !visitorForm.department) {
      Alert.alert('Eksik Bilgi', 'Lütfen zorunlu (*) alanları doldurun.');
      return;
    }

    setLoading(true);
    try {
      await visitorService.create(visitorForm);
      Alert.alert('Başarılı', 'Ziyaretçi kaydı oluşturuldu.');
      setVisitorForm({
        fullName: '',
        phone: '',
        company: '',
        visitingPerson: '',
        department: '',
        entryReason: '',
        hasVehicle: false,
        licensePlate: '',
        visitorPhotos: [],
        idPhoto: '',
        vehiclePhoto: '',
      });
      await loadActiveRecords();
    } catch (error: any) {
      Alert.alert('Hata', error.response?.data?.message || 'Kayıt başarısız.');
    } finally {
      setLoading(false);
    }
  };

  const handleVehicleSubmit = async () => {
    if (!vehicleForm.driverName || !vehicleForm.licensePlate) {
      Alert.alert('Eksik Bilgi', 'Lütfen zorunlu (*) alanları doldurun.');
      return;
    }

    setLoading(true);
    try {
      await vehicleService.create(vehicleForm);
      Alert.alert('Başarılı', 'Araç kaydı oluşturuldu.');
      setVehicleForm({
        driverName: '',
        licensePlate: '',
        brand: '',
        model: '',
        photos: [],
      });
      await loadActiveRecords();
    } catch (error: any) {
      Alert.alert('Hata', error.response?.data?.message || 'Kayıt başarısız.');
    } finally {
      setLoading(false);
    }
  };

  const handleExit = (record: ActiveRecord) => {
    const isVehicle = record.recordType === 'vehicle';
    const name = isVehicle ? record.driverName || record.fullName : record.fullName;
    
    Alert.alert('Çıkış İşlemi', `${name} için çıkış yapılsın mı?`, [
      { text: 'Hayır', style: 'cancel' },
      {
        text: 'Evet',
        onPress: async () => {
          try {
            if (isVehicle) {
              await vehicleService.exit(record._id);
            } else {
              await visitorService.exit(record._id);
            }
            loadActiveRecords();
          } catch (error) {
            Alert.alert('Hata', 'İşlem başarısız.');
          }
        },
      },
    ]);
  };

  // Filtered records based on type and search
  const filteredRecords = activeRecords.filter(record => {
    // Type filter
    if (recordFilter === 'visitor' && record.recordType !== 'visitor') return false;
    if (recordFilter === 'vehicle' && record.recordType !== 'vehicle') return false;
    
    // Search filter
    if (recordSearch) {
      const search = recordSearch.toLowerCase();
      const name = record.recordType === 'vehicle' ? record.driverName : record.fullName;
      return (
        name?.toLowerCase().includes(search) ||
        record.licensePlate?.toLowerCase().includes(search)
      );
    }
    return true;
  });

  // Counts for badges
  const visitorCount = activeRecords.filter(r => r.recordType === 'visitor').length;
  const vehicleCount = activeRecords.filter(r => r.recordType === 'vehicle').length;

  const renderRecordCard = ({ item }: { item: ActiveRecord }) => {
    const isVehicle = item.recordType === 'vehicle';
    const name = isVehicle ? item.driverName || item.fullName : item.fullName;
    
    return (
      <View style={[styles.card, isVehicle && styles.vehicleCard]}>
        <View style={styles.cardHeader}>
          <View style={[styles.avatarPlaceholder, isVehicle && styles.vehicleAvatar]}>
            <Text style={styles.avatarText}>{isVehicle ? '🚗' : name?.charAt(0).toUpperCase()}</Text>
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>{name}</Text>
            <Text style={styles.cardSubtitle}>
              {isVehicle ? `🚙 ${item.licensePlate}` : item.department?.name}
            </Text>
          </View>
          <View style={[styles.typeBadge, isVehicle ? styles.vehicleBadge : styles.visitorBadge]}>
            <Text style={styles.typeBadgeText}>{isVehicle ? 'ARAÇ' : 'ZİYARETÇİ'}</Text>
          </View>
        </View>

        <View style={styles.cardDetails}>
          <Text style={styles.cardDetailText}>
            🕒 {new Date(item.entryTime).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
          </Text>
          {!isVehicle && item.licensePlate && (
            <Text style={styles.cardDetailText}>🚗 {item.licensePlate}</Text>
          )}
        </View>

        <TouchableOpacity style={styles.exitButton} onPress={() => handleExit(item)}>
          <Text style={styles.exitButtonText}>ÇIKIŞ YAP</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderVisitorForm = () => (
    <ScrollView style={styles.formScroller} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      <View style={styles.formGroup}>
        <Text style={styles.label}>Ziyaretçi Bilgileri</Text>
        <TextInput
          style={styles.input}
          placeholder="Ad Soyad *"
          value={visitorForm.fullName}
          onChangeText={(text) => setVisitorForm(prev => ({ ...prev, fullName: text }))}
        />
        <View style={styles.row}>
          <TextInput
            style={[styles.input, styles.halfInput]}
            placeholder="Telefon *"
            value={visitorForm.phone}
            onChangeText={(text) => setVisitorForm(prev => ({ ...prev, phone: text }))}
            keyboardType="phone-pad"
          />
          <TextInput
            style={[styles.input, styles.halfInput]}
            placeholder="Şirket *"
            value={visitorForm.company}
            onChangeText={(text) => setVisitorForm(prev => ({ ...prev, company: text }))}
          />
        </View>
        <View style={styles.row}>
          <TextInput
            style={[styles.input, styles.halfInput]}
            placeholder="Görüşeceği Kişi *"
            value={visitorForm.visitingPerson}
            onChangeText={(text) => setVisitorForm(prev => ({ ...prev, visitingPerson: text }))}
          />
          <View style={[styles.inputContainer, styles.halfInput]}>
            <Picker
              selectedValue={visitorForm.department}
              onValueChange={(value) => setVisitorForm(prev => ({ ...prev, department: value }))}
              style={styles.picker}
            >
              <Picker.Item label="Departman *" value="" color="#999" />
              {departments.map((dept) => (
                <Picker.Item key={dept._id} label={dept.name} value={dept._id} />
              ))}
            </Picker>
          </View>
        </View>
      </View>

      <View style={styles.formGroup}>
        <TouchableOpacity
          style={styles.checkboxContainer}
          onPress={() => setVisitorForm(prev => ({ ...prev, hasVehicle: !prev.hasVehicle }))}
        >
          <View style={[styles.checkbox, visitorForm.hasVehicle && styles.checked]}>
            {visitorForm.hasVehicle && <Text style={styles.checkMark}>✓</Text>}
          </View>
          <Text style={styles.checkboxLabel}>Araçlı mı?</Text>
        </TouchableOpacity>
        {visitorForm.hasVehicle && (
          <View style={styles.plateInputContainer}>
            <TextInput
              style={[styles.input, styles.plateInput]}
              placeholder="Araç plakası"
              value={visitorForm.licensePlate}
              onChangeText={(text) => setVisitorForm(prev => ({ ...prev, licensePlate: text.toUpperCase() }))}
              autoCapitalize="characters"
            />
            {visitorOcrLoading && <ActivityIndicator style={styles.ocrIndicator} color="#007aff" />}
          </View>
        )}
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Fotoğraflar</Text>
        <View style={styles.photoRow}>
          <TouchableOpacity
            style={[styles.photoCard, visitorForm.visitorPhotos.length > 0 && styles.photoTaken]}
            onPress={() => pickVisitorImage('visitor')}
          >
            <Text style={styles.photoIcon}>👤</Text>
            <Text style={styles.photoText}>
              {visitorForm.visitorPhotos.length > 0 ? `Eklendi (${visitorForm.visitorPhotos.length})` : 'Kişi'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.photoCard, visitorForm.idPhoto && styles.photoTaken]}
            onPress={() => pickVisitorImage('id')}
          >
            <Text style={styles.photoIcon}>🪪</Text>
            <Text style={styles.photoText}>{visitorForm.idPhoto ? 'Eklendi' : 'Kimlik'}</Text>
          </TouchableOpacity>
          
          {visitorForm.hasVehicle && (
            <TouchableOpacity
              style={[styles.photoCard, visitorForm.vehiclePhoto && styles.photoTaken]}
              onPress={() => pickVisitorImage('vehicle')}
            >
              <Text style={styles.photoIcon}>🚙</Text>
              <Text style={styles.photoText}>{visitorForm.vehiclePhoto ? 'Eklendi' : 'Araç'}</Text>
              {visitorOcrLoading && <ActivityIndicator size="small" color="#007aff" style={styles.photoLoading} />}
            </TouchableOpacity>
          )}
        </View>

        {/* Visitor Photos Preview Grid */}
        {visitorForm.visitorPhotos.length > 0 && (
          <View style={[styles.photoGrid, { marginTop: 10 }]}>
            {visitorForm.visitorPhotos.map((photo, index) => (
              <View key={index} style={styles.photoPreview}>
                <Image source={{ uri: photo }} style={styles.previewImage} />
                <TouchableOpacity style={styles.removePhotoBtn} onPress={() => removeVisitorPhoto(index)}>
                  <Text style={styles.removePhotoText}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </View>

      <TouchableOpacity
        style={[styles.saveButton, loading && styles.disabledButton]}
        onPress={handleVisitorSubmit}
        disabled={loading}
      >
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>KAYDI OLUŞTUR</Text>}
      </TouchableOpacity>
      <View style={{ height: 50 }} />
    </ScrollView>
  );

  const renderVehicleForm = () => (
    <ScrollView style={styles.formScroller} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      <View style={styles.formGroup}>
        <Text style={styles.label}>Araç Bilgileri</Text>
        <TextInput
          style={styles.input}
          placeholder="Sürücü Ad Soyad *"
          value={vehicleForm.driverName}
          onChangeText={(text) => setVehicleForm(prev => ({ ...prev, driverName: text }))}
        />
        <View style={styles.plateInputContainer}>
          <TextInput
            style={[styles.input, styles.plateInput]}
            placeholder="Araç plakası"
            value={vehicleForm.licensePlate}
            onChangeText={(text) => setVehicleForm(prev => ({ ...prev, licensePlate: text.toUpperCase() }))}
            autoCapitalize="characters"
          />
          {ocrLoading && <ActivityIndicator style={styles.ocrIndicator} color="#007aff" />}
        </View>
        <View style={styles.row}>
          <TextInput
            style={[styles.input, styles.halfInput]}
            placeholder="Marka"
            value={vehicleForm.brand}
            onChangeText={(text) => setVehicleForm(prev => ({ ...prev, brand: text }))}
          />
          <TextInput
            style={[styles.input, styles.halfInput]}
            placeholder="Model"
            value={vehicleForm.model}
            onChangeText={(text) => setVehicleForm(prev => ({ ...prev, model: text }))}
          />
        </View>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Araç Fotoğrafları ({vehicleForm.photos.length})</Text>
        <View style={styles.photoGrid}>
          {vehicleForm.photos.map((photo, index) => (
            <View key={index} style={styles.photoPreview}>
              <Image source={{ uri: photo }} style={styles.previewImage} />
              <TouchableOpacity style={styles.removePhotoBtn} onPress={() => removeVehiclePhoto(index)}>
                <Text style={styles.removePhotoText}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}
          <TouchableOpacity style={styles.addPhotoCard} onPress={pickVehiclePhoto}>
            <Text style={styles.addPhotoIcon}>📷</Text>
            <Text style={styles.addPhotoText}>Fotoğraf Ekle</Text>
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.saveButton, loading && styles.disabledButton]}
        onPress={handleVehicleSubmit}
        disabled={loading}
      >
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>ARAÇ KAYDI OLUŞTUR</Text>}
      </TouchableOpacity>
      <View style={{ height: 50 }} />
    </ScrollView>
  );

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={isLandscape ? styles.landscapeContainer : styles.portraitContainer}>
        {/* Form Panel */}
        <View style={isLandscape ? styles.mainPanelLandscape : styles.mainPanelPortrait}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              {/* <Image 
                source={require('../../assets/logo.png')} 
                style={styles.headerLogo}
                resizeMode="contain"
              />*/}
              <View>
                <Text style={styles.headerTitle}>Kayıt Paneli</Text>
                <Text style={styles.headerSubtitle}>Personel: {staffName}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
              <Text style={styles.logoutText}>ÇIKIŞ</Text>
            </TouchableOpacity>
          </View>

          {/* Tabs */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'visitor' && styles.activeTab]}
              onPress={() => setActiveTab('visitor')}
            >
              <Text style={[styles.tabText, activeTab === 'visitor' && styles.activeTabText]}>👤 Ziyaretçi Kaydı</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'vehicle' && styles.activeTab]}
              onPress={() => setActiveTab('vehicle')}
            >
              <Text style={[styles.tabText, activeTab === 'vehicle' && styles.activeTabText]}>🚗 Araç Kaydı</Text>
            </TouchableOpacity>
          </View>

          {/* Form */}
          {activeTab === 'visitor' ? renderVisitorForm() : renderVehicleForm()}
        </View>

        {/* List Panel */}
        <View style={isLandscape ? styles.sidePanelLandscape : styles.sidePanelPortrait}>
          <View style={styles.listHeader}>
            <Text style={styles.listHeaderTitle}>Aktif Kayıtlar</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{filteredRecords.length}</Text>
            </View>
          </View>

          {/* Filter Tabs */}
          <View style={styles.filterTabsContainer}>
            <TouchableOpacity
              style={[styles.filterTab, recordFilter === 'all' && styles.filterTabActive]}
              onPress={() => setRecordFilter('all')}
            >
              <Text style={[styles.filterTabText, recordFilter === 'all' && styles.filterTabTextActive]}>
                Tümü ({activeRecords.length})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterTab, recordFilter === 'visitor' && styles.filterTabActive]}
              onPress={() => setRecordFilter('visitor')}
            >
              <Text style={[styles.filterTabText, recordFilter === 'visitor' && styles.filterTabTextActive]}>
                👤 ({visitorCount})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterTab, recordFilter === 'vehicle' && styles.filterTabActive]}
              onPress={() => setRecordFilter('vehicle')}
            >
              <Text style={[styles.filterTabText, recordFilter === 'vehicle' && styles.filterTabTextActive]}>
                🚗 ({vehicleCount})
              </Text>
            </TouchableOpacity>
          </View>

          {/* Search Input */}
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="İsim veya plaka ara..."
              value={recordSearch}
              onChangeText={setRecordSearch}
              placeholderTextColor="#8e8e93"
            />
            {recordSearch.length > 0 && (
              <TouchableOpacity style={styles.clearSearch} onPress={() => setRecordSearch('')}>
                <Text style={styles.clearSearchText}>✕</Text>
              </TouchableOpacity>
            )}
          </View>

          <FlatList
            data={filteredRecords}
            keyExtractor={(item) => item._id}
            renderItem={renderRecordCard}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>
                  {recordSearch ? 'Sonuç bulunamadı' : 'Aktif kayıt yok'}
                </Text>
              </View>
            }
            contentContainerStyle={styles.listContent}
          />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f2f2f7' },
  landscapeContainer: { flex: 1, flexDirection: 'row' },
  portraitContainer: { flex: 1, flexDirection: 'column' },
  mainPanelLandscape: { flex: 2, backgroundColor: '#fff', borderRightWidth: 1, borderRightColor: '#e5e5ea' },
  sidePanelLandscape: { flex: 1, backgroundColor: '#f2f2f7' },
  mainPanelPortrait: { flex: 1, backgroundColor: '#fff' },
  sidePanelPortrait: { height: 280, backgroundColor: '#f2f2f7', borderTopWidth: 1, borderTopColor: '#e5e5ea' },
  
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#e5e5ea' },
  headerLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  headerLogo: { width: 200, height: 80, marginRight: 16 , transform: [{ scale: 1 }] },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#1c1c1e' },
  headerSubtitle: { fontSize: 14, color: '#8e8e93', marginTop: 2 },
  logoutButton: { paddingVertical: 8, paddingHorizontal: 16, backgroundColor: '#ffebee', borderRadius: 8 },
  logoutText: { color: '#d32f2f', fontWeight: '600', fontSize: 14 },
  
  tabContainer: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#e5e5ea' },
  tab: { flex: 1, paddingVertical: 16, alignItems: 'center', backgroundColor: '#f9f9f9' },
  activeTab: { backgroundColor: '#fff', borderBottomWidth: 3, borderBottomColor: '#007aff' },
  tabText: { fontSize: 16, fontWeight: '600', color: '#8e8e93' },
  activeTabText: { color: '#007aff' },
  
  formScroller: { flex: 1, padding: 16 },
  formGroup: { marginBottom: 20 },
  label: { fontSize: 16, fontWeight: '600', color: '#1c1c1e', marginBottom: 12 },
  input: { backgroundColor: '#f2f2f7', borderRadius: 10, padding: 14, fontSize: 16, color: '#1c1c1e', marginBottom: 10 },
  row: { flexDirection: 'row', gap: 10 },
  halfInput: { flex: 1 },
  inputContainer: { backgroundColor: '#f2f2f7', borderRadius: 10, marginBottom: 10, overflow: 'hidden', justifyContent: 'center' },
  picker: { height: 50 },
  
  checkboxContainer: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, marginBottom: 8 },
  checkbox: { width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: '#007aff', marginRight: 12, alignItems: 'center', justifyContent: 'center' },
  checked: { backgroundColor: '#007aff' },
  checkMark: { color: '#fff', fontWeight: 'bold' },
  checkboxLabel: { fontSize: 16, color: '#1c1c1e' },
  
  photoRow: { flexDirection: 'row', gap: 10 },
  photoCard: { flex: 1, aspectRatio: 1, backgroundColor: '#f2f2f7', borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#e5e5ea', borderStyle: 'dashed' },
  photoTaken: { backgroundColor: '#e8f5e9', borderColor: '#4caf50', borderStyle: 'solid' },
  photoIcon: { fontSize: 28, marginBottom: 4 },
  photoText: { fontSize: 12, color: '#8e8e93', fontWeight: '500' },
  
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  photoPreview: { width: 100, height: 100, borderRadius: 10, position: 'relative' },
  previewImage: { width: '100%', height: '100%', borderRadius: 10 },
  removePhotoBtn: { position: 'absolute', top: -8, right: -8, width: 24, height: 24, borderRadius: 12, backgroundColor: '#ff3b30', alignItems: 'center', justifyContent: 'center' },
  removePhotoText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  addPhotoCard: { width: 100, height: 100, backgroundColor: '#f2f2f7', borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#007aff', borderStyle: 'dashed' },
  addPhotoIcon: { fontSize: 28, marginBottom: 4 },
  addPhotoText: { fontSize: 11, color: '#007aff', fontWeight: '600' },
  
  saveButton: { backgroundColor: '#007aff', padding: 18, borderRadius: 14, alignItems: 'center', marginTop: 12 },
  disabledButton: { backgroundColor: '#8e8e93' },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  
  listHeader: { padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e5ea' },
  listHeaderTitle: { fontSize: 16, fontWeight: '700', color: '#1c1c1e' },
  badge: { backgroundColor: '#34c759', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  badgeText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
  listContent: { padding: 12 },
  
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  vehicleCard: { borderLeftWidth: 4, borderLeftColor: '#ff9500' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  avatarPlaceholder: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#007aff', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  vehicleAvatar: { backgroundColor: '#ff9500' },
  avatarText: { fontSize: 16, fontWeight: 'bold', color: '#fff' },
  cardContent: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: '600', color: '#1c1c1e' },
  cardSubtitle: { fontSize: 13, color: '#8e8e93' },
  typeBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  visitorBadge: { backgroundColor: '#e3f2fd' },
  vehicleBadge: { backgroundColor: '#fff3e0' },
  typeBadgeText: { fontSize: 10, fontWeight: '700' },
  cardDetails: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  cardDetailText: { fontSize: 12, color: '#666', backgroundColor: '#f2f2f7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  exitButton: { backgroundColor: '#ff3b30', padding: 10, borderRadius: 10, alignItems: 'center' },
  exitButtonText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  emptyState: { alignItems: 'center', justifyContent: 'center', padding: 30 },
  emptyStateText: { color: '#8e8e93', fontSize: 14 },
  plateInputContainer: { position: 'relative', flexDirection: 'row', alignItems: 'center' },
  plateInput: { flex: 1, paddingRight: 40 },
  ocrIndicator: { position: 'absolute', right: 12, top: 18 },
  photoLoading: { position: 'absolute', bottom: 8 },
  
  // Filter tabs for active records
  filterTabsContainer: { flexDirection: 'row', backgroundColor: '#fff', paddingHorizontal: 12, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#e5e5ea' },
  filterTab: { flex: 1, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginHorizontal: 4, backgroundColor: '#f2f2f7' },
  filterTabActive: { backgroundColor: '#007aff' },
  filterTabText: { fontSize: 12, fontWeight: '600', color: '#8e8e93' },
  filterTabTextActive: { color: '#fff' },
  
  // Search for active records
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 12, paddingVertical: 8 },
  searchInput: { flex: 1, backgroundColor: '#f2f2f7', borderRadius: 10, paddingVertical: 10, paddingHorizontal: 14, fontSize: 14, color: '#1c1c1e' },
  clearSearch: { marginLeft: 8, width: 28, height: 28, borderRadius: 14, backgroundColor: '#e5e5ea', alignItems: 'center', justifyContent: 'center' },
  clearSearchText: { color: '#8e8e93', fontSize: 14, fontWeight: '600' },
});
