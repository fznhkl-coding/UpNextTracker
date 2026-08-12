import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { addDoc, collection, doc, getDoc, updateDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { auth, db } from '../firebaseConfig';

export default function ItemFormModal() {
  const router = useRouter();
  const navigation = useNavigation();
  const params = useLocalSearchParams();
  const editingId = params.id as string;

  // Form Fields State
  const [title, setTitle] = useState('');
  const [mediaType, setMediaType] = useState('Book');
  const [currentProgress, setCurrentProgress] = useState('0');
  const [totalLength, setTotalLength] = useState('');
  const [loading, setLoading] = useState(false);

  // NEW STATE: Tracks our dynamic checkbox toggle
  const [isToggled, setIsToggled] = useState(false);

  // Dynamically change the native top bar title
  useEffect(() => {
    navigation.setOptions({
      title: editingId ? 'Edit Tracker Card' : 'Add New Tracker'
    });
  }, [editingId, navigation]);

  // Load entry if editing
  useEffect(() => {
    if (editingId) {
      const loadItemData = async () => {
        const docRef = doc(db, 'trackers', editingId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setTitle(data.title);
          setMediaType(data.mediaType);
          setCurrentProgress(String(data.currentProgress));
          setTotalLength(String(data.totalLength));
          
          // If editing and status is 'Completed', turn the toggle ON
          if (data.status === 'Completed') {
            setIsToggled(true);
          }
        }
      };
      loadItemData();
    }
  }, [editingId]);

  const handleSave = async () => {
    if (!title.trim() || !totalLength.trim()) {
      Alert.alert('Error', 'Please fill in the Title and Total Count.');
      return;
    }
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    setLoading(true);

    // CONCEPT: Calculate values based on the Active Mode and Toggle State
    let finalStatus = 'Tracking';
    let finalProgress = parseInt(currentProgress) || 0;
    const totalCountVal = parseInt(totalLength) || 0;

    if (editingId) {
      // EDIT MODE LOGIC
      finalStatus = isToggled ? 'Completed' : 'Tracking';
      if (isToggled) {
        finalProgress = totalCountVal; // Automatically maxes out progress if completed
      }
    } else {
      // ADD MODE LOGIC
      finalStatus = isToggled ? 'Plan to Track' : 'Tracking';
    }

    const payload = {
      uid: currentUser.uid,
      title: title.trim(),
      mediaType: mediaType,
      currentProgress: finalProgress,
      totalLength: totalCountVal,
      status: finalStatus,
    };

    try {
      if (editingId) {
        await updateDoc(doc(db, 'trackers', editingId), payload);
      } else {
        await addDoc(collection(db, 'trackers'), payload);
      }
      router.back();
    } catch (error: any) {
      Alert.alert('Save Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Media Title</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. Teach You A Lesson"
        placeholderTextColor="#aaa"
        value={title}
        onChangeText={setTitle}
      />

      <Text style={styles.label}>Category</Text>
      <View style={styles.typeContainer}>
        <TouchableOpacity 
          style={[styles.typeButton, mediaType === 'Book' && styles.activeType]} 
          onPress={() => setMediaType('Book')}
        >
          <Text style={[styles.typeText, mediaType === 'Book' && styles.activeTypeText]}>Book / Comic</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.typeButton, mediaType === 'Shows' && styles.activeType]} 
          onPress={() => setMediaType('Shows')}
        >
          <Text style={[styles.typeText, mediaType === 'Shows' && styles.activeTypeText]}>Shows</Text>
        </TouchableOpacity>
      </View>

      {/* DYNAMIC CHECKBOX TOGGLE CONTAINER */}
      <TouchableOpacity 
        style={styles.checkboxContainer} 
        onPress={() => setIsToggled(!isToggled)}
        activeOpacity={0.8}
      >
        <View style={[styles.checkbox, isToggled && styles.checkboxChecked]}>
          {isToggled && <FontAwesome name="check" size={12} color="#fff" />}
        </View>
        <Text style={styles.checkboxLabel}>
          {editingId ? "Mark tracking as completed" : "Save directly to 'Plan To Track' list"}
        </Text>
      </TouchableOpacity>

      <View style={styles.row}>
        {/* Current Progress Input (Greys out dynamically when toggle is enabled) */}
        <View style={{ flex: 1, marginRight: 10 }}>
          <Text style={styles.label}>Current Progress</Text>
          <TextInput
            style={[styles.input, isToggled && styles.inputDisabled]}
            keyboardType="number-pad"
            value={isToggled ? (editingId ? totalLength : '0') : currentProgress}
            onChangeText={setCurrentProgress}
            editable={!isToggled} // Locks fields when toggled
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>Total Count</Text>
          <TextInput
            style={styles.input}
            keyboardType="number-pad"
            placeholder="e.g. 12"
            value={totalLength}
            onChangeText={setTotalLength}
          />
        </View>
      </View>

      <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveText}>SAVE TRACKER</Text>}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', paddingHorizontal: 20, paddingTop: 20 },
  label: { fontSize: 14, color: '#555', marginBottom: 6, fontWeight: '600' },
  input: { height: 50, borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 8, paddingHorizontal: 16, fontSize: 16, backgroundColor: '#fafafa', marginBottom: 20, color: '#333' },
  inputDisabled: { backgroundColor: '#eaeaea', color: '#888', borderColor: '#dcdcdc' },
  typeContainer: { flexDirection: 'row', marginBottom: 20, borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 8, overflow: 'hidden' },
  typeButton: { flex: 1, height: 45, justifyContent: 'center', alignItems: 'center' },
  activeType: { backgroundColor: '#2196F3' },
  typeText: { fontSize: 14, color: '#666', fontWeight: '600' },
  activeTypeText: { color: '#fff' },
  checkboxContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 24, paddingVertical: 4 },
  checkbox: { width: 20, height: 20, borderRadius: 4, borderWidth: 2, borderColor: '#2196F3', justifyContent: 'center', alignItems: 'center', marginRight: 10, backgroundColor: '#fff' },
  checkboxChecked: { backgroundColor: '#2196F3' },
  checkboxLabel: { fontSize: 15, color: '#444', fontWeight: '500' },
  row: { flexDirection: 'row' },
  saveButton: { height: 50, backgroundColor: '#2196F3', borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginTop: 16 },
  saveText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});