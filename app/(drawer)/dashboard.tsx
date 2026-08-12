import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useNavigation, useRouter } from 'expo-router';
import { collection, deleteDoc, doc, getDocs, query, updateDoc, where } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { auth, db } from '../../firebaseConfig'; // Adjust path if needed

export default function PlanToTrackScreen() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const navigation = useNavigation() as any;

  const fetchPlanItems = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    try {
      setLoading(true);
      // FILTER: Only grab documents marked as 'Plan to Track'
      const q = query(
        collection(db, 'trackers'), 
        where('uid', '==', currentUser.uid),
        where('status', '==', 'Plan to Track')
      );
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(item => ({ id: item.id, ...item.data() }));
      setItems(data);
    } catch (error: any) {
      console.error("Fetch Plan Error: ", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlanItems();
    const unsubscribe = navigation.addListener('focus', () => { fetchPlanItems(); });
    return unsubscribe;
  }, [navigation]);

  // Quick Action: Promotes the item from "Plan" to active "Tracking" status
  const handleStartTracking = async (id: string) => {
    try {
      await updateDoc(doc(db, 'trackers', id), {
        status: 'Tracking'
      });
      Alert.alert('Success', 'Moved to Current Trackers!');
      fetchPlanItems(); // Refresh list
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const handleDelete = async (id: string) => {
    Alert.alert('Delete Plan', 'Are you sure you want to remove this from your watchlist?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { await deleteDoc(doc(db, 'trackers', id)); fetchPlanItems(); } }
    ]);
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={items}
        keyExtractor={(item: any) => item.id}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <FontAwesome name="bookmark-o" size={50} color="#ccc" />
            <Text style={styles.emptyText}>Your wishlist is empty.</Text>
            <Text style={styles.emptySubText}>Items saved as 'Plan To Track' will appear here.</Text>
          </View>
        }
        renderItem={({ item }: any) => (
          <View style={styles.card}>
            <View style={styles.infoBlock}>
              <View style={styles.planTag}>
                <FontAwesome name="bookmark" size={12} color="#FF9800" />
                <Text style={styles.planTagText}> PLAN TO TRACK</Text>
              </View>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardTypeText}>
                Category: {item.mediaType === 'Book' ? 'Manga / Novel' : 'Anime / Show'}
              </Text>
            </View>

            <View style={styles.actionColumn}>
              {/* Quick activate button */}
              <TouchableOpacity 
                style={styles.actionButton} 
                onPress={() => handleStartTracking(item.id)}
                title="Start Tracking"
              >
                <FontAwesome name="play-circle" size={20} color="#2196F3" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton} onPress={() => handleDelete(item.id)}>
                <FontAwesome name="trash" size={18} color="red" />
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 16 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' },
  emptyContainer: { alignItems: 'center', marginTop: 100 },
  emptyText: { fontSize: 18, fontWeight: 'bold', color: '#666', marginTop: 16 },
  emptySubText: { fontSize: 14, color: '#999', marginTop: 4, textAlign: 'center', paddingHorizontal: 20 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between', elevation: 2 },
  infoBlock: { flex: 1 },
  planTag: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF3E0', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4, alignSelf: 'flex-start', marginBottom: 8 },
  planTagText: { fontSize: 10, fontWeight: 'bold', color: '#FF9800', lineHeight: 14 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  cardTypeText: { fontSize: 13, color: '#777', marginTop: 4 },
  actionColumn: { justifyContent: 'space-around', paddingLeft: 12, alignItems: 'center' },
  actionButton: { padding: 8 }
});