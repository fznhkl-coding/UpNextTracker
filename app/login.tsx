import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Image, Keyboard, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import { auth, db } from '../firebaseConfig';

export default function AuthScreen() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Form Fields
  const [identifier, setIdentifier] = useState(''); // Holds Username OR Email for Login
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const handleAuth = async () => {
    setLoading(false);

    if (isRegistering) {
      // --- SIGN UP LOGIC ---
      if (!email || !password || !username || !fullName) {
        Alert.alert('Error', 'Please fill in all registration fields.');
        return;
      }
      
      const cleanUsername = username.trim().toLowerCase().replace(/\s+/g, '');

      setLoading(true);
      try {
        // 1. Check if Username already exists in Firestore
        const usernameDocRef = doc(db, 'users', cleanUsername);
        const usernameCheck = await getDoc(usernameDocRef);

        if (usernameCheck.exists()) {
          Alert.alert('Error', 'This username is already taken. Try another one!');
          setLoading(false);
          return;
        }

        // 2. Create User account in Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
        const user = userCredential.user;

        // 3. Save extra information to Firestore using the Username as the Document ID
        await setDoc(doc(db, 'users', cleanUsername), {
          uid: user.uid,
          username: cleanUsername,
          fullName: fullName.trim(),
          email: email.trim().toLowerCase(),
          createdAt: new Date().toISOString()
        });

        Alert.alert('Success', 'Account created successfully!');
        setIsPasswordVisible(false);
        router.replace('/(drawer)');
      } catch (error: any) {
        Alert.alert('Registration Failed', error.message);
      } finally {
        setLoading(false);
      }

    } else {
      // --- LOGIN LOGIC (Supports Email OR Username) ---
      if (!identifier || !password) {
        Alert.alert('Error', 'Please fill in all login fields.');
        return;
      }

      setLoading(true);
      try {
        let targetEmail = identifier.trim();

        // If the user didn't type an '@', assume they typed their unique username
        if (!targetEmail.includes('@')) {
          const cleanUsernameInput = targetEmail.toLowerCase().replace(/\s+/g, '');
          const userDocRef = doc(db, 'users', cleanUsernameInput);
          const userDoc = await getDoc(userDocRef);

          if (userDoc.exists()) {
            targetEmail = userDoc.data().email; // Retrieve their registered email address
          } else {
            Alert.alert('Error', 'Username not found.');
            setLoading(false);
            return;
          }
        }

        // Sign in using the resolved email string
        await signInWithEmailAndPassword(auth, targetEmail, password);
        setIsPasswordVisible(false);
        router.replace('/(drawer)');
      } catch (error: any) {
        Alert.alert('Login Failed', error.message);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} >
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.innerContainer}>
            <View style={styles.brandContainer}>
              <View style={styles.logoIcon}>
                  <Image 
                      source={require('../assets/images/appicon.png')} // <-- Adjust this path to where your appicon.png lives!
                      style={styles.customIconImage} 
                      resizeMode="contain"
                  />
              </View>
              <Text style={styles.brandTitle}>UpNext</Text>
              <Text style={styles.brandSubtitle}>Track your reading & watching habits</Text>
            </View>

            <View style={styles.formContainer}>
              {/* Registration Specific Fields */}
              {isRegistering && (
                <>
                  <TextInput
                    style={styles.input}
                    placeholder="Full Name"
                    placeholderTextColor="#aaa"
                    value={fullName}
                    onChangeText={setFullName}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Unique Username"
                    placeholderTextColor="#aaa"
                    value={username}
                    onChangeText={setUsername}
                    autoCapitalize="none"
                  />
                </>
              )}

              {/* Dual Login Input / Registration Email */}
              {!isRegistering ? (
                <TextInput
                  style={styles.input}
                  placeholder="Username or Email Address"
                  placeholderTextColor="#aaa"
                  value={identifier}
                  onChangeText={setIdentifier}
                  autoCapitalize="none"
                />
              ) : (
                <TextInput
                  style={styles.input}
                  placeholder="Email Address"
                  placeholderTextColor="#aaa"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              )}

              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.inputField}
                  placeholder="Password"
                  placeholderTextColor="#aaa"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!isPasswordVisible}
                  autoCapitalize="none"
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

              <TouchableOpacity style={styles.primaryButton} onPress={handleAuth} disabled={loading}>
                {loading ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.buttonText}>{isRegistering ? 'CREATE ACCOUNT' : 'LOG IN'}</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity style={styles.toggleLink} onPress={() => {setIsRegistering(!isRegistering); setIsPasswordVisible(false);}}>
                <Text style={styles.toggleText}>
                  {isRegistering ? 'Already have an account? Log In' : "Don't have an account? Sign Up"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5'},
  brandContainer: { alignItems: 'center', marginBottom: 30 },
  brandTitle: { fontSize: 32, fontWeight: 'bold', color: '#333333' },
  brandSubtitle: { fontSize: 14, color: '#666666', marginTop: 4 },
  formContainer: { backgroundColor: '#ffffff', borderRadius: 16, padding: 20, elevation: 2 },
  input: { height: 50, borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 8, paddingHorizontal: 16, fontSize: 16, backgroundColor: '#fafafa', marginBottom: 16, color: '#333333' },
  primaryButton: { height: 50, backgroundColor: '#2196F3', borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginTop: 8, elevation: 2 },
  buttonText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold', letterSpacing: 1 },
  toggleLink: { marginTop: 16, alignItems: 'center' },
  toggleText: { color: '#2196F3', fontSize: 14, fontWeight: '600' },
  scrollContainer: {
    flexGrow: 1, // Crucial for letting ScrollView fill the view container bounds
    justifyContent: 'center', // Keeps everything neatly centered when keyboard is closed
  },
  innerContainer: {
    padding: 24,
    width: '100%',
    alignItems: 'center',
  },
  logoIcon: {
    width: 64,               // Assuming your existing container size
    height: 64,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',      // Ensures the square image corners mask nicely inside the circle wrapper
  },
  customIconImage: {
    width: '100%',           // Fills the container completely
    height: '100%',
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