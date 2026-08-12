import FontAwesome from "@expo/vector-icons/FontAwesome";
import { DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';
import { Drawer } from "expo-router/drawer";
import { collection, getDocs, query, where } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { ImageBackground, StyleSheet, Text, View } from 'react-native';
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { auth, db } from '../../firebaseConfig';

// Custom Drawer Layout featuring a Material Profile Header
function CustomDrawerContent(props: any) { 
  const [profile, setProfile] = useState({ fullName: 'Loading...', username: 'Please wait'});

  useEffect(() => {
    const fetchuserProfile = async () => {
      const currentUser = auth.currentUser;
      if (currentUser) {
        try {
          const q = query(collection(db, 'users'), where('uid', '==', currentUser.uid));
          const querySnapshot = await getDocs(q);

          if (!querySnapshot.empty) {
            const userData = querySnapshot.docs[0].data();
            setProfile({
              fullName: userData.fullName || 'User Name',
              username: `@${userData.username}` || '@username'
            });
          }
        }
        catch (error) {
          console.error("Error loading user profile information:", error);
        }
      }
    };

    fetchuserProfile();
  }, []);

  return (
    <DrawerContentScrollView 
      {...props} 
      // Overriding React Navigation's specific variable names to force 0 margins
      contentContainerStyle={{ 
        paddingTop: 0, 
        paddingStart: 0, 
        paddingEnd: 0 
      }} 
      style={{ backgroundColor: '#ffffff' }}
    >
      <ImageBackground
        source={require('../../assets/images/drawerbanner.png')}
        style={styles.drawerHeader}
        resizeMode="cover"
      >
        <View style={styles.avatarContainer}>
          <FontAwesome name="user" size={40} color="#2196F3" />
        </View>
        {/* User Details */}
        <Text style={styles.userName}>{profile.fullName}</Text>
        <Text style={styles.userEmail}>{profile.username}</Text>
      </ImageBackground>

      {/* The Actual Navigation Menu Items */}
      <View style={[styles.menuContainer, { paddingHorizontal: 12 }]}>
        <DrawerItemList {...props} />
      </View>
    </DrawerContentScrollView>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Drawer
        drawerContent={(props) => <CustomDrawerContent {...props} />}
        screenOptions={{
          drawerActiveTintColor: '#2196F3',
          drawerInactiveTintColor: '#333',
          drawerStyle: {
            borderTopRightRadius: 16,    // Material standard curve
            borderBottomRightRadius: 16, // Material standard curve
            width: 300,                  // Keeps the drawer size standard & clean
            overflow: 'hidden',          // Forces children elements (like the blue block) to respect the curves!
          },
        }}
      >
        <Drawer.Screen 
          name="index"
          options={{
            title: "UpNext Tracker",
            drawerLabel: "Current Tracker",
            drawerIcon: ({ color }) => <FontAwesome name="play-circle" size={22} color={color} />,
          }}
        />
        <Drawer.Screen 
          name="dashboard"
          options={{
            title: "Bookmarks",
            drawerLabel: "Plan to Track",
            drawerIcon: ({ color }) => <FontAwesome name="bookmark" size={22} color={color} />,
          }}
        />
        <Drawer.Screen 
          name="profile"
          options={{
            title: "My Profile",
            drawerLabel: "Profile",
            drawerIcon: ({ color }) => <FontAwesome name="user" size={22} color={color} />,
          }}
        />
      </Drawer>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    padding: 20,
    paddingTop: 50, // Gives breathing room for the phone's top icons/status bar
    paddingBottom: 24,
    backgroundColor: '#2196F3', // Stays strictly inside this header block
  },
  avatarContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    elevation: 4, 
  },
  userName: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  userEmail: {
    color: '#e0e0e0',
    fontSize: 14,
    marginTop: 2,
  },
  menuContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingTop: 12,
  },
  drawerHeader: {
    padding: 24,
    paddingTop: 50, // Gives safe space for device status bars
    paddingBottom: 24,
    height: 200,    // Fixes the height to frame the banner elegantly
    justifyContent: 'flex-end',
  },
});