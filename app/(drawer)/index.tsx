import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useNavigation, useRouter } from 'expo-router';
import { collection, deleteDoc, doc, getDocs, query, where } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { auth, db } from '../../firebaseConfig';

export default function CurrentTrackerScreen() {
  const [items, setItems] = useState([]);
  const [activeFilter, setActiveFilter] = useState('All');
  const [showDropdown, setShowDropdown] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();
  const navigation = useNavigation() as any;

  const insets = useSafeAreaInsets();

  // READ LIVE INDIVIDUAL USER ITEMS ( Adapted from Lecturer's fetchStudents )
  const fetchTrackers = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    try {
      // Strictly queries documents belonging to this unique active UID
      const q = query(collection(db, 'trackers'), where('uid', '==', currentUser.uid), where('status', 'in', ['Tracking', 'Completed']));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(item => ({
        id: item.id,
        ...item.data()
      }));
      setItems(data);
    } catch (error: any) {
      console.error("Fetch Error: ", error);
    }
  };

  // Run on mount, and also listen for screen re-focus events to reload data
  useEffect(() => {
    fetchTrackers();
    const unsubscribe = navigation.addListener('focus', () => {
      fetchTrackers();
    });
    return unsubscribe;
  }, [navigation]);

  // DELETE ENTRY ENGINE ( Adapted from Lecturer's deleteStudent )
  const handleDelete = async (id: string) => {
    Alert.alert('Delete Entry', 'Are you sure you want to delete this tracking card?', [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Delete', 
        style: 'destructive',
        onPress: async () => {
          await deleteDoc(doc(db, 'trackers', id));
          fetchTrackers(); // Refresh display
        }
      }
    ]);
  };
  const displayedItems = items.filter((item: any) => {
    if (activeFilter === 'All') return true;
    return item.status === activeFilter;
  });

  return (
    <View style={styles.container}>
      <View style={styles.filterBarContainer}>
        <Text style={styles.filterBarLabel}>Filter:</Text>
        
        <View style={styles.dropdownWrapper}>
          <TouchableOpacity 
            style={styles.dropdownButton} 
            onPress={() => setShowDropdown(!showDropdown)}
            activeOpacity={0.8}
          >
            <Text style={styles.dropdownButtonText}>
              {activeFilter === 'All' ? 'All Items' : activeFilter === 'Tracking' ? 'Active Tracking' : 'Completed'}
            </Text>
            <FontAwesome name={showDropdown ? "chevron-up" : "chevron-down"} size={12} color="#2196F3" />
          </TouchableOpacity>

          {/* FLOATING DROPDOWN MENU PANEL */}
          {showDropdown && (
            <View style={styles.dropdownMenuPanel}>
              <TouchableOpacity 
                style={[styles.dropdownOption, activeFilter === 'All' && styles.selectedOption]} 
                onPress={() => { setActiveFilter('All'); setShowDropdown(false); }}
              >
                <Text style={[styles.optionText, activeFilter === 'All' && styles.selectedOptionText]}>All Items</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.dropdownOption, activeFilter === 'Tracking' && styles.selectedOption]} 
                onPress={() => { setActiveFilter('Tracking'); setShowDropdown(false); }}
              >
                <Text style={[styles.optionText, activeFilter === 'Tracking' && styles.selectedOptionText]}>Active Tracking</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.dropdownOption, activeFilter === 'Completed' && styles.selectedOption]} 
                onPress={() => { setActiveFilter('Completed'); setShowDropdown(false); }}
              >
                <Text style={[styles.optionText, activeFilter === 'Completed' && styles.selectedOptionText]}>Completed</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
      <FlatList
        data={displayedItems}
        keyExtractor={(item: any) => item.id}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <FontAwesome name="folder-open" size={50} color="#ccc" />
            <Text style={styles.emptyText}>Your tracker is currently empty.</Text>
            <Text style={styles.emptySubText}>Tap the "+" button below to log something!</Text>
          </View>
        }
        renderItem={({ item }: any) => (
          <View style={styles.card}>
            <View style={styles.infoBlock}>
              <View style={{ flexDirection: 'row', gap: 6, marginBottom: 8 }}>
                {/* Media Category Tag */}
                <View style={styles.mediaTag}>
                  <FontAwesome name={item.mediaType === 'Book' ? 'book' : 'film'} size={12} color="#2196F3" />
                  <Text style={styles.tagText}> {item.mediaType.toUpperCase()}</Text>
                </View>

                {/* DYNAMIC: Completed Status Badge Display */}
                {item.status === 'Completed' && (
                  <View style={styles.completedTag}>
                    <FontAwesome name="check-circle" size={12} color="#4CAF50" />
                    <Text style={styles.completedTagText}> COMPLETED</Text>
                  </View>
                )}

                {/* Optional: Plan to Track Badge Display */}
                {item.status === 'Plan to Track' && (
                  <View style={styles.planTag}>
                    <FontAwesome name="bookmark" size={12} color="#FF9800" />
                    <Text style={styles.planTagText}> PLAN TO TRACK</Text>
                  </View>
                )}
              </View>

              <Text style={styles.cardTitle}>{item.title}</Text>
              
              {/* Dynamic Progress Display: Forces exact total counts if marked complete */}
              <Text style={styles.cardProgress}>
                Progress: {item.status === 'Completed' ? item.totalLength : item.currentProgress} / {item.totalLength} completed
              </Text>
            </View>

            <View style={styles.actionColumn}>
              <TouchableOpacity style={styles.actionButton} onPress={() => router.push({ pathname: '/modal', params: { id: item.id } })}>
                <FontAwesome name="pencil" size={18} color="#666" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton} onPress={() => handleDelete(item.id)}>
                <FontAwesome name="trash" size={18} color="red" />
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      {/* Floating Action Button (+) */}
      <TouchableOpacity style={[styles.fab, { bottom: Math.max(20, insets.bottom + 16) }]} onPress={() => router.push('/modal')}>
        <FontAwesome name="plus" size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 16 },
  emptyContainer: { alignItems: 'center', marginTop: 100 },
  emptyText: { fontSize: 18, fontWeight: 'bold', color: '#666', marginTop: 16 },
  emptySubText: { fontSize: 14, color: '#999', marginTop: 4 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between', elevation: 2 },
  infoBlock: { flex: 1 },
  mediaTag: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E3F2FD', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4, alignSelf: 'flex-start', marginBottom: 8 },
  tagText: { fontSize: 10, fontWeight: 'bold', color: '#2196F3', lineHeight: 14 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  cardProgress: { fontSize: 14, color: '#666', marginTop: 6 },
  actionColumn: { justifyContent: 'space-around', paddingLeft: 12 },
  actionButton: { padding: 8 },
  fab: { position: 'absolute', right: 20, width: 56, height: 56, borderRadius: 28, backgroundColor: '#2196F3', justifyContent: 'center', alignItems: 'center', elevation: 4 },
  completedTag: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E8F5E9', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4, alignSelf: 'flex-start' },
  completedTagText: { fontSize: 10, fontWeight: 'bold', color: '#4CAF50', lineHeight: 14 },
  planTag: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF3E0', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4, alignSelf: 'flex-start' },
  planTagText: { fontSize: 10, fontWeight: 'bold', color: '#FF9800', lineHeight: 14 },
  filterBarContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    marginBottom: 16,
    zIndex: 10 // Crucial so the floating dropdown options layer sits cleanly ON TOP of your list rows
  },
  filterBarLabel: { fontSize: 14, fontWeight: '600', color: '#666' },
  dropdownWrapper: { flex: 1, marginLeft: 12, position: 'relative' },
  dropdownButton: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    backgroundColor: '#fff', 
    borderWidth: 1, 
    borderColor: '#e0e0e0', 
    borderRadius: 8, 
    paddingHorizontal: 12, 
    height: 40,
    elevation: 1
  },
  dropdownButtonText: { fontSize: 14, fontWeight: '600', color: '#333' },
  dropdownMenuPanel: { 
    position: 'absolute', 
    top: 44, 
    left: 0, 
    right: 0, 
    backgroundColor: '#fff', 
    borderRadius: 8, 
    borderWidth: 1, 
    borderColor: '#e0e0e0', 
    elevation: 5, 
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    zIndex: 999 // Guarantees layout rendering stack precedence on Android
  },
  dropdownOption: { paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#f5f5f5' },
  selectedOption: { backgroundColor: '#E3F2FD' },
  optionText: { fontSize: 14, color: '#555', fontWeight: '500' },
  selectedOptionText: { color: '#2196F3', fontWeight: 'bold' }
});