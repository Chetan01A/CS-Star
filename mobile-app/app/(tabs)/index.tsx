import React, { useState, useEffect } from 'react';
import { 
  View, Text, FlatList, StyleSheet, Image, 
  Dimensions, ActivityIndicator, RefreshControl 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Heart, MessageCircle, Share2, MoreHorizontal } from 'lucide-react-native';
import api from '../../src/api';

const { width } = Dimensions.get('window');

export default function FeedScreen() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      // Assuming there's a feed or post endpoint
      const { data } = await api.get('/post/');
      setPosts(data);
    } catch (err) {
      console.error("Failed to fetch posts", err);
      // Fallback with mock data for demo
      setPosts([
        { id: 1, caption: "Future is here! #CSStar", image_url: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=1000", author: { username: "alex_v" } },
        { id: 2, caption: "Glassmorphism in mobile is wow.", image_url: "https://images.unsplash.com/photo-1614850523296-e8c041de83a4?auto=format&fit=crop&q=80&w=1000", author: { username: "design_pro" } },
      ]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const renderPost = ({ item }) => (
    <View style={styles.postCard}>
      <View style={styles.postHeader}>
        <View style={styles.authorInfo}>
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>{item.author.username[0].toUpperCase()}</Text>
          </View>
          <Text style={styles.username}>{item.author.username}</Text>
        </View>
        <MoreHorizontal size={20} color="#b0b0b0" />
      </View>

      <Image source={{ uri: item.image_url }} style={styles.postImage} />

      <View style={styles.postActions}>
        <View style={styles.leftActions}>
          <Heart size={24} color="#fff" style={styles.actionIcon} />
          <MessageCircle size={24} color="#fff" style={styles.actionIcon} />
          <Share2 size={24} color="#fff" style={styles.actionIcon} />
        </View>
      </View>

      <View style={styles.postContent}>
        <Text style={styles.caption}>
          <Text style={styles.captionUsername}>{item.author.username} </Text>
          {item.caption}
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>CS-Star</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#00f2fe" style={{ marginTop: 50 }} />
      ) : (
        <FlatList 
          data={posts}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderPost}
          contentContainerStyle={styles.feedList}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchPosts(); }} tintColor="#00f2fe" />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    height: 60,
    justifyContent: 'center',
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#00f2fe',
  },
  feedList: {
    paddingBottom: 100,
  },
  postCard: {
    marginBottom: 16,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#4facfe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
  },
  username: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  postImage: {
    width: width,
    height: width,
    backgroundColor: '#111',
  },
  postActions: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  leftActions: {
    flexDirection: 'row',
    gap: 16,
  },
  actionIcon: {
    marginRight: 4,
  },
  postContent: {
    paddingHorizontal: 12,
    paddingBottom: 16,
  },
  caption: {
    color: '#fff',
    fontSize: 14,
    lineHeight: 20,
  },
  captionUsername: {
    fontWeight: '700',
  }
});
