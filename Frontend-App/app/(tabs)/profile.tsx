import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useAuthStore } from '../../src/store/authStore';
import useAuth from '../../src/hooks/useAuth';
import { colors } from '../../src/theme/colors';

export default function Profile() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuth().logout;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile</Text>
      {user ? (
        <View style={styles.userInfo}>
          <Text style={styles.name}>{user.name}</Text>
          <Text style={styles.email}>{user.email}</Text>
        </View>
      ) : (
        <Text style={styles.subtitle}>No user</Text>
      )}
      <TouchableOpacity onPress={logout} style={styles.logoutButton}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 32, fontWeight: 'bold', color: colors.text, marginBottom: 32 },
  userInfo: { alignItems: 'center', marginBottom: 32 },
  name: { fontSize: 24, fontWeight: 'bold', color: colors.text },
  email: { fontSize: 16, color: colors.muted },
  subtitle: { fontSize: 18, color: colors.muted },
  logoutButton: { 
    backgroundColor: '#DC2626', 
    paddingHorizontal: 24, 
    paddingVertical: 12, 
    borderRadius: 8 
  },
  logoutText: { color: '#fff', fontWeight: '600' },
});

