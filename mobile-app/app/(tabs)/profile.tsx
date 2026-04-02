import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, Image, 
  Dimensions, ScrollView, TouchableOpacity, 
  ActivityIndicator, RefreshControl 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Edit3, Grid, ShieldCheck, ShieldAlert, LogOut, ArrowLeft } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import api from '../../src/api';

const { width } = Dimensions.get('window');

export default function ProfileScreen() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data } = await api.get('/auth/me');
      setProfile(data);
    } catch (err) {
      console.error("Failed to fetch profile", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleLogout = async () => {
    await SecureStore.deleteItemAsync('access_token');
    await SecureStore.deleteItemAsync('refresh_token');
    router.replace('/login');
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#00f2fe" />
      </View>
    );
  }

  if (!profile) return null;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchProfile(); }} tintColor="#00f2fe" />}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        <header style={styles.header}>
          <Text style={styles.headerTitle}>{profile.username}</Text>
          <TouchableOpacity onPress={handleLogout}>
            <LogOut size={24} color="#ff4d4d" />
          </TouchableOpacity>
        </header>

        <View style={styles.profileInfo}>
          <LinearGradient colors={['#00f2fe', '#4facfe']} style={styles.avatarGradient}>
            <View style={styles.avatarInner}>
              <Text style={styles.avatarText}>{profile.username[0].toUpperCase()}</Text>
            </View>
          </LinearGradient>

          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>12</Text>
              <Text style={styles.statLabel}>Posts</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>248</Text>
              <Text style={styles.statLabel}>Followers</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>182</Text>
              <Text style={styles.statLabel}>Following</Text>
            </View>
          </View>
        </View>

        <View style={styles.bioContainer}>
          <Text style={styles.displayName}>{profile.username}</Text>
          <Text style={styles.bio}>{profile.bio || "No bio yet."}</Text>
          
          <div style={styles.securityTags}>
            {profile.totp_enabled ? (
              <View style={styles.tag}>
                <ShieldCheck size={14} color="#10b981" />
                <Text style={[styles.tagText, { color: '#10b981' }]}>2FA Active</Text>
              </View>
            ) : (
              <TouchableOpacity style={styles.tag}>
                <ShieldAlert size={14} color="#00f2fe" />
                <Text style={[styles.tagText, { color: '#00f2fe' }]}>Enable 2FA</Text>
              </TouchableOpacity>
            )}
          </div>

          <TouchableOpacity style={styles.editBtn}>
            <Edit3 size={18} color="#fff" />
            <Text style={styles.editBtnText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.gridHeader}>
          <Grid size={24} color="#00f2fe" />
          <View style={styles.gridLine} />
        </View>

        <View style={styles.postGrid}>
          <View style={styles.gridPlaceholder} />
          <View style={styles.gridPlaceholder} />
          <View style={styles.gridPlaceholder} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  profileInfo: {
    flexDirection: 'row',
    padding: 24,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  avatarGradient: {
    width: 90,
    height: 90,
    borderRadius: 45,
    padding: 3,
  },
  avatarInner: {
    flex: 1,
    borderRadius: 42,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '700',
  },
  statsContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginLeft: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  statLabel: {
    color: '#b0b0b0',
    fontSize: 12,
  },
  bioContainer: {
    paddingHorizontal: 24,
  },
  displayName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  bio: {
    color: '#b0b0b0',
    fontSize: 14,
    lineHeight: 20,
  },
  securityTags: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 12,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '600',
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 44,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    marginTop: 24,
  },
  editBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  gridHeader: {
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 16,
  },
  gridLine: {
    width: 64,
    height: 2,
    backgroundColor: '#00f2fe',
    marginTop: 8,
  },
  postGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 2,
  },
  gridPlaceholder: {
    width: (width / 3) - 2,
    aspectRatio: 1 / 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
  }
});
