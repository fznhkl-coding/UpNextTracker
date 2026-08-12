import { Ionicons } from '@expo/vector-icons';
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useRouter } from 'expo-router';
import { EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import { collection, doc, getDocs, query, where, writeBatch } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { auth, db } from '../../firebaseConfig';

export default function ProfileScreen() {
  const router = useRouter();
  const currentUser = auth.currentUser;

  // Profile States
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [editName, setEditName] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const fetchProfileData = async () => {
    if (!currentUser) return;
    try {
      setLoading(true);
      
      const { collection, query, where, getDocs } = require('firebase/firestore');
      const q = query(collection(db, 'users'), where('uid', '==', currentUser.uid));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        const data = userDoc.data();

        setName(data.fullName || '');
        setUsername(data.username || '');
        
        setEditName(data.fullName || '');
        setEditUsername(data.username || '');
      } else {
        const defaultName = currentUser.email ? currentUser.email.split('@')[0] : 'User';
        setName(defaultName);
      }
    } catch (error: any) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileData();
  }, []);

  const handleSaveChanges = async () => {
    if (!currentUser) return;
    
    const cleanName = editName.trim();
    const cleanUsername = editUsername.trim().toLowerCase();

    if (!cleanName || !cleanUsername) {
      Alert.alert('Error', 'Name and Username fields cannot be left empty.');
      return;
    }

    try {
      setSaving(true);
      const { doc, getDoc, setDoc, deleteDoc } = require('firebase/firestore');

      // 1. UNIQUE CHECK: Is anyone else using this username document ID?
      const targetDocRef = doc(db, 'users', cleanUsername);
      const docSnap = await getDoc(targetDocRef);

      if (docSnap.exists() && docSnap.data().uid !== currentUser.uid) {
        Alert.alert('Username Taken', 'This username is already claimed. Try a different one!');
        setSaving(false);
        return;
      }

      // 2. CLEAN UP OLD ENTRY: If the user changed their username, delete their old document ID!
      // First, find what their username used to be
      const { collection, query, where, getDocs } = require('firebase/firestore');
      const oldQuery = query(collection(db, 'users'), where('uid', '==', currentUser.uid));
      const oldSnap = await getDocs(oldQuery);
      
      if (!oldSnap.empty && oldSnap.docs[0].id !== cleanUsername) {
        // They changed their username handle! Erase the old document name container
        await deleteDoc(doc(db, 'users', oldSnap.docs[0].id));
      }

      // 3. WRITE FRESH DATA: Save using your verified system schema keys
      await setDoc(targetDocRef, {
        fullName: cleanName,           // 🔍 FIX: Saved as fullName
        username: cleanUsername,       // 🔍 FIX: Saved as username
        uid: currentUser.uid,          // Links back to Auth account ID
        email: currentUser.email
      }, { merge: true });

      Alert.alert('Success', 'Profile updated successfully!');
      setIsEditing(false);
      fetchProfileData(); // Refresh page text states
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: async () => { await auth.signOut(); router.replace('/login'); } },
    ]);
  };

  const handleDeleteAccount = (userEnteredPassword: string) => {
    Alert.alert('⚠️ Delete Account', 'This will permanently remove your tracker cloud account and all logged items. This action cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Delete Permanently', 
        style: 'destructive', 
        onPress: async () => {
          try {
            if (!currentUser || !currentUser.email) return;
            const credential = EmailAuthProvider.credential(currentUser.email, userEnteredPassword);
            await reauthenticateWithCredential(currentUser, credential);

            const batch = writeBatch(db);

            let userDocName= "";

            const usersRef = collection(db, 'users');
            const userQuery = query(usersRef, where("uid", "==", currentUser.uid));
            const userQuerySnapshot = await getDocs(userQuery);

            if (!userQuerySnapshot.empty) {
              userDocName = userQuerySnapshot.docs[0].id;
              const profileDocRef = doc(db, 'users', userDocName);
              batch.delete(profileDocRef);
            }

            const trackersRef = collection(db, 'trackers');
            const trackersQuery = query(trackersRef, where("uid", "==", currentUser.uid));
            const trackersSnapshot = await getDocs(trackersQuery);

            trackersSnapshot.forEach((docSnap) => {
              batch.delete(docSnap.ref);
            });

            await batch.commit();

            await currentUser.delete();
            closeDeleteModal();
            Alert.alert('Account Deleted', 'Your account data has been completely scrubbed.');
            router.replace('/login');
          } catch (error: any) {
            if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
              Alert.alert('Security Error', 'The password you entered is incorrect. Verification failed.');
            } else {
              Alert.alert('Error', 'An unexpected error occured. Please try again.');
            }
          }
        } 
      },
    ]);
  };

  const closeDeleteModal = () => {
    setIsModalVisible(false);
    setDeletePassword(''); // Clear the password string
    setIsPasswordVisible(false); // ◄ ALWAYS reset visibility to false here!
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
      {/* Profile Header Card */}
      <View style={styles.profileCard}>
        <View style={styles.avatarContainer}>
          <Image source={require('../../assets/images/appicon.png')} style={styles.avatarImage} resizeMode="contain" />
        </View>
        <Text style={styles.welcomeText}>{name || 'Welcome!'}</Text>
        <Text style={styles.emailText}>{currentUser?.email}</Text>
        {username ? <Text style={styles.usernameText}>@{username}</Text> : null}
      </View>

      {/* Account Actions Section */}
      <Text style={styles.sectionTitle}>Account Customization</Text>
      
      {!isEditing ? (
        <View style={styles.optionsGroup}>
          <TouchableOpacity style={styles.optionRow} onPress={() => {setEditName(name); setEditUsername(username); setIsEditing(true);}}>
            <View style={styles.optionLeft}>
              <FontAwesome name="edit" size={18} color="#2196F3" style={styles.optionIcon} />
              <Text style={styles.optionText}>Edit Profile Details</Text>
            </View>
            <FontAwesome name="chevron-right" size={14} color="#ccc" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.optionRow} onPress={() => setIsModalVisible(true)}>
            <View style={styles.optionLeft}>
              <FontAwesome name="trash" size={18} color="#FF3B30" style={styles.optionIcon} />
              <Text style={[styles.optionText, { color: '#FF3B30' }]}>Delete Account</Text>
            </View>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.editForm}>
          <Text style={styles.inputLabel}>Name</Text>
          <TextInput style={styles.input} value={editName} onChangeText={setEditName} placeholder="Enter your full name" />

          <Text style={styles.inputLabel}>Username</Text>
          <TextInput style={styles.input} value={editUsername} onChangeText={setEditUsername} placeholder="username (no spaces)" autoCapitalize="none" />

          <View style={styles.formActions}>
            <TouchableOpacity style={[styles.formButton, styles.cancelButton]} onPress={() => { setIsEditing(false); fetchProfileData(); }}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.formButton, styles.saveButton]} onPress={handleSaveChanges} disabled={saving}>
              {saving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.saveButtonText}>Save</Text>}
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* About App Section */}
      <Text style={styles.sectionTitle}>About App</Text>
      <View style={styles.optionsGroup}>
        <View style={styles.aboutRow}>
          <Text style={styles.aboutLabel}>App Name</Text>
          <Text style={styles.aboutValue}>UpNext Tracker</Text>
        </View>
        <View style={styles.aboutRow}>
          <Text style={styles.aboutLabel}>Version</Text>
          <Text style={styles.aboutValue}>1.0.0</Text>
        </View>
      </View>

      {/* Sign Out Button (Using bottom margin flow control to lift layout spacing safely) */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.8}>
        <FontAwesome name="sign-out" size={18} color="#FF3B30" style={{ marginRight: 8 }} />
        <Text style={styles.logoutText}>SIGN OUT</Text>
      </TouchableOpacity>

      <Modal
        animationType="fade"
        transparent={true}
        visible={isModalVisible}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            
            <Text style={styles.modalTitle}>⚠️ Verify Password</Text>
            <Text style={styles.modalDescription}>
              To permanently delete your account, please enter your password to confirm identity.
            </Text>

            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.inputField}
                placeholder="Enter your account password"
                placeholderTextColor="#999"
                secureTextEntry={!isPasswordVisible}
                value={deletePassword}
                onChangeText={setDeletePassword}
                autoFocus={true}
              />
              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => setIsPasswordVisible(!isPasswordVisible)}
              >
                <Ionicons
                  name={isPasswordVisible ? "eye-off" : "eye"}
                  size={22}
                  color="#666"
                />
              </TouchableOpacity>
            </View>


            <View style={styles.modalButtonContainer}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]} 
                onPress={closeDeleteModal}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.modalButton, styles.confirmButton]} 
                onPress={() => {
                  if (!deletePassword.trim()) {
                    Alert.alert('Required', 'Please enter your password to proceed.');
                    return;
                  }
                  setIsModalVisible(false);
                  handleDeleteAccount(deletePassword);
                  setDeletePassword('');
                }}
              >
                <Text style={styles.confirmButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>

          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: { padding: 20, paddingBottom: 40 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8f9fa' },
  profileCard: { 
    backgroundColor: '#fff', 
    borderRadius: 16, 
    padding: 24, 
    alignItems: 'center', 
    marginBottom: 24,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  avatarContainer: { width: 90, height: 90, borderRadius: 45, overflow: 'hidden', marginBottom: 16 },
  avatarImage: { width: '100%', height: '100%' },
  welcomeText: { fontSize: 22, fontWeight: 'bold', color: '#111', marginBottom: 4 },
  emailText: { fontSize: 14, color: '#666', fontWeight: '500' },
  usernameText: { fontSize: 13, color: '#2196F3', fontWeight: '600', marginTop: 4, backgroundColor: '#E3F2FD', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: '#888', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10, marginTop: 12, paddingLeft: 4 },
  optionsGroup: { backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden', marginBottom: 20, borderWidth: 1, borderColor: '#f0f0f0' },
  optionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#f9f9f9' },
  optionLeft: { flexDirection: 'row', alignItems: 'center' },
  optionIcon: { width: 24, textAlign: 'center', marginRight: 12 },
  optionText: { fontSize: 15, fontWeight: '500', color: '#333' },
  editForm: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: '#f0f0f0' },
  inputLabel: { fontSize: 13, fontWeight: '600', color: '#555', marginBottom: 6 },
  input: { backgroundColor: '#f9f9f9', borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 8, paddingHorizontal: 12, height: 44, marginBottom: 16, fontSize: 15 },
  formActions: { flexDirection: 'row', justifyContent: 'space-between' },
  formButton: { flex: 1, height: 40, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  cancelButton: { backgroundColor: '#f5f5f5', marginRight: 8 },
  cancelButtonText: { color: '#666', fontWeight: '600' },
  saveButton: { backgroundColor: '#2196F3', marginLeft: 8 },
  saveButtonText: { color: '#fff', fontWeight: '600' },
  aboutRow: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: '#f9f9f9' },
  aboutLabel: { fontSize: 15, color: '#555', fontWeight: '500' },
  aboutValue: { fontSize: 15, color: '#999', fontWeight: '600' },
  logoutButton: { 
    flexDirection: 'row',
    height: 52, 
    backgroundColor: '#FFF5F5', 
    borderWidth: 1,
    borderColor: '#FFEBEB',
    borderRadius: 12, 
    justifyContent: 'center', 
    alignItems: 'center',
    marginTop: 24, // Generous spacing separating it from elements above
    marginBottom: 16 // Elevated safe distance clear of any soft Android back-gesture nav zones
  },
  logoutText: { color: '#FF3B30', fontSize: 15, fontWeight: 'bold', letterSpacing: 0.5 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    elevation: 5, // Android shadows
    shadowColor: '#000', // iOS shadows
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111',
    marginBottom: 8,
  },
  modalDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  modalButtonContainer: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    height: 44,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmButton: {
    backgroundColor: '#DC3545', // Strong structural alert crimson red
  },
  confirmButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 15,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    height: 48,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
    marginBottom: 24,
    paddingHorizontal: 12,
  },
  inputField: {
    flex: 1, // Takes up all remaining space on the left
    height: '100%',
    fontSize: 16,
    color: '#333',
  },
  iconButton: {
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
});